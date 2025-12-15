import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiPrediction, AiPredictionDocument } from '../schemas/ai-prediction.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Material, MaterialDocument } from '../schemas/material.schema';

@Injectable()
export class AiService {
    constructor(
        @InjectModel(AiPrediction.name) private aiPredictionModel: Model<AiPredictionDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
    ) { }

    async predict(orderId: string, userId: string): Promise<AiPredictionDocument> {
        // TODO: Implementar lógica real de IA
        // Por ahora, retorna una predicción mock
        const prediction = new this.aiPredictionModel({
            order_id: orderId,
            input_snapshot: {},
            features: {},
            decision: 'permitido',
            confidence: 0.85,
            model_version: 'v1.0',
            reasons: ['Stock disponible', 'Póliza activa', 'Técnico calificado'],
            requested_by: userId,
            timestamp: new Date(),
        });

        return prediction.save();
    }

    async predictMaterials(tipo_trabajo: string, cliente?: string): Promise<any> {
        // Buscar órdenes similares finalizadas
        const similarOrders = await this.findSimilarOrders(tipo_trabajo, cliente);

        if (similarOrders.length < 5) {
            return {
                success: false,
                message: 'No hay suficientes datos históricos (mínimo 5 trabajos similares)',
                materiales_sugeridos: [],
                confidence: 0,
                ordenes_analizadas: similarOrders.length,
            };
        }

        // Analizar patrones de consumo
        const materialConsumption = new Map<string, { total: number; count: number; unidad: string; nombre: string }>();

        for (const order of similarOrders) {
            if (order.materiales_utilizados && order.materiales_utilizados.length > 0) {
                for (const mat of order.materiales_utilizados) {
                    const key = mat.material_id.toString();
                    if (!materialConsumption.has(key)) {
                        materialConsumption.set(key, {
                            total: 0,
                            count: 0,
                            unidad: mat.unidad,
                            nombre: '',
                        });
                    }
                    const current = materialConsumption.get(key);
                    current.total += mat.cantidad;
                    current.count += 1;
                }
            }
        }

        // Obtener información de materiales
        const materialIds = Array.from(materialConsumption.keys()).map(id => new Types.ObjectId(id));
        const materials = await this.materialModel.find({ _id: { $in: materialIds } }).exec();

        const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

        // Calcular promedios y generar sugerencias
        const sugerencias = [];
        for (const [materialId, data] of materialConsumption.entries()) {
            const material = materialMap.get(materialId);
            if (material) {
                const promedio = Math.ceil(data.total / data.count);
                const frecuencia = (data.count / similarOrders.length) * 100;

                sugerencias.push({
                    material_id: materialId,
                    nombre: material.nombre,
                    cantidad_sugerida: promedio,
                    unidad: data.unidad,
                    frecuencia_uso: Math.round(frecuencia),
                    veces_usado: data.count,
                    categoria: material.categoria,
                });
            }
        }

        // Ordenar por frecuencia de uso
        sugerencias.sort((a, b) => b.frecuencia_uso - a.frecuencia_uso);

        // Calcular confianza basada en cantidad de datos
        const confidence = Math.min(0.95, 0.5 + (similarOrders.length / 100));

        return {
            success: true,
            materiales_sugeridos: sugerencias,
            confidence: Math.round(confidence * 100) / 100,
            ordenes_analizadas: similarOrders.length,
            tipo_trabajo,
            message: `Análisis basado en ${similarOrders.length} trabajos similares`,
        };
    }

    private async findSimilarOrders(tipo_trabajo: string, cliente?: string): Promise<OrderDocument[]> {
        const query: any = {
            tipo_trabajo,
            estado: { $in: ['finalizada', 'cerrada'] },
            materiales_utilizados: { $exists: true, $ne: [] },
        };

        if (cliente) {
            query.cliente = { $regex: cliente, $options: 'i' };
        }

        return this.orderModel
            .find(query)
            .populate('materiales_utilizados.material_id')
            .sort({ fecha_creacion: -1 })
            .limit(50)
            .exec();
    }

    async getAIStats(): Promise<any> {
        const totalPredictions = await this.aiPredictionModel.countDocuments();
        const totalOrders = await this.orderModel.countDocuments();
        const ordersWithMaterials = await this.orderModel.countDocuments({
            materiales_utilizados: { $exists: true, $ne: [] },
        });

        // Estadísticas por tipo de trabajo
        const ordersByType = await this.orderModel.aggregate([
            {
                $group: {
                    _id: '$tipo_trabajo',
                    count: { $sum: 1 },
                    avg_materials: {
                        $avg: { $size: { $ifNull: ['$materiales_utilizados', []] } },
                    },
                },
            },
        ]);

        // Top materiales más usados
        const topMaterials = await this.orderModel.aggregate([
            { $unwind: '$materiales_utilizados' },
            {
                $group: {
                    _id: '$materiales_utilizados.material_id',
                    total_usado: { $sum: '$materiales_utilizados.cantidad' },
                    veces_usado: { $sum: 1 },
                },
            },
            { $sort: { veces_usado: -1 } },
            { $limit: 10 },
        ]);

        // Poblar información de materiales
        const materialIds = topMaterials.map(m => m._id);
        const materials = await this.materialModel.find({ _id: { $in: materialIds } }).exec();
        const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

        const topMaterialsWithInfo = topMaterials.map(m => ({
            material_id: m._id,
            nombre: materialMap.get(m._id.toString())?.nombre || 'Desconocido',
            categoria: materialMap.get(m._id.toString())?.categoria || 'N/A',
            total_usado: m.total_usado,
            veces_usado: m.veces_usado,
        }));

        return {
            total_predictions: totalPredictions,
            total_orders: totalOrders,
            orders_with_materials: ordersWithMaterials,
            data_coverage: totalOrders > 0 ? Math.round((ordersWithMaterials / totalOrders) * 100) : 0,
            orders_by_type: ordersByType,
            top_materials: topMaterialsWithInfo,
        };
    }

    async findAll(filters: any = {}): Promise<AiPredictionDocument[]> {
        return this.aiPredictionModel
            .find(filters)
            .sort({ timestamp: -1 })
            .exec();
    }

    async findById(id: string): Promise<AiPredictionDocument> {
        return this.aiPredictionModel.findById(id).exec();
    }

    async labelPrediction(id: string, label: string): Promise<AiPredictionDocument> {
        return this.aiPredictionModel
            .findByIdAndUpdate(id, { label_after: label }, { new: true })
            .exec();
    }
}
