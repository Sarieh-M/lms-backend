import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LocalizedTextDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  en: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  ar: string;
}