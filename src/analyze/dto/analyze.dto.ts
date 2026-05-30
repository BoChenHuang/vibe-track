import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MarketCode } from './market.enum';

const TRACK_LIMITS = [5, 8, 10] as const;

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

  @ApiPropertyOptional({
    enum: MarketCode,
    description:
      'Spotify market code to filter songs available in that market and guide query style',
    example: MarketCode.TW,
  })
  @IsOptional()
  @IsEnum(MarketCode)
  market?: MarketCode;

  @ApiPropertyOptional({ enum: TRACK_LIMITS, default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(TRACK_LIMITS)
  limit?: number;
}
