import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Posts } from '../interfaces/posts';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';

@UseGuards(ThrottlerGuard)
@Controller('v1/posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('/')
  async findAll(): Promise<Posts[]>   {
    return this.postsService.get(['title','url','featured','published_at'],['tags']);
  }

  @Post('/updatecache')
  async updateCache(@Req() request: Request): Promise<void>   {
    
    const { body } = request as PostWebhookPayload;
    
    const parsedBody: PostWebhookPayload = {
     body:{ 
        post: {
            current: {
                tags: body?.post?.current?.tags || [],
                slug: body?.post?.current?.slug || '',
            },
            previous: {
                tags: body?.post?.previous?.tags || [],
                slug: body?.post?.previous?.slug || '',
            }
        }
      }
  };

    this.postsService.updateCache();
  }
}
