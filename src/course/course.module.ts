import { forwardRef, Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { DatabaseModule } from 'src/db/database.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { Lecture, LectureSchema } from './schemas/lecture.schema';
import {
  AutoIncrementID,
  AutoIncrementIDOptions,
} from '@typegoose/auto-increment';
import { CourseProgress, CourseProgressSchema } from 'src/course-progress/schemas/course-progress.schema';


@Module({
  controllers: [CourseController],
  providers: [CourseService],
  imports:[MongooseModule.forFeature([
    {name:Course.name,schema:CourseSchema},
    {name:CourseProgress.name,schema:CourseProgressSchema},
  ]),
    DatabaseModule,
    MongooseModule.forFeatureAsync([{
      name: Course.name,
      useFactory: () => {
        const schema = CourseSchema;
        return schema;
      },
    },
    {
      name: Lecture.name,
      useFactory: () => {
        const schema = LectureSchema;
        schema.plugin(AutoIncrementID, {
          field: 'public_id',
          startAt: 1,
        } satisfies AutoIncrementIDOptions);
        return schema;
      },
      inject: [getConnectionToken()],
    },
    ]),
    forwardRef(()=>UserModule),JwtModule  
  ],
  exports:[CourseService]
})
export class CourseModule {}
