import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { MovimientoInventario } from '../schemas/movimiento-inventario.schema';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(MovimientoInventario.name) private movimientoModel: Model<MovimientoInventario>,
    ) { }

    async getPolizaReport(polizaNumber: string) {
        const orders = await this.orderModel
            .find({ poliza_number: polizaNumber })
            .populate('tecnico_id', 'nombre email')
            .populate('creado_por', 'nombre email')
            .exec();

        const totalConsumos = orders.reduce((acc, order) => {
            order.materiales_utilizados?.forEach((material) => {
                const existing = acc.find((c) => c.material_id.toString() === material.material_id.toString());
                if (existing) {
                    existing.cantidad += material.cantidad;
                } else {
                    acc.push({
                        material_id: material.material_id,
                        cantidad: material.cantidad,
                        unidad: material.unidad,
                    });
                }
            });
            return acc;
        }, []);

        return {
            poliza_number: polizaNumber,
            total_ots: orders.length,
            ots: orders,
            total_consumos: totalConsumos,
        };
    }

    async getTechConsumption(techId: string, from: string, to: string) {
        const filters: any = { tecnico_id: techId };

        if (from || to) {
            filters.fecha = {};
            if (from) filters.fecha.$gte = new Date(from);
            if (to) filters.fecha.$lte = new Date(to);
        }

        const movimientos = await this.movimientoModel
            .find(filters)
            .populate('material_id', 'nombre codigo')
            .sort({ fecha: -1 })
            .exec();

        const resumen = movimientos.reduce((acc, mov) => {
            const key = mov.material_id.toString();
            if (!acc[key]) {
                acc[key] = {
                    material_id: mov.material_id,
                    total_consumido: 0,
                    total_devuelto: 0,
                };
            }

            if (mov.tipo === 'consumo') {
                acc[key].total_consumido += mov.cantidad;
            } else if (mov.tipo === 'devolucion') {
                acc[key].total_devuelto += mov.cantidad;
            }

            return acc;
        }, {});

        return {
            tecnico_id: techId,
            periodo: { from, to },
            movimientos,
            resumen: Object.values(resumen),
        };
    }
}
