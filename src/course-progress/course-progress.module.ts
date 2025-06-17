import { Module } from '@nestjs/common';
import { CourseProgressService } from './course-progress.service';
import { CourseProgressController } from './course-progress.controller';
import { DatabaseModule } from 'src/db/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseProgress, CourseProgressSchema } from './schemas/course-progress.schema';
import {  LectureProgres, LectureProgresSchema } from './schemas/lecture-progress.schema';
import { CourseModule } from 'src/course/course.module';
import { StudentCourseModule } from 'src/student-course/student-course.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Student, StudentCourseSchema } from 'src/student-course/schemas/student-course.schema';
import { AuthRolesGuard } from 'src/user/guard/auth-role.guard';
import { UserModule } from 'src/user/user.module';
import { Course, CourseSchema } from 'src/course/schema/course.schema';

@Module({
  imports:[
    DatabaseModule,
    MongooseModule.forFeature([{name:CourseProgress.name,schema:CourseProgressSchema},
                              {name:LectureProgres.name,schema:LectureProgresSchema},
                              {name:Student.name,schema:StudentCourseSchema},
    ]),
    JwtModule.register({}),
    ConfigModule,
    StudentCourseModule,
    CourseModule,
    UserModule,
    
  ],

controllers: [CourseProgressController],
  providers: [CourseProgressService],
})
export class CourseProgressModule {}
