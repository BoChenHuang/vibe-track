import { ApiProperty } from '@nestjs/swagger';

export class TrackResultDto {
  @ApiProperty({ example: '0BRjO6ga9RKCKjfDqeFgWV' })
  id: string;

  @ApiProperty({ example: 'The Night We Met' })
  title: string;

  @ApiProperty({ example: 'Lord Huron' })
  artist: string;

  @ApiProperty({ example: 'https://open.spotify.com/track/abc123' })
  spotify_url: string;

  @ApiProperty({
    nullable: true,
    example: 'https://p.scdn.co/mp3-preview/abc123',
  })
  preview_url: string | null;

  // TODO: null in Spotify dev mode; requires Extended Quota for real values
  @ApiProperty({
    example: 72,
    nullable: true,
    description: 'Spotify popularity score (0–100); null in dev mode',
  })
  popularity: number | null;

  @ApiProperty({
    nullable: true,
    example: 'https://i.scdn.co/image/ab67616d0000b273abc123',
    description: 'Album cover image URL (640x640); null if unavailable',
  })
  album_image_url: string | null;

  @ApiProperty({
    example: 'Melancholic yet beautiful, matching the reflective mood',
  })
  reason: string;
}
