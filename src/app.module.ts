import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import * as path from 'path';

const ENV = process.env.NODE_ENV;

console.log(ENV);

@Module({
  imports: [
    PostsModule,  
    ConfigModule.forRoot({
      envFilePath: path.resolve(!ENV ? '.env' : `.env.${ENV}`),
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
