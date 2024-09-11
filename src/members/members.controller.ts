import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MembersService } from './members.service';

@UseGuards(ThrottlerGuard)
@Controller('v1/members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Post('/subscribe')
  async subscribe(@Req() request: Request): Promise<[]>   {
    const { body } = request; 
    return [];
  }

}
 