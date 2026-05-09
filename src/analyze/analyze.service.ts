import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ClaudeService } from '../claude/claude.service';
import { SpotifyService, SpotifyTrack } from '../spotify/spotify.service';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

@Injectable()
export class AnalyzeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly claudeService: ClaudeService,
    private readonly spotifyService: SpotifyService,
  ) {}

  async analyze(
    text?: string,
    imageFile?: Express.Multer.File,
  ): Promise<AnalyzeResponseDto> {
    if (!text && !imageFile) {
      throw new UnprocessableEntityException(
        'At least one of text or image must be provided.',
      );
    }

    this.logger.debug('Starting mood analysis', {
      hasText: !!text,
      hasImage: !!imageFile,
    });

    const moodParams = await this.claudeService.analyzeMood(
      text,
      imageFile?.buffer,
      imageFile?.mimetype,
    );

    this.logger.info('Mood queries generated', { queries: moodParams.queries });

    const candidates: SpotifyTrack[] =
      await this.spotifyService.searchByQueries(moodParams.queries);

    if (candidates.length === 0) {
      return { tracks: [] };
    }

    const selections = await this.claudeService.selectTracks(
      candidates.map((c) => ({ title: c.title, artist: c.artist })),
      moodParams.reason,
    );

    return {
      tracks: selections
        .filter((s) => s.index >= 0 && s.index < candidates.length)
        .map((s) => ({
          id: candidates[s.index].id,
          title: candidates[s.index].title,
          artist: candidates[s.index].artist,
          spotify_url: candidates[s.index].spotify_url,
          preview_url: candidates[s.index].preview_url,
          reason: s.reason,
        })),
    };
  }
}
