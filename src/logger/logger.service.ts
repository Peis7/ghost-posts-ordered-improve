import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info'; // Default to 'info'

    const consoleTransport: ConsoleTransportInstance = new winston.transports.Console({
        format: winston.format.simple(),
      });
  
      const transports: winston.transport[] = [consoleTransport];
  
      // Add file transport only in production
      if (process.env.NODE_ENV === 'production') {
        transports.push(
          new winston.transports.File({ filename: 'combined.log', format: winston.format.json() }), // All logs
          new winston.transports.File({ filename: 'error.log', format: winston.format.json(), level: 'error' }) // Only error logs
        );
      }
  

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports
    });
  }

  getLogger() {
    return this.logger;
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
