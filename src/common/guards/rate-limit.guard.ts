import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CacheService } from '../../cache/cache.service';
import { extractIp } from '../utils/extract-ip';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = extractIp(req);

    const max = this.configService.get<number>('app.rateLimit.max') ?? 5;
    const windowSec =
      this.configService.get<number>('app.rateLimit.windowSec') ?? 60;

    const result = await this.cacheService.incrementAndCheck(
      ip,
      max,
      windowSec,
    );

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);

    if (result.exceeded) {
      const retryAfter = Math.max(
        0,
        result.resetAt - Math.floor(Date.now() / 1000),
      );
      (req as unknown as Record<string, unknown>).rateLimitInfo = {
        retryAfter,
        limit: max,
        remaining: 0,
        resetAt: result.resetAt,
      };
      this.logger.warn('Rate limit exceeded', { ip });
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
