import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = this.cls.getId();

    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    const { method, url } = req;
    const input = req.body as Record<string, unknown> | null | undefined;
    const start = Date.now();

    this.logger.info(`→ ${method} ${url}`, {
      context: 'RequestLoggerInterceptor',
      ...(input && Object.keys(input).length > 0 && { input }),
    });

    return next.handle().pipe(
      tap((output: unknown) => {
        const duration = Date.now() - start;
        this.logger.info(`← ${method} ${url} ${res.statusCode} ${duration}ms`, {
          context: 'RequestLoggerInterceptor',
          ...(output != null && { output: output as Record<string, unknown> }),
        });
      }),
    );
  }
}
