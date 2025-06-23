import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UploadChunkDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  files: any;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsNumber()
  chunkNumber: number;

  @ApiProperty()
  @IsNumber()
  totalChunks: number;

  @ApiProperty()
  @IsString()
  uploadId: string;
}