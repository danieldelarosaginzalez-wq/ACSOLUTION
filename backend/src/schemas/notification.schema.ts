import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, enum: ['info', 'success', 'warning', 'error', 'order', 'material', 'alert'] })
    type: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: Object })
    data: any;

    @Prop({ default: false })
    read: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
