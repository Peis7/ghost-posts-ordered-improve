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
import { BASE_FILTER, FIELDS, INCLUDE } from './constants/ghost';
import { diffieHellman } from 'crypto';

describe('Posts Service', () => {
  let service: SearchService;
  let mockHttpService: { get: jest.Mock };
  let mockPostService: { get: jest.Mock , generateCahceKey: jest.Mock};
  const ENV = process.env.NODE_ENV;
  let mockPosts = [];
  let mockPostsProcessedResult = {};
  let redisService: RedisService;
  const LANGS = ['en','es'];
  const inMemoryCache = new Map<string, string>();
  const generateCacheKey = (values:Array<string>): string => values.join('_');
  beforeEach(async () => {
    jest.clearAllMocks();

    inMemoryCache.clear();
    mockHttpService = {
      get: jest.fn(),
    };

    mockPostService = {
      get: jest.fn(),
      generateCahceKey: jest.fn(),
    };
    //TODO: move mock data outside
    mockPosts = [
      { id: '1',title: 'Post 1', url: 'url1', slug: 'slug1', featured: true, 
        published_at: new Date('1990-02-20T20:11:10.230Z'), excerpt: 'post 1',
          tags: [{ name: TechStack.Python.toLocaleLowerCase(), slug:'python' },{ name: 'index-1' }, 
            { name: 'no_menu' }, { name: `diff-level-begginer`, slug: `diff-level-begginer` }] },
      { id: '2', title: 'Post 2', url: 'url2', slug: 'slug2', featured: false,
         published_at: new Date('1960-06-29T20:11:10.230Z'), excerpt: 'post 2',
          tags: [{ name: TechStack.TypeScript.toLocaleLowerCase(), slug:'typescript' }, { name: 'index-100' }, { name: `diff-level-intermediate`, slug: `diff-level-intermediate` }] },
      { id: '3', title: 'Post 3', url: 'url3', slug: 'slug3', featured: false,
         published_at: new Date('1958-06-29T20:11:10.230Z'), excerpt: 'post 3',
        tags: [{ name: TechStack.NodeJS.toLocaleLowerCase(), slug:'node.js' }, { name: 'index-50' }, { name: `diff-level-advanced`, slug: `diff-level-advanced` }] },
    ] as Posts[];

    const englishPosts = mockPosts.map((post) =>  {
      return {...post, tags: [...post['tags'], { name: '#lang-en', slug: 'hash-lang-en' }]}
    })

    const spanishPosts = [...mockPosts.map((post) =>  {
      return {...post, tags: [...post['tags'], { name: '#lang-es', slug: 'hash-lang-es' }]}
    })]

    mockPosts = [...englishPosts, ...spanishPosts];

    mockPostsProcessedResult = {
        [generateCacheKey([TechStack.Python, LANGS[0]])] : [
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
                                  lang:'#lang-en',
                                  difficultyLevel: 'begginer',

                              }
                            ],
      [generateCacheKey([TechStack.NodeJS, LANGS[0]])] : [
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
                                lang:'#lang-en',
                                difficultyLevel: 'intermediate',
                              },
                              {
                                id: '3',
                                index: 50,
                                title: 'Node.js Foundamentals',
                                level: null,
                                no_menu: false,
                                url: 'url3',
                                published_at: new Date('1958-06-29T20:11:10.230Z'), 
                                excerpt: 'This is a node post',
                                mainTag: TechStack.NodeJS.toLocaleLowerCase(),
                                lang:'#lang-en',
                                difficultyLevel: 'advanced',
                              }
                            ]
      };

      LANGS.forEach((_lang) => {
        if (_lang !== LANGS[0]){
          mockPostsProcessedResult = {...mockPostsProcessedResult,
            [generateCacheKey([TechStack.Python, _lang])] : 
            [...mockPostsProcessedResult[generateCacheKey([TechStack.Python, LANGS[0]])].map((postResult) => {
                return {...postResult, lang: `#lang-${_lang}`}
            })], 
            [generateCacheKey([TechStack.NodeJS, _lang])]: 
            [...mockPostsProcessedResult[generateCacheKey([TechStack.NodeJS, LANGS[0]])].map((postResult) => {
                return {...postResult, lang: `#lang-${_lang}`}
            })]
          };
        }
      })


    mockPostService.get.mockReturnValue(mockPosts );
    mockPostService.generateCahceKey.mockImplementation((values:Array<string>) => values.join('_'))
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
        ConfigService,

        {
          provide: PostsService,
          useValue: mockPostService,
        },
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
    


   
    LANGS.forEach((_lang)=> { 
      let pythonES = [];
      pythonES = [...mockPostsProcessedResult[generateCacheKey([TechStack.Python, _lang])]];
      redisService.set(
        generateCacheKey([TechStack.Python, _lang]), 
        JSON.stringify( pythonES )
      );
    });

    LANGS.forEach((_lang)=> { 
      let nodeES = [];
      nodeES = [...mockPostsProcessedResult[generateCacheKey([TechStack.NodeJS, _lang])]];
      redisService.set(
        generateCacheKey([TechStack.NodeJS, _lang]), 
        JSON.stringify( nodeES )
      );
    } );



  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  LANGS.forEach((lang) => {
    it('should return 1 post after performing a search with Term = Python', async () => {
      const term = "Python";
      const expectedSearchResult = {
          contentType: 'Article',
          title: 'Python fundamentals',
          url: 'url1',
          mainTag: 'python',
          weight: 1,
          difficultyLevel: "begginer",
      }
      const result = await service.search(term, lang);
  
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expectedSearchResult);
    });
  
  
    it('should return weight = 2 after performing a search with Term = Python funda', async () => {
      const term = "Python funda";
      const expectedSearchResult = {
        contentType: 'Article',
        title: 'Python fundamentals',
        url: 'url1',
        mainTag: 'python',
        weight: 2,
        difficultyLevel: "begginer",
    };
      const result = await service.search(term, lang);
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expectedSearchResult);
    });
  
    it('should return weight = 3 after performing a search with Term = Python funda beggin', async () => {
      const term = "Python funda beggi";
      const result = await service.search(term, lang);
      expect(result.length).toEqual(1);
      expect(result[0].weight).toEqual(3);
    });
  
    it('should return 0 results for terms not part of any post', async () => {
      const term = "Weird words";
      const result = await service.search(term, lang);
      expect(result.length).toEqual(0);
    });
  
  
    it('should return 0 results for empty seacrh term', async () => {
      const term = "";
      const result = await service.search(term, lang);
      expect(result.length).toEqual(0);
    });
  
    it(`should return all post related to ${ TechStack.Python}  and ${TechStack.NodeJS} `, async () => {
      const term = "Python Node";
      const result = await service.search(term, lang);
      const postsCount = mockPostsProcessedResult[generateCacheKey([TechStack.Python, lang])].length + mockPostsProcessedResult[generateCacheKey([TechStack.NodeJS, lang])].length
      expect(result.length).toEqual(postsCount);
    });
  
    it(`should process stored posts in cache`, async () => {
      const term = "Python Node";
      const handleCachedSearchSpy = jest.spyOn(service as any, 'handleCachedSearch');
      const castPostsToResultSpy = jest.spyOn(service as any, 'castPostsToResult');
      await service.search(term, lang);
      expect(handleCachedSearchSpy).toHaveBeenCalledTimes(1);
      let pythonPosts = [ ];
      pythonPosts = [...pythonPosts, ...mockPostsProcessedResult[generateCacheKey([TechStack.Python, lang])]];


      let nodePosts = [ ];
      nodePosts = [...nodePosts, ...mockPostsProcessedResult[generateCacheKey([TechStack.NodeJS, lang])]];

      const posts = [
        JSON.stringify(pythonPosts),
        JSON.stringify(nodePosts),
      ];
  
      expect(handleCachedSearchSpy).toHaveBeenCalledWith(term, posts);
      expect(handleCachedSearchSpy).toHaveBeenCalledTimes(1);
      const expectedValue = [...mockPostsProcessedResult[generateCacheKey([TechStack.Python, lang])],...mockPostsProcessedResult[generateCacheKey([TechStack.NodeJS, lang])]]
                            .map((obj)=> { return  { ...obj,published_at: obj.published_at.toISOString(), weight: 1 }} );
  
      expect(castPostsToResultSpy).toHaveBeenCalledWith(expectedValue);
      expect(castPostsToResultSpy).toHaveBeenCalledTimes(1);
    });
  
    it(`should get post data from ghost instance`, async () => {
      inMemoryCache.clear(); //clear cache
      const term = "Python Node";
      const handleCachedSearchSpy = jest.spyOn(service as any, 'handleCachedSearch');
      const castPostsToResultSpy = jest.spyOn(service as any, 'castPostsToResult');
      const queryPostsSpy = jest.spyOn(service as any, 'queryPosts');
      const performSearchSpy = jest.spyOn(service as any, 'performSearch');
      await service.search(term, lang);
      expect(handleCachedSearchSpy).toHaveBeenCalledTimes(0);
      expect(handleCachedSearchSpy).toHaveBeenCalledTimes(0);
      expect(castPostsToResultSpy).toHaveBeenCalledTimes(1);
      expect(queryPostsSpy).toHaveBeenCalledTimes(1);
      expect(performSearchSpy).toHaveBeenCalledTimes(1);
      expect(queryPostsSpy).toHaveBeenCalledWith([...FIELDS], [...INCLUDE], [...BASE_FILTER, ['tag', `hash-lang-${lang}`]]);
      expect(performSearchSpy).toHaveBeenCalledWith(term, mockPosts);
    });
  });
  

});

