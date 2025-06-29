import {IsBoolean,IsNotEmpty,IsObject,IsUrl,ValidateNested,} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Localized title DTO used inside lecture objects
export class LocalizedTitle {
  @IsNotEmpty({ message: 'English title is required' })
  en: string;

  @IsNotEmpty({ message: 'العنوان العربي مطلوب' }) 
  ar: string;
}

// DTO for a single lecture
export class LectureDTO {
  // Lecture title in both English and Arabic (validated and nested)
  @IsNotEmpty({
    message: (args) =>
      args.object['lang'] === 'ar' ? 'العنوان مطلوب' : 'Title is required',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTitle)
  @ApiProperty({
    description: 'Localized title of the lecture (English and Arabic)',
    example: {
      en: 'Learn Advanced Web Development',
      ar: 'تعلم تطوير الويب المتقدم',
    },
  })
  title: LocalizedTitle;

  // Video URL of the lecture
  @IsUrl(
    {},
    {
      message: (args) =>
        args.object['lang'] === 'ar'
          ? 'رابط الفيديو غير صالح'
          : 'Video URL must be a valid URL',
    },
  )
  @ApiProperty({
    description: 'URL for the lecture video',
    example: 'https://www.example.com/videos/advanced-web-development',
  })
  videoUrl: string;

  // Whether the lecture is available as a free preview
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