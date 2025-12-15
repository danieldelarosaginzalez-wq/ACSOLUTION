import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MaterialConsumptionPattern, MaterialConsumptionPatternDocument } from '../schemas/material-consumption-pattern.schema';
import { MaterialControl, MaterialControlDocument } from '../schemas/material-control.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Material, MaterialDocument } from '../schemas/material.schema';

@Injectable()
export class MaterialLearningService {
    constructor(
        @InjectModel(MaterialConsumptionPattern.name)
        private patternModel: Model<MaterialConsumptionPatternDocument>,
        @InjectModel(MaterialControl.name)
        private controlModel: Model<MaterialControlDocument>,
        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,
        @InjectModel(Material.name)
        private materialModel: Model<MaterialDocument>,
    ) { }

    /**
     * Aprende de un trabajo completado y actualiza los patrones
     */
    async aprenderDeTrabajoCompletado(ordenId: string, tipoTrabajo: string) {
        try {
            // Buscar el control de materiales de esta orden
            const control = await this.controlModel
                .findOne({ orden_trabajo_id: ordenId })
                .populate('materiales_asignados.material_id')
                .lean();

            if (!control || !control.materiales_asignados) {
                return { success: false, message: 'No se encontraron materiales asignados' };
            }

            // Procesar cada material utilizado
            for (const materialAsignado of control.materiales_asignados) {
                const cantidadUtilizada = materialAsignado.cantidad_utilizada || 0;

                if (cantidadUtilizada > 0) {
                    await this.actualizarPatron(
                        tipoTrabajo,
                        materialAsignado.material_id as any,
                        cantidadUtilizada
                    );
                }
            }

            return { success: true, message: 'Patrones actualizados correctamente' };
        } catch (error) {
            console.error('Error aprendiendo de trabajo completado:', error);
            return { success: false, message: 'Error procesando el aprendizaje' };
        }
    }

    /**
     * Actualiza o crea un patrón de consumo
     */
    private async actualizarPatron(tipoTrabajo: string, materialId: string, cantidadUtilizada: number) {
        let patron = await this.patternModel.findOne({
            tipo_trabajo: tipoTrabajo,
            material_id: materialId
        });

        if (!patron) {
            // Crear nuevo patrón
            patron = new this.patternModel({
                tipo_trabajo: tipoTrabajo,
                material_id: materialId,
                cantidad_promedio: cantidadUtilizada,
                cantidad_minima: cantidadUtilizada,
                cantidad_maxima: cantidadUtilizada,
                total_trabajos: 1,
                total_consumo: cantidadUtilizada,
                confianza: 0.1, // Baja confianza al inicio
                historial_consumos: [cantidadUtilizada]
            });
        } else {
            // Actualizar patrón existente
            patron.total_trabajos += 1;
            patron.total_consumo += cantidadUtilizada;
            patron.cantidad_promedio = patron.total_consumo / patron.total_trabajos;

            // Actualizar min/max
            patron.cantidad_minima = Math.min(patron.cantidad_minima, cantidadUtilizada);
            patron.cantidad_maxima = Math.max(patron.cantidad_maxima, cantidadUtilizada);

            // Mantener historial de últimos 20 consumos
            patron.historial_consumos.push(cantidadUtilizada);
            if (patron.historial_consumos.length > 20) {
                patron.historial_consumos.shift();
            }

            // Calcular confianza basada en cantidad de datos y consistencia
            patron.confianza = this.calcularConfianza(patron.historial_consumos, patron.total_trabajos);
            patron.ultima_actualizacion = new Date();
        }

        await patron.save();
    }

    /**
     * Calcula la confianza del patrón basado en consistencia y cantidad de datos
     */
    private calcularConfianza(historial: number[], totalTrabajos: number): number {
        if (totalTrabajos < 3) return Math.min(0.3, totalTrabajos * 0.1);

        // Calcular desviación estándar
        const promedio = historial.reduce((a, b) => a + b, 0) / historial.length;
        const varianza = historial.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / historial.length;
        const desviacionEstandar = Math.sqrt(varianza);

        // Coeficiente de variación (menor = más consistente)
        const coeficienteVariacion = promedio > 0 ? desviacionEstandar / promedio : 1;

        // Confianza basada en consistencia y cantidad de datos
        const confianzaConsistencia = Math.max(0, 1 - coeficienteVariacion);
        const confianzaCantidad = Math.min(1, totalTrabajos / 10); // Máxima confianza con 10+ trabajos

        return Math.min(0.95, (confianzaConsistencia * 0.7) + (confianzaCantidad * 0.3));
    }

