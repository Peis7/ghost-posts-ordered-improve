import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PostsService {
    constructor(private configService: ConfigService) {}


    async get(): Promise<any[]>  {
        return [this.configService.get<string>('ghost.api_url')];
    }
}
