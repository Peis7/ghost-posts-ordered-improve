import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CACHE_OPTIONS } from '../cache/constants';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_OPTIONS) private readonly redisClient: Redis) {}

  async set(key: string, value: any, seconds?: number): Promise<string> {
    const result = await this.redisClient.set(key, value);
    if (seconds) {
      await this.expire(key, seconds);
    }
    return result;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.redisClient.expire(key, seconds);
  }

  async get(key: string): Promise<string> {
    return await this.redisClient.get(key);
  }

  async disconnect() {
    await this.redisClient.disconnect();
  }
}
