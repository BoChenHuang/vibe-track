import { ExecutionContext } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { RequestLoggerInterceptor } from './request-logger.interceptor';

const mockLogger = { info: jest.fn() };
const mockCls = { getId: jest.fn().mockReturnValue('test-id') };

function makeContext(body: Record<string, unknown> = {}, ip = '::1') {
  const req = { method: 'POST', url: '/analyze', headers: {}, ip, body };
  const res = { statusCode: 201, setHeader: jest.fn() };
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

describe('RequestLoggerInterceptor', () => {
  let interceptor: RequestLoggerInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new RequestLoggerInterceptor(
      mockLogger as never,
      mockCls as never,
    );
  });

  describe('→ request-entry log', () => {
    it('logs method and url on arrival without input field', async () => {
      const { context } = makeContext({ text: 'feeling happy' });
      const next = { handle: () => of({ tracks: [] }) };

      await lastValueFrom(interceptor.intercept(context, next as never));

      const [firstCall] = (mockLogger.info as jest.Mock).mock.calls;
      expect(firstCall[0]).toBe('→ POST /analyze');
      expect(firstCall[1]).not.toHaveProperty('input');
    });
  });

  describe('← response log', () => {
    it('includes input when req.body is non-empty (multipart with text fields)', async () => {
      const { context } = makeContext({ text: 'feeling happy', market: 'TW' });
      const next = { handle: () => of({ tracks: [] }) };

      await lastValueFrom(interceptor.intercept(context, next as never));

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const responseLine = calls.find((c: unknown[]) =>
        (c[0] as string).startsWith('←'),
      );
      expect(responseLine[0]).toContain('← POST /analyze');
      expect(responseLine[1]).toHaveProperty('input', {
        text: 'feeling happy',
        market: 'TW',
      });
    });

    it('omits input when req.body is empty (image-only request)', async () => {
      const { context } = makeContext({});
      const next = { handle: () => of({ tracks: [] }) };

      await lastValueFrom(interceptor.intercept(context, next as never));

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const responseLine = calls.find((c: unknown[]) =>
        (c[0] as string).startsWith('←'),
      );
      expect(responseLine[1]).not.toHaveProperty('input');
    });

    it('includes output when handler returns a value', async () => {
      const { context } = makeContext();
      const output = { tracks: [{ id: '1' }] };
      const next = { handle: () => of(output) };

      await lastValueFrom(interceptor.intercept(context, next as never));

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const responseLine = calls.find((c: unknown[]) =>
        (c[0] as string).startsWith('←'),
      );
      expect(responseLine[1]).toHaveProperty('output', output);
    });
  });

  describe('error path', () => {
    it('logs → on arrival but never logs ← when handler throws', async () => {
      const { context } = makeContext({ text: 'test' });
      const next = {
        handle: () => throwError(() => new Error('handler error')),
      };

      await expect(
        lastValueFrom(interceptor.intercept(context, next as never)),
      ).rejects.toThrow('handler error');

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const arrowIn = calls.filter((c: unknown[]) =>
        (c[0] as string).startsWith('→'),
      );
      const arrowOut = calls.filter((c: unknown[]) =>
        (c[0] as string).startsWith('←'),
      );
      expect(arrowIn).toHaveLength(1);
      expect(arrowOut).toHaveLength(0);
    });
  });
});
