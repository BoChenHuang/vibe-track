import { Controller, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CacheService } from '../cache/cache.service';
import { extractIp } from '../common/utils/extract-ip';

@ApiTags('rate-limit')
@Controller('ratelimit')
export class RateLimitController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Query current rate limit status (read-only, does not consume quota)',
  })
  @ApiResponse({
    status: 200,
    description: 'Current rate limit status for the requesting IP',
    schema: {
      properties: {
        limit: { type: 'integer', example: 5 },
        remaining: { type: 'integer', example: 3 },
        reset_at: { type: 'integer', example: 1717059600 },
      },
    },
  })
  async getStatus(@Req() req: Request) {
    const ip = extractIp(req);

    const max = this.configService.get<number>('app.rateLimit.max') ?? 5;
    const windowSec =
      this.configService.get<number>('app.rateLimit.windowSec') ?? 60;

    const status = await this.cacheService.getRateLimitStatus(
      ip,
      max,
      windowSec,
    );
    return {
      limit: status.limit,
      remaining: status.remaining,
      reset_at: status.resetAt,
    };
  }
}
