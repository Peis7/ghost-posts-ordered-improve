import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { SearchResult } from './interfaces/searchResult';

@Injectable()
export class SearchService {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService,
        private redisService: RedisService
    ) {}

    async search(term: string): Promise<SearchResult[]> {
        return [];
    }
}
