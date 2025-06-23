import { Controller, Post, Delete, UploadedFiles, Body, Param, UseInterceptors, BadRequestException, Logger, Headers } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { UploadChunkDto } from './dto/upload-chunk.dto';

@ApiTags('Cloudinary Upload')
@Controller('api/upload')
export class CloudinaryController {
  private readonly logger = new Logger(CloudinaryController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  //============================================================================
  @Post('chunk')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload a file chunk (supports chunked file uploads)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadChunkDto })
  @ApiResponse({ status: 201, description: 'Chunk uploaded successfully or file upload completed.' })
  @ApiResponse({ status: 400, description: 'Bad request: no file uploaded or invalid input.' })
  async uploadChunk(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadChunkDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = acceptLanguage === 'ar' ? 'ar' : 'en';

    if (!files || files.length === 0) {
      const message = lang === 'ar' ? 'لم يتم تحميل أي ملف' : 'No file uploaded';
      this.logger.warn(message);
      throw new BadRequestException(message);
    }

    return this.cloudinaryService.uploadChunkedFile(
      files[0],
      body.fileName,
      Number(body.chunkNumber),
      Number(body.totalChunks),
      body.uploadId,
    );
  }

  //============================================================================
  @Delete('cancel/:uploadId')
  @ApiOperation({ summary: 'Cancel an ongoing chunked upload session' })
  @ApiParam({ name: 'uploadId', type: 'string', description: 'Upload session ID' })
  @ApiResponse({ status: 200, description: 'Upload session cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Upload session not found' })
  async cancelUpload(
    @Param('uploadId') uploadId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = acceptLanguage === 'ar' ? 'ar' : 'en';

    const result = await this.cloudinaryService.cancelUpload(uploadId);
    if (!result.cancelled) {
      const message = lang === 'ar' ?` لم يتم العثور على تحميل بالمعرف ${uploadId}` : `No upload found with ID ${uploadId}`;
      throw new BadRequestException(message);
    }
    return {
      ...result,
      message: lang === 'ar' ?` تم إلغاء التحميل ${uploadId} وتنظيف الملفات.` : `Upload ${uploadId} canceled and cleaned up.`,
    };
  }
}