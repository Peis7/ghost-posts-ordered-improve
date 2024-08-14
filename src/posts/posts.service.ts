import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { Posts } from '../interfaces/posts';
import { RedisService } from '../redis/redis.service';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { GHOST_POST_FIELD }  from './interfaces/postfields'
import { INDEX_TAG_FORMAT, LEVEL_TAG_FORMAT, NO_MENU_TAG } from './constants/ghost';
import { isTechStack, TechStack } from './enums/techStack';
import { Tag } from '../interfaces/tags';
import { ArrayOfStringPairs } from './types/custom';


@Injectable()
export class PostsService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private redisService: RedisService
    ) {}

    updateCache(data: PostWebhookPayload): void {
        const updatedPostId = data?.body?.post?.current?.id;
        const slug =  data?.body?.post?.current?.slug;
        const tags = data?.body?.post?.current?.tags;

        const techStackString: string | boolean = this.getTechFromTags(data?.body?.post?.current?.tags);

   
        const tech: TechStack | undefined = TechStack[techStackString as keyof typeof TechStack];

        if (!tech) return; //TODO: return a meaninful message
        
        const cached = this.redisService.get(tech);

        if (!cached) return;

        //so far, we know that there is data
        cached.then((data)=>{
            if (!data) return;
            let postData = JSON.parse(data);
            if (!(postData instanceof Array)) return;
            postData = postData.map((post)=>{
                if (post[GHOST_POST_FIELD.base.ID] === updatedPostId){
                        let updatedPost = {
                            ...post,
                            index: tags ? this.getIndexFrom(tags, INDEX_TAG_FORMAT) : post[GHOST_POST_FIELD.calculated.INDEX],
                            level: tags ? this.getFirstTagWithPatther(tags, LEVEL_TAG_FORMAT) : post[GHOST_POST_FIELD.calculated.LEVEL],
                            no_menu: tags ? (this.getFirstTagWithPatther(tags, NO_MENU_TAG) ? true : false) : post[GHOST_POST_FIELD.calculated.NO_MENU],
                            slug: slug || post[GHOST_POST_FIELD.base.SLUG]
                        }
                        return updatedPost;
                }
                return post; 
            });
            this.redisService.set(tech, JSON.stringify(postData));

        });
    }
    async handlePublished(post: Posts): Promise<void>{
        const techStackString: string | boolean = this.getTechFromTags(post[GHOST_POST_FIELD.base.TAGS]);
        const tech: TechStack | undefined = TechStack[techStackString as keyof typeof TechStack];

        if (!tech) return; //TODO: return a meaninful message
        const publishedPostFormatedData = {
            id: post[GHOST_POST_FIELD.base.ID],
            index: this.getIndexFrom(post[GHOST_POST_FIELD.base.TAGS], INDEX_TAG_FORMAT),
            title: post[GHOST_POST_FIELD.base.TITLE],
            level: this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], LEVEL_TAG_FORMAT),
            no_menu: this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], NO_MENU_TAG) ? true : false,
            url: post[GHOST_POST_FIELD.base.URL],
            slug: post[GHOST_POST_FIELD.base.SLUG],
            featured: post[GHOST_POST_FIELD.base.FEATURED],
            new: this.isNew(post[GHOST_POST_FIELD.base.PUBLISHED_AT])
        }
        const cachedCourseStructure = await this.redisService.get(tech);
        let cachedPosts:Posts[] = []
        if (cachedCourseStructure){
            cachedPosts = JSON.parse(cachedCourseStructure) as Posts[];
        }
        cachedPosts.push(publishedPostFormatedData);
        this.setCache(tech, JSON.stringify(cachedPosts));
    }
    private getTechFromTags(tags: Array<Tag>): string | boolean {
        if (tags.length == 0 ) return false;
        let mainTag = tags[0];
        return (mainTag.name && isTechStack(mainTag.name)) ? mainTag.name : false;
    }

    private async clearMalformedCourseStructure( tech: TechStack){
        const cachedData = await this.redisService.get(tech);
        let parsedData = JSON.parse(cachedData);
        if (!(parsedData instanceof Array)) this.redisService.delete(tech);
    }
    async getPostDataAndUpdateCache( tech: TechStack,fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
        this.clearMalformedCourseStructure(tech);
        const cachedCourseStructure = await this.redisService.get(tech);
        if (cachedCourseStructure){
            return JSON.parse(cachedCourseStructure) as Posts[];
        }
        const postData = await this.get(fields, include, filter);
        this.setCache(tech, JSON.stringify(postData))
        return postData;
    }
    private async get(fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
        const url = this.buildUrl(fields, include, filter)


        //TODO: add this to .env?
        const headers = {
            'Accept-Version': 'v5.0', 
        };
        const { data } = await firstValueFrom(
            this.httpService.get<Posts[]>(url, { headers }).pipe(
                catchError((error) => {
                    console.error('Error connecting to Ghost:', error.message);
                    throw error;
                    }),
            ));
        let postData = [];
        
        if (Array.isArray(data['posts'])){
            postData = data['posts'].map((post)=>{
                return {
                    id: post[GHOST_POST_FIELD.base.ID],
                    index: this.getIndexFrom(post[GHOST_POST_FIELD.base.TAGS], INDEX_TAG_FORMAT),
                    title: post[GHOST_POST_FIELD.base.TITLE],
                    level: this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], LEVEL_TAG_FORMAT),
                    no_menu: this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], NO_MENU_TAG) ? true : false,
                    url: post[GHOST_POST_FIELD.base.URL],
                    slug: post[GHOST_POST_FIELD.base.SLUG],
                    featured: post[GHOST_POST_FIELD.base.FEATURED],
                    new: this.isNew(post[GHOST_POST_FIELD.base.PUBLISHED_AT])
                }
            })
        }
        return postData;
    }

    private setCache(key, value){
        this.redisService.set(key, value);
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
    
    private buildUrl(fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): string {
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
        if (filter.length > 0) {
            let filterOptions = filter.map(filter=>{
                return filter.join(':');
            })
            url.searchParams.append('filter', filterOptions.join(','));
        }
        return url.toString();
    }

    private getConfig(key: string): string {
        return this.configService.get<string>(key);
    }
}
