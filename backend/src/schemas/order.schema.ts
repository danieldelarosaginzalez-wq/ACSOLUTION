import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

class MaterialSugerido {
    @Prop({ type: Types.ObjectId, ref: 'Material' })
    material_id: Types.ObjectId;

    @Prop()
    cantidad: number;

    @Prop()
    unidad: string;
}

class MaterialApartado {
    @Prop({ type: Types.ObjectId, ref: 'Material' })
    material_id: Types.ObjectId;

    @Prop()
    cantidad: number;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    tecnico_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    reservation_id: Types.ObjectId;
}

class MaterialUtilizado {
    @Prop({ type: Types.ObjectId, ref: 'Material' })
    material_id: Types.ObjectId;

    @Prop()
    cantidad: number;

    @Prop()
    unidad: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    registrado_por: Types.ObjectId;

    @Prop()
    fecha: Date;

    @Prop()
    poliza_number: string;
}

class FotoEvidencia {
    @Prop({ type: Types.ObjectId })
    file_id: Types.ObjectId;

    @Prop({ type: Object })
    meta: any;
}

class Evidencias {
    @Prop({ type: FotoEvidencia })
    foto_inicial: FotoEvidencia;

    @Prop({ type: FotoEvidencia })
    foto_durante: FotoEvidencia;

    @Prop({ type: FotoEvidencia })
    foto_materiales: FotoEvidencia;

    @Prop({ type: FotoEvidencia })
    foto_final: FotoEvidencia;

    @Prop({ type: [Types.ObjectId] })
    otros: Types.ObjectId[];
}

class AuditTrailEntry {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    actor: Types.ObjectId;

    @Prop()
    action: string;

    @Prop()
    detail: string;

    @Prop({ default: Date.now })
    timestamp: Date;
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true, unique: true })
    codigo: string;

    @Prop({ required: true, match: /^[0-9]{6}$/ })
    poliza_number: string;

    @Prop({ required: true })
    cliente: string;

    @Prop({ required: true })
    direccion: string;

    @Prop({ required: true, enum: ['instalacion', 'mantenimiento', 'reparacion', 'inspeccion'] })
    tipo_trabajo: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    analista_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    tecnico_id: Types.ObjectId;

    @Prop({
        required: true,
        enum: ['creada', 'asignada', 'en_proceso', 'finalizada', 'imposibilidad', 'pendiente_revision', 'cerrada'],
        default: 'creada'
    })
    estado: string;

    @Prop({ type: [MaterialSugerido] })
    materiales_sugeridos: MaterialSugerido[];

    @Prop({ type: [MaterialApartado] })
    materiales_apartados: MaterialApartado[];

    @Prop({ type: [MaterialUtilizado] })
    materiales_utilizados: MaterialUtilizado[];

    @Prop({ type: Evidencias })
    evidencias: Evidencias;

    @Prop({ type: Types.ObjectId })
    ia_prediction_id: Types.ObjectId;

    @Prop({ default: Date.now })
    fecha_creacion: Date;

    @Prop()
    fecha_cierre: Date;

    @Prop({ type: [AuditTrailEntry] })
    audit_trail: AuditTrailEntry[];

    @Prop()
    notas: string;

    // Campos de Imposibilidad
    @Prop({ type: Object })
    imposibilidad: {
        motivo: string;
        descripcion_detallada: string;
        foto_tirilla: string; // URL de la foto de la tirilla (OBLIGATORIA)
        foto_predio: string; // URL de la foto del predio (OPCIONAL)
        justificacion_sin_foto_predio?: string; // Si no puede tomar foto del predio
        fecha_registro: Date;
        registrado_por: Types.ObjectId;
        ubicacion?: {
            latitude: number;
            longitude: number;
        };
    };

    @Prop()
    fecha_pendiente_revision: Date; // Cuando el técnico marca como finalizada

    @Prop()
    observaciones_analista: string; // Observaciones del analista al revisar

    // Campos de Finalización
    @Prop()
    fecha_finalizacion: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    finalizada_por: Types.ObjectId;

    @Prop()
    observaciones_finalizacion: string;

    @Prop()
    tiempo_total: number; // En minutos

    // 🆕 UBICACIÓN (heredada de póliza)
    @Prop({ type: Object })
    ubicacion: {
        lat: number;
        lng: number;
        direccion_completa?: string;
        geocoded?: boolean;
        geocoded_at?: Date;
    };
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Índices adicionales (codigo ya tiene unique: true en @Prop)
OrderSchema.index({ poliza_number: 1 });
OrderSchema.index({ tecnico_id: 1 });
OrderSchema.index({ estado: 1 });
OrderSchema.index({ fecha_creacion: -1 });
