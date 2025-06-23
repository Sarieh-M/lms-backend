import {Body,Controller,Delete,Param,Post,UploadedFiles,BadRequestException,} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  //============================================================================
  @Post('chunk')
  async uploadChunk(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()body: {fileName: string;chunkNumber: number;totalChunks: number;uploadId: string;},) {
    console.log('Received files:', files);
    console.log('Body:', body);

    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }

    return this.cloudinaryService.uploadChunkedFile(
      files[0], // Take the first file
      body.fileName,
      Number(body.chunkNumber),
      Number(body.totalChunks),
      body.uploadId,
    );
  }
  //============================================================================
  @Delete('cancel/:uploadId')
  async cancelUpload(@Param('uploadId') uploadId: string) {
    return this.cloudinaryService.cancelUpload(uploadId);
  }
  //============================================================================
}
