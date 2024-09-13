import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { MembersService } from './members.service';
import { SubscribeDTO } from './dtos/subscribe.dto';
import { SubscribeSerializedDTO } from './dtos/serialized/subscribe.dto';

@UseGuards(ThrottlerGuard)
@SkipThrottle({'default': true })
@Controller('v1/members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Post('/subscribe')
  async subscribe( @Body() dto: SubscribeDTO,): Promise<SubscribeSerializedDTO>   {
    const response = await this.membersService.subscribe(dto) 
    return response as SubscribeSerializedDTO;
  }

  @Get('/all')
  async all(): Promise<Array<SubscribeSerializedDTO>>   {
    const response = await this.membersService.getAllCurrentMembers()
    return response as [SubscribeSerializedDTO];
  }

}
 