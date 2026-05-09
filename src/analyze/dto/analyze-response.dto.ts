import { ApiProperty } from '@nestjs/swagger';
import { TrackResultDto } from './track-result.dto';

export class AnalyzeResponseDto {
  @ApiProperty({ type: [TrackResultDto] })
  tracks: TrackResultDto[];
}
