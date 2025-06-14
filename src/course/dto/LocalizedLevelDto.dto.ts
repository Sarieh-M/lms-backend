import { IsEnum } from "class-validator";
import { CourseLevel,CourseLevelAr } from "utilitis/enums";

export class LocalizedLevelDto {
    @IsEnum(CourseLevel, {
        message: " Invalid level! Allowed values: Beginner, Intermediate, Advanced."
    })
    en: CourseLevel;

    @IsEnum(CourseLevelAr, {
        message: " القيم غير صحيحة ! القيم المسموح بها: مبتدئ، متوسط، متقدم."
    })
    ar: CourseLevelAr;
}
