import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';
import { UtilsService } from '../utils/utils.service';
import { WinstonLoggerService } from '../logger/logger.service';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    RedisModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, UtilsService, WinstonLoggerService]
})
export class PostsModule {}
