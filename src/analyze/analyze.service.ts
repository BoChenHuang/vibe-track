import { createHash } from 'crypto';
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ClaudeService } from '../claude/claude.service';
import { SpotifyService, SpotifyTrack } from '../spotify/spotify.service';
import { CacheService } from '../cache/cache.service';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { MoodDto } from './dto/mood.dto';

const CACHE_TTL_SECONDS = 86400;

@Injectable()
export class AnalyzeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly claudeService: ClaudeService,
    private readonly spotifyService: SpotifyService,
    private readonly cacheService: CacheService,
  ) {}

  async analyze(
    text?: string,
    imageFile?: Express.Multer.File,
    market?: string,
    limit?: number,
  ): Promise<AnalyzeResponseDto> {
    const resolvedLimit = limit ?? 8;
    if (!text && !imageFile) {
      throw new UnprocessableEntityException(
        'At least one of text or image must be provided.',
      );
    }

    const cacheKey = this.buildCacheKey(text, imageFile?.buffer);
    const cached = await this.cacheService.getCached(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as AnalyzeResponseDto;
      if (parsed.mood) {
        this.logger.info('Cache hit', { cacheKey });
        return parsed;
      }
      this.logger.info('Cache hit but missing mood field, recomputing', {
        cacheKey,
      });
    }

    this.logger.debug('Starting mood analysis', {
      hasText: !!text,
      hasImage: !!imageFile,
      market,
    });

    const moodParams = await this.claudeService.analyzeMood(
      text,
      imageFile?.buffer,
      imageFile?.mimetype,
      market,
    );

    this.logger.info('Mood queries generated', { queries: moodParams.queries });

    const candidates: SpotifyTrack[] =
      await this.spotifyService.searchByQueries(moodParams.queries, market);

    const mood: MoodDto = {
      label: moodParams.label,
      sub: moodParams.sub,
      tags: moodParams.tags,
    };

    if (candidates.length === 0) {
      return { mood, tracks: [] };
    }

    const selections = await this.claudeService.selectTracks(
      candidates.map((c) => ({
        title: c.title,
        artist: c.artist,
        popularity: c.popularity,
      })),
      moodParams.reason,
      resolvedLimit,
    );

    const result: AnalyzeResponseDto = {
      mood,
      tracks: selections
        .filter((s) => s.index >= 0 && s.index < candidates.length)
        .map((s) => ({
          id: candidates[s.index].id,
          title: candidates[s.index].title,
          artist: candidates[s.index].artist,
          spotify_url: candidates[s.index].spotify_url,
          preview_url: candidates[s.index].preview_url,
          popularity: candidates[s.index].popularity,
          album_image_url: candidates[s.index].album_image_url,
          reason: s.reason,
        })),
    };

    await this.cacheService.setCached(
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL_SECONDS,
    );

    return result;
  }

  private buildCacheKey(text?: string, imageBuffer?: Buffer): string {
    const hash = createHash('md5')
      .update(text ?? '')
      .update(imageBuffer ?? Buffer.alloc(0))
      .digest('hex');
    return `cache:${hash}`;
  }
}
