import {IsNotEmpty,IsObject,ValidateNested,IsUrl,IsString,IsNumber,IsPositive,IsBoolean,IsEnum} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId, Types } from 'mongoose';

// Enum for defining primary language options
export enum PrimaryLanguage {
  EN = 'English',
  AR = 'Arabic',
}

// DTO for localized text fields (e.g., title, description)
export class LocalizedTextDto {
  @IsNotEmpty({ message: 'English text is required' })
  @IsString()
  en: string;

  @IsNotEmpty({ message: 'Arabic text is required' })
  @IsString()
  ar: string;
}

// DTO specifically for localized level fields
export class LocalizedLevelDto {
  @IsNotEmpty({ message: 'English level is required' })
  @IsString()
  en: string;

  @IsNotEmpty({ message: 'Arabic level is required' })
  @IsString()
  ar: string;
}

// Main DTO for creating a course
export class CreateCourseDto {
  // Course title in both languages
  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'العنوان مطلوب' : 'Title is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  title: LocalizedTextDto;

  // Course category in both languages
  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'التصنيف مطلوب' : 'Category is required' })
  @ApiProperty()
  category: string|Types.ObjectId;

  // Course level in both languages
  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'المستوى مطلوب' : 'Level is required' })
  @ApiProperty()
  level: string|Types.ObjectId;

  // Primary language of the course: EN or AR
  @IsEnum(PrimaryLanguage, {
    message: (args) => args.object['lang'] === 'ar' ? 'اللغة الأساسية غير صحيحة' : 'Invalid primary language',
  })
  @ApiProperty()
  primaryLanguage: PrimaryLanguage;

  // Subtitle of the course
  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'العنوان الفرعي مطلوب' : 'Subtitle is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  subtitle: LocalizedTextDto;

  // Description of the course
  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'الوصف مطلوب' : 'Description is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  description: LocalizedTextDto;

  // Course image URL
  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'رابط الصورة مطلوب' : 'Image URL is required' })
  @IsUrl({}, { message: (args) => args.object['lang'] === 'ar' ? 'رابط الصورة غير صالح' : 'Image must be a valid URL' })
  @ApiProperty()
  image: string;

  // Welcome message shown to students
  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'رسالة الترحيب مطلوبة' : 'Welcome message is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  welcomeMessage: LocalizedTextDto;

  // Course pricing (must be positive number)
  @IsNumber({}, { message: (args) => args.object['lang'] === 'ar' ? 'السعر مطلوب' : 'Pricing is required' })
  @IsPositive({ message: (args) => args.object['lang'] === 'ar' ? 'يجب أن يكون السعر رقماً موجباً' : 'Pricing must be a positive number' })
  @ApiProperty()
  pricing: number;

  // Text describing course objectives
  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'الأهداف مطلوبة' : 'Objectives are required' })
  @ApiProperty()
  objectives: string;

  // Whether the course is published or not
  @IsBoolean({ message: (args) => args.object['lang'] === 'ar' ? 'حالة النشر مطلوبة' : 'Published status is required' })
  @ApiProperty()
  isPublished: boolean;
}
