import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { RateLimitController } from './ratelimit.controller';

@Module({
  imports: [CacheModule, ConfigModule],
  controllers: [RateLimitController],
})
export class RateLimitModule {}
