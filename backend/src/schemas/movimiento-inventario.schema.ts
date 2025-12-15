import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MovimientoInventarioDocument = MovimientoInventario & Document;

@Schema({ timestamps: false })
export class MovimientoInventario {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    tecnico_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
    material_id: Types.ObjectId;

    @Prop({ required: true, enum: ['entrada', 'salida', 'apartado', 'ajuste', 'devolucion'] })
    tipo: string;

    @Prop({ required: true })
    cantidad: number;

    @Prop()
    motivo: string;

    @Prop({ default: true })
    visible_para_analistas: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    usuario_responsable: Types.ObjectId;

    @Prop({ enum: ['OT', 'poliza', 'Excel', 'AjusteAutomatico', 'Manual'] })
    origen: string;

    @Prop({ type: Types.ObjectId })
    referencia_origen_id: Types.ObjectId;

    @Prop({ required: true, default: Date.now })
    fecha: Date;
}

export const MovimientoInventarioSchema = SchemaFactory.createForClass(MovimientoInventario);

// Índices
MovimientoInventarioSchema.index({ tecnico_id: 1, fecha: -1 });
MovimientoInventarioSchema.index({ material_id: 1 });
MovimientoInventarioSchema.index({ origen: 1, referencia_origen_id: 1 });
MovimientoInventarioSchema.index({ visible_para_analistas: 1 });
