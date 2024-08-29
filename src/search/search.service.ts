import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { SearchResult } from './interfaces/searchResult';
import { BASE_FILTER, FIELDS, INCLUDE } from './constants/ghost';
import { CACHED_TECH_KEY } from '../constants';
import { Posts } from '../interfaces/posts';
import { PostsService } from '../posts/posts.service';
import { ArrayOfStringPairs } from 'src/types/custom';

@Injectable()
export class SearchService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private redisService: RedisService,
        private postsService: PostsService
    ) {}
 
    async search(term: string): Promise<SearchResult[]> {
        const cachedTech = await this.redisService.get(CACHED_TECH_KEY);
        const cachedStacksObject = JSON.parse(cachedTech);

        if (!cachedStacksObject) { // if we have no cached post per stack, we query ghost instance directly
            const postList = await this.queryPosts([...FIELDS], [...INCLUDE], [...BASE_FILTER]);
            return this.performSearch(term, postList);
        }

        const techStack = cachedStacksObject['storedTechStacks'];
        const POSTS = techStack.map(async (tech)=>{
            return await this.redisService.get(tech)
        })
        const resolvedPOSTS = await Promise.all(POSTS);
        const matchingPosts = this.handleCachedSearch(term, resolvedPOSTS);
        return matchingPosts;
    }
    
    private handleCachedSearch(term: string, posts: any[]) : SearchResult[] {
        let matchingPosts: SearchResult[] = [];
        posts.forEach((postList)=>{
            if (!postList) return;
            const parsedPostList = JSON.parse(postList);
            const parsedList = this.performSearch(term, parsedPostList)
            matchingPosts = [ ...matchingPosts, ...parsedList];
        });
        return matchingPosts;
    }

    private performSearch(term: string, posts: any[]){
        let matchingPosts = [];
        
        posts.forEach((post)=>{
            const words = term.split(/\s+/);
            let count = 0;
            words.forEach((word)=> {
                const title = post['title'].toLowerCase();
                const isSubstring =  title.includes(word.toLowerCase());
                if (isSubstring) {
                    count++;
                    }
            });

            if (count > 0){
                matchingPosts.push({...post, weight: count })
            };
        })
       
        return matchingPosts;
    }

    async queryPosts(fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
        return this.postsService.get(fields, include, filter);
    }
}
