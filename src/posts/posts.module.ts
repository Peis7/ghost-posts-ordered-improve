import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
