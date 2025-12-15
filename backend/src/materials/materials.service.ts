import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from '../schemas/material.schema';
import { Order, OrderDocument } from '../schemas/order.schema';

@Injectable()
export class MaterialsService {
    constructor(
        @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    ) { }

    async findAll(filters: any = {}): Promise<MaterialDocument[]> {
        return this.materialModel.find(filters).sort({ nombre: 1 }).exec();
    }

    async findById(id: string): Promise<MaterialDocument> {
        const material = await this.materialModel.findById(id).exec();
        if (!material) {
            throw new NotFoundException('Material no encontrado');
        }
        return material;
    }

    async create(materialData: any): Promise<MaterialDocument> {
        const material = new this.materialModel(materialData);
        return material.save();
    }

    async update(id: string, updateData: any): Promise<MaterialDocument> {
        const material = await this.materialModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!material) {
            throw new NotFoundException('Material no encontrado');
        }
        return material;
    }

    async delete(id: string): Promise<MaterialDocument> {
        const material = await this.materialModel.findByIdAndDelete(id).exec();
        if (!material) {
            throw new NotFoundException('Material no encontrado');
        }
        return material;
    }

    async getCategorias(): Promise<string[]> {
        const categorias = await this.materialModel.distinct('categoria').exec();
        return categorias;
    }

    async getConsumptionStats(query: any): Promise<any> {
        const { tipo_trabajo, from, to } = query;

        const filters: any = {};
        if (tipo_trabajo) filters.tipo_trabajo = tipo_trabajo;
        if (from || to) {
            filters.fecha_creacion = {};
            if (from) filters.fecha_creacion.$gte = new Date(from);
            if (to) filters.fecha_creacion.$lte = new Date(to);
        }

        const orders = await this.orderModel
            .find(filters)
            .select('materiales_utilizados tipo_trabajo')
            .exec();

        // Agrupar consumos por material
        const consumptionMap = new Map();

        orders.forEach(order => {
            order.materiales_utilizados?.forEach(material => {
                const key = material.material_id.toString();
                if (!consumptionMap.has(key)) {
                    consumptionMap.set(key, {
                        material_id: material.material_id,
                        total_cantidad: 0,
                        total_usos: 0,
                        promedio: 0,
                    });
                }
                const stats = consumptionMap.get(key);
                stats.total_cantidad += material.cantidad;
                stats.total_usos += 1;
                stats.promedio = stats.total_cantidad / stats.total_usos;
            });
        });

        return {
            total_orders: orders.length,
            consumption_by_material: Array.from(consumptionMap.values()),
        };
    }
}
