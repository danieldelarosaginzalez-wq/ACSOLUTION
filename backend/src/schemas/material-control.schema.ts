import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaterialControlDocument = MaterialControl & Document;

// Esquema para rastrear materiales asignados por OT
class MaterialAsignado {
    @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
    material_id: Types.ObjectId;

    @Prop({ required: true })
    cantidad_asignada: number;

    @Prop({ default: 0 })
    cantidad_utilizada: number;

    @Prop({ default: 0 })
    cantidad_devuelta: number;

    @Prop({ default: 0 })
    cantidad_perdida: number;

    @Prop()
    motivo_perdida: string;

    @Prop({ default: 'pendiente', enum: ['pendiente', 'en_uso', 'completado', 'devuelto_parcial', 'devuelto_total'] })
    estado: string;
}

@Schema({ timestamps: true })
export class MaterialControl {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    tecnico_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    orden_trabajo_id: Types.ObjectId;

    @Prop({ type: [MaterialAsignado] })
    materiales_asignados: MaterialAsignado[];

    @Prop({ required: true, default: Date.now })
    fecha_asignacion: Date;

    @Prop()
    fecha_inicio_trabajo: Date;

    @Prop()
    fecha_fin_trabajo: Date;

    @Prop()
    fecha_devolucion: Date;

    @Prop({ default: 'asignado', enum: ['asignado', 'en_trabajo', 'trabajo_completado', 'devolucion_pendiente', 'devolucion_completada', 'cerrado'] })
    estado_general: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    bodeguero_asigno: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    analista_supervisa: Types.ObjectId;

    @Prop()
    observaciones_bodeguero: string;

    @Prop()
    observaciones_tecnico: string;

    @Prop()
    observaciones_analista: string;

    // Control de descuadres
    @Prop({ default: false })
    tiene_descuadre: boolean;

    @Prop()
    motivo_descuadre: string;

    @Prop({ default: 0 })
    valor_descuadre: number;

    @Prop({ default: false })
    descuadre_resuelto: boolean;

    @Prop()
    fecha_resolucion_descuadre: Date;
}

export const MaterialControlSchema = SchemaFactory.createForClass(MaterialControl);

// Índices
MaterialControlSchema.index({ tecnico_id: 1, fecha_asignacion: -1 });
MaterialControlSchema.index({ orden_trabajo_id: 1 });
MaterialControlSchema.index({ estado_general: 1 });
MaterialControlSchema.index({ tiene_descuadre: 1 });
MaterialControlSchema.index({ bodeguero_asigno: 1 });
MaterialControlSchema.index({ analista_supervisa: 1 });