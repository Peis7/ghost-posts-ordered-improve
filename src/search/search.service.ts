import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { GhostContentType, SearchResult } from './interfaces/searchResult';
import { BASE_FILTER, FIELDS, INCLUDE } from './constants/ghost';
import { SEARCH_CACHE_OBJECT_KEYS } from '../constants';
import { Posts } from '../interfaces/posts';
import { PostsService } from '../posts/posts.service';
import { ArrayOfStringPairs } from 'src/types/custom';

@Injectable()
export class SearchService {
    constructor(
        private redisService: RedisService,
        private postsService: PostsService,
    ) {}
 
    async search(term: string): Promise<SearchResult[]> {
        const cachedTech = await this.redisService.get(SEARCH_CACHE_OBJECT_KEYS.DATA);
        const cachedStacksObject = JSON.parse(cachedTech);

        if (!cachedStacksObject) { // if we have no cached post per stack, we query ghost instance directly
            let postList = await this.queryPosts([...FIELDS], [...INCLUDE], [...BASE_FILTER]);
            postList = [...this.performSearch(term, postList)];
            return [...this.castPostsToResult(postList)];
        }

        const techStack = cachedStacksObject[SEARCH_CACHE_OBJECT_KEYS.TECH_ARRAY];
        const POSTS = techStack.map(async (tech)=>{
            return await this.redisService.get(tech)
        });

        const resolvedPOSTS = await Promise.all(POSTS);
        const matchingPosts = this.handleCachedSearch(term, resolvedPOSTS);

        let formatedPosts: SearchResult[] = [] ;

        formatedPosts = this.castPostsToResult(matchingPosts);
        return formatedPosts;
    }
    
    private castPostsToResult(posts: any[]) : SearchResult[]  {
        return posts.map((post) => {
            return {
                contentType: GhostContentType.Post,
                title: post.title,
                url: post.url,
                mainTag: post.mainTag, 
                weight: post.weight
            };
        });
    }
    private handleCachedSearch(term: string, posts: any[]) : SearchResult[] {
        let matchingPosts: SearchResult[] = [];
        posts.forEach((postList)=>{
            if (!postList) return;
            const parsedPostList = JSON.parse(postList);
            const parsedList = this.performSearch(term, parsedPostList);
            matchingPosts = [ ...matchingPosts, ...parsedList];
        });
        return matchingPosts;
    }

    private performSearch(term: string, posts: any[]){
        let matchingPosts = [];
        const words = term.trim() === "" ? [] : term.split(/\s+/);
        posts.forEach((post)=>{
            //if (post['no_menu']) return;// exclude post that are not part of the menu
            if (!post['no_menu']){
                let count = 0;
                words.forEach((word)=> {
                    const title = post['title'] ? post['title'].toLowerCase() : '';
                    const excerpt = post['excerpt'] ? post['excerpt'].toLowerCase() : '';
                    const foundInTitle =  title.indexOf(word.toLowerCase());
                    const foundInExcerpt =  excerpt.indexOf(word.toLowerCase());
                    if (foundInTitle !== -1 || foundInExcerpt !== -1) {
                        count+=1;
                    }
                });
                if (count > 0){
                    matchingPosts.push({...post, weight: count });
                };
                
            }
        });
        return matchingPosts;
    }

    async queryPosts(fields: Array<string>, include: Array<string>, filter: ArrayOfStringPairs): Promise<Posts[]> {
        return this.postsService.get(fields, include, filter);
    }
}
