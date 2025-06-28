import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Level extends Document {
  @Prop({ type: Object, required: true }) // { en: string, ar: string }
  title: { en: string; ar: string };
}

export const LevelSchema = SchemaFactory.createForClass(Level);