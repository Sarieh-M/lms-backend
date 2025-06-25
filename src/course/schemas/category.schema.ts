import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Object, required: true }) // { en: string, ar: string }
  title: { en: string; ar: string };

  @Prop({ type: Object }) // Optional localized description
  description?: { en: string; ar: string };

  @Prop({ default: false })
  isFeatured?: boolean;

  @Prop({ default: 0 })
  displayOrder?: number;
}

export type CategoryDocument = Category & Document;
export const CategorySchema = SchemaFactory.createForClass(Category);