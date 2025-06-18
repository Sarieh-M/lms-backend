import { forwardRef, Module } from '@nestjs/common';
import { StudentCourseService } from './student-course.service';
import { StudentCourseController } from './student-course.controller';
import { DatabaseModule } from 'src/db/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentCourseSchema } from './schemas/student-course.schema';
import { CourseModule } from 'src/course/course.module';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Course, CourseSchema } from 'src/course/schemas/course.schema';
import { CourseProgress, CourseProgressSchema } from 'src/course-progress/schemas/course-progress.schema';
import { LectureProgres, LectureProgresSchema } from 'src/course-progress/schemas/lecture-progress.schema';

@Module({
  imports: [forwardRef(()=>CourseModule),
    DatabaseModule,
    forwardRef(()=>UserModule),
    MongooseModule.forFeature([{name:Student.name, schema: StudentCourseSchema},
                              {name:User.name, schema: UserSchema},
                              {name:Course.name, schema: CourseSchema},
                              {name:CourseProgress.name, schema: CourseProgressSchema},
                              { name: LectureProgres.name, schema: LectureProgresSchema },
                            ]),
  ],
  exports:[StudentCourseService,MongooseModule],
  controllers: [StudentCourseController],
  providers: [StudentCourseService],
})
export class StudentCourseModule {}
