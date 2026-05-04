import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// Set on module init, before any request arrives.
let clsService: ClsService;

const LEVEL_COLORS: Record<string, string> = {
  error: '\x1B[31m',
  warn: '\x1B[33m',
  info: '\x1B[32m',
  debug: '\x1B[36m',
  verbose: '\x1B[37m',
};
const R = '\x1B[0m';
const DIM = '\x1B[90m';
const YELLOW = '\x1B[33m';
const GREEN = '\x1B[32m';
const RED = '\x1B[31m';

const prettyConsoleFormat = winston.format.combine(
  winston.format((info) => {
    const requestId = clsService?.getId();
    if (requestId) {
      info.requestId = requestId;
    }
    return info;
  })(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      context,
      requestId,
      stack,
      ms: _ms,
      splat: _splat,
      ...rest
    } = info as {
      timestamp: string;
      level: string;
      message: string;
      context?: string;
      requestId?: string;
      stack?: string;
      ms?: string;
      splat?: unknown;
      [key: string]: unknown;
    };

    const color = LEVEL_COLORS[level] ?? R;
    const levelStr = `${color}${level.toUpperCase().padEnd(5)}${R}`;
    const ctx = context ? ` ${YELLOW}[${context}]${R}` : '';
    const rid = requestId
      ? `  ${DIM}requestId: ${requestId.substring(0, 8)}${R}`
      : '';

    let output = `${GREEN}[Nest]${R} ${process.pid}  - ${timestamp}  ${levelStr}${ctx} ${String(message)}${rid}`;

    if (stack) {
      output += `\n  ${RED}${String(stack)}${R}`;
    }

    for (const [key, val] of Object.entries(rest)) {
      const valStr =
        typeof val === 'object' && val !== null
          ? JSON.stringify(val, null, 2).replace(/\n/g, '\n    ')
          : String(val);
      output += `\n  ${DIM}${key}:${R} ${valStr}`;
    }

    return output;
  }),
);

const jsonFileFormat = winston.format.combine(
  winston.format((info) => {
    const requestId = clsService?.getId();
    if (requestId) {
      info.requestId = requestId;
    }
    return info;
  })(),
  winston.format.timestamp(),
  winston.format.json(),
);

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get<string>('app.logLevel', 'info'),
        transports: [
          new winston.transports.Console({ format: prettyConsoleFormat }),
          new winston.transports.DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: jsonFileFormat,
          }),
        ],
      }),
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    clsService = this.moduleRef.get(ClsService, { strict: false });
  }
}
