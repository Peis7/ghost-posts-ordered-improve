import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PostsService } from '../posts/posts.service';
import { PostsModule } from '../posts/posts.module';
import { UtilsService } from '../utils/utils.service';
import { LoggerWinstonModule } from '../logger/logger.module';

@Module({
  imports: [
    PostsModule,
    RedisModule,
    HttpModule,
    LoggerWinstonModule
  ],
  controllers: [SearchController],
  providers: [SearchService, PostsService, UtilsService]
})
export class SearchModule {}
