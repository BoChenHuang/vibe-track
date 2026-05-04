import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : String(exception);

    // Only log unexpected errors — HttpExceptions are intentional and should be
    // logged by the service that throws them (with proper context).
    if (!(exception instanceof HttpException)) {
      this.logger.error(message, {
        context: 'AllExceptionsFilter',
        status,
        path: req.url,
        method: req.method,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message:
        exception instanceof HttpException
          ? (exception.getResponse() as object)
          : 'Internal server error',
    });
  }
}
