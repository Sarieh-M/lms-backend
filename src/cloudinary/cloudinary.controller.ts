import {
  Controller,
  Post,
  Delete,
  UploadedFiles,
  Body,
  Param,
  BadRequestException,
  Logger,
  Headers,
  Query,
  Inject,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Cloudinary Upload')
@Controller('api/upload')
export class CloudinaryController {
  private readonly logger = new Logger(CloudinaryController.name);
  config: any;

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @Inject(ConfigService) private readonly configService: ConfigService, // Add this
  ) {}

  //============================================================================
  @Post('chunk')
  @ApiOperation({
    summary: 'Upload a file chunk (supports chunked file uploads)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadChunkDto })
  @ApiResponse({
    status: 201,
    description: 'Chunk uploaded successfully or file upload completed.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: no file uploaded or invalid input.',
  })
  async uploadChunk(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadChunkDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = acceptLanguage === 'ar' ? 'ar' : 'en';

    if (!files || files.length === 0) {
      const message =
        lang === 'ar' ? 'لم يتم تحميل أي ملف' : 'No file uploaded';
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: message,
      });
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
  @ApiParam({
    name: 'uploadId',
    type: 'string',
    description: 'Upload session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload session cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Upload session not found' })
  async cancelUpload(
    @Param('uploadId') uploadId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = acceptLanguage === 'ar' ? 'ar' : 'en';

    const result = await this.cloudinaryService.cancelUpload(uploadId);
    if (!result.cancelled) {
      const message =
        lang === 'ar'
          ? ` لم يتم العثور على تحميل بالمعرف ${uploadId}`
          : `No upload found with ID ${uploadId}`;
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: message,
      });
    }
    return {
      ...result,
      message:
        lang === 'ar'
          ? ` تم إلغاء التحميل ${uploadId} وتنظيف الملفات.`
          : `Upload ${uploadId} canceled and cleaned up.`,
    };
  }

  //============================================================================
  @Delete('file/:publicId') // Define your route, e.g., DELETE /api/upload/file/:publicId
  @ApiOperation({ summary: 'Delete an uploaded file from Cloudinary' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'The public ID of the file to delete from Cloudinary',
    required: true,
  })
  @ApiQuery({
    name: 'resourceType',
    enum: ['image', 'video', 'raw'],
    required: false,
    description: 'The type of resource to delete (defaults to video)',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters or file not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during deletion',
  })
  async deleteFileFromCloudinary(
    // Give it a distinct name to avoid confusion with the service method
    @Param('publicId') publicId: string, // Extract publicId from URL path
    @Query('resourceType') resourceType?: 'image' | 'video' | 'raw', // Extract optional resourceType from query
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ result: string }> {
    const lang = acceptLanguage === 'ar' ? 'ar' : 'en';
    this.logger.log(
      `Received request to delete file: ${publicId} (resourceType: ${resourceType || 'video'})`,
    );

    if (!publicId) {
      const message =
        lang === 'ar'
          ? 'معرف الملف العام مطلوب للحذف.'
          : 'Public ID is required for file deletion.';
      this.logger.error(message);
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: message,
      });
    }

    try {
      // Call the service method to perform the actual deletion
      const result = await this.cloudinaryService.deleteFile(
        publicId,
        resourceType || 'video',
      );
      return {
        ...result,
      };
    } catch (error) {
      this.logger.error(
        `Cloudinary deletion error for ${publicId}:`,
        error.message,
      );
      const errorMessage =
        lang === 'ar'
          ? `فشل حذف الملف: ${error.message || 'خطأ غير معروف'}`
          : `Failed to delete file: ${error.message || 'Unknown error'}`;
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: errorMessage,
      });
    }
  }
}
