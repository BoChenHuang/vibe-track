import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

const mockLogger = { error: jest.fn() };

function makeHost(
  rateLimitInfo?: Record<string, unknown>,
  url = '/analyze',
  method = 'POST',
) {
  const req = { url, method, ...(rateLimitInfo ? { rateLimitInfo } : {}) };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  return {
    req,
    res,
    host: {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as never,
  };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new AllExceptionsFilter(mockLogger as never);
  });

  describe('429 with rateLimitInfo', () => {
    const info = {
      retryAfter: 1800,
      limit: 5,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 1800,
    };

    it('sets Retry-After header', () => {
      const { host, res } = makeHost(info);
      filter.catch(
        new HttpException('Rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS),
        host,
      );
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 1800);
    });

    it('returns structured JSON body with error: rate_limited', () => {
      const { host, res } = makeHost(info);
      filter.catch(
        new HttpException('Rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS),
        host,
      );
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'rate_limited',
          retry_after: 1800,
          limit: 5,
          remaining: 0,
          reset_at: info.resetAt,
        }),
      );
    });

    it('retry_after in body matches Retry-After header', () => {
      const { host, res } = makeHost(info);
      filter.catch(
        new HttpException('Rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS),
        host,
      );
      const body = (res.json as jest.Mock).mock.calls[0][0] as {
        retry_after: number;
      };
      const headerValue = (res.setHeader as jest.Mock).mock.calls[0][1];
      expect(body.retry_after).toBe(headerValue);
    });
  });

  describe('429 without rateLimitInfo (fallback)', () => {
    it('falls back to generic error format when rateLimitInfo absent', () => {
      const { host, res } = makeHost();
      filter.catch(
        new HttpException('Rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS),
        host,
      );
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Retry-After',
        expect.anything(),
      );
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('non-429 exceptions', () => {
    it('500 for unknown errors', () => {
      const { host, res } = makeHost();
      filter.catch(new Error('unexpected'), host);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('passes through HttpException status codes', () => {
      const { host, res } = makeHost();
      filter.catch(new HttpException('Not found', 404), host);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
