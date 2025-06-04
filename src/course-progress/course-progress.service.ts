import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCourseProgressDto } from './dto/create-course-progress.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CourseProgress } from './schemas/course-progress.schema';
import { JWTPayloadType } from 'utilitis/types';
import { Model, Types } from 'mongoose';
import { LectureProgres } from './schemas/lecture-progress.schema';
import { CourseService } from 'src/course/course.service';
import { StudentCourseService } from 'src/student-course/student-course.service';
import { Student } from 'src/student-course/schemas/student-course.schema';

@Injectable()
export class CourseProgressService {
  constructor(
    @InjectModel(CourseProgress.name)private readonly courseProgress: Model<CourseProgress>,
    @InjectModel(LectureProgres.name)private readonly lectureProgress: Model<LectureProgres>,
    @InjectModel(Student.name)private readonly studentModel: Model<Student>,
    private readonly courseService:CourseService,
    private readonly studentCourseService: StudentCourseService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // 1) Mark Lecture as Viewed
  // ─────────────────────────────────────────────────────────────────────
  /**
   * Records that the current student has viewed a lecture.
   * - If no CourseProgress exists, creates both LectureProgress and CourseProgress.
   * - If CourseProgress exists, updates or adds the lecture entry.
   * - Also adds the course to the student's purchased list if it's their first lecture.
   *
   * @param dto         - contains lectureId and courseId
   * @param userPayload - JWT payload containing user.id
   * @returns the updated or newly created CourseProgress document
   */
  public async markLectureAsViewed(
    dto: CreateCourseProgressDto,
    userPayload: JWTPayloadType,
  ): Promise<CourseProgress> {
    try {
      const { lectureId, courseId } = dto;

      // Ensure the course exists
      await this.courseService.getCourseDetailsByID(courseId);

      // Find existing course progress for this user & course
      let progress = await this.courseProgress.findOne({userId: userPayload.id,courseId,});

      if (!progress) {
        // First lecture view: create lecture progress record
        const newLecture = await this.lectureProgress.create({lectureId,viewed: true,dateViewed: new Date(),});

        // Create course progress with the new lecture
        progress = await this.courseProgress.create({userId: userPayload.id,courseId,lecturesProgress: [newLecture._id],});
        await progress.save();

        // Also register this course under the student's purchased courses
        const student = await this.studentModel.findOne({userId: new Types.ObjectId(userPayload.id),});
        if (student) {
          const hasCourse = student.courses.some((c) =>c.idCourses.includes(courseId),);
          if (!hasCourse) {
            student.courses.push({dateOfPurchase: new Date(),idCourses: [courseId],ViewAt: new Date(),});
            await student.save();
          }
        }
      } else {
        // Update existing lecture progress or add new lecture entry
        const existingLecture = await this.lectureProgress.findOne({_id: { $in: progress.lecturesProgress },lectureId,});

        if (existingLecture) {
          existingLecture.viewed = true;
          existingLecture.dateViewed = new Date();
          await existingLecture.save();
        } else {
          const newLecture = await this.lectureProgress.create({lectureId, viewed: true,dateViewed: new Date(),});
          progress.lecturesProgress.push(newLecture._id);
        }

        await progress.save();// If all lectures are viewed, mark the course as completed
        const lectures = await this.lectureProgress.find({
          _id: { $in: progress.lecturesProgress },
        });
        const course = await this.courseService.getCourseDetailsByID(courseId);
        const allViewed =
          progress.lecturesProgress.length === course.curriculum.length &&
          lectures.every((lec) => lec.viewed);

        if (allViewed) {
          progress.completed = true;
          progress.completionDate = new Date();
          await progress.save();
        }
      }

      return progress;
    } catch (err) {
      console.error('Error in markLectureAsViewed:', err.message);
      throw new InternalServerErrorException('Could not mark lecture as viewed');
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 2) Get Current Course Progress
  // ─────────────────────────────────────────────────────────────────────
  /**
   * Retrieves the current progress for a student in a given course.
   * - Verifies that the student has purchased the course.
   * - Returns existing progress or a default message if no progress found.
   *
   * @param courseId    - ObjectId of the course
   * @param currentUser - JWT payload containing user.id
   * @returns progress data or purchase requirement message
   */
  public async getCurrentCourseProgress(
    courseId: Types.ObjectId,
    currentUser: JWTPayloadType,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    try {
      // Validate pagination inputs
      page = Math.max(1, page);
      limit = Math.min(Math.max(1, limit), 100); // Restrict limit between 1 and 100
  
      // Check if the user has purchased the course
      const studentRecord = await this.studentCourseService.getStudent(currentUser.id);
      const purchased = studentRecord.courses.find(entry => entry.idCourses.includes(courseId));
  
      if (!purchased) {
        return {
          isPurchased: false,
          message: 'You need to purchase this course to access it.',
        };
      }
  
      // Fetch existing course progress
      const progress = await this.courseProgress.findOne({ userId: currentUser.id, courseId });
  
      // Fetch course details
      const courseDetails = await this.courseService.getCourseDetailsByID(courseId);
      if (!courseDetails) {
        throw new NotFoundException('Course not found');
      }
  
      // If no progress or no lectures viewed
      if (!progress || progress.lecturesProgress.length === 0) {
        return {
          message: 'No progress found, you can start watching the course.',
          data: {
            courseDetails,
            progress: [],
            isPurchased: true,
          },
        };
      }
  
      // Apply pagination without sorting
      const lecturesProgress = progress.lecturesProgress;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLectures = lecturesProgress.slice(startIndex, endIndex);
  
      return {
        data: {
          courseDetails,
          progress: paginatedLectures,
          completed: progress.completed,
          completionDate: progress.completionDate,
          isPurchased: true,
          pagination: {
            totalLectures: lecturesProgress.length,
            totalPages: Math.ceil(lecturesProgress.length / limit),
            currentPage: page,
            perPage: limit,
          },
        },
      };
    } catch (err) {
      console.error('Error in getCurrentCourseProgress:', err.message);
      throw new InternalServerErrorException('Could not fetch course progress');
    }
  }
  // ─────────────────────────────────────────────────────────────────────
  // 3) Reset Course Progress
  // ─────────────────────────────────────────────────────────────────────
  /**
   * Resets a student’s progress for a specific course.
   * Clears lecture entries, completion flag, and completion date.
   *
   * @param courseId - ObjectId of the course to reset
   * @param userId   - ObjectId of the student
   * @returns confirmation message and the reset progress document
   */
  public async resetCurrentCourseProgress(courseId: string ,userId: string|Types.ObjectId ,): Promise<any> {
    try {
      const progress = await this.courseProgress.findOne({courseId,userId});
      if (!progress) {
        return { message: 'Progress not found!' };
      }
      progress.lecturesProgress = [];
      progress.completed = false;
      progress.completionDate = null;
      await progress.save();
      return { message: 'Course progress has been reset', data: progress };
    } catch (err) {
      console.error('Error in resetCurrentCourseProgress:', err.message);
      throw new InternalServerErrorException('Could not reset course progress');
    }
  }

  
}