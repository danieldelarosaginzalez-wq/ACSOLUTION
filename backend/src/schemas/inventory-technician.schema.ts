import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryTechnicianDocument = InventoryTechnician & Document;

class MaterialInventory {
    @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
    material_id: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    cantidad_actual: number;

    @Prop({ required: true, min: 0, default: 0 })
    cantidad_apartada: number;

    @Prop({ required: true, min: 0 })
    cantidad_disponible: number;

    @Prop()
    ultimo_movimiento: Date;
}

@Schema({ timestamps: true })
export class InventoryTechnician {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    tecnico_id: Types.ObjectId;

    @Prop({ type: [MaterialInventory] })
    materials: MaterialInventory[];

    @Prop({ default: Date.now })
    updated_at: Date;
}

export const InventoryTechnicianSchema = SchemaFactory.createForClass(InventoryTechnician);

// Índices
InventoryTechnicianSchema.index({ tecnico_id: 1 }, { unique: true });
InventoryTechnicianSchema.index({ 'materials.material_id': 1 });
