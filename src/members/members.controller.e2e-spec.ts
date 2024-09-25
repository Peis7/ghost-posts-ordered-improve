import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { RedisService } from '../redis/redis.service';
import { MembersService } from './members.service';
import { SubscribeDTO } from './dtos/subscribe.dto';

describe('Throttling (e2e)', () => {
  let app: INestApplication; 
  const THROTTLE_LIMIT_MEMBERS = parseInt(process.env.THROTTLE_LIMIT_MEMBERS);
  const THROTTLE_TTL_MEMBERS = parseInt(process.env.THROTTLE_TTL_MEMBERS);
  const TEST_EMAIL = 'p@e.com';

  let membersService: Partial<MembersService> & { subscribe: jest.Mock }; // Define membersService with mock

  beforeAll(async () => {
    membersService = {
      subscribe: jest.fn(), // Initialize mock without implementation here
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue({
        getClient: jest.fn().mockReturnValue({}), // Mock Redis client
        getDefaultTimeInSeconds: jest.fn().mockReturnValue(3600),
      })
      .overrideProvider(MembersService)
      .useValue(membersService) // Use the mock service
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 if honeypot is present', async () => {
    const dto: SubscribeDTO = { honeypot: 'true', email: TEST_EMAIL };
    const response = await request(app.getHttpServer())
      .post('/v1/members/subscribe')
      .send(dto)
      .expect(400);
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_TTL_MEMBERS));

    expect(response.body.message).toEqual('Error');
  });

  it('should call the subscribe service successfully', async () => {
    const dto: SubscribeDTO = { honeypot: null, email: TEST_EMAIL };
    
    // Mock the subscribe method for this test
    membersService.subscribe.mockImplementation(() => {
      return Promise.resolve({ message: 'mocked response', email: TEST_EMAIL });
    });

    const response = await request(app.getHttpServer())
      .post('/v1/members/subscribe')
      .send(dto)
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, THROTTLE_TTL_MEMBERS)); 

    expect(response.body.email).toEqual(dto.email);
  });

  it('should return 429 after hitting throttle limit', async () => {
    const dto: SubscribeDTO = { honeypot: '', email: TEST_EMAIL };

    // Mock the subscribe method to return a valid response
    membersService.subscribe.mockImplementation(() => {
      return Promise.resolve({ message: 'mocked response', email: TEST_EMAIL });
    });

    // Send multiple requests to exceed the throttle limit
    for (let i = 0; i < THROTTLE_LIMIT_MEMBERS; i++) {
      await request(app.getHttpServer()).post('/v1/members/subscribe').send(dto);
    }

    const throttledRes = await request(app.getHttpServer())
      .post('/v1/members/subscribe')
      .send(dto)
      .expect(429);

    expect(throttledRes.body.message).toEqual('ThrottlerException: Too Many Requests');
  });
});
