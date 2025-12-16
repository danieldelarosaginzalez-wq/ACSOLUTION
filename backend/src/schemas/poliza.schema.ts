import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PolizaDocument = Poliza & Document;

class Autorizacion {
    @Prop()
    autoridad: string;

    @Prop()
    fecha: Date;

    @Prop({ type: Types.ObjectId })
    document_id: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Poliza {
    @Prop({ required: true, unique: true, match: /^[0-9]{6}$/ })
    poliza_number: string;

    @Prop()
    descripcion: string;

    @Prop({ type: Object })
    metadata: {
        max_cost?: number;
        entidades?: string[];
        [key: string]: any;
    };

    @Prop({ type: [Autorizacion] })
    autorizaciones: Autorizacion[];

    @Prop({ default: Date.now })
    created_at: Date;

    @Prop({ required: true, enum: ['activo', 'anulada'], default: 'activo' })
    estado: string;

    // 🆕 CAMPOS DE UBICACIÓN
    @Prop()
    direccion: string;

    @Prop({ type: Object })
    ubicacion: {
        lat: number;
        lng: number;
        direccion_completa?: string;
        geocoded?: boolean;
    };

    @Prop()
    cliente: string;
}

export const PolizaSchema = SchemaFactory.createForClass(Poliza);

// Índices adicionales (poliza_number ya tiene unique: true en @Prop)
PolizaSchema.index({ estado: 1 });
