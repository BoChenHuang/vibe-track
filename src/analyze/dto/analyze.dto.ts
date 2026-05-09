import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeDto {
  @ApiPropertyOptional({
    description: 'Text describing the mood or situation',
    maxLength: 300,
    example: 'Feeling calm and reflective on a rainy afternoon',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  text?: string;
}
