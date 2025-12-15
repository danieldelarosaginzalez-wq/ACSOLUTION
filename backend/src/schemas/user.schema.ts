import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password_hash: string;

    @Prop({ required: true, enum: ['analista', 'tecnico', 'analista_inventario_oculto', 'bodeguero'] })
    rol: string;

    @Prop({ enum: ['analista', 'tecnico', 'analista_inventario_oculto', 'bodeguero'] })
    role: string; // Alias para compatibilidad

    @Prop()
    especialidad: string;

    @Prop()
    telefono: string;

    @Prop({ required: true, enum: ['activo', 'inactivo'], default: 'activo' })
    estado: string;

    @Prop({ default: Date.now })
    created_at: Date;

    // 🆕 UBICACIÓN EN TIEMPO REAL (para técnicos)
    @Prop({ type: Object })
    ubicacion_actual: {
        lat: number;
        lng: number;
        timestamp: Date;
        accuracy?: number;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ rol: 1 });
