import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export type StudentCourseDocument =   HydratedDocument<Student>;

@Schema({timestamps:true})
export class Student {
    @Prop({type:Types.ObjectId,ref:'User', required: true})
    userId: Types.ObjectId;
    @Prop({ 
        type: [{ 
            dateOfPurchase: { type: Date, default: () => new Date() }, 
            idCourses: [{ type: Types.ObjectId, ref: "Course", required: true }],
            ViewAt:{ type: Date, default: null }
        }], 
        default: [] 
    })
    courses: { dateOfPurchase: Date; idCourses: Types.ObjectId[];ViewAt:Date|null }[];
}

export const StudentCourseSchema =SchemaFactory.createForClass(Student);