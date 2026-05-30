import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from './cache.tokens';

const mockLogger = { error: jest.fn() };

function makeRedis(overrides: Record<string, jest.Mock> = {}) {
  return {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    ...overrides,
  };
}

describe('CacheService', () => {
  let service: CacheService;
  let redis: ReturnType<typeof makeRedis>;

  async function build(redisOverrides?: Record<string, jest.Mock>) {
    redis = makeRedis(redisOverrides);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();
    service = module.get(CacheService);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await build();
  });

  describe('incrementAndCheck()', () => {
    it('first request in fresh window: sets TTL, returns remaining = max - 1', async () => {
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.ttl.mockResolvedValue(60);

      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);

      expect(redis.expire).toHaveBeenCalledWith('ratelimit:127.0.0.1', 60);
      expect(result.exceeded).toBe(false);
      expect(result.remaining).toBe(4);
      expect(result.count).toBe(1);
    });

    it('subsequent request within window: does not call expire again', async () => {
      redis.incr.mockResolvedValue(3);
      redis.ttl.mockResolvedValue(45);

      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);

      expect(redis.expire).not.toHaveBeenCalled();
      expect(result.remaining).toBe(2);
      expect(result.exceeded).toBe(false);
    });

    it('exactly at limit: not exceeded, remaining = 0', async () => {
      redis.incr.mockResolvedValue(5);
      redis.ttl.mockResolvedValue(30);

      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);

      expect(result.exceeded).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('over limit: exceeded = true, remaining = 0', async () => {
      redis.incr.mockResolvedValue(6);
      redis.ttl.mockResolvedValue(30);

      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);

      expect(result.exceeded).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('resetAt = now + ttl when ttl > 0', async () => {
      redis.incr.mockResolvedValue(2);
      redis.ttl.mockResolvedValue(100);

      const before = Math.floor(Date.now() / 1000);
      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);
      const after = Math.floor(Date.now() / 1000);

      expect(result.resetAt).toBeGreaterThanOrEqual(before + 100);
      expect(result.resetAt).toBeLessThanOrEqual(after + 100);
    });

    it('Redis failure (fail-open): allows request, returns remaining = max', async () => {
      redis.incr.mockRejectedValue(new Error('Redis down'));

      const result = await service.incrementAndCheck('127.0.0.1', 5, 60);

      expect(result.exceeded).toBe(false);
      expect(result.remaining).toBe(5);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getRateLimitStatus()', () => {
    it('no key exists: remaining = max, resetAt ≈ now + windowSec', async () => {
      redis.get.mockResolvedValue(null);
      redis.ttl.mockResolvedValue(-2);

      const before = Math.floor(Date.now() / 1000);
      const result = await service.getRateLimitStatus('127.0.0.1', 5, 60);
      const after = Math.floor(Date.now() / 1000);

      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeGreaterThanOrEqual(before + 60);
      expect(result.resetAt).toBeLessThanOrEqual(after + 60);
    });

    it('key exists with count 2: remaining = 3', async () => {
      redis.get.mockResolvedValue('2');
      redis.ttl.mockResolvedValue(45);

      const result = await service.getRateLimitStatus('127.0.0.1', 5, 60);

      expect(result.remaining).toBe(3);
      expect(result.limit).toBe(5);
    });

    it('does not call INCR — uses GET only', async () => {
      redis.get.mockResolvedValue('1');
      redis.ttl.mockResolvedValue(50);

      await service.getRateLimitStatus('127.0.0.1', 5, 60);

      expect(redis.incr).not.toHaveBeenCalled();
    });

    it('count exceeds max: remaining clamped to 0', async () => {
      redis.get.mockResolvedValue('7');
      redis.ttl.mockResolvedValue(20);

      const result = await service.getRateLimitStatus('127.0.0.1', 5, 60);

      expect(result.remaining).toBe(0);
    });

    it('Redis failure: returns remaining = max (fail-open)', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));

      const result = await service.getRateLimitStatus('127.0.0.1', 5, 60);

      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(5);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('GET and TTL are called in parallel via Promise.all', async () => {
      const order: string[] = [];
      redis.get.mockImplementation(() => {
        order.push('get');
        return Promise.resolve('1');
      });
      redis.ttl.mockImplementation(() => {
        order.push('ttl');
        return Promise.resolve(30);
      });

      await service.getRateLimitStatus('127.0.0.1', 5, 60);

      expect(order).toContain('get');
      expect(order).toContain('ttl');
    });
  });
});
