import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { MembersService } from './members.service';

@Module({
  imports: [
    RedisModule,
    HttpModule
  ],
  controllers: [],
  providers: [MembersService]
})
export class MembersModule {}