    /**
     * Genera sugerencias de materiales para un tipo de trabajo
     */
    async generarSugerenciasMateriales(tipoTrabajo: string, factorSeguridad: number = 1.2) {
        const patrones = await this.patternModel
            .find({ tipo_trabajo: tipoTrabajo })
            .populate('material_id', 'nombre unidad_medida stock_actual stock_minimo')
            .sort({ confianza: -1 });

        const sugerencias = [];

        for (const patron of patrones) {
            const material = patron.material_id as any;

            // Calcular cantidad sugerida con factor de seguridad
            let cantidadSugerida = Math.ceil(patron.cantidad_promedio * factorSeguridad);

            // Ajustar basado en confianza
            if (patron.confianza < 0.5) {
                cantidadSugerida = Math.ceil(patron.cantidad_maxima * factorSeguridad);
            }

            sugerencias.push({
                material: {
                    id: material._id,
                    nombre: material.nombre,
                    unidad_medida: material.unidad_medida,
                    stock_actual: material.stock_actual
                },
                cantidad_sugerida: cantidadSugerida,
                cantidad_promedio: patron.cantidad_promedio,
                confianza: patron.confianza,
                total_trabajos: patron.total_trabajos,
                rango: {
                    minimo: patron.cantidad_minima,
                    maximo: patron.cantidad_maxima
                },
                disponible: material.stock_actual >= cantidadSugerida,
                alerta_stock: material.stock_actual < material.stock_minimo
            });
        }

        return {
            tipo_trabajo: tipoTrabajo,
            sugerencias,
            total_patrones: patrones.length,
            confianza_promedio: patrones.length > 0
                ? patrones.reduce((acc, p) => acc + p.confianza, 0) / patrones.length
                : 0
        };
    }

    /**
     * Obtiene estadísticas de aprendizaje del sistema
     */
    async obtenerEstadisticasAprendizaje() {
        const totalPatrones = await this.patternModel.countDocuments();
        const patronesConfiables = await this.patternModel.countDocuments({ confianza: { $gte: 0.7 } });

        const tiposTrabajoStats = await this.patternModel.aggregate([
            {
                $group: {
                    _id: '$tipo_trabajo',
                    total_patrones: { $sum: 1 },
                    confianza_promedio: { $avg: '$confianza' },
                    total_trabajos: { $sum: '$total_trabajos' }
                }
            },
            { $sort: { total_trabajos: -1 } }
        ]);

        const materialesMasUsados = await this.patternModel.aggregate([
            {
                $group: {
                    _id: '$material_id',
                    total_consumo: { $sum: '$total_consumo' },
                    total_trabajos: { $sum: '$total_trabajos' },
                    tipos_trabajo: { $addToSet: '$tipo_trabajo' }
                }
            },
            { $sort: { total_consumo: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'materials',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'material'
                }
            }
        ]);

        return {
            resumen: {
                total_patrones: totalPatrones,
                patrones_confiables: patronesConfiables,
                porcentaje_confiabilidad: totalPatrones > 0 ? (patronesConfiables / totalPatrones) * 100 : 0
            },
            tipos_trabajo: tiposTrabajoStats,
            materiales_mas_usados: materialesMasUsados,
            timestamp: new Date()
        };
    }

    /**
     * Detecta anomalías en el consumo de materiales
     */
    async detectarAnomalias(ordenId: string, tipoTrabajo: string) {
        const control = await this.controlModel
            .findOne({ orden_trabajo_id: ordenId })
            .populate('materiales_asignados.material_id')
            .lean();

        if (!control) return { anomalias: [] };

        const anomalias = [];

        for (const materialAsignado of control.materiales_asignados) {
            const cantidadUtilizada = materialAsignado.cantidad_utilizada || 0;

            const patron = await this.patternModel.findOne({
                tipo_trabajo: tipoTrabajo,
                material_id: materialAsignado.material_id
            });

            if (patron && cantidadUtilizada > 0) {
                const desviacion = Math.abs(cantidadUtilizada - patron.cantidad_promedio);
                const umbralAnomalia = patron.cantidad_promedio * 0.5; // 50% de desviación

                if (desviacion > umbralAnomalia) {
                    anomalias.push({
                        material: materialAsignado.material_id,
                        cantidad_utilizada: cantidadUtilizada,
                        cantidad_esperada: patron.cantidad_promedio,
                        desviacion_porcentual: (desviacion / patron.cantidad_promedio) * 100,
                        tipo_anomalia: cantidadUtilizada > patron.cantidad_promedio ? 'consumo_excesivo' : 'consumo_bajo',
                        confianza_patron: patron.confianza
                    });
                }
            }
        }

        return { anomalias };
    }
}