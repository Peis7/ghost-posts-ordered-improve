// app.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppModule } from './app.module';
import * as path from 'path';
import configuration from './config/configuration';
import { LoggerWinstonModule } from './logger/logger.module';


describe('AppModule', () => {
  let module: TestingModule;
  let configService: ConfigService;
  const ENV = process.env.NODE_ENV;

  beforeEach(async () => {
    module = await Test.createTestingModule({
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
        LoggerWinstonModule,
        AppModule,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });
  
  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should use correct throttle configuration', () => {
    const throttleTTLStr = configService.get<string>('THROTTLE_TTL');
    const throttleLimitStr = configService.get<string>('THROTTLE_LIMIT');

    // Parse them to numbers
    const throttleTTL = parseInt(throttleTTLStr, 10);
    const throttleLimit = parseInt(throttleLimitStr, 10);

    // Validate the type and value
    expect(typeof throttleTTL).toBe('number');
    expect(!isNaN(throttleTTL)).toBe(true);
    expect(throttleTTL).toBeGreaterThan(0); // Optionally check value constraints

    expect(typeof throttleLimit).toBe('number');
    expect(!isNaN(throttleLimit)).toBe(true);
    expect(throttleLimit).toBeGreaterThan(0); 
  });
});
