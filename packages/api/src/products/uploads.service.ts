import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UploadUrlRequestDto, UploadUrlResponse } from './dto';

/**
 * Phase 1: stubbed. Returns a pretend pre-signed URL and a public URL under a
 * placeholder CDN. Phase 4 swaps this for a real AWS SDK v3 S3 pre-sign call.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  createPresignedUpload(dto: UploadUrlRequestDto): UploadUrlResponse {
    const ext = (dto.filename.split('.').pop() ?? 'bin').toLowerCase();
    const key = `products/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const cdn = process.env.CDN_BASE_URL ?? 'https://picsum.photos/seed';
    const publicUrl = process.env.CDN_BASE_URL
      ? `${cdn}/${key}`
      : `${cdn}/${randomUUID()}/800/1000`; // pretty placeholder for dev

    this.logger.warn('S3 upload not configured — returning stubbed URLs');

    return {
      uploadUrl: `https://example-bucket.s3.amazonaws.com/${key}?stub=1`,
      publicUrl,
      expiresIn: 900,
    };
  }
}
