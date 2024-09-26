import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {  ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import configuration from '../config/configuration';
import { WinstonLoggerService } from './logger.service';
import { transports } from 'winston';
 

describe('Logger Service', () => {
  const ENV = process.env.NODE_ENV;
  let service: WinstonLoggerService;

  beforeEach(async () => {
    jest.clearAllMocks();



    const module: TestingModule  = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: path.resolve(!ENV ? '.env' : `.env.${ENV}`),
          isGlobal: true,
          load: [configuration],
        }),
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => [
            {
              ttl: config.get<number>('THROTTLE_TTL'),
              limit: config.get<number>('THROTTLE_LIMIT')
            }
        ],
        }),
        
      ],
      providers: [
        WinstonLoggerService, 
      ]
    }).compile();
 
    service = module.get<WinstonLoggerService>(WinstonLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('functions should be defined', () => {
    expect(service.debug).toBeDefined();
    expect(service.error).toBeDefined();
    expect(service.log).toBeDefined();
    expect(service.warn).toBeDefined();
    expect(service.verbose).toBeDefined();
  });


  it('logger transports is configured', () => {
    const logger = service.getLogger();
    expect(logger.level).toBe(process.env.LOG_LEVEL || 'info');
    expect(logger.transports).toBeDefined();
    expect(logger.transports.length).toBe(1);
    expect(logger).toBeDefined();
  });


  });


