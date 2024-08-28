import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    RedisModule
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
