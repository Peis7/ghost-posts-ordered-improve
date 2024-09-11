import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { Posts } from '../interfaces/posts';
import { RedisService } from '../redis/redis.service';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { GHOST_POST_FIELD }  from './interfaces/postfields'
import { INDEX_TAG_FORMAT, LANG_TAG_FORMAT, LEVEL_TAG_FORMAT, NO_MENU_TAG } from './constants/ghost';
import { SEARCH_CACHE_OBJECT_KEYS } from '../constants';
import { isTechStack, TechStack } from './enums/techStack';
import { Tag } from '../interfaces/tags';
import { ArrayOfStringPairs } from '../types/custom';
import { LANG } from './enums/langs';

@Injectable()
export class PostsService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private redisService: RedisService
    ) {}

    async updateCache(data: PostWebhookPayload): Promise<void> {
        const updatedPostId = data?.body?.post?.current?.id;
        const updatedTitle = data?.body?.post?.current?.title;
        const slug =  data?.body?.post?.current?.slug;
        const tags = data?.body?.post?.current?.tags;
        const url = data?.body?.post?.current?.url;
        const excerpt = data?.body?.post?.current?.excerpt;
        const mainTag = data?.body?.post?.current?.mainTag;
        const techStackString: string | boolean = this.getTechFromTags(data?.body?.post?.current?.tags);

        const tech: TechStack | undefined = TechStack[techStackString as keyof typeof TechStack];


        if (!tech) return; //TODO: return a meaninful message
        const lang = this.getFirstTagWithPatther(tags, LANG_TAG_FORMAT);
        const cacheKey = this.generateCahceKey([tech, lang.match(/-(.*)/)[1]]);
        const cached = await this.redisService.get(cacheKey);
        if (!cached) return;

        //so far, we know that there is data

        let postData = JSON.parse(cached);
        if (!(postData instanceof Array)) return;
        postData = postData.map((post)=>{
            if (post[GHOST_POST_FIELD.base.ID] === updatedPostId){
                    let updatedPost = {
                        ...post,
                        title: updatedTitle ? updatedTitle : post[GHOST_POST_FIELD.base.TITLE],
                        index: tags ? this.getIndexFrom(tags, INDEX_TAG_FORMAT) : post[GHOST_POST_FIELD.calculated.INDEX],
                        level: tags ? this.getFirstTagWithPatther(tags, LEVEL_TAG_FORMAT) : post[GHOST_POST_FIELD.calculated.LEVEL],
                        no_menu: tags ? (this.getFirstTagWithPatther(tags, NO_MENU_TAG) ? true : false) : post[GHOST_POST_FIELD.calculated.NO_MENU],
                        slug: slug || post[GHOST_POST_FIELD.base.SLUG],
                        excerpt: excerpt || post[GHOST_POST_FIELD.base.EXCERPT],
                        mainTag: mainTag || this.getMainTag(tags || post[GHOST_POST_FIELD.base.TAGS]),
                        url: url || post[GHOST_POST_FIELD.base.URL],
                    }
                    return updatedPost;
            }
            return post; 
        });

        await this.setTechCache(cacheKey, JSON.stringify(postData));
    }

    async handleDeleted(post: Posts): Promise<void>{
        return this.removePostFromCache(post);
    }
    async handleUnpublished(post: Posts): Promise<void>{
        return this.removePostFromCache(post);
    }

    private async removePostFromCache(post: Posts): Promise<void>{
        const techStackString: string | boolean = this.getTechFromTags(post[GHOST_POST_FIELD.base.TAGS]);
        const tech: TechStack | undefined = TechStack[techStackString as keyof typeof TechStack];

        const lang = this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], LANG_TAG_FORMAT);
        const cacheKey = this.generateCahceKey([tech, lang.match(/-(.*)/)[1]])

        const cached = await this.redisService.get(cacheKey);

        if (!cached) return;

        let postData = JSON.parse(cached);
        if (!(postData instanceof Array)) return;
        
        postData = postData.filter((cachedpost)=> cachedpost[GHOST_POST_FIELD.base.ID] !== post[GHOST_POST_FIELD.base.ID] );

        await this.setTechCache(cacheKey, JSON.stringify(postData));
        return;
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
            new: this.isNew(post[GHOST_POST_FIELD.base.PUBLISHED_AT]),
            mainTag: this.getMainTag(post[GHOST_POST_FIELD.base.TAGS]),
        }
        const lang = this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], LANG_TAG_FORMAT);
        const cacheKey = this.generateCahceKey([tech, lang]);

        const cachedCourseStructure = await this.redisService.get(cacheKey);
        let cachedPosts:Posts[] = []
        if (cachedCourseStructure){
            cachedPosts = JSON.parse(cachedCourseStructure) as Posts[];
        }
        cachedPosts.push(publishedPostFormatedData);

        this.setTechCache(cacheKey, JSON.stringify(cachedPosts));
    }

    public generateCahceKey(values: Array<string>): string{
        return values.join('_');
    }
    private getTechFromTags(tags: Array<Tag>): string | boolean {
        if (tags.length == 0 ) return false;
        let mainTag = tags[0];
        return (mainTag.name && isTechStack(this.capitalizeFirstLetter(mainTag.name))) ? this.capitalizeFirstLetter(mainTag.name) : false;
    }

    private async clearMalformedCourseStructure( key: string): Promise<void>{
        const cachedData = await this.redisService.get(key);
        if (!cachedData) return;
        let parsedData = JSON.parse(cachedData);
        if (!(parsedData instanceof Array)) this.redisService.delete(key);
    }

    async getPostDataAndUpdateCache( tech: TechStack, lang: LANG,fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
        const cacheKey = this.generateCahceKey([tech, lang]);
        this.clearMalformedCourseStructure(cacheKey);
        const cachedCourseStructure = await this.redisService.get(cacheKey);
        this.addTechStack(SEARCH_CACHE_OBJECT_KEYS.DATA, tech);//TODO: cover test
        if (cachedCourseStructure){
            return JSON.parse(cachedCourseStructure) as Posts[];
        }
        const postData = await this.get(fields, include, filter);
        this.setTechCache(cacheKey, JSON.stringify(postData));
        return postData;
    }
    
    async get(fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
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
                    new: this.isNew(post[GHOST_POST_FIELD.base.PUBLISHED_AT]),
                    published_at: post[GHOST_POST_FIELD.base.PUBLISHED_AT],
                    excerpt: post[GHOST_POST_FIELD.base.EXCERPT],
                    mainTag: this.getMainTag(post[GHOST_POST_FIELD.base.TAGS]),
                    lang: this.getFirstTagWithPatther(post[GHOST_POST_FIELD.base.TAGS], LANG_TAG_FORMAT),
                }
            })
        }
        return postData;
    }

    private async setTechCache(key, value){
        this.redisService.set(key, value);
        this.addTechStack(SEARCH_CACHE_OBJECT_KEYS.DATA, key);
    }

    async storeTechStacks(key: string, techStacks: string[]): Promise<void> {
        const value = JSON.stringify({ 
            [SEARCH_CACHE_OBJECT_KEYS.TECH_ARRAY]: techStacks, 
            lastUpdate: new Date() 
        });
        await this.redisService.set(key, value);
      }
    
      async getTechStacks(key: string): Promise<string[]> {
        const result = await this.redisService.get(key);
        if (result) {
          const parsed = JSON.parse(result);
          return parsed[SEARCH_CACHE_OBJECT_KEYS.TECH_ARRAY] || [];
        }
        return [];
      }
    
      async addTechStack(key: string, newTechStack: string): Promise<void> {
        const currentTechStacks = await this.getTechStacks(key);
        if (!currentTechStacks.includes(newTechStack)) {
            currentTechStacks.push(newTechStack);
            await this.storeTechStacks(key, currentTechStacks);
        } 
      }

    private isNew(published_at){
        const publicationDate = new Date(published_at);
        const currentDate = new Date();
        const diffInMs = currentDate.getTime() - publicationDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        return diffInDays < parseInt(this.configService.get<string>('ghost.new_publication_treshhold'));
    }

    private getMainTag(tags: Array<any>): string | undefined{
        return tags.length > 0 ? tags[0]['slug'] : undefined
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
    private capitalizeFirstLetter(str) {
        if (str.length === 0) return str; // Handle empty string
        return str.charAt(0).toUpperCase() + str.slice(1);
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
            url.searchParams.append('filter', filterOptions.join('+'));
        }
        return url.toString();
    }

    private getConfig(key: string): string {
        return this.configService.get<string>(key);
    }
}
