import { ApiProperty } from '@nestjs/swagger';
import { MoodDto } from './mood.dto';
import { TrackResultDto } from './track-result.dto';

export class AnalyzeResponseDto {
  @ApiProperty({ type: MoodDto })
  mood: MoodDto;

  @ApiProperty({ type: [TrackResultDto] })
  tracks: TrackResultDto[];
}
