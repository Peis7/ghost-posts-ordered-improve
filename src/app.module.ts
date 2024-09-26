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
import RedisStore  from 'connect-redis';
import { UtilsService } from './utils/utils.service';
import { Envintoment } from './enums/env.enum';
import { UtilsModule } from './utils/utils.module';
import { SameSite } from './enums/cookies.enum';
import { WinstonLoggerService } from './logger/logger.service';
import { LoggerWinstonModule } from './logger/logger.module';


const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    RedisModule,
    PostsModule,  
    SearchModule,
    MembersModule,
    UtilsModule,
    LoggerWinstonModule,
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
            storage,
            keyGenerator: (req) => {
              const sessionID = req.sessionID;
              const ipAddress = req.ip;
              return `${sessionID}-${ipAddress}`; // Combines sessionID and IP address
            },
          },
          {
            name:"members",
            ttl: ttlMembers || ttl,
            limit: limitMembers || limit,
            storage,
            keyGenerator: (req) => {
              const sessionID = req.sessionID;
              const ipAddress = req.ip;
              return `${sessionID}-${ipAddress}`; // Combines sessionID and IP address
            },
          },
        ]
      },
    }),
  ],
  controllers: [],
  providers: [UtilsService, WinstonLoggerService],
})


export class AppModule implements NestModule {
  constructor(
    private readonly redisService: RedisService,
    private readonly utilsService: UtilsService
  ) {}

  async configure(consumer: MiddlewareConsumer) {

    const redisSessionExpirationTime = this.redisService.getDefaultTimeInSeconds('SESSION_REDIS_TIME_UNIT','SESSION_REDIS_TTL');
    const maxAge = redisSessionExpirationTime; //aligned for convinience
    const store = new RedisStore({
      client: this.redisService.getClient(),
      prefix: 'sess:', // Optional: Prefix for session keys in Redis
      ttl: redisSessionExpirationTime,
    });

    consumer
      .apply(
        session({
          store,
          secret: this.utilsService.getConfig('session.secret'),
          resave: false,
          saveUninitialized: true,
          cookie: {
            secure: process.env.NODE_ENV === Envintoment.Production, // true in production, false in local
            httpOnly: true,
            maxAge:maxAge*1000, //milliseconds, so we multiply by 1000
            sameSite: process.env.NODE_ENV === Envintoment.Production ? SameSite.None : SameSite.Lax, // Lax for local
            path: '/api/v1/',
          },
          name: 'sessionId',
        }),
      )
      .forRoutes('*');
  }
}