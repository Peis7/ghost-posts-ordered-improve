import { Controller, Get, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../interfaces/post';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('/')
  async findAll(): Promise<Post[]>   {
    return this.postsService.get(['title','url','featured','published_at'],['tags']);
  }
}
