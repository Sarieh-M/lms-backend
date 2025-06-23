import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class UploadChunkDto {
  @ApiProperty({ description: 'Original file name | اسم الملف الأصلي' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Chunk number (zero-based index) | رقم القطعة (بدءًا من صفر)' })
  @IsNumber()
  chunkNumber: number;

  @ApiProperty({ description: 'Total number of chunks | العدد الإجمالي للقطع' })
  @IsNumber()
  totalChunks: number;

  @ApiProperty({ description: 'Unique upload session ID | معرف جلسة الرفع الفريد' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;
}