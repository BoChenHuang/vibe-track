import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitController } from './ratelimit.controller';
import { CacheService } from '../cache/cache.service';

function makeReq(ip = '127.0.0.1', forwarded?: string) {
  const headers: Record<string, string> = {};
  if (forwarded) headers['x-forwarded-for'] = forwarded;
  return { headers, ip } as never;
}

describe('RateLimitController', () => {
  let controller: RateLimitController;
  let cacheService: { getRateLimitStatus: jest.Mock };

  const now = Math.floor(Date.now() / 1000);

  beforeEach(async () => {
    cacheService = {
      getRateLimitStatus: jest.fn().mockResolvedValue({
        limit: 5,
        remaining: 5,
        resetAt: now + 60,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateLimitController],
      providers: [
        { provide: CacheService, useValue: cacheService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'app.rateLimit.max') return 5;
              if (key === 'app.rateLimit.windowSec') return 60;
            },
          },
        },
      ],
    }).compile();

    controller = module.get(RateLimitController);
  });

  it('returns limit, remaining, reset_at', async () => {
    const result = await controller.getStatus(makeReq());
    expect(result).toEqual({ limit: 5, remaining: 5, reset_at: now + 60 });
  });

  it('does not call INCR — uses getRateLimitStatus (read-only)', async () => {
    await controller.getStatus(makeReq());
    expect(cacheService.getRateLimitStatus).toHaveBeenCalledTimes(1);
  });

  it('uses x-forwarded-for IP when present', async () => {
    await controller.getStatus(makeReq('::1', '203.0.113.1'));
    expect(cacheService.getRateLimitStatus).toHaveBeenCalledWith(
      '203.0.113.1',
      5,
      60,
    );
  });

  it('returns remaining: 0 when quota exhausted (still HTTP 200)', async () => {
    cacheService.getRateLimitStatus.mockResolvedValue({
      limit: 5,
      remaining: 0,
      resetAt: now + 1800,
    });
    const result = await controller.getStatus(makeReq());
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(5);
  });

  it('returns remaining = limit when Redis has no key for this IP', async () => {
    cacheService.getRateLimitStatus.mockResolvedValue({
      limit: 5,
      remaining: 5,
      resetAt: now + 60,
    });
    const result = await controller.getStatus(makeReq('10.0.0.1'));
    expect(result.remaining).toBe(result.limit);
  });

  it('Redis failure: returns remaining = limit (fail-open via service)', async () => {
    cacheService.getRateLimitStatus.mockResolvedValue({
      limit: 5,
      remaining: 5,
      resetAt: now + 60,
    });
    const result = await controller.getStatus(makeReq());
    expect(result.remaining).toBe(5);
  });
});
