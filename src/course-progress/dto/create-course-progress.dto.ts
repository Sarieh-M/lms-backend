import { IsMongoId, IsNotEmpty, IsString } from "class-validator";
import { Types } from "mongoose";


export class CreateCourseProgressDto {

    @IsMongoId()
    @IsNotEmpty()
    courseId: Types.ObjectId;
    @IsString()
    @IsNotEmpty()
    lectureId: string;
}
