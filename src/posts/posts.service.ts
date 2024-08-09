import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import { Post } from '../interfaces/post';

@Injectable()
export class PostsService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService
    ) {}
 

     async get(fields: Array<string>, include: Array<string>): Promise<Post[]> {
        const url = this.buildUrl(fields, include)
        const INDEX_TAG_FORMAT = 'index-'; //index-{number}
        const LEVEL_TAG_FORMAT = 'level-'; //level-{number}
        const NO_MENU_TAG = 'no_menu'; //level-{number}

        //TODO: add this to .env?
        const headers = {
            'Accept-Version': 'v5.0',
          };
        const { data } = await firstValueFrom(
            this.httpService.get<Post[]>(url, { headers }).pipe(
                catchError((error) => {
                    console.error('Error connecting to Ghost:', error.message);
                    throw error;
                    }),
            ));
        let postData = [];
        
        if (Array.isArray(data['posts'])){
            postData = data['posts'].map((post)=>{
                return { 
                    index: this.getIndexFrom(post['tags'], INDEX_TAG_FORMAT),
                    title: post['title'],
                    level: this.getFirstTagWithPatther(post['tags'], LEVEL_TAG_FORMAT),
                    no_menu: this.getFirstTagWithPatther(post['tags'], NO_MENU_TAG) ? true : false,
                    url: post['url'],
                    featured: post['featured'],
                    new: this.isNew(post['published_at'])
                }
            })
        }
        return postData;
    }


    private isNew(published_at){
        const publicationDate = new Date(published_at);
        const currentDate = new Date();
        const diffInMs = currentDate.getTime() - publicationDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        return diffInDays < parseInt(this.configService.get<string>('ghost.new_publication_treshhold'));
    }
    private getFirstTagWithPatther(tags: Array<any>, pattern: String): string {
        const tag = tags.find(tag => {
            const str = tag.slug || tag.name; 
            const regex = new RegExp(`^${pattern}.*`); 
            return regex.test(str); 
        });
        return tag? tag['name'] : null;
    }
    private getIndexFrom(tags: Array<any>,indexPattern): number | null {
        const indexArray = tags.map(tag => {
            const str = tag.name || tag.slug;
            const match = str.match(new RegExp(`^${indexPattern}(\\d+)$`)); // Use RegExp constructor
            return match ? parseInt(match[1], 10) : null;
        })
        .filter(num => num !== null).sort((a, b) => a - b);
        return indexArray.length > 0 ? indexArray[0] : -1;
    }
    
    private buildUrl(fields: Array<string>, include: Array<string>): string {
        const baseUrl = `${this.getConfig('ghost.api_url')}:${this.getConfig('ghost.port')}`;
        const contentPath = this.getConfig('ghost.content_path');
        const apiKey = this.getConfig('ghost.content_api_key');
    
        const url = new URL(contentPath, baseUrl);
        url.searchParams.append('key', apiKey);

        if (include.length > 0 ){
            url.searchParams.append('include', include.join(','));
        }
        if (fields.length > 0) {
            url.searchParams.append('fields', fields.join(','));
        }
    
        return url.toString();
    }

    private getConfig(key: string): string {
        return this.configService.get<string>(key);
    }
}
