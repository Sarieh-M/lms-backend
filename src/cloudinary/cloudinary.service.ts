import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { Readable, pipeline } from 'stream';
import { Logger } from '@nestjs/common';
import { logger } from '@typegoose/typegoose/lib/logSettings';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const pipelineAsync = promisify(pipeline);

@Injectable()
export class CloudinaryService {
  private readonly tempDir = path.join(__dirname, '..', '..', 'temp-uploads');
  private uploadProgress = new Map<
    string,
    { totalChunks: number; receivedChunks: number }
  >();

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async uploadChunkedFile(
    chunk: Express.Multer.File,
    fileName: string,
    chunkNumber: number,
    totalChunks: number,
    uploadId: string
  ): Promise<CloudinaryResponse | { done: boolean; received: number }> {
    const chunkDir = path.join(this.tempDir, uploadId);
    const chunkPath = path.join(chunkDir, chunkNumber.toString());
    const logger = new Logger('CloudinaryService');
    logger.log('chunk:', chunk);
    try {
      // Ensure directory exists
      if (!fs.existsSync(chunkDir)) {
        await mkdirAsync(chunkDir, { recursive: true });
      }

      // Save chunk
      await writeFileAsync(chunkPath, chunk.buffer);

      // Update upload progress
      if (!this.uploadProgress.has(uploadId)) {
        this.uploadProgress.set(uploadId, {
          totalChunks,
          receivedChunks: 0,
        });
      }

      const progress = this.uploadProgress.get(uploadId);
      progress.receivedChunks++;

      // Check if all chunks are received
      if (progress.receivedChunks === totalChunks) {
        // Reassemble file
        const fullFilePath = await this.reassembleFile(
          uploadId,
          totalChunks,
          fileName
        );

        // Upload to Cloudinary
        const result = await this.uploadFileFromPath(fullFilePath);

        // Cleanup
        await this.cleanup(uploadId);
        return result;
      }

      return { done: false, received: progress.receivedChunks };
    } catch (error) {
      await this.cleanup(uploadId);
      throw error;
    }
  }

  private async reassembleFile(
    uploadId: string,
    totalChunks: number,
    fileName: string
  ): Promise<string> {
    const chunkDir = path.join(this.tempDir, uploadId);
    const fullFilePath = path.join(chunkDir, fileName);
    const writeStream = fs.createWriteStream(fullFilePath);

    // Write chunks in order
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, i.toString());
      const readStream = fs.createReadStream(chunkPath);
      await pipelineAsync(readStream, writeStream, { end: false });
    }

    writeStream.end();
    return fullFilePath;
  }

  private async uploadFileFromPath(
    filePath: string
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      fs.createReadStream(filePath).pipe(uploadStream);
    });
  }

  private async cleanup(uploadId: string): Promise<void> {
    try {
      const chunkDir = path.join(this.tempDir, uploadId);
      
      // Delete all chunk files
      if (fs.existsSync(chunkDir)) {
        const files = await readdirAsync(chunkDir);
        await Promise.all(
          files.map(file => unlinkAsync(path.join(chunkDir, file)))
        );
        await rmdirAsync(chunkDir);
      }
      
      // Remove progress tracking
      this.uploadProgress.delete(uploadId);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }

  // Single file upload method
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      // Create a readable stream from the file buffer
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null); // Signals end of stream

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      // Pipe the buffer stream to Cloudinary upload stream
      bufferStream.pipe(uploadStream);
    });
  }
  async cancelUpload(uploadId: string): Promise<{ cancelled: boolean; message: string }> {
    const chunkDir = path.join(this.tempDir, uploadId);
  
    if (fs.existsSync(chunkDir)) {
      await this.cleanup(uploadId);
      return { cancelled: true, message: `Upload ${uploadId} canceled and cleaned up.` };
    }
  
    return { cancelled: false, message: `No upload found with ID ${uploadId}.` };
  }
  
}