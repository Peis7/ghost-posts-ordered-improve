import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { CACHE_OPTIONS } from '../cache/constants';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
  let redisClient: Redis;
  let redisService: RedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [
        ConfigService,
        RedisService,
        {
          provide: CACHE_OPTIONS,
          useValue: createMock<Redis>(),
        },
      ],
    }).compile();

    redisClient = module.get(CACHE_OPTIONS);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    jest.resetAllMocks();
  });

  describe('set', () => {
    it('sets a key value pair', async () => {
      const setSpy = jest.spyOn(redisClient, 'set');
      const expireSpy = jest.spyOn(redisService, 'expire');
      const redisClientExpireSpy = jest.spyOn(redisClient, 'expire');
      await redisService.set('iamakey', 'value', 10);
      expect(setSpy).toHaveBeenCalled();
      expect(expireSpy).toHaveBeenCalled();
      expect(expireSpy).toHaveBeenCalledWith('iamakey', 10);
      expect(redisClientExpireSpy).toHaveBeenCalled();
      expect(redisClientExpireSpy).toHaveBeenCalledWith('iamakey', 10);
      expect(setSpy).toHaveBeenCalledWith('iamakey', 'value');
    });
  });

  describe('get', () => {
    it('get a value by its key', async () => {
      const redisClientGetSpy = jest.spyOn(redisClient, 'get');
      await redisService.get('iamakey');
      expect(redisClientGetSpy).toHaveBeenCalled();
      expect(redisClientGetSpy).toHaveBeenCalledWith('iamakey');
    });
  });

  describe('disconnect', () => {
    it('disconnects from redis', async () => {
      const redisClientDisconnectSpy = jest
        .spyOn(redisClient, 'disconnect')
        .mockImplementation(() => Promise.resolve());
      await redisService.disconnect();
      expect(redisClientDisconnectSpy).toHaveBeenCalled();
    });
  });

  describe('expire', () => {
    it('set expiration for a key', async () => {
      const expireSpy = jest.spyOn(redisService, 'expire');
      await redisService.expire('iamakey', 10);
      expect(expireSpy).toHaveBeenCalled();
      expect(expireSpy).toHaveBeenCalledWith('iamakey', 10);
    });
  });
});
