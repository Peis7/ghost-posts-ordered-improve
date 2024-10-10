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
        connectionOptions: 
          { 
              connectionName: configService.get('REDIS_CONNECTION_NAME'),
              host: configService.get<string>('REDIS_HOST') || 'redis',
              port: Number(configService.get('REDIS_PORT'))  || 6379,
              username: configService.get<string>('REDIS_USER_NAME'),
              password: configService.get<string>('REDIS_PASSWORD'),
            },
        onClientReady: (client: Redis) => {
          console.log('Redis is ready');
          console.log(configService.get('REDIS_HOST')+' - '+configService.get('REDIS_USER_NAME')+' - '+configService.get('REDIS_PASSWORD'));
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService, UtilsService],
  exports: [RedisService],
})
export class RedisModule {}
