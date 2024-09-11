
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MembersService {
    constructor(
        private redisService: RedisService,
    ) {}
 
   
}
