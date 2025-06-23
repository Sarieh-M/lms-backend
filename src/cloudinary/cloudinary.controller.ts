import {Body,Controller,Delete,Param,Post,UploadedFiles,BadRequestException, UseInterceptors,} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadChunkDto } from './dto/upload-chunk.dto';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  //============================================================================
  //Upload a file chunk [Public]
  @Post('chunk')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadChunkDto })
  async uploadChunk(@UploadedFiles() files: Express.Multer.File[],@Body() body: UploadChunkDto) {
  if (!files || files.length === 0) {
    throw new BadRequestException('No file uploaded');
  }

  return this.cloudinaryService.uploadChunkedFile(
    files[0],
    body.fileName,
    Number(body.chunkNumber),
    Number(body.totalChunks),
    body.uploadId,
  );
}
//Cancel an ongoing upload session [Public]
  @Delete('cancel/:uploadId')
  @ApiOperation({ summary: 'Cancel an ongoing chunked upload session' })
  @ApiParam({ name: 'uploadId', type: 'string', description: 'Upload session ID' })
  @ApiResponse({ status: 200, description: 'Upload session cancelled successfully' })
  async cancelUpload(@Param('uploadId') uploadId: string) {
    return this.cloudinaryService.cancelUpload(uploadId);
  }
}
