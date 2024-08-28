import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './redis/redis.module';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    RedisModule,
    PostsModule,  
    ConfigModule.forRoot({
      envFilePath: path.resolve(!ENV ? '.env' : `.env.${ENV}`),
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>{ 
        const ttl = configService.get<number>('THROTTLE_TTL');
        const limit = configService.get<number>('THROTTLE_LIMIT');
        const storage = new ThrottlerStorageRedisService(
          configService.get('RUNNING_ON_GHA', false)
            ? {
                connectionName: configService.get<string>('REDIS_CONNECTION_NAME'),
                host: configService.get<string>('REDIS_HOST'),
                port: Number(configService.get<string>('REDIS_PORT'))  | 6379,
              }
            : {
                connectionName: configService.get<string>('REDIS_CONNECTION_NAME'),
                host: configService.get<string>('REDIS_HOST'),
                port: Number(configService.get<number>('REDIS_PORT')) | 6379,
                username: configService.get<string>('REDIS_USER_NAME'),
                password: configService.get<string>('REDIS_PASSWORD'),
              },
        );
        return [
          {
            ttl,
            limit,
            storage
          },
        ]
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
