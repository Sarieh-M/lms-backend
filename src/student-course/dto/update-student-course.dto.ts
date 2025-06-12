import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentCourseDto } from './create-student-course.dto';

export class UpdateStudentCourseDto extends PartialType(CreateStudentCourseDto) {}
