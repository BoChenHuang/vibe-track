import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MarketCode } from './market.enum';

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
}
