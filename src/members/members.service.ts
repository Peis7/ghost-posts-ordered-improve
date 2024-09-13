
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { SubscribeDTO } from './dtos/subscribe.dto';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils/utils.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Member } from './interfaces/members';
import { RedisService } from '../redis/redis.service';
import { ArrayOfStringPairs } from 'src/types/custom';

@Injectable()
export class MembersService {
    constructor(
        private redisService: RedisService,
        private readonly httpService: HttpService,
        private readonly utilsService: UtilsService,
    ) {}
 
    async subscribe({ email }: SubscribeDTO): Promise<Member> {
        try {
            const user = await this.redisService.get(email.trim());
            if (user) {
                throw new HttpException('Email already exists in the system', HttpStatus.CONFLICT);
            }
    
            const audience = 'members/';
            const url = this.buildUrl(audience);
            const token = this.utilsService.signToken('/admin/');
            const data = { members: [{ email }] };
            const headers = {
                Authorization: `Ghost ${token}`,
                'Accept-Version': 'v5.0',
            };
    
            const requestConfig: AxiosRequestConfig = {
                url,
                method: 'POST',
                data,
                headers
            };
    
            const response = await this.request(requestConfig);
            return response.data as Member;
    
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 409) {
                    throw new HttpException('Member already exists', HttpStatus.CONFLICT);
                } else {
                    throw new HttpException(`${error.response}`, HttpStatus.BAD_GATEWAY);
                }
            } else if (error.request) {
                throw new HttpException('Failed to communicate with server', HttpStatus.SERVICE_UNAVAILABLE);
            } else if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException('An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    

    async updateCachedMembers(email:string): Promise<string>{
        await this.redisService.set(email, '1');
        return await  this.redisService.get(email);
    }

    async getAllCurrentMembers():  Promise<Member[]> {
        const firstPageMembers = await this.getMembersFrom(1,10);
        return firstPageMembers as Member[];
    }

    private async getMembersFrom(startPage: number, limit: number): Promise<Member[]> {
        const cacheMembers = this.utilsService.getConfig('ghost.cache_members');
        let allMembers: Member[] = [];
        let currentPage = startPage;
        let hasMorePages = true;

    
        while (hasMorePages) {
            const response = await this.getMembers([['limit', limit.toString()], ['page', currentPage.toString()]]);
            if (!(response['data']['members'] && response['data']['meta'])) {
                hasMorePages = false;
                break;
            }
            const { members, meta } = response.data as any;
            allMembers = [...allMembers, ...members];
            
            const { pages } = meta.pagination;
            hasMorePages = currentPage < pages;
            if (cacheMembers){
                members.forEach((member) => {
                    this.updateCachedMembers(member['email']);
                })
            }
            currentPage++;
        }
    
        return allMembers;
    }
    
    async getMembers(filter: ArrayOfStringPairs): Promise<AxiosResponse> {
        const audience = 'members/';
        const url = this.buildUrl(audience, filter, ['email']);
        const token = this.utilsService.signToken('/admin/');
        const headers = { 
                          Authorization: `Ghost ${token}`,
                         'Accept-Version': 'v5.0',
                        };
        const requestConfig: AxiosRequestConfig = {
            url,
            method: 'GET',
            headers
        }
        const response = await this.request(requestConfig);
        return response;
        
    }
   
    private async request(requestConfig:AxiosRequestConfig) : Promise<AxiosResponse>{
        return firstValueFrom(
            this.httpService.request(requestConfig).pipe(
                catchError((error) => {
                    console.error('Error connecting to Ghost:', error.message);
                    throw error;
                    }),
            ));
    }
    private buildUrl(audience: string, params?: ArrayOfStringPairs,  fields?: Array<string>): string {
        const port = this.utilsService.getConfig('ghost.port');
        const amdinPath = this.utilsService.getConfig('ghost.api_admin_path');
        const domain = this.utilsService.getConfig('ghost.api_url');
        const baseUrl = `${domain}:${port}${amdinPath}`;
        const url = new URL(audience, baseUrl);

        if ( params?.length > 0 ){
            params?.forEach((param)=> {
                url.searchParams.append( param[0], param[1]);
            })
        }
        if (fields?.length > 0) {
            url.searchParams.append('fields', fields.join(','));
        }

        return url.toString();
    }

}
