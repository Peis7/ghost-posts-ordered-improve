import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { SearchResult } from './interfaces/searchResult';
import { SearchService } from './search.service';

@UseGuards(ThrottlerGuard)
@SkipThrottle({'members': true })
@Controller('v1/search')
export class SearchController { 
  constructor(private searchService: SearchService) {}

  @Get('/')
  async search(@Req() req: Request, @Query('term') term: string, @Query('lang') lang: string): Promise<SearchResult[]>   {
    return this.searchService.search(term, lang); 
  }

}
 