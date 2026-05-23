import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { REDIS_CLIENT } from './cache.tokens';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

@Injectable()
export class CacheService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async incrementAndCheck(ip: string): Promise<boolean> {
    try {
      const key = `ratelimit:${ip}`;
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      }
      return count > RATE_LIMIT_MAX;
    } catch (err) {
      this.logger.error('Redis rate limit check failed, allowing request', {
        err: (err as Error).message,
      });
      return false;
    }
  }

  async getCached(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.error('Redis get failed, skipping cache', {
        err: (err as Error).message,
      });
      return null;
    }
  }

  async setCached(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.error('Redis set failed, skipping cache write', {
        err: (err as Error).message,
      });
    }
  }
}
