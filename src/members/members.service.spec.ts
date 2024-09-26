import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {  ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import configuration from '../config/configuration';
import { RedisService } from '../redis/redis.service';
import { createMock } from '@golevelup/ts-jest';
import { UtilsService } from '../utils/utils.service';
import { MembersService } from './members.service';
 

describe('Posts Service', () => {
  let service: MembersService;
  let mockHttpService: { get: jest.Mock };
  let mockUtilsService: { getConfig: jest.Mock };
  const ENV = process.env.NODE_ENV;
  let mockPosts = {};
  let mockPostsProcessedResult= {};
  let redisService: RedisService;
  let configService: ConfigService;
  let utilsService: UtilsService;
  const inMemoryCache = new Map<string, string>();
  interface Tag {
    name: string;
    slug?: string;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    inMemoryCache.clear();
    mockHttpService = {
      get: jest.fn(),
    };


    mockUtilsService = { 
        getConfig: jest.fn()
    };


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
        MembersService, 
        ConfigService,
         {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ]
    }).compile();
 
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    service = module.get<MembersService>(MembersService);

    // jest.spyOn(utilsService, 'getConfig').mockImplementation((key: string) => {
    //   return configService.get(key);
    // });

    // Mock Redis methods to use in-memory cache
    jest.spyOn(redisService, 'set').mockImplementation((key: string, value: string) => {
      inMemoryCache.set(key, value);
      return Promise.resolve(value); 
    });

    jest.spyOn(redisService, 'get').mockImplementation((key: string) => {
      const value = inMemoryCache.get(key);
      return Promise.resolve(value);
    });
    


  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  it(`should get course posts array and update cache`, async () => {
    // mockHttpService.get.mockReturnValue(of({ data: { posts: []} }));
    // const isNewSpy = jest.spyOn(service as any, 'isNew');
    // const getFirstTagWithPattherSpy = jest.spyOn(service as any, 'getFirstTagWithPatther');
    // const getIndexFromSpy = jest.spyOn(service as any, 'getIndexFrom');
    // const buildUrlSpy = jest.spyOn(service as any, 'buildUrl');
    // const posts = await service.getPostDataAndUpdateCache(tech, _lang as LANG, [], [], []);
    // expect(isNewSpy).toHaveBeenCalledTimes(posts.length);
    // expect(getFirstTagWithPattherSpy).toHaveBeenCalledTimes(posts.length*4);
    // expect(getIndexFromSpy).toHaveBeenCalledTimes(posts.length);
    // expect(buildUrlSpy).toHaveBeenCalledWith([],[],[]);
  });
  });


