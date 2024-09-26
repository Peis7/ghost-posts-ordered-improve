import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Posts } from '../interfaces/posts';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { PostWebhookPayload } from '../interfaces/postwebhookpayload';
import { FIELDS, BASE_FILTER, INCLUDE } from './constants/ghost';
import { isTechStack } from './enums/techStack';
import { ArrayOfStringPairs } from '../types/custom';
import { LANG } from './enums/langs';

@UseGuards(ThrottlerGuard)
@SkipThrottle({'members': true }) 
@Controller('v1/posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('/')
  async search(@Query('tech') tech: string, @Query('lang') lang: string): Promise<Posts[]>   {
    const filter: ArrayOfStringPairs = [...BASE_FILTER];
    filter.push(['primary_tag',`${tech.toLowerCase()}`]);
    filter.push(['tag', `hash-lang-${lang}`]);
    if (!isTechStack(tech)) return [];
    return this.postsService.getPostDataAndUpdateCache(tech, lang as LANG, [...FIELDS], [...INCLUDE], filter);
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
                url: body?.post?.current?.url || '',
                title: body?.post?.current?.title || '',
                excerpt: body?.post?.current?.excerpt || '',
                mainTag: body?.post?.current?.mainTag || '',
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

  @Post('/published')
  async handlePublished(@Req() request: Request): Promise<void>   {
    const { body } = request as PostWebhookPayload;
    const post:Posts = body?.post?.current;
    this.postsService.handlePublished(post);
  }

  @Post('/unpublished')
  async handleUnublished(@Req() request: Request): Promise<void>   {
    const { body } = request as PostWebhookPayload;
    const post:Posts = body?.post?.current;
    this.postsService.handleUnpublished(post);
  }

  @Post('/deleted')
  async deleted(@Req() request: Request): Promise<void>   {
    const { body } = request as PostWebhookPayload;
    const post:Posts = body?.post?.previous; 
    this.postsService.handleDeleted(post);
  }
}
 