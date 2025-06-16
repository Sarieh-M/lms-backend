import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, HydratedDocument, Types } from "mongoose";
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
CourseSchema.pre<CourseDocument>('deleteOne', { document: true, query: false }, async function (next) {
  const courseId = this._id;

  const courseProgressModel = this.model('CourseProgress');
  const studentCourseModel = this.model('Student');
  const orderModel = this.model('Order');
  const lectureModel = this.model('Lecture');
  const lectureProgressModel = this.model('LectureProgres');

  // 🧼 حذف CourseProgress
  await courseProgressModel.deleteMany({ courseId });

  // 🧼 حذف الكورس من StudentCourse
  await studentCourseModel.updateMany(
    {},
    { $pull: { 'courses.$[].idCourses': courseId } }
  );

  // 🧼 حذف الطلبات المتعلقة بالكورس
  await orderModel.deleteMany({ courseId });

  // 🧼 جلب وحذف المحاضرات
  const lectureDocs = await lectureModel.find({ _id: { $in: this.curriculum || [] } });
  const lectureIds = lectureDocs.map(lec => lec._id.toString());

  await lectureModel.deleteMany({ _id: { $in: lectureIds } });

  // 🧼 حذف تقدم المحاضرات
  await lectureProgressModel.deleteMany({ lectureId: { $in: lectureIds } });

  next();
});

export { CourseSchema };