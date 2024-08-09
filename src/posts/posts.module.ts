import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    RedisModule
  ],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
