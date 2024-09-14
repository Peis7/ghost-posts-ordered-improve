import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import { Posts } from '../interfaces/posts';
import * as path from 'path';
import configuration from '../config/configuration';
import { ArrayOfStringPairs } from '../types/custom';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { SubscribeDTO } from './dtos/subscribe.dto';


describe('PostsController', () => {
  const ENV = process.env.NODE_ENV;
  let controller: MembersController;
  let membersService: MembersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockMembersService = {
        subscribe: jest.fn(),
        getAllCurrentMembers: jest.fn(),
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
          provide: MembersService, useValue: mockMembersService 
        }, 
        ConfigService, {
                provide: HttpService,
                useValue: {
                  get: jest.fn(),
                  post: jest.fn(),
                },
           },
      ],
      controllers: [MembersController],
    }).compile();

    controller = module.get<MembersController>(MembersController);
    membersService = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(controller.subscribe).toBeDefined();
  });

  it('should create a member', async () => {
    const createMember = { email:'p@o.com' } as SubscribeDTO;
    await controller.subscribe(createMember);
    const subscribeSpy = jest.spyOn(membersService, 'subscribe');
    expect(subscribeSpy).toHaveBeenCalledWith(createMember);
  });

});
