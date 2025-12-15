import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MaterialDocument = Material & Document;

@Schema({ timestamps: true })
export class Material {
    @Prop({ required: true })
    nombre: string;

    @Prop()
    descripcion: string;

    @Prop({ required: true })
    unidad_medida: string;

    @Prop({ required: true })
    costo_unitario: number;

    @Prop()
    categoria: string;

    @Prop({ default: 0 })
    stock_minimo: number;

    @Prop({ default: Date.now })
    created_at: Date;

    @Prop({ required: true, enum: ['activo', 'inactivo'], default: 'activo' })
    estado: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

// Índices
MaterialSchema.index({ nombre: 1 });
MaterialSchema.index({ categoria: 1 });
