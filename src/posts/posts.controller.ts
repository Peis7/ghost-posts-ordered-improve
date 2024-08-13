import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Posts } from '../interfaces/posts';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { FIELDS, INCLUDE } from './constants/ghost';
import { isTechStack } from './enums/techOptions';
import { getCourseStructureBody } from './interfaces/getCourseStructureRequest';

@UseGuards(ThrottlerGuard)
@Controller('v1/posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('/')
  async getCourseStructure(@Req() request: Request): Promise<Posts[]>   {
    const { body } = request;
    const { tech } = body as getCourseStructureBody;
    if (!isTechStack(tech)) return [];
    return this.postsService.getPostDataAndUpdateCache(tech, FIELDS, INCLUDE);
  }

  @Post('/updatecache')
  async updateCache(@Req() request: Request): Promise<void>   {
    
    const { body } = request as PostWebhookPayload;
    
    const parsedBody: PostWebhookPayload = {
     body:{ 
        post: {
            current: {
                id: body?.post?.current?.id || '',
                tags: body?.post?.current?.tags || [],
                slug: body?.post?.current?.slug || '',
            },
            previous: {
                id: body?.post?.current?.id || '', //id is alway in present data
                tags: body?.post?.previous?.tags || [],
                slug: body?.post?.previous?.slug || '',
            }
        }
      }
  };

    this.postsService.updateCache(parsedBody);
  }
}
