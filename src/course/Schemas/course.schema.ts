import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, HydratedDocument, Types } from "mongoose";
import { CourseProgress,CourseProgressSchema } from "src/course-progress/schemas/course-progress.schema";
import { Student,StudentCourseSchema } from "src/student-course/schemas/student-course.schema";

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, type: Object }) // يدعم { en, ar }
  title: { en: string; ar: string };

  @Prop({ required: true, type: Object })
  description: { en: string; ar: string };

  @Prop({ required: true, type: Object })
  category: { en: string; ar: string };

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], required: true })
  instructorId: Types.ObjectId;

  @Prop({ required: true })
  instructorName: string;

  @Prop({ required: true, type: Object })
  level: { en: string; ar: string };

  @Prop({ required: true })
  primaryLanguage: string;

  @Prop({ required: true,type: Object })
  subtitle:  { en: string; ar: string };

  @Prop({ required: true })
  image: string;

  @Prop({ type: Object })
  welcomeMessage: { en: string; ar: string };

  @Prop({ required: true })
  pricing: number;

  @Prop({ required: true })
  objectives: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Student" }], default: [] })
  students: Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Lecture" }], default: [] })
  curriculum: Types.ObjectId[];

  @Prop({ required: true })
  isPublished: boolean;
  
}

// تعريف الـ CourseSchema قبل تصديره
const CourseSchema = SchemaFactory.createForClass(Course);

// Hook for cascading deletes when a course is deleted


export { CourseSchema };