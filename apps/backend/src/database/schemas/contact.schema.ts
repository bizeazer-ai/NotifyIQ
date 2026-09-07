import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: String, trim: true, default: null })
  name: string | null;

  @Prop({
    required: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid E.164 phone number!`,
    },
  })
  phone: string;

  @Prop({ type: [String], default: ['Customer'] })
  tags: string[];

  @Prop({ default: false })
  consentGiven: boolean;

  @Prop({ default: false })
  optedOut: boolean;

  @Prop({ type: Date, default: null })
  deletionRequestedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index({ workspaceId: 1, phone: 1 }, { unique: true });
