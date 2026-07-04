import { ApiProperty } from '@nestjs/swagger';

export class MoodTagDto {
  @ApiProperty({ example: 'Melancholic' })
  name: string;

  @ApiProperty({ example: true })
  primary: boolean;
}

export class MoodDto {
  @ApiProperty({ example: 'Melancholic' })
  label: string;

  @ApiProperty({ example: 'quietly nostalgic' })
  sub: string;

  @ApiProperty({ type: [MoodTagDto] })
  tags: MoodTagDto[];
}
