import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { AnalyzeBodyDto } from './dto/analyze-body.dto';
import { AnalyzeDto } from './dto/analyze.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('analyze')
@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Analyze mood and recommend tracks',
    description:
      'Accepts optional text and/or an image, analyzes the mood via Claude, and returns Spotify track recommendations.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AnalyzeBodyDto })
  @ApiOkResponse({
    description: 'Mood analyzed and tracks recommended',
    type: AnalyzeResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'At least one of text or image must be provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        message: {
          type: 'string',
          example: 'At least one of text or image must be provided.',
        },
        error: { type: 'string', example: 'Unprocessable Entity' },
      },
    },
  })
  analyze(
    @Body() body: AnalyzeDto = {},
    @UploadedFile(new FileValidationPipe()) image?: Express.Multer.File,
  ): Promise<AnalyzeResponseDto> {
    return this.analyzeService.analyze(body?.text, image);
  }
}
