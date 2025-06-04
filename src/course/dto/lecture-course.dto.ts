import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsObject, IsString, IsUrl, MinLength, ValidateNested } from "class-validator";

class LocalizedTitle {
    @IsString()
    en: string;
  
    @IsString()
    ar: string;
  }

export class LectureDTO {
    @IsObject()
    @ValidateNested()
    @Type(() => LocalizedTitle)
    @ApiProperty({
        description: "Title of the lecture, must be at least 10 characters long",
        example: "Learn Advanced Web Development in-depth and master your skills",
    })
    title: LocalizedTitle;

    @IsUrl()
    @ApiProperty({
        description: "URL for the lecture video",
        example: "https://www.example.com/videos/advanced-web-development",
    })
    videoUrl: string;


    @IsBoolean({ message: "Free preview must be a boolean value" })
    @ApiProperty({
        description: "Indicates if the lecture is available for free preview",
        example: true,
    })
    freePreview: boolean;
}