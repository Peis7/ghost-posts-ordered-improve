
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { SubscribeDTO } from './dtos/subscribe.dto';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils/utils.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Member } from './interfaces/members';

@Injectable()
export class MembersService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly utilsService: UtilsService,
    ) {}
 
    async subscribe({ email }: SubscribeDTO): Promise<Member> {
        const audience = 'members/';
        const url = this.buildUrl(audience);
        console.log('>>>    '+url);
        const token = this.utilsService.signToken('/admin/');
        const data = { members: [ { email } ] };
        const headers = { 
                          Authorization: `Ghost ${token}`,
                         'Accept-Version': 'v5.0',
                        };
        const requestConfig: AxiosRequestConfig = {
            url,
            method: 'POST',
            data,
            headers
        }
        console.log(requestConfig);
        const response = await this.request(requestConfig);
        console.log(response)
        return response.data as Member;
    }

    async getAllNewsLetters(): Promise<any> {
        const audience = 'members/';
        const url = this.buildUrl(audience);
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
        return this.request(requestConfig);
        
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
    private buildUrl(audience: string): string {
        const port = this.utilsService.getConfig('ghost.port');
        const amdinPath = this.utilsService.getConfig('ghost.api_admin_path');
        const domain = this.utilsService.getConfig('ghost.api_url');
        const baseUrl = `${domain}:${port}${amdinPath}`;
        console.log('=>'+baseUrl)
        const url = new URL(audience, baseUrl);
        return url.toString();
    }

}
