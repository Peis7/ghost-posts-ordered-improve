import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CACHE_OPTIONS } from '../cache/constants';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils/utils.service';


@Injectable()
export class RedisService {
  private readonly client: Redis;
  
  constructor(
      @Inject(CACHE_OPTIONS) private readonly redisClient: Redis,
      private configService: ConfigService,
      private readonly utilsService: UtilsService,
    ) {
      this.client = new Redis({
        host: this.utilsService.getConfig('redis.host'),
        port: Number(this.utilsService.getConfig('redis.port')) || 6379,
        username: this.utilsService.getConfig('redis.username'),
        password: this.utilsService.getConfig('redis.password'),
      });
    }
  
    getClient(): Redis {
      return this.client;
    }

  async set(key: string, value: any, seconds?: number): Promise<string> {
    const result = await this.redisClient.set(key, value);

    const expirationTime = seconds ?? this.getDefaultTimeInSeconds('REDIS_EXPIRATION_TIME_UNIT', 'REDIS_EXPIRATION_TIME');

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

  getDefaultTimeInSeconds(timeUnitEnvVarName: string, expirationTimeEnvVarName: string): number | undefined {
    const timeUnit = this.configService.get<'seconds' | 'minutes' | 'hours'>(timeUnitEnvVarName);
    const ret = this.configService.get<number>(expirationTimeEnvVarName);
  
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
