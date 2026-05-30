import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { REDIS_CLIENT } from './cache.tokens';

export interface RateLimitResult {
  exceeded: boolean;
  count: number;
  remaining: number;
  resetAt: number; // Unix epoch seconds (UTC)
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt: number; // Unix epoch seconds (UTC)
}

@Injectable()
export class CacheService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async incrementAndCheck(
    ip: string,
    max: number,
    windowSec: number,
  ): Promise<RateLimitResult> {
    try {
      const key = `ratelimit:${ip}`;
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, windowSec);
      }
      const ttl = await this.redis.ttl(key);
      const now = Math.floor(Date.now() / 1000);
      const resetAt = now + (ttl > 0 ? ttl : windowSec);
      return {
        exceeded: count > max,
        count,
        remaining: Math.max(0, max - count),
        resetAt,
      };
    } catch (err) {
      this.logger.error('Redis rate limit check failed, allowing request', {
        err: (err as Error).message,
      });
      const now = Math.floor(Date.now() / 1000);
      return {
        exceeded: false,
        count: 0,
        remaining: max,
        resetAt: now + windowSec,
      };
    }
  }

  async getRateLimitStatus(
    ip: string,
    max: number,
    windowSec: number,
  ): Promise<RateLimitStatus> {
    try {
      const key = `ratelimit:${ip}`;
      const [raw, ttl] = await Promise.all([
        this.redis.get(key),
        this.redis.ttl(key),
      ]);
      const count = raw ? parseInt(raw, 10) : 0;
      const now = Math.floor(Date.now() / 1000);
      const resetAt = ttl > 0 ? now + ttl : now + windowSec;
      return { limit: max, remaining: Math.max(0, max - count), resetAt };
    } catch (err) {
      this.logger.error('Redis rate limit status check failed', {
        err: (err as Error).message,
      });
      const now = Math.floor(Date.now() / 1000);
      return { limit: max, remaining: max, resetAt: now + windowSec };
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
