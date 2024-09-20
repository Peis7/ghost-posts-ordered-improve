import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheModule } from '../cache/cache.module';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connectionOptions: configService.get('RUNNING_ON_GHA', 'false') === 'true'
          ? {
              connectionName: configService.get('REDIS_CONNECTION_NAME'),
              host: configService.get('REDIS_HOST'),
              port: Number(configService.get('REDIS_PORT')) || 6379,
            }
          : { 
              connectionName: configService.get('REDIS_CONNECTION_NAME'),
              host: configService.get('REDIS_HOST'),
              port: Number(configService.get('REDIS_PORT'))  || 6379,
              username: configService.get('REDIS_USER_NAME'),
              password: configService.get('REDIS_PASSWORD'),
            },
        onClientReady: (client: Redis) => {
          console.log('Redis is ready');
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService, UtilsService],
  exports: [RedisService],
})
export class RedisModule {}
