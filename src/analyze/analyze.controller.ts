import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { AnalyzeDto } from './dto/analyze.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  analyze(
    @Body() body: AnalyzeDto = {},
    @UploadedFile(new FileValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.analyzeService.analyze(body?.text, image);
  }
}
