import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { ClaudeModule } from '../claude/claude.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { CacheModule } from '../cache/cache.module';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Module({
  imports: [ClaudeModule, SpotifyModule, CacheModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService, RateLimitGuard],
})
export class AnalyzeModule {}
