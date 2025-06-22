import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { UserGender, UserRole } from "utilitis/enums";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 50,unique: true })
  userName: string;
  //============================================================================
  @Prop({ required: true, unique: true })
  userEmail: string;
  //============================================================================
  @Prop({ required: true, unique: true })
  password: string;
  //============================================================================
  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;
  //============================================================================
  @Prop({ required: false })
  profileImage: string;
  //============================================================================
  @Prop({ required: false })
  age: number;
  //============================================================================  
  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Course" }], default: [] })
  enrolledCourses: Types.ObjectId[];
  //============================================================================
  @Prop({ default: () => Date.now() })
  lastLogin: Date;
  //============================================================================
  @Prop({ required: false })
  dateOfBirth: Date;
  //============================================================================
  @Prop({ type: String, enum: UserGender, default: UserGender.OTHER })
  gender: UserGender;
  //============================================================================
  @Prop()
  resetCode?: string;
  //============================================================================
  @Prop()
  resetCodeExpiry?: Date;
  //============================================================================
  @Prop()
  resetPasswordToken: string;
  //============================================================================
  @Prop({ default: false })
  isAccountverified: boolean;
  //============================================================================
  @Prop({ required: false })
  verificationToken: string;
}
//============================================================================
// هنا منضيف الـ hook
export const UserSchema = SchemaFactory.createForClass(User);
//============================================================================
//  استخدم deleteOne بدلاً من remove
UserSchema.pre<UserDocument>('deleteOne', { document: true, query: false }, async function (next) {
  const userId = this._id;
  const courseModel = this.model('Course');
  const courseProgressModel = this.model('CourseProgress');
  const studentCourseModel = this.model('Student');
  const lectureProgressModel = this.model('LectureProgres');

  if (this.role === UserRole.TEACHER) {
    const courses = await courseModel.find({ instructorId: userId });
    for (const course of courses) {
      await course.deleteOne(); // 🔁 triggers course-level cascade delete
    }
  }

  if (this.role === UserRole.STUDENT) {
    await courseProgressModel.deleteMany({ userId });
    await lectureProgressModel.deleteMany({ userId });
    await studentCourseModel.deleteMany({ userId });
  }

  next();
});