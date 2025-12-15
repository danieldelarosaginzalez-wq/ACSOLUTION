import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: false })
export class Alert {
    @Prop({
        required: true,
        enum: ['stock_critico', 'consumo_sospechoso', 'foto_manipulada', 'poliza_invalid', 'over_consumption']
    })
    tipo: string;

    @Prop({ required: true })
    descripcion: string;

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    order_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    tecnico_id: Types.ObjectId;

    @Prop({ required: true, default: true })
    visible_para_analistas: boolean;

    @Prop({ required: true, default: Date.now })
    created_at: Date;

    @Prop({ required: true, default: false })
    resolved: boolean;

    @Prop()
    resolved_at: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    resolved_by: Types.ObjectId;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Índices
AlertSchema.index({ tipo: 1, resolved: 1 });
AlertSchema.index({ order_id: 1 });
AlertSchema.index({ tecnico_id: 1 });
AlertSchema.index({ visible_para_analistas: 1 });
AlertSchema.index({ created_at: -1 });
