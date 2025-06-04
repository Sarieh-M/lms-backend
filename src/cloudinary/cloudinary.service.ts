import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';
import { ConfigService } from '@nestjs/config';
// const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    constructor(private readonly config: ConfigService) {
        cloudinary.config({
          cloud_name: this.config.get('CLOUDINARY_NAME'),
          api_key:    this.config.get('CLOUDINARY_API_KEY'),
          api_secret: this.config.get('CLOUDINARY_API_SECRET'),
        });
      }
    uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
            if (error) return reject(error);
            resolve(result);
            },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
