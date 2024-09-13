import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PostsService } from '../posts/posts.service';
import { PostsModule } from '../posts/posts.module';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    PostsModule,
    RedisModule,
    HttpModule
  ],
  controllers: [SearchController],
  providers: [SearchService, PostsService, UtilsService]
})
export class SearchModule {}
