import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import configuration from '../config/configuration';
import { of } from 'rxjs';


describe('Posts', () => {
  let service: PostsService;
  let mockHttpService: { get: jest.Mock };
  const ENV = process.env.NODE_ENV;

  console.log(ENV);
  beforeEach(async () => {
    mockHttpService = {
      get: jest.fn(),
    };

    // Define mock posts data
    const mockPosts = [
      { title: 'Post 1', url: 'url1', featured: true, published_at: new Date('1990-02-20T20:11:10.230Z'), 
          tags: [{ name: 'index-1' }, { name: 'no_menu' }] },
      { title: 'Post 2', url: 'url2', featured: false, published_at: new Date('1960-06-29T20:11:10.230Z'), 
          tags: [{ name: 'index-100' }] },
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
      providers: [PostsService, ConfigService, {
        provide: HttpService,
        useValue: mockHttpService,
      },]
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an array of posts', async () => {
    const fields = ['title', 'url', 'featured', 'published_at'];
    const include = ['tags'];
    const result = await service.get(fields, include);

    console.log(result);
    expect(result).toEqual([
      {
          index: 1,
          title: 'Post 1',
          level: null,
          no_menu: true,
          url: 'url1',
          featured: true,
          new: false

      },
      {
        index: 100,
        title: 'Post 2',
        level: null,
        no_menu: false,
        url: 'url2',
        featured: false,
        new: false
      }
,
    ]);
    //expect(service.get).toHaveBeenCalledWith( fields, include );
  });
});
