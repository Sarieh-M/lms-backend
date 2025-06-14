import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LectureProgresDocuemnt = HydratedDocument<LectureProgres>;
@Schema()
export class LectureProgres {
    @Prop({required:true})
    lectureId: string;
    @Prop({required:true})
    viewed: boolean;
    @Prop({required:true,default:()=> new Date()})
    dateViewed: Date;
}

export const LectureProgresSchema = SchemaFactory.createForClass(LectureProgres);





