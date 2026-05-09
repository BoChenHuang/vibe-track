import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ClaudeService, MoodParams } from '../claude/claude.service';

@Injectable()
export class AnalyzeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly claudeService: ClaudeService,
  ) {}

  async analyze(
    text?: string,
    imageFile?: Express.Multer.File,
  ): Promise<MoodParams> {
    if (!text && !imageFile) {
      throw new UnprocessableEntityException(
        'At least one of text or image must be provided.',
      );
    }

    this.logger.debug('Starting mood analysis', {
      hasText: !!text,
      hasImage: !!imageFile,
    });

    return this.claudeService.analyzeMood(
      text,
      imageFile?.buffer,
      imageFile?.mimetype,
    );
  }
}
