import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { v2 as cloudinary } from 'cloudinary';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);
const rmdirAsync = promisify(fs.rmdir);

export interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  [key: string]: any;
}

@Injectable()
export class CloudinaryService {
  private readonly tempDir = path.join(process.cwd(), 'tempUploads');
  private uploadProgress = new Map<string, { totalChunks: number; receivedChunks: number }>();
  private logger = new Logger(CloudinaryService.name);

  //============================================================================
  // Upload a single chunk of a file (chunked upload)
  async uploadChunkedFile(
    chunk: Express.Multer.File,
    fileName: string,
    chunkNumber: number,
    totalChunks: number,
    uploadId: string,
  ): Promise<CloudinaryResponse | { done: boolean; received: number }> {
    const chunkDir = path.join(this.tempDir, uploadId);
    const chunkPath = path.join(chunkDir, chunkNumber.toString());

    try {
      // Ensure chunk directory exists
      if (!fs.existsSync(chunkDir)) {
        await mkdirAsync(chunkDir, { recursive: true });
      }

      // Save current chunk to disk
      await writeFileAsync(chunkPath, chunk.buffer);

      // Initialize or update upload progress
      if (!this.uploadProgress.has(uploadId)) {
        this.uploadProgress.set(uploadId, { totalChunks, receivedChunks: 0 });
      }

      const progress = this.uploadProgress.get(uploadId);
      progress.receivedChunks++;

      // If all chunks received, reassemble and upload full file
      if (progress.receivedChunks === totalChunks) {
        const fullFilePath = await this.reassembleFile(uploadId, totalChunks, fileName);
        const result = await this.uploadFileFromPath(fullFilePath);

        // Cleanup temp files and progress
        await this.cleanup(uploadId);
        return result;
      }

      // Return progress info if not done yet
      return { done: false, received: progress.receivedChunks };
    } catch (error) {
      await this.cleanup(uploadId);
      throw error;
    }
  }

  //============================================================================
  // Combine all chunks into one file in correct order
  private async reassembleFile(uploadId: string, totalChunks: number, fileName: string): Promise<string> {
    const chunkDir = path.join(this.tempDir, uploadId);
    const fullFilePath = path.join(chunkDir, fileName);
    const writeStream = fs.createWriteStream(fullFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, i.toString());
      const readStream = fs.createReadStream(chunkPath);
      await pipeline(readStream, writeStream, { end: false });
    }

    writeStream.end();
    return fullFilePath;
  }

  //============================================================================
  // Upload a local file to Cloudinary using upload_stream
  private async uploadFileFromPath(filePath: string): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      fs.createReadStream(filePath).pipe(uploadStream);
    });
  }

  //============================================================================
  // Remove temporary chunk files and folder for an upload session
  private async cleanup(uploadId: string): Promise<void> {
    try {
      const chunkDir = path.join(this.tempDir, uploadId);

      if (fs.existsSync(chunkDir)) {
        const files = await readdirAsync(chunkDir);
        await Promise.all(files.map(file => unlinkAsync(path.join(chunkDir, file))));
        await rmdirAsync(chunkDir);
      }

      this.uploadProgress.delete(uploadId);
    } catch (err) {
      this.logger.error('Cleanup error:', err);
    }
  }

  //============================================================================
  // Upload a single file directly (non-chunked)
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      bufferStream.pipe(uploadStream);
    });
  }

  //============================================================================
  // Cancel ongoing upload session and cleanup chunks
  async cancelUpload(uploadId: string): Promise<{ cancelled: boolean; message: string }> {
    const chunkDir = path.join(this.tempDir, uploadId);

    if (fs.existsSync(chunkDir)) {
      await this.cleanup(uploadId);
      return { cancelled: true, message: `Upload ${uploadId} canceled and cleaned up.` };
    }

    return { cancelled: false, message: `No upload found with ID ${uploadId}.` };
  }
}