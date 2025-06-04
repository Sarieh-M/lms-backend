import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { UserGender, UserRole } from "utilitis/enums";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 50, type: Object })
  userName: { en: string; ar: string };

  @Prop({ required: true, unique: true })
  userEmail: string;

  @Prop({ required: true, unique: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ required: false })
  profileImage: string;

  @Prop({ required: false })
  age: number;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Course" }], default: [] })
  enrolledCourses: Types.ObjectId[];

  @Prop({ default: () => Date.now() })
  lastLogin: Date;

  @Prop({ required: false })
  dateOfBirth: Date;

  @Prop({ type: String, enum: UserGender, default: UserGender.OTHER })
  gender: UserGender;

  @Prop()
  resetPasswordToken: string;

  @Prop({ default: false })
  isAccountverified: boolean;

  @Prop({ required: false })
  verificationToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);