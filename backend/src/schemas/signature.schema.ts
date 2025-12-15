import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Signature extends Document {
    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true, enum: ['client', 'technician', 'analyst'] })
    signatureType: string;

    @Prop({ required: true })
    signatureData: string; // Base64 image

    @Prop({ required: true })
    signerName: string;

    @Prop()
    signerDocument: string;

    @Prop()
    signerEmail: string;

    @Prop()
    signerPhone: string;

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;

    @Prop({ type: Object })
    location: {
        latitude: number;
        longitude: number;
    };

    @Prop({ required: true })
    hash: string;

    @Prop({ default: false })
    verified: boolean;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const SignatureSchema = SchemaFactory.createForClass(Signature);
