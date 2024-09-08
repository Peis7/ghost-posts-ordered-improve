import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import { Posts } from '../interfaces/posts';
import * as path from 'path';
import configuration from '../config/configuration';
import { BASE_FILTER, FIELDS, INCLUDE } from './constants/ghost';
import { ArrayOfStringPairs } from '../types/custom';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TechStack } from '../posts/enums/techStack';


describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;
  const ENV = process.env.NODE_ENV;
  let lang = 'en';

  beforeEach(async () => {
    lang='en';
    jest.clearAllMocks();
    const mockSearchService = {
      search: jest.fn().mockResolvedValue([{
                            contentType: 'Post',
                            title: 'Python fundamentals',
                            url: 'url1',
                            mainTag: 'python',
                            weight: 2
                        }]
    ),
    };
    
    const module: TestingModule = await Test.createTestingModule({
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
        { 
          provide: SearchService, useValue: mockSearchService 
        }, 
        ConfigService, {
            provide: HttpService,
            useValue: {
                get: jest.fn(),
                post: jest.fn(),
            },
      },],
      controllers: [SearchController],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return an array of posts', async () => {
    const term = "Python";
    await controller.search(term, lang);
    const searchSpy = jest.spyOn(searchService, 'search');
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith(term, lang);
  });

});
