import {IsBoolean,IsNotEmpty,IsObject,IsUrl,ValidateNested,} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocalizedTitle {
  @IsNotEmpty({ message: 'English title is required' })
  en: string;

  @IsNotEmpty({ message: 'العنوان العربي مطلوب' })
  ar: string;
}

export class LectureDTO {
  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'العنوان مطلوب' : 'Title is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTitle)
  @ApiProperty({
    description: 'Title of the lecture, must be at least 10 characters long',
    example:
      'Learn Advanced Web Development in-depth and master your skills',
  })
  title: LocalizedTitle;

  @IsUrl({}, {
    message: (args) =>
      args.object['lang'] === 'ar'
        ? 'رابط الفيديو غير صالح'
        : 'Video URL must be a valid URL',
  })
  @ApiProperty({
    description: 'URL for the lecture video',
    example: 'https://www.example.com/videos/advanced-web-development',
  })
  videoUrl: string;

  @IsBoolean({
    message: (args) =>
      args.object['lang'] === 'ar'
        ? 'المعاينة المجانية يجب أن تكون قيمة منطقية'
        : 'Free preview must be a boolean value',
  })
  @ApiProperty({
    description: 'Indicates if the lecture is available for free preview',
    example: true,
  })
  freePreview: boolean;
}