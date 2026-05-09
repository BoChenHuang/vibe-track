import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { ClaudeModule } from '../claude/claude.module';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [ClaudeModule, SpotifyModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService],
})
export class AnalyzeModule {}
