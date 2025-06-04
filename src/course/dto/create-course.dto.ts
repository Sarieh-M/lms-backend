import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsPositive, IsString, IsUrl, MinLength, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { CourseLevel, PrimaryLanguage } from "utilitis/enums";
import { LocalizedTextDto } from "./localized-text.dto";




export class CreateCourseDto {
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTextDto)
    @ApiProperty({
        description: "Title of the course, must be at least 50 characters long",
        example: "Learn Advanced Web Development in-depth and master your skills",
    })
    title:LocalizedTextDto;
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTextDto)
    @ApiProperty({
        description: "Category of the course, must be at least 5 characters",
        example: "Web Development",
    })
    category:LocalizedTextDto;
    @ApiProperty({
        description: "Level of the course, must be Beginner, Intermediate, or Advanced",
        example: "Beginner",
        enum: CourseLevel,
    })
    @IsEnum(CourseLevel,{message:"Level must be one of Beginner, Intermediate, Advanced"})
    level:CourseLevel;
    @ApiProperty({
        description: "Primary language of the course",
        example: "English",
        enum: PrimaryLanguage,
    })
    @IsEnum(PrimaryLanguage,{message:"primary language is required"})
    primaryLanguage:PrimaryLanguage;
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTextDto)
    @ApiProperty({
        description: "Subtitle of the course",
        example: "A practical guide to becoming a skilled web developer",
    })
    subtitle:LocalizedTextDto;
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTextDto)
    @ApiProperty({
        description: "Detailed description of the course",
        example: "This course covers everything you need to know about web development, from beginner concepts to advanced practices.",
    })
    description:LocalizedTextDto;
    @IsString({ message: "Image URL is required" })
    @IsUrl({}, { message: "Image must be a valid URL" })
    @ApiProperty({
        description: "URL of the course's image",
        example: "https://example.com/images/course-thumbnail.jpg",
    })
    image:string;
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTextDto)
    @ApiProperty({
        description: "Welcome message for students who enroll in the course",
        example: "Welcome to this amazing course! Let's start learning and growing together.",
    })
    welcomeMessage:LocalizedTextDto;
    @IsNumber({}, { message: "Pricing is required" })
    @IsPositive({ message: "Pricing must be a positive number" })
    @ApiProperty({
        description: "Pricing of the course, must be a positive number",
        example: 99.99,
    })
    pricing:number;
    @IsString({message:"objectives is required"})
    @ApiProperty({
        description: "Learning objectives of the course",
        example: "Understand advanced concepts of web development, build complex projects, and master industry practices.",
    })
    objectives:string;

    @ApiProperty({
        description: "Publication status of the course (true = published, false = unpublished)",
        example: true,
    })
    @IsBoolean({ message: "The published status is required" })
    isPublished:boolean;
}
