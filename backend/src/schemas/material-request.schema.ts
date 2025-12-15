import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaterialRequestDocument = MaterialRequest & Document;

@Schema({ timestamps: true })
export class MaterialRequest {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    tecnico_id: Types.ObjectId;

    @Prop({ required: true })
    fecha_solicitud: Date;

    @Prop({ required: true, enum: ['pendiente', 'aprobada', 'entregada', 'rechazada'] })
    estado: string;

    @Prop([{
        material_id: { type: Types.ObjectId, ref: 'Material', required: true },
        cantidad_solicitada: { type: Number, required: true },
        cantidad_aprobada: { type: Number, default: 0 },
        motivo: { type: String }, // Por qué necesita este material
        tipo_trabajo_estimado: { type: String } // Qué tipo de trabajo va a hacer
    }])
    materiales_solicitados: Array<{
        material_id: Types.ObjectId;
        cantidad_solicitada: number;
        cantidad_aprobada: number;
        motivo?: string;
        tipo_trabajo_estimado?: string;
    }>;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    aprobado_por: Types.ObjectId;

    @Prop()
    fecha_aprobacion: Date;

    @Prop()
    observaciones: string;

    @Prop({ default: false })
    es_sugerencia_ia: boolean; // Si fue generada por IA basada en patrones
}

export const MaterialRequestSchema = SchemaFactory.createForClass(MaterialRequest);