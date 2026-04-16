import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FriendsService } from './friends.service';

class SendRequestDto {
  receiverId!: string;
}

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly svc: FriendsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by username (for adding friends)' })
  @ApiQuery({ name: 'q', description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'userId', description: 'Current user ID' })
  async search(@Query('q') q: string, @Query('userId') userId: string) {
    return { data: await this.svc.searchUsers(q, userId) };
  }

  @Get(':userId/list')
  @ApiOperation({ summary: 'Get accepted friends with weekly XP leaderboard' })
  @ApiParam({ name: 'userId' })
  async getFriends(@Param('userId') userId: string) {
    return { data: await this.svc.getFriends(userId) };
  }

  @Get(':userId/requests')
  @ApiOperation({ summary: 'Get pending incoming friend requests' })
  @ApiParam({ name: 'userId' })
  async getRequests(@Param('userId') userId: string) {
    return { data: await this.svc.getPendingRequests(userId) };
  }

  @Post(':userId/request')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiParam({ name: 'userId', description: 'Sender user ID' })
  @ApiBody({ schema: { example: { receiverId: 'clx...' } } })
  async sendRequest(
    @Param('userId') senderId: string,
    @Body() body: SendRequestDto,
  ) {
    return { data: await this.svc.sendRequest(senderId, body.receiverId) };
  }

  @Post('requests/:requestId/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({ name: 'requestId' })
  @ApiQuery({ name: 'userId', description: 'Accepting user ID' })
  async accept(
    @Param('requestId') requestId: string,
    @Query('userId') userId: string,
  ) {
    return { data: await this.svc.acceptRequest(requestId, userId) };
  }

  @Delete('requests/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline or remove a friend request/friendship' })
  @ApiParam({ name: 'requestId' })
  @ApiQuery({ name: 'userId', description: 'User ID performing the action' })
  async remove(
    @Param('requestId') requestId: string,
    @Query('userId') userId: string,
  ) {
    return { data: await this.svc.removeOrDecline(requestId, userId) };
  }
}
