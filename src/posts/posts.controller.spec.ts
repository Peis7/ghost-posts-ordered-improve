import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PostsService } from './posts.service';
import { HttpService } from '@nestjs/axios';
import { Post } from '../interfaces/posts';
import * as path from 'path';
import configuration from '../config/configuration';


describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  const ENV = process.env.NODE_ENV;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockPostsService = {
      get: jest.fn().mockResolvedValue([
        { title: 'Post 1', url: 'url1', featured: true, published_at: new Date('1990-02-20T20:11:10.230Z'), tags: ['tag1'] },
        { title: 'Post 2', url: 'url2', featured: false, published_at: new Date('1960-06-29T20:11:10.230Z'), tags: ['tag2'] },
      ] as Post[]),
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
    const result = await controller.findAll();

    expect(result).toEqual([
      {  title: 'Post 1', url: 'url1', featured: true, published_at: new Date('1990-02-20T20:11:10.230Z'), tags: ['tag1'] },
      {  title: 'Post 2', url: 'url2', featured: false, published_at: new Date('1960-06-29T20:11:10.230Z'), tags: ['tag2'] },
    ]);
    expect(postsService.get).toHaveBeenCalledWith(['title', 'url', 'featured', 'published_at'], ['tags']);
  });
});
