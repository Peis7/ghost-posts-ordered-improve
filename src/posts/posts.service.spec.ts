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
import { POST_ORDER_DATA_KEY } from '../cache/constants';
import { Posts } from '../interfaces/posts';
import { TechStack } from './enums/techStack';
import { TestTechStacks } from './test/data';
import { GHOST_POST_FIELD } from './interfaces/postfields';


describe('Posts Service', () => {
  let service: PostsService;
  let mockHttpService: { get: jest.Mock };
  const ENV = process.env.NODE_ENV;
  let mockPosts = [];
  let mockPostsProcessedResult= [];
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
      { id: '1',title: 'Post 1', url: 'url1', slug: 'slug1', featured: true, published_at: new Date('1990-02-20T20:11:10.230Z'), 
          tags: [{ name: 'index-1' }, { name: 'no_menu' }] },
      { id: '2', title: 'Post 2', url: 'url2', slug: 'slug2', featured: false, published_at: new Date('1960-06-29T20:11:10.230Z'), 
          tags: [{ name: 'index-100' }] },
      { id: '3', title: 'Post 3', url: 'url3', slug: 'slug3', featured: false, published_at: new Date('1958-06-29T20:11:10.230Z'), 
        tags: [{ name: 'index-50' }] },
    ] as Posts[];

    mockPostsProcessedResult = [
      {
        id: '1',
        index: 1,
        title: 'Post 1',
        level: null,
        no_menu: true,
        url: 'url1',
        slug: 'slug1',
        featured: true,
        new: false

    },
    {
      id: '2',
      index: 100,
      title: 'Post 2',
      level: null,
      no_menu: false,
      url: 'url2',
      slug: 'slug2',
      featured: false,
      new: false
    },
    {
      id: '3',
      index: 50,
      title: 'Post 3',
      level: null,
      no_menu: false,
      url: 'url3',
      slug: 'slug3',
      featured: false,
      new: false
    }
,
    ];

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
    service = module.get<PostsService>(PostsService);

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



  TestTechStacks.forEach((tech) => {
    it(`should get course posts array and update cache: ${tech}`, async () => {
      const isNewSpy = jest.spyOn(service as any, 'isNew');
      const getFirstTagWithPattherSpy = jest.spyOn(service as any, 'getFirstTagWithPatther');
      const getIndexFromSpy = jest.spyOn(service as any, 'getIndexFrom');
      const buildUrlSpy = jest.spyOn(service as any, 'buildUrl');
      const posts = await service.getPostDataAndUpdateCache(tech, [], [], []);
      expect(isNewSpy).toHaveBeenCalledTimes(posts.length);
      expect(getFirstTagWithPattherSpy).toHaveBeenCalledTimes(posts.length*2);
      expect(getIndexFromSpy).toHaveBeenCalledTimes(posts.length);
      expect(buildUrlSpy).toHaveBeenCalledWith([],[],[]);
    });

    it('should return an array of posts', async () => {
      const spyGet = jest.spyOn(service, 'getPostDataAndUpdateCache');
      const result = await service.getPostDataAndUpdateCache(tech, ['some'], ['value'], [['tag','python']]);
      expect(result).toEqual(mockPostsProcessedResult);
      expect(spyGet).toHaveBeenCalledWith(tech, ['some'], ['value'], [['tag','python']] );
    });

    it(`should update cache data for course of ${tech}`, async () => {
      inMemoryCache.delete(tech);
      const setTechCacheSpy = jest.spyOn(redisService, 'set');
      const spySetCahce = jest.spyOn(service as any, 'setTechCache');
      const postData = await service.getPostDataAndUpdateCache(tech, ['some'], ['value'],[['tag','python']]);

      expect(spySetCahce).toHaveBeenCalledTimes(1);
      expect(spySetCahce).toHaveBeenCalledWith(tech, JSON.stringify(mockPostsProcessedResult));

      expect(setTechCacheSpy).toHaveBeenCalledTimes(1);
      expect(setTechCacheSpy).toHaveBeenCalledWith(tech, JSON.stringify(mockPostsProcessedResult));
      const cachedValue = await redisService.get(tech);
      expect(cachedValue).toBeTruthy();
      expect(cachedValue).toBe(JSON.stringify(mockPostsProcessedResult));
      expect(postData).toStrictEqual(mockPostsProcessedResult);
    });

    it(`should return cached data and NOT update cache for course of ${tech}`, async () => {
      
      await redisService.set(tech, JSON.stringify(mockPostsProcessedResult));
      const spySet = jest.spyOn(redisService, 'set');
      const spyGet = jest.spyOn(redisService, 'get');
      const spySetCahce = jest.spyOn(service as any, 'setTechCache');
      const postData = await service.getPostDataAndUpdateCache(tech, ['some'], ['value'],[['tag','python']]);

      expect(spySetCahce).toHaveBeenCalledTimes(0);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(spyGet).toHaveBeenCalledTimes(2);
      const cachedValue = await redisService.get(tech);
      expect(cachedValue).toBeTruthy();
      expect(cachedValue).toBe(JSON.stringify(mockPostsProcessedResult));
      expect(postData).toStrictEqual(mockPostsProcessedResult);
    });

    it(`should add published post to course structure ${tech}`, async () => {
      const spySet = jest.spyOn(redisService, 'set');
      const spyGet = jest.spyOn(redisService, 'get');
      const spyGetTechFromTags = jest.spyOn(service as any, 'getTechFromTags');
      const spySetCahce = jest.spyOn(service as any, 'setTechCache');
      const testPost = {...mockPosts[mockPosts.length - 1],id: '4', tags: [{name: tech} ]}; //get a copy of last test post to publish
      const lengthBeforePublishedPost = inMemoryCache.size;
      await service.handlePublished(testPost);
      expect(spySetCahce).toHaveBeenCalledTimes(1);
      expect(spyGetTechFromTags).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(inMemoryCache.size).toBe(lengthBeforePublishedPost + 1);
    });

    it(`should remove post from cache when post is unpublished and update cached value for: ${tech}`, async () => {
      await redisService.set(tech, JSON.stringify(mockPostsProcessedResult));//set a value in cache
      const spyGet = jest.spyOn(redisService, 'get');
      const spySetCahce = jest.spyOn(service as any, 'setTechCache');
      const testPost = mockPosts[mockPosts.length - 1]; //get a copy of last test post to upublish
      testPost['tags'].unshift({name: tech});//add  the main tag [ index 0 ]
      await service.handleUnpublished(testPost);
      const cachedValueAfterUnpublished = await redisService.get(tech);
      const expectedCourseStructure = mockPostsProcessedResult.filter((post)=>post[GHOST_POST_FIELD.base.ID] != testPost[GHOST_POST_FIELD.base.ID]);
      expect(spySetCahce).toHaveBeenCalledTimes(1);
      expect(spyGet).toHaveBeenCalledTimes(2);
      expect(JSON.parse(cachedValueAfterUnpublished)).toStrictEqual(expectedCourseStructure);
    });

    it(`should remove post from cache when post is deleted and update cached value for: ${tech}`, async () => {
      await redisService.set(tech, JSON.stringify(mockPostsProcessedResult));//set a value in cache
      const spyGet = jest.spyOn(redisService, 'get');
      const spySetCahce = jest.spyOn(service as any, 'setTechCache');
      const testPost = mockPosts[mockPosts.length - 1]; //get a copy of last test post to upublish
      testPost['tags'].unshift({name: tech});//add  the main tag [ index 0 ]
      await service.handleDeleted(testPost);
      const cachedValueAfterUnpublished = await redisService.get(tech);
      const expectedCourseStructure = mockPostsProcessedResult.filter((post)=>post[GHOST_POST_FIELD.base.ID] != testPost[GHOST_POST_FIELD.base.ID]);
      expect(spySetCahce).toHaveBeenCalledTimes(1);
      expect(spyGet).toHaveBeenCalledTimes(2);
      expect(JSON.parse(cachedValueAfterUnpublished)).toStrictEqual(expectedCourseStructure);
    });
  });
});

