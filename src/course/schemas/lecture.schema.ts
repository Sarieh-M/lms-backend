import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LectureDocument = HydratedDocument<Lecture>;

@Schema({timestamps:true})
export class Lecture{
    @Prop({ required: true,type:Object })
    title:{en:string;ar:string};
    @Prop({ required: true })
    videoUrl:string;
    @Prop({type:Number})
    public_id:number;
    @Prop({ default: false })
    freePreview:boolean;
}

export const LectureSchema = SchemaFactory.createForClass(Lecture);

