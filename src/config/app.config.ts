import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '5', 10),
    windowSec: parseInt(process.env.RATE_LIMIT_WINDOW_SEC ?? '60', 10),
  },
}));
