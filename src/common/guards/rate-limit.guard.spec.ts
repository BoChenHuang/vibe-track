import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from './rate-limit.guard';
import { CacheService } from '../../cache/cache.service';

const mockLogger = { warn: jest.fn(), error: jest.fn() };

function makeContext(ip = '127.0.0.1', forwarded?: string) {
  const headers: Record<string, string> = {};
  if (forwarded) headers['x-forwarded-for'] = forwarded;

  const req = { headers, ip } as unknown;
  const res = { setHeader: jest.fn() };

  return {
    req,
    res,
    context: {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext,
  };
}

function makeGuard(
  cacheResult: Awaited<ReturnType<CacheService['incrementAndCheck']>>,
  max = 5,
  windowSec = 60,
) {
  const cacheService = {
    incrementAndCheck: jest.fn().mockResolvedValue(cacheResult),
  } as unknown as CacheService;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'app.rateLimit.max') return max;
      if (key === 'app.rateLimit.windowSec') return windowSec;
    }),
  } as unknown as ConfigService;

  const guard = new RateLimitGuard(
    mockLogger as never,
    cacheService,
    configService,
  );
  return { guard, cacheService };
}

describe('RateLimitGuard', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('successful request (not exceeded)', () => {
    it('returns true and sets X-RateLimit-* headers', async () => {
      const now = Math.floor(Date.now() / 1000);
      const { guard } = makeGuard({
        exceeded: false,
        count: 1,
        remaining: 4,
        resetAt: now + 60,
      });
      const { context, res } = makeContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', now + 60);
    });

    it('extracts IP from x-forwarded-for header', async () => {
      const { guard, cacheService } = makeGuard({
        exceeded: false,
        count: 1,
        remaining: 4,
        resetAt: Math.floor(Date.now() / 1000) + 60,
      });
      const { context } = makeContext('::1', '203.0.113.5');

      await guard.canActivate(context);

      expect(cacheService.incrementAndCheck).toHaveBeenCalledWith(
        '203.0.113.5',
        5,
        60,
      );
    });
  });

  describe('rate limit exceeded', () => {
    it('throws 429 HttpException', async () => {
      const now = Math.floor(Date.now() / 1000);
      const { guard } = makeGuard({
        exceeded: true,
        count: 6,
        remaining: 0,
        resetAt: now + 3000,
      });
      const { context } = makeContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('attaches rateLimitInfo to request before throwing', async () => {
      const now = Math.floor(Date.now() / 1000);
      const resetAt = now + 1800;
      const { guard } = makeGuard({
        exceeded: true,
        count: 6,
        remaining: 0,
        resetAt,
      });
      const { context, req } = makeContext();

      await expect(guard.canActivate(context)).rejects.toThrow();

      const info = (req as Record<string, unknown>).rateLimitInfo as {
        retryAfter: number;
        limit: number;
        remaining: number;
        resetAt: number;
      };
      expect(info).toBeDefined();
      expect(info.remaining).toBe(0);
      expect(info.limit).toBe(5);
      expect(info.retryAfter).toBeGreaterThan(0);
      expect(info.resetAt).toBe(resetAt);
    });

    it('sets X-RateLimit-Remaining: 0 even when exceeded', async () => {
      const now = Math.floor(Date.now() / 1000);
      const { guard } = makeGuard({
        exceeded: true,
        count: 6,
        remaining: 0,
        resetAt: now + 3000,
      });
      const { context, res } = makeContext();

      await expect(guard.canActivate(context)).rejects.toThrow();

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
    });
  });
});
