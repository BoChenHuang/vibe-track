import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
