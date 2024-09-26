import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {  ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import configuration from '../config/configuration';
import { of } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { createMock } from '@golevelup/ts-jest';
import { TechStack } from './enums/techStack';
import { TestTechStacks } from './test/data';
import { GHOST_POST_FIELD } from './interfaces/postfields';
import { LANG } from './enums/langs';
import { UtilsService } from '../utils/utils.service';
import { LoggerWinstonModule } from '../logger/logger.module';
import { WinstonLoggerService } from '../logger/logger.service';
import { AVAILABLE_LANGS, MAIN_LANG } from './constants/ghost';
 

describe('Posts Service', () => {
  let service: PostsService;
  let mockHttpService: { get: jest.Mock };
  let mockUtilsService: { getConfig: jest.Mock };
  const ENV = process.env.NODE_ENV;
  let mockPosts = {};
  let mockPostsProcessedResult= {};
  let redisService: RedisService;
  let configService: ConfigService;
  let utilsService: UtilsService;
  const generateCacheKey = (values:Array<string>): string => values.join('_');
  const LANGS = AVAILABLE_LANGS;
  const currentTechLangPair = { tech: TechStack , lang: LANG}
  const inMemoryCache = new Map<string, string>();
  interface Tag {
    name: string;
    slug?: string;
  }  
  const loggerMockBase = jest.fn().mockImplementation((message) => {
    console.log(message);
  });

  function buildLangOptions(currentLang, slug){   
      const urlLangs = [];
      AVAILABLE_LANGS.map((lang)=>{
          if (lang !== currentLang) {
              const formatedSlug = MAIN_LANG === lang ? `${slug.substring(slug.indexOf('-') + 1)}`: `${lang}-${slug.substring(slug.indexOf('-') + 1)}`; 
              urlLangs.push({ lang, slug: formatedSlug});
          }
      });
      return urlLangs;
  }



  beforeEach(async () => {
    jest.clearAllMocks();

    inMemoryCache.clear();
    mockHttpService = {
      get: jest.fn(),
    };

    const mockLoggerService = {
      log: loggerMockBase,
      error: loggerMockBase,
      warn: loggerMockBase,
      debug: loggerMockBase,
      verbose: loggerMockBase
    };

   mockUtilsService = { 
    getConfig: jest.fn()
  };

    LANGS.forEach((_lang) => {
      TestTechStacks.forEach((tech, index) => {
        const no_menu = Math.random() >= 0.5;
        const featured = Math.random() >= 0.5;
        const difficultyLevel = Math.random() < 0.3 ? 'advanced' : Math.random() < 0.5 ? 'intermediate' : 'begginer';
        const tags: Tag[] = [
          { name: tech.toLocaleLowerCase(), slug:tech.toLocaleLowerCase() },
          { name: `#lang-${_lang}`, slug: `hash-lang-${_lang}` },
          { name: `diff-level-${difficultyLevel}`, slug: `diff-level-${difficultyLevel}` }
        ]
        if (no_menu){
          tags.push({ name: 'no_menu' });
        }{
          tags.push({ name: `index-${index}` });
        }
        const post = { 
          id: index,
          title: `Post ${index}`,
          url: 'url1', 
          slug: 'slug1', 
          featured, 
          published_at: new Date('1990-02-20T20:11:10.230Z'), 
          excerpt: `Post excerpt ${index}`,
          tags
         };

         mockPosts[generateCacheKey([tech, _lang])] = [post];
         const slug = 'slug1';
        const postResult = {
          id: index,
          index: index,
          title: `Post ${index}`,
          level: null,
          no_menu,
          url: 'url1',
          slug,
          featured,
          new: false,
          published_at: new Date('1990-02-20T20:11:10.230Z'),
          excerpt: `Post excerpt ${index}`,
          mainTag: tech.toLocaleLowerCase(),
          lang:`#lang-${_lang}`,
          difficultyLevel,
          langURLs: buildLangOptions(_lang, slug),
        }
        mockPostsProcessedResult[generateCacheKey([tech, _lang])] = [postResult];
      });
    });


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
        LoggerWinstonModule
        
      ],
      providers: [
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
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        { 
          provide: WinstonLoggerService, useValue: mockLoggerService 
        }, 
      ]
    }).compile();
 
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    utilsService = module.get<UtilsService>(UtilsService);
    service = module.get<PostsService>(PostsService);

    jest.spyOn(utilsService, 'getConfig').mockImplementation((key: string) => {
      return configService.get(key);
    });

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

  LANGS.forEach((_lang) => {
      TestTechStacks.forEach((tech) => {
        it(`should get course posts array and update cache: ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          const isNewSpy = jest.spyOn(service as any, 'isNew');
          const getFirstTagWithPattherSpy = jest.spyOn(service as any, 'getFirstTagWithPatther');
          const getIndexFromSpy = jest.spyOn(service as any, 'getIndexFrom');
          const buildUrlSpy = jest.spyOn(service as any, 'buildUrl');
          const posts = await service.getPostDataAndUpdateCache(tech, _lang as LANG, [], [], []);
          expect(isNewSpy).toHaveBeenCalledTimes(posts.length);
          expect(getFirstTagWithPattherSpy).toHaveBeenCalledTimes(posts.length*5);
          expect(getIndexFromSpy).toHaveBeenCalledTimes(posts.length);
          expect(buildUrlSpy).toHaveBeenCalledWith([],[],[]);
        });

        it('should return an array of posts', async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          const spyGet = jest.spyOn(service, 'getPostDataAndUpdateCache');
          const result = await service.getPostDataAndUpdateCache(tech,  _lang as LANG, ['some'], ['value'], [['tag','python']]);
          expect(result).toEqual(mockPostsProcessedResult[generateCacheKey([tech, _lang])]);
          expect(spyGet).toHaveBeenCalledWith(tech, _lang, ['some'], ['value'], [['tag','python']] );
        });

        it(`should update cache data for course of ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          inMemoryCache.delete(tech);
          const setTechCacheSpy = jest.spyOn(redisService, 'set');
          const spySetCahce = jest.spyOn(service as any, 'setTechCache');
          const postData = await service.getPostDataAndUpdateCache(tech,  _lang as LANG, ['some'], ['value'],[['tag','python']]);

          expect(spySetCahce).toHaveBeenCalledTimes(1);
          expect(spySetCahce).toHaveBeenCalledWith(generateCacheKey([tech, _lang]), JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));

          expect(setTechCacheSpy).toHaveBeenCalledTimes(2);
          expect(setTechCacheSpy).toHaveBeenCalledWith(generateCacheKey([tech, _lang]), JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));
          const cachedValue = await redisService.get(generateCacheKey([tech, _lang]));
          expect(cachedValue).toBeTruthy();
          expect(cachedValue).toBe(JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));
          expect(postData).toStrictEqual(mockPostsProcessedResult[generateCacheKey([tech, _lang])]);
        });

        it(`should return cached data and NOT update cache for course of ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          await redisService.set(generateCacheKey([tech, _lang]), JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));
          const spySet = jest.spyOn(redisService, 'set');
          const spyGet = jest.spyOn(redisService, 'get');
          const spySetCahce = jest.spyOn(service as any, 'setTechCache');
          const postData = await service.getPostDataAndUpdateCache(tech,  _lang as LANG, ['some'], ['value'],[['tag','python']]);

          expect(spySetCahce).toHaveBeenCalledTimes(0);
          expect(spySet).toHaveBeenCalledTimes(1);
          expect(spyGet).toHaveBeenCalledTimes(3);
          const cachedValue = await redisService.get(generateCacheKey([tech, _lang]));
          expect(cachedValue).toBeTruthy();
          expect(cachedValue).toBe(JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));
          const result = mockPostsProcessedResult[generateCacheKey([tech, _lang])].map((obj)=> { return { ...obj,published_at: obj.published_at.toISOString() } });
          expect(postData).toStrictEqual(result);
        });

        it(`should add published post to course structure ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          const spySet = jest.spyOn(redisService, 'set');
          const spyGet = jest.spyOn(redisService, 'get');
          const spyGetTechFromTags = jest.spyOn(service as any, 'getTechFromTags');
          const spySetCahce = jest.spyOn(service as any, 'setTechCache');
          const testPost = {...mockPosts[generateCacheKey([tech, _lang])][mockPosts[generateCacheKey([tech, _lang])].length - 1],id: 4, tags: [{name: tech}]}; //get a copy of last test post to publish
          const lengthBeforePublishedPost = inMemoryCache.size;
          await service.handlePublished(testPost);
          expect(spySetCahce).toHaveBeenCalledTimes(1);
          expect(spyGetTechFromTags).toHaveBeenCalledTimes(1);
          expect(spySet).toHaveBeenCalledTimes(1);
          expect(inMemoryCache.size).toBe(lengthBeforePublishedPost + 1);
        });

        it(`should remove post from cache when post is unpublished and update cached value for: ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          await redisService.set(generateCacheKey([tech, _lang]), JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));//set a value in cache
          const spyGet = jest.spyOn(redisService, 'get');
          const spySetCahce = jest.spyOn(service as any, 'setTechCache');
          const testPost = mockPosts[generateCacheKey([tech, _lang])][mockPosts[generateCacheKey([tech, _lang])].length - 1]; //get a copy of last test post to upublish
          testPost['tags'].unshift({name: tech});//add  the main tag [ index 0 ]
          await service.handleUnpublished(testPost);
          const cachedValueAfterUnpublished = await redisService.get(generateCacheKey([tech, _lang]));
          const expectedCourseStructure =  mockPostsProcessedResult[generateCacheKey([tech, _lang])].
                                            filter((post)=>post[GHOST_POST_FIELD.base.ID] != testPost[GHOST_POST_FIELD.base.ID])
                                              .map((obj)=> { return { ...obj,published_at: obj.published_at.toISOString() } });
          expect(spySetCahce).toHaveBeenCalledTimes(1);
          expect(spyGet).toHaveBeenCalledTimes(3);
          expect(JSON.parse(cachedValueAfterUnpublished)).toStrictEqual(expectedCourseStructure);
        });

        it(`should remove post from cache when post is deleted and update cached value for: ${tech}`, async () => {
          mockHttpService.get.mockReturnValue(of({ data: { posts: mockPosts[generateCacheKey([tech.toString(), _lang.toString()])] } }));
          await redisService.set(generateCacheKey([tech, _lang]), JSON.stringify(mockPostsProcessedResult[generateCacheKey([tech, _lang])]));//set a value in cache
          const spyGet = jest.spyOn(redisService, 'get');
          const spySetCahce = jest.spyOn(service as any, 'setTechCache');
          const testPost = mockPosts[generateCacheKey([tech, _lang])][mockPosts[generateCacheKey([tech, _lang])].length - 1]; //get a copy of last test post to upublish
          testPost['tags'].unshift({name: tech});//add  the main tag [ index 0 ]
          await service.handleDeleted(testPost);
          const cachedValueAfterUnpublished = await redisService.get(generateCacheKey([tech, _lang]));
          const expectedCourseStructure = mockPostsProcessedResult[generateCacheKey([tech, _lang])].
                                filter((post)=>post[GHOST_POST_FIELD.base.ID] != testPost[GHOST_POST_FIELD.base.ID])
                                  .map((obj)=> { return { ...obj,published_at: obj.published_at.toISOString() } });
          expect(spySetCahce).toHaveBeenCalledTimes(1);
          expect(spyGet).toHaveBeenCalledTimes(3);
          expect(JSON.parse(cachedValueAfterUnpublished)).toStrictEqual(expectedCourseStructure);
        });
      });
  });
});

