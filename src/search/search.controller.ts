import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SearchResult } from './interfaces/searchResult';
import { SearchService } from './search.service';

@UseGuards(ThrottlerGuard)
@Controller('v1/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('/')
  async search(@Query('term') term: string): Promise<SearchResult[]>   {
    return this.searchService.search(term); 
  }

}
 