import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './redis/redis.module';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { SearchModule } from './search/search.module';
import { MembersModule } from './members/members.module';
import { RedisService } from './redis/redis.service';

import * as session from 'express-session';
import Redis from 'ioredis';
import RedisStore  from 'connect-redis';


const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    RedisModule,
    PostsModule,  
    SearchModule,
    MembersModule,
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

        const ttlMembers = configService.get<number>('THROTTLE_TTL_MEMBERS');
        const limitMembers = configService.get<number>('THROTTLE_LIMIT_MEMBERS');

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
            name:"default",
            ttl,
            limit,
            storage
          },
          {
            name:"members",
            ttl: ttlMembers || ttl,
            limit: limitMembers || limit,
            storage
          },
        ]
      },
    }),
  ],
  controllers: [],
  providers: [],
})


export class AppModule implements NestModule {
  constructor(private readonly redisService: RedisService) {}

  configure(consumer: MiddlewareConsumer) {

    const store = new RedisStore({
      client: this.redisService.getClient(),
      prefix: 'sess:', // Optional: Prefix for session keys in Redis
    });

    consumer
      .apply(
        session({
          store,
          secret: 'your-secret-key',
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
          },
        }),
      )
      .forRoutes('*');
  }
}