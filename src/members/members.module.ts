import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  imports: [
    HttpModule
  ],
  controllers: [MembersController],
  providers: [MembersService, UtilsService]
})
export class MembersModule {}
