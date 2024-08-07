import { Test, TestingModule } from '@nestjs/testing';
import { Posts } from './posts.service';

describe('Posts', () => {
  let provider: Posts;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Posts],
    }).compile();

    provider = module.get<Posts>(Posts);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
