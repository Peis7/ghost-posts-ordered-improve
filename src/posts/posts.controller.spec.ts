import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PostsService } from './posts.service';
import { HttpService } from '@nestjs/axios';
import { Posts } from '../interfaces/posts';
import * as path from 'path';
import configuration from '../config/configuration';
import { BASE_FILTER, FIELDS, INCLUDE } from './constants/ghost';
import { TechStack } from './enums/techStack';
import { ArrayOfStringPairs } from './types/custom';


describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  const ENV = process.env.NODE_ENV;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockPostsService = {
      getPostDataAndUpdateCache: jest.fn().mockResolvedValue([
        { id: '1', title: 'Post 1', url: 'url1', featured: true, slug:'p1', published_at: new Date('1990-02-20T20:11:10.230Z'), tags: [{ name:'tag1' }] },
        { id: '2', title: 'Post 2', url: 'url2', featured: false, slug:'p2', published_at: new Date('1960-06-29T20:11:10.230Z'), tags: [{ name:'tag2' }] },
      ] as Posts[]),
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
          provide: PostsService, useValue: mockPostsService 
        }, 
        ConfigService, {
        provide: HttpService,
        useValue: {
          get: jest.fn(),
          post: jest.fn(),
        },
      },],
      controllers: [PostsController],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return an array of posts', async () => {
    const request = {
      body: { tech: TechStack.Python.toString() },
    } as unknown as Request;
    
    const result = await controller.getCourseStructure(request);
    const filter: ArrayOfStringPairs = BASE_FILTER;
    filter.push(['primary_tag',`[${TechStack.Python.toString()}]`]);

    expect(result).toEqual([
      {  id: '1', title: 'Post 1', url: 'url1', featured: true, slug:'p1', published_at: new Date('1990-02-20T20:11:10.230Z'), tags: [{ name: 'tag1' }] },
      {  id: '2', title: 'Post 2', url: 'url2', featured: false, slug:'p2', published_at: new Date('1960-06-29T20:11:10.230Z'), tags: [{ name: 'tag2' }] },
    ]);
    expect(postsService.getPostDataAndUpdateCache).toHaveBeenCalledWith(TechStack.Python,FIELDS, INCLUDE, filter);
  });

  it('should return an empty array when invalid tech is provided', async () => {
    // Create a mock request object with invalid tech
    const request = {
        body: { tech: 'InvalidTech' },
    } as unknown as Request;

    // Call the controller method
    const result = await controller.getCourseStructure(request);

    // Assert the result
    expect(result).toEqual([]);
    expect(postsService.getPostDataAndUpdateCache).not.toHaveBeenCalled();
});
});
