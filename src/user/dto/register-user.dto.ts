import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, IsEmail, MinLength, IsOptional, IsNumber, IsArray, IsEnum, IsDate } from "class-validator";
import { Types } from "mongoose";
import { UserGender, UserRole } from "utilitis/enums";

export class RegisterUserDto {
  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  @IsString()
  @MinLength(3)
  userName: string;
  //============================================================================
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  userEmail: string;
  //============================================================================
  @ApiProperty({ description: 'Password for the user', example: 'Password@123' })
  @IsString()
  @MinLength(6)
  password: string;
  //============================================================================
  @ApiProperty({ description: 'User role', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  //============================================================================
  @ApiProperty({ description: 'Profile image URL', required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
  //============================================================================
  @ApiProperty({ description: 'User age', required: false })
  @IsOptional()
  @IsNumber()
  age?: number;
  //============================================================================
  @ApiProperty({ description: 'Date of birth', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : value)
  dateOfBirth?: Date;  
  //============================================================================
  @ApiProperty({ description: 'User gender', enum: UserGender, required: false })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;  
  //============================================================================
  @ApiProperty({ description: 'Enrolled courses', type: [String], required: false })
  @IsOptional()
  @IsArray()
  enrolledCourses?: Types.ObjectId[];
  //============================================================================
}