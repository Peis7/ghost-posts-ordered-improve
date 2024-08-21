import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CACHE_OPTIONS } from '../cache/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  constructor(
      @Inject(CACHE_OPTIONS) private readonly redisClient: Redis,
      private configService: ConfigService
    ) {}

  async set(key: string, value: any, seconds?: number): Promise<string> {
    const result = await this.redisClient.set(key, value);

    const expirationTime = seconds ?? this.getDefaultTimeInSeconds();

    if (expirationTime) {
      await this.expire(key, expirationTime);
    }
    return result;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.redisClient.expire(key, seconds);
  }

  async get(key: string): Promise<string> {
    return await this.redisClient.get(key);
  }

  getDefaultTimeInSeconds(): number | undefined {
    const timeUnit = this.configService.get<'seconds' | 'minutes' | 'hours'>('REDIS_EXPIRATION_TIME_UNIT');
    const ret = this.configService.get<number>('REDIS_EXPIRATION_TIME');
  
    if (!timeUnit || !ret) return undefined;
  
    const unitMultipliers = {
      seconds: 1,
      minutes: 60,
      hours: 3600
    };
  
    return unitMultipliers[timeUnit] * ret;
  }

  async disconnect() {
    await this.redisClient.disconnect();
    this.redisClient.del
  }

  async delete(key: string) {
    await this.redisClient.del(key);
  }
}
