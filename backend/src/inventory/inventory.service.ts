import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { InventoryTechnician, InventoryTechnicianDocument } from '../schemas/inventory-technician.schema';
import { MovimientoInventario, MovimientoInventarioDocument } from '../schemas/movimiento-inventario.schema';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(InventoryTechnician.name) private inventoryModel: Model<InventoryTechnicianDocument>,
        @InjectModel(MovimientoInventario.name) private movimientoModel: Model<MovimientoInventarioDocument>,
    ) { }

    async getByTech(techId: string): Promise<InventoryTechnicianDocument> {
        let inventory = await this.inventoryModel.findOne({ tecnico_id: techId }).populate('materials.material_id').exec();

        // Si no existe, crear inventario vacío para el técnico
        if (!inventory) {
            inventory = new this.inventoryModel({
                tecnico_id: techId,
                materials: [],
                created_at: new Date(),
                updated_at: new Date(),
            });
            await inventory.save();
        }

        return inventory;
    }

    async createOrGetInventory(techId: string): Promise<InventoryTechnicianDocument> {
        let inventory = await this.inventoryModel.findOne({ tecnico_id: techId }).exec();

        if (!inventory) {
            inventory = new this.inventoryModel({
                tecnico_id: techId,
                materials: [],
                created_at: new Date(),
                updated_at: new Date(),
            });
            await inventory.save();
        }

        return inventory;
    }

    async reserveMaterial(
        techId: string,
        materialId: string,
        cantidad: number,
        motivo: string,
        ordenId: string,
        userId: string,
        session?: ClientSession,
    ): Promise<any> {
        const query = this.inventoryModel.findOne({ tecnico_id: techId });
        const inventory = session ? await query.session(session) : await query;

        if (!inventory) {
            throw new NotFoundException('Inventario del técnico no encontrado');
        }

        const materialIndex = inventory.materials.findIndex(
            m => m.material_id.toString() === materialId
        );

        if (materialIndex === -1) {
            throw new NotFoundException('Material no encontrado en inventario del técnico');
        }

        const material = inventory.materials[materialIndex];

        if (material.cantidad_disponible < cantidad) {
            throw new ConflictException(
                `Stock insuficiente. Disponible: ${material.cantidad_disponible}, Solicitado: ${cantidad}`
            );
        }

        // Actualizar inventario
        material.cantidad_apartada += cantidad;
        material.cantidad_disponible -= cantidad;
        material.ultimo_movimiento = new Date();
        inventory.updated_at = new Date();

        await (session ? inventory.save({ session }) : inventory.save());

        // Crear movimiento
        const movimiento = new this.movimientoModel({
            tecnico_id: techId,
            material_id: materialId,
            tipo: 'apartado',
            cantidad,
            motivo,
            visible_para_analistas: true,
            usuario_responsable: userId,
            origen: 'OT',
            referencia_origen_id: ordenId,
            fecha: new Date(),
        });

        const savedMovimiento = session ? await movimiento.save({ session }) : await movimiento.save();

        return { movimiento_id: savedMovimiento._id };
    }

    async commitConsumption(
        techId: string,
        materialId: string,
        cantidad: number,
        ordenId: string,
        polizaNumber: string,
        userId: string,
        session?: ClientSession,
    ): Promise<void> {
        const query = this.inventoryModel.findOne({ tecnico_id: techId });
        const inventory = session ? await query.session(session) : await query;

        // Si el técnico tiene inventario, actualizar stock
        if (inventory) {
            const materialIndex = inventory.materials.findIndex(
                m => m.material_id.toString() === materialId
            );

            if (materialIndex !== -1) {
                const material = inventory.materials[materialIndex];

                // Decrementar cantidad_actual y cantidad_apartada
                material.cantidad_actual -= cantidad;
                if (material.cantidad_apartada >= cantidad) {
                    material.cantidad_apartada -= cantidad;
                } else {
                    material.cantidad_apartada = 0;
                }

                // Recalcular disponible
                material.cantidad_disponible = material.cantidad_actual - material.cantidad_apartada;
                material.ultimo_movimiento = new Date();
                inventory.updated_at = new Date();

                await (session ? inventory.save({ session }) : inventory.save());
            }
        }

        // Crear movimiento de salida (siempre, incluso si no hay inventario)
        const movimiento = new this.movimientoModel({
            tecnico_id: techId,
            material_id: materialId,
            tipo: 'salida',
            cantidad,
            motivo: `Consumo en OT - Póliza ${polizaNumber}`,
            visible_para_analistas: true,
            usuario_responsable: userId,
            origen: 'OT',
            referencia_origen_id: ordenId,
            fecha: new Date(),
        });

        await (session ? movimiento.save({ session }) : movimiento.save());
    }

    async getMovimientos(techId: string, filters: any = {}): Promise<MovimientoInventarioDocument[]> {
        return this.movimientoModel
            .find({ tecnico_id: techId, ...filters })
            .sort({ fecha: -1 })
            .limit(100)
            .exec();
    }

    async returnMaterial(
        techId: string,
        materialId: string,
        cantidad: number,
        motivo: string,
        ordenId: string,
        userId: string,
        session?: ClientSession,
    ): Promise<any> {
        const query = this.inventoryModel.findOne({ tecnico_id: techId });
        const inventory = session ? await query.session(session) : await query;

        if (!inventory) {
            throw new NotFoundException('Inventario del técnico no encontrado');
        }

        const materialIndex = inventory.materials.findIndex(
            m => m.material_id.toString() === materialId
        );

        if (materialIndex === -1) {
            throw new NotFoundException('Material no encontrado en inventario del técnico');
        }

        const material = inventory.materials[materialIndex];

        // Validar que haya suficiente material apartado para devolver
        if (material.cantidad_apartada < cantidad) {
            throw new ConflictException(
                `No hay suficiente material apartado. Apartado: ${material.cantidad_apartada}, Intentando devolver: ${cantidad}`
            );
        }

        // Actualizar inventario: devolver de apartado a disponible
        material.cantidad_apartada -= cantidad;
        material.cantidad_disponible += cantidad;
        material.ultimo_movimiento = new Date();
        inventory.updated_at = new Date();

        await (session ? inventory.save({ session }) : inventory.save());

        // Crear movimiento de devolución
        const movimiento = new this.movimientoModel({
            tecnico_id: techId,
            material_id: materialId,
            tipo: 'devolucion',
            cantidad,
            motivo: motivo || 'Devolución de material sobrante',
            visible_para_analistas: true,
            usuario_responsable: userId,
            origen: 'OT',
            referencia_origen_id: ordenId,
            fecha: new Date(),
        });

        const savedMovimiento = session ? await movimiento.save({ session }) : await movimiento.save();

        return { movimiento_id: savedMovimiento._id, message: 'Material devuelto exitosamente' };
    }

    async getMaterialSummaryByTech(techId: string): Promise<any> {
        const inventory = await this.inventoryModel.findOne({ tecnico_id: techId }).populate('materials.material_id').exec();

        if (!inventory) {
            return {
                total_materiales: 0,
                total_cantidad: 0,
                total_apartado: 0,
                total_disponible: 0,
                materiales_bajo_stock: []
            };
        }

        const total_cantidad = inventory.materials.reduce((sum, m) => sum + m.cantidad_actual, 0);
        const total_apartado = inventory.materials.reduce((sum, m) => sum + m.cantidad_apartada, 0);
        const total_disponible = inventory.materials.reduce((sum, m) => sum + m.cantidad_disponible, 0);
        const materiales_bajo_stock = inventory.materials.filter(m => m.cantidad_disponible < 5);

        return {
            total_materiales: inventory.materials.length,
            total_cantidad,
            total_apartado,
            total_disponible,
            materiales_bajo_stock: materiales_bajo_stock.length
        };
    }
}
