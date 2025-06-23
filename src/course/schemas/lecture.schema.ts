import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LectureDocument = HydratedDocument<Lecture>;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
export class Lecture {

  // Localized lecture title (English and Arabic)
  @Prop({ required: true, type: Object })
  title: { en: string; ar: string };

  // Video URL of the lecture
  @Prop({ required: true })
  videoUrl: string;

  // Cloud storage public ID (e.g., from Cloudinary)
  @Prop({ type: Number })
  public_id: number;

  // Indicates whether this lecture is available for free preview
  @Prop({ default: false })
  freePreview: boolean;
}

// Mongoose schema factory for the Lecture model
export const LectureSchema = SchemaFactory.createForClass(Lecture);

