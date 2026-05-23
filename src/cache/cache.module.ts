import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from './cache.tokens';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
      useFactory: (configService: ConfigService, logger: WinstonLogger) => {
        const client = new Redis(configService.get<string>('REDIS_URL')!, {
          lazyConnect: true,
        });
        client.on('error', (err: Error) => {
          logger.error('Redis connection error', { err: err.message });
        });
        return client;
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
