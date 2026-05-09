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
  valence: number;
  energy: number;
  tempo: number;
  genres: string[];
  keywords: string;
  reason: string;
}

const SYSTEM_PROMPT = `你是一個情緒分析專家。分析使用者提供的文字或圖片，回傳以下固定 JSON 格式，不要有任何其他文字：
{
  "valence": <0.0~1.0, 情感正負向>,
  "energy": <0.0~1.0, 活力程度>,
  "tempo": <BPM整數, 40~200>,
  "genres": [<音樂類型字串陣列>],
  "keywords": "<空格分隔英文關鍵字>",
  "reason": "<中文說明推薦理由>"
}`;

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
      system: SYSTEM_PROMPT,
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
      this.logger.error('Failed to parse Claude response', { raw });
      throw new InternalServerErrorException(
        'Claude returned an unexpected response format.',
      );
    }
  }
}
