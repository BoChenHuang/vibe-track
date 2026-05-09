import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  text?: string;
}
