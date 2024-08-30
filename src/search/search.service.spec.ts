import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {  ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import configuration from '../config/configuration';
import { of } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { createMock } from '@golevelup/ts-jest';
import { Posts } from '../interfaces/posts';
import { SearchService } from './search.service';
import { TechStack } from '../posts/enums/techStack';
import { PostsService } from '../posts/posts.service';
import { SEARCH_CACHE_OBJECT_KEYS } from '../constants';


describe('Posts Service', () => {
  let service: SearchService;
  let mockHttpService: { get: jest.Mock };
  const ENV = process.env.NODE_ENV;
  let mockPosts = [];
  let mockPostsProcessedResult = {};
  let redisService: RedisService;


  const inMemoryCache = new Map<string, string>();

  beforeEach(async () => {
    jest.clearAllMocks();

    inMemoryCache.clear();
    mockHttpService = {
      get: jest.fn(),
    };

    //TODO: move mock data outside
    mockPosts = [
      { id: '1',title: 'Post 1', url: 'url1', slug: 'slug1', featured: true, 
        published_at: new Date('1990-02-20T20:11:10.230Z'), excerpt: 'post 1',
          tags: [{ name: TechStack.Python.toLocaleLowerCase(), slug:'python' },{ name: 'index-1' }, { name: 'no_menu' }] },
      { id: '2', title: 'Post 2', url: 'url2', slug: 'slug2', featured: false,
         published_at: new Date('1960-06-29T20:11:10.230Z'), excerpt: 'post 2',
          tags: [{ name: TechStack.TypeScript.toLocaleLowerCase(), slug:'typescript' }, { name: 'index-100' }] },
      { id: '3', title: 'Post 3', url: 'url3', slug: 'slug3', featured: false,
         published_at: new Date('1958-06-29T20:11:10.230Z'), excerpt: 'post 3',
        tags: [{ name: TechStack.NodeJS.toLocaleLowerCase(), slug:'node.js' }, { name: 'index-50' }] },
    ] as Posts[];

    mockPostsProcessedResult = {
        [TechStack.Python] : [
                              {
                                  id: '1',
                                  index: 1,
                                  title: 'Python fundamentals',
                                  level: null,
                                  no_menu: false,
                                  url: 'url1',
                                  slug: 'slug1',
                                  featured: true,
                                  new: false,
                                  published_at: new Date('1990-02-20T20:11:10.230Z'),
                                  excerpt: 'For begginers',
                                  mainTag: TechStack.Python.toLocaleLowerCase(),

                              }
                            ],
      [TechStack.NodeJS] : [
                              {
                                id: '2',
                                index: 100,
                                title: 'Node setup new project',
                                level: null,
                                no_menu: false,
                                url: 'url2',
                                slug: 'slug2',
                                featured: false,
                                new: false,
                                published_at: new Date('1960-06-29T20:11:10.230Z'),
                                excerpt: 'Programming language',
                                mainTag: TechStack.TypeScript.toLocaleLowerCase(),
                              },
                              {
                                id: '3',
                                index: 50,
                                title: 'Node.js Foundamentals',
                                level: null,
                                no_menu: false,
                                url: 'url3',
                                slug: 'slug3',
                                featured: false,
                                new: false,
                                published_at: new Date('1958-06-29T20:11:10.230Z'), 
                                excerpt: 'This is a node post',
                                mainTag: TechStack.NodeJS.toLocaleLowerCase(),
                              }
                            ]
      };

    mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts } }));

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
        SearchService,
        PostsService, 
        ConfigService,
         {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
      ]
    }).compile();
 
    redisService = module.get<RedisService>(RedisService);
    service = module.get<SearchService>(SearchService);

    // Mock Redis methods to use in-memory cache
    jest.spyOn(redisService, 'set').mockImplementation((key: string, value: string) => {
      inMemoryCache.set(key, value);
      return Promise.resolve(value); 
    });

    jest.spyOn(redisService, 'get').mockImplementation((key: string) => {
      const value = inMemoryCache.get(key);
      return Promise.resolve(value);
    });
    
    redisService.set(
          SEARCH_CACHE_OBJECT_KEYS.DATA, 
          JSON.stringify( { 
                [SEARCH_CACHE_OBJECT_KEYS.TECH_ARRAY]: [TechStack.Python, TechStack.NodeJS], 
                lastUpdate: new Date() 
            }
          )
    );
    
    redisService.set(
      TechStack.Python, 
      JSON.stringify( mockPostsProcessedResult[TechStack.Python] )
    );

    redisService.set(
      TechStack.NodeJS, 
      JSON.stringify( mockPostsProcessedResult[TechStack.NodeJS] )
    );

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return 1 post after performing a search with Term = Python', async () => {
    const term = "Python";
    const expectedSearchResult = {
        contentType: 'Post',
        title: 'Python fundamentals',
        url: 'url1',
        mainTag: 'python',
        weight: 1
    }
    const result = await service.search(term);

    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(expectedSearchResult);
  });


  it('should return weight = 2 after performing a search with Term = Python funda', async () => {
    const term = "Python funda";
    const expectedSearchResult = {
        contentType: 'Post',
        title: 'Python fundamentals',
        url: 'url1',
        mainTag: 'python',
        weight: 2
    }
    const result = await service.search(term);
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(expectedSearchResult);
  });

  it('should return weight = 3 after performing a search with Term = Python funda beggin', async () => {
    const term = "Python funda beggi";
    const result = await service.search(term);
    expect(result.length).toEqual(1);
    expect(result[0].weight).toEqual(3);
  });

});

