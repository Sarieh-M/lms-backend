import { IsArray, IsMongoId, IsNotEmpty } from "class-validator";
import { Types } from "mongoose";



export class CreateStudentCourseDto {
    @IsMongoId({ message: 'userId must be a valid ObjectId' })
    @IsNotEmpty({ message: 'userId is required and cannot be empty' })
    userId:Types.ObjectId;
    @IsArray({ message: 'courses must be an array of valid ObjectIds' }) 
    @IsMongoId({ each: true, message: 'Each course ID must be valid' }) 
    courses: Types.ObjectId[];
}
