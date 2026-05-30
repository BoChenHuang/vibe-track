import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { MarketCode } from './market.enum';

const TRACK_LIMITS = [5, 8, 10] as const;

export class AnalyzeBodyDto {
  @ApiPropertyOptional({
    description: 'Text describing the mood or situation',
    maxLength: 300,
    example: 'Feeling calm and reflective on a rainy afternoon',
  })
  text?: string;

  // Swagger-only field: actual upload is handled by @UploadedFile, not bound to this DTO
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Image file representing the mood (JPEG or PNG)',
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    enum: MarketCode,
    description:
      'Spotify market code to filter songs available in that market and guide query style',
    example: MarketCode.TW,
  })
  @IsOptional()
  @IsEnum(MarketCode)
  market?: MarketCode;

  @ApiPropertyOptional({
    enum: TRACK_LIMITS,
    default: 8,
    description: 'Number of tracks to return (5, 8, or 10)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(TRACK_LIMITS)
  limit?: number;
}
