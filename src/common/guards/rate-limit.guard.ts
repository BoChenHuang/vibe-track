import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) ??
      req.ip ??
      'unknown';

    const exceeded = await this.cacheService.incrementAndCheck(ip);
    if (exceeded) {
      this.logger.warn('Rate limit exceeded', { ip });
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
