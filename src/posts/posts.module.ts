import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    RedisModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, UtilsService]
})
export class PostsModule {}
