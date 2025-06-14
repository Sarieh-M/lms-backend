import {
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsUrl,
  IsString,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PrimaryLanguage {
  EN = 'English',
  AR = 'Arabic',
}

export class LocalizedTextDto {
  @IsNotEmpty({ message: 'English text is required' })
  @IsString()
  en: string;

  @IsNotEmpty({ message: 'Arabic text is required' })
  @IsString()
  ar: string;
}

export class LocalizedLevelDto {
  @IsNotEmpty({ message: 'English level is required' })
  @IsString()
  en: string;

  @IsNotEmpty({ message: 'Arabic level is required' })
  @IsString()
  ar: string;
}

export class CreateCourseDto {

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'العنوان مطلوب' : 'Title is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  title: LocalizedTextDto;

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'التصنيف مطلوب' : 'Category is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  category: LocalizedTextDto;

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'المستوى مطلوب' : 'Level is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedLevelDto)
  @ApiProperty()
  level: LocalizedLevelDto;

  @IsEnum(PrimaryLanguage, {
    message: (args) => args.object['lang'] === 'ar' ? 'اللغة الأساسية غير صحيحة' : 'Invalid primary language',
  })
  @ApiProperty()
  primaryLanguage: PrimaryLanguage;

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'العنوان الفرعي مطلوب' : 'Subtitle is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  subtitle: LocalizedTextDto;

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'الوصف مطلوب' : 'Description is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  description: LocalizedTextDto;

  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'رابط الصورة مطلوب' : 'Image URL is required' })
  @IsUrl({}, { message: (args) => args.object['lang'] === 'ar' ? 'رابط الصورة غير صالح' : 'Image must be a valid URL' })
  @ApiProperty()
  image: string;

  @IsNotEmpty({ message: (args) => args.object['lang'] === 'ar' ? 'رسالة الترحيب مطلوبة' : 'Welcome message is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @ApiProperty()
  welcomeMessage: LocalizedTextDto;

  @IsNumber({}, { message: (args) => args.object['lang'] === 'ar' ? 'السعر مطلوب' : 'Pricing is required' })
  @IsPositive({ message: (args) => args.object['lang'] === 'ar' ? 'يجب أن يكون السعر رقماً موجباً' : 'Pricing must be a positive number' })
  @ApiProperty()
  pricing: number;

  @IsString({ message: (args) => args.object['lang'] === 'ar' ? 'الأهداف مطلوبة' : 'Objectives are required' })
  @ApiProperty()
  objectives: string;

  @IsBoolean({ message: (args) => args.object['lang'] === 'ar' ? 'حالة النشر مطلوبة' : 'Published status is required' })
  @ApiProperty()
  isPublished: boolean;
}
