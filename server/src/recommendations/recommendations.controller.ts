import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly svc: RecommendationsService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get AI-powered personalized learning path for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getPath(@Param('userId') userId: string) {
    return { data: await this.svc.getPersonalizedPath(userId) };
  }
}
