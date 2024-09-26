import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { UtilsService } from '../utils/utils.service';
import { RedisModule } from '../redis/redis.module';
import { LoggerWinstonModule } from '../logger/logger.module';
import { WinstonLoggerService } from 'src/logger/logger.service';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    LoggerWinstonModule
  ],
  controllers: [MembersController],
  providers: [MembersService, UtilsService, WinstonLoggerService]
})
export class MembersModule {}
