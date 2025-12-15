import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiPredictionDocument = AiPrediction & Document;

@Schema({ timestamps: false })
export class AiPrediction {
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    order_id: Types.ObjectId;

    @Prop({ type: Object })
    input_snapshot: any;

    @Prop({ type: Object })
    features: any;

    @Prop({ required: true, enum: ['imposible', 'permitido', 'requiere_verificacion'] })
    decision: string;

    @Prop({ required: true, min: 0, max: 1 })
    confidence: number;

    @Prop()
    model_version: string;

    @Prop({ type: [String] })
    reasons: string[];

    @Prop({ type: Types.ObjectId, ref: 'User' })
    requested_by: Types.ObjectId;

    @Prop({ required: true, default: Date.now })
    timestamp: Date;

    @Prop({ enum: ['permitido', 'imposible', 'falso_positivo', null] })
    label_after: string;
}

export const AiPredictionSchema = SchemaFactory.createForClass(AiPrediction);

// Índices
AiPredictionSchema.index({ order_id: 1 });
AiPredictionSchema.index({ decision: 1 });
AiPredictionSchema.index({ timestamp: -1 });
AiPredictionSchema.index({ label_after: 1 });
