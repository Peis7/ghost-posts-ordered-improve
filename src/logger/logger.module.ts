import { Module } from '@nestjs/common';
import { WinstonLoggerService } from './logger.service';

@Module({
  imports: [],
  controllers: [],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerWinstonModule {}
