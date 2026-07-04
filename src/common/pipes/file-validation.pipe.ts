import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File | undefined) {
    if (!file) return undefined;

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Only JPG and PNG are allowed.`,
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds 5MB limit (${file.size} bytes).`,
      );
    }

    return file;
  }
}
