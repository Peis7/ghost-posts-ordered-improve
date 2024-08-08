import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../interfaces/post';


@Controller('posts')
export class PostsController {
    constructor(private postsService: PostsService) {}

  @Get('/')
  async findAll(): Promise<Post[]>   {
    return this.postsService.get(['id','title','url','featured','published_at'],['tags']);
  }
}
