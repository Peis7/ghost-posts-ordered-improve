import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { UtilsService } from '../utils/utils.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    HttpModule,
    RedisModule
  ],
  controllers: [MembersController],
  providers: [MembersService, UtilsService]
})
export class MembersModule {}
