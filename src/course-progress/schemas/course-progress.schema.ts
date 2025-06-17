import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";


export type CourseProgressDocuemnt = HydratedDocument<CourseProgress>;


@Schema()
export class CourseProgress {

  @Prop({ type: mongoose.Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: "Course", required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true, default: false })
  completed: boolean;

  @Prop({ default: null }) 
  completionDate: Date;

  @Prop({ required: true, type: [{ type: mongoose.Types.ObjectId, ref: "LectureProgres" }] })
  LectureProgres: Types.ObjectId[];
  
}



export const CourseProgressSchema = SchemaFactory.createForClass(CourseProgress);