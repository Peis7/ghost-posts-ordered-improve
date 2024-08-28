import { Module } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { CacheModule } from '../cache/cache.module';
// import { ConfigBridgeModule } from '../config/config.bridge.module';
// import { ConfigBridgeService } from '../config/config.bridge.service';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connectionOptions: configService.get('RUNNING_ON_GHA', false)
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
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
