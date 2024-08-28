import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { SearchResult } from './interfaces/searchResult';
import { CACHED_TECH_KEY } from '../posts/constants/ghost';

@Injectable()
export class SearchService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private redisService: RedisService
    ) {}
 
    async search(term: string): Promise<SearchResult[]> {
        const cachedTech = await this.redisService.get(CACHED_TECH_KEY);
        const cachedStacksObject = JSON.parse(cachedTech);

        if (!cachedStacksObject) return;
        const techStack = cachedStacksObject['storedTechStacks'];
        
        const POSTS = techStack.map(async (tech)=>{
            return await this.redisService.get(tech)
        })

        const resolvedPOSTS = await Promise.all(POSTS);

        let matchingPosts = [];
        resolvedPOSTS.forEach((postList)=>{
            if (!postList) return;
            const parsedPostList = JSON.parse(postList);
            parsedPostList.forEach((post)=>{
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
        })
        return matchingPosts;
    }
}
