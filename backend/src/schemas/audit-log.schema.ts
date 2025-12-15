import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: false })
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    usuario_id: Types.ObjectId;

    @Prop({ required: true })
    accion: string;

    @Prop()
    detalle: string;

    @Prop({ required: true, default: Date.now })
    fecha: Date;

    @Prop({ type: Object })
    meta: any;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Índices
AuditLogSchema.index({ usuario_id: 1, fecha: -1 });
AuditLogSchema.index({ fecha: -1 });
