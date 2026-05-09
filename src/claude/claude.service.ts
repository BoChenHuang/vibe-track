import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

export interface MoodParams {
  queries: string[];
  reason: string;
}

export interface TrackSelection {
  index: number;
  reason: string;
}

const ANALYZE_SYSTEM_PROMPT = `你是一個情緒分析專家，也熟悉 Spotify 音樂搜尋。
分析使用者提供的文字或圖片，回傳以下固定 JSON 格式，不要有任何其他文字：
{
  "queries": [
    "<2~3個英文詞的Spotify搜尋query>",
    "<2~3個英文詞的Spotify搜尋query>",
    "<2~3個英文詞的Spotify搜尋query>"
  ],
  "reason": "<中文說明整體情緒與推薦方向>"
}

queries 規則：
- 每組限 2~3 個英文詞
- 使用音樂風格、情緒形容詞、樂器名稱等 Spotify 可辨識詞彙
- 三組需有差異性，涵蓋不同風格角度
- 不要使用抽象描述或句子`;

const SELECT_SYSTEM_PROMPT = `你是音樂推薦專家。根據情緒背景，從候選歌曲中選出最適合的 8 首（候選不足 8 首則全選），為每首產出一句繁體中文推薦理由。
回傳固定 JSON 陣列格式，不要有任何其他文字：
[
  { "index": <候選索引整數>, "reason": "<繁體中文推薦理由>" }
]`;

@Injectable()
export class ClaudeService {
  private readonly anthropic: Anthropic;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('CLAUDE_API_KEY'),
    });
  }

  async analyzeMood(
    text?: string,
    imageBuffer?: Buffer,
    mimeType?: string,
  ): Promise<MoodParams> {
    const content: Anthropic.MessageParam['content'] = [];

    if (imageBuffer && mimeType) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType as 'image/jpeg' | 'image/png',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    if (text) {
      content.push({ type: 'text', text });
    }

    this.logger.debug('Calling Claude API for mood analysis');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: ANALYZE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const raw = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    try {
      return JSON.parse(raw) as MoodParams;
    } catch {
      this.logger.error('Failed to parse Claude mood response', { raw });
      throw new InternalServerErrorException(
        'Claude returned an unexpected response format.',
      );
    }
  }

  async selectTracks(
    candidates: { title: string; artist: string }[],
    moodReason: string,
  ): Promise<TrackSelection[]> {
    const candidateList = candidates
      .map((c, i) => `${i}. ${c.title} - ${c.artist}`)
      .join('\n');

    const userMessage = `情緒背景：${moodReason}\n\n候選歌曲：\n${candidateList}`;

    this.logger.debug('Calling Claude API for track selection', {
      candidateCount: candidates.length,
    });

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SELECT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const raw = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    try {
      return JSON.parse(raw) as TrackSelection[];
    } catch {
      this.logger.error('Failed to parse Claude selection response', { raw });
      throw new InternalServerErrorException(
        'Claude returned an unexpected response format for track selection.',
      );
    }
  }
}
