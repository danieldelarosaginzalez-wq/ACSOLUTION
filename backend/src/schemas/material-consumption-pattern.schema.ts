import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaterialConsumptionPatternDocument = MaterialConsumptionPattern & Document;

@Schema({ timestamps: true })
export class MaterialConsumptionPattern {
    @Prop({ required: true })
    tipo_trabajo: string; // "instalacion_medidor", "reparacion_tuberia", etc.

    @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
    material_id: Types.ObjectId;

    @Prop({ required: true })
    cantidad_promedio: number;

    @Prop({ required: true })
    cantidad_minima: number;

    @Prop({ required: true })
    cantidad_maxima: number;

    @Prop({ required: true, default: 0 })
    total_trabajos: number; // Cuántos trabajos se han registrado

    @Prop({ required: true, default: 0 })
    total_consumo: number; // Suma total de consumo

    @Prop({ required: true, default: 1 })
    confianza: number; // 0-1, qué tan confiable es la predicción

    @Prop({ type: Date, default: Date.now })
    ultima_actualizacion: Date;

    @Prop({ type: [Number], default: [] })
    historial_consumos: number[]; // Últimos 20 consumos para calcular tendencias
}

export const MaterialConsumptionPatternSchema = SchemaFactory.createForClass(MaterialConsumptionPattern);