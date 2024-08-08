import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    PostsModule,  
    ConfigModule.forRoot({
      envFilePath: path.resolve(!ENV ? '.env' : `.env.${ENV}`),
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>{ 
        const ttl = config.get<number>('THROTTLE_TTL');
        const limit = config.get<number>('THROTTLE_LIMIT');
        return [
          {
            ttl,
            limit,
          },
        ]
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
