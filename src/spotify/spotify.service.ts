import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  spotify_url: string;
  preview_url: string | null;
  popularity: number;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class SpotifyService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private tokenCache: TokenCache | null = null;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    )!;
  }

  async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to get Spotify access token',
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    this.logger.info('Spotify access token refreshed');
    return this.tokenCache.token;
  }

  async searchByQueries(
    queries: string[],
    market?: string,
  ): Promise<SpotifyTrack[]> {
    const results = await Promise.all(
      queries.map((q) => this.searchByQuery(q, market)),
    );

    const seen = new Set<string>();
    const merged: SpotifyTrack[] = [];
    for (const tracks of results) {
      for (const track of tracks) {
        if (!seen.has(track.id)) {
          seen.add(track.id);
          merged.push(track);
        }
      }
    }

    this.logger.info('Spotify search merged', {
      queries: queries.length,
      total: merged.length,
    });

    return merged;
  }

  private async searchByQuery(
    query: string,
    market?: string,
  ): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    const marketParam = market ? `&market=${encodeURIComponent(market)}` : '';
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10${marketParam}`;

    this.logger.info('Spotify search', { query });

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error('Spotify search failed', {
        status: response.status,
        body,
        query,
      });
      return [];
    }

    const data = (await response.json()) as {
      tracks: {
        items: Array<{
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          external_urls: { spotify: string };
          preview_url: string | null;
          popularity: number;
        }>;
      };
    };

    return data.tracks.items.map((item) => ({
      id: item.id,
      title: item.name,
      artist: item.artists[0]?.name ?? '',
      spotify_url: item.external_urls.spotify,
      preview_url: item.preview_url,
      // TODO: popularity is null in Spotify dev mode; requires Extended Quota to receive real values
      popularity: item.popularity,
    }));
  }
}
