import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MaterialRequest, MaterialRequestDocument } from '../schemas/material-request.schema';
import { MaterialLearningService } from '../ai/material-learning.service';
import { Material, MaterialDocument } from '../schemas/material.schema';

@Injectable()
export class MaterialRequestService {
    constructor(
        @InjectModel(MaterialRequest.name)
        private requestModel: Model<MaterialRequestDocument>,
        @InjectModel(Material.name)
        private materialModel: Model<MaterialDocument>,
        private materialLearningService: MaterialLearningService,
    ) { }

    /**
     * Crear una nueva solicitud de materiales
     */
    async crearSolicitud(tecnicoId: string, materiales: Array<{
        material_id: string;
        cantidad_solicitada: number;
        motivo?: string;
        tipo_trabajo_estimado?: string;
    }>) {
        const solicitud = new this.requestModel({
            tecnico_id: tecnicoId,
            fecha_solicitud: new Date(),
            estado: 'pendiente',
            materiales_solicitados: materiales,
            es_sugerencia_ia: false
        });

        return await solicitud.save();
    }

    /**
     * Generar solicitud automática basada en tipo de trabajo
     */
    async generarSolicitudInteligente(tecnicoId: string, tipoTrabajo: string, factorSeguridad: number = 1.2) {
        const sugerencias = await this.materialLearningService.generarSugerenciasMateriales(tipoTrabajo, factorSeguridad);

        if (sugerencias.sugerencias.length === 0) {
            return {
                success: false,
                message: 'No hay patrones suficientes para este tipo de trabajo'
            };
        }

        const materialesSugeridos = sugerencias.sugerencias
            .filter(s => s.disponible && s.confianza > 0.3) // Solo materiales disponibles y con confianza mínima
            .map(s => ({
                material_id: s.material.id,
                cantidad_solicitada: s.cantidad_sugerida,
                motivo: `Sugerencia IA basada en ${s.total_trabajos} trabajos similares`,
                tipo_trabajo_estimado: tipoTrabajo
            }));

        if (materialesSugeridos.length === 0) {
            return {
                success: false,
                message: 'No hay materiales disponibles para las sugerencias'
            };
        }

        const solicitud = new this.requestModel({
            tecnico_id: tecnicoId,
            fecha_solicitud: new Date(),
            estado: 'pendiente',
            materiales_solicitados: materialesSugeridos,
            es_sugerencia_ia: true,
            observaciones: `Solicitud generada automáticamente para trabajo tipo: ${tipoTrabajo}. Confianza promedio: ${(sugerencias.confianza_promedio * 100).toFixed(1)}%`
        });

        const solicitudGuardada = await solicitud.save();

        return {
            success: true,
            solicitud: solicitudGuardada,
            sugerencias_detalle: sugerencias
        };
    }

    /**
     * Aprobar una solicitud de materiales
     */
    async aprobarSolicitud(solicitudId: string, aprobadoPor: string, ajustes?: Array<{
        material_id: string;
        cantidad_aprobada: number;
    }>) {
        const solicitud = await this.requestModel.findById(solicitudId);

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        // Aplicar ajustes si se proporcionan
        if (ajustes) {
            for (const ajuste of ajustes) {
                const material = solicitud.materiales_solicitados.find(
                    m => m.material_id.toString() === ajuste.material_id
                );
                if (material) {
                    material.cantidad_aprobada = ajuste.cantidad_aprobada;
                }
            }
        } else {
            // Si no hay ajustes, aprobar las cantidades solicitadas
            solicitud.materiales_solicitados.forEach(material => {
                material.cantidad_aprobada = material.cantidad_solicitada;
            });
        }

        solicitud.estado = 'aprobada';
        solicitud.aprobado_por = aprobadoPor as any;
        solicitud.fecha_aprobacion = new Date();

        return await solicitud.save();
    }

    /**
     * Marcar solicitud como entregada
     */
    async marcarComoEntregada(solicitudId: string) {
        return await this.requestModel.findByIdAndUpdate(
            solicitudId,
            { estado: 'entregada' },
            { new: true }
        );
    }

    /**
     * Obtener solicitudes pendientes
     */
    async obtenerSolicitudesPendientes() {
        return await this.requestModel
            .find({ estado: 'pendiente' })
            .populate('tecnico_id', 'nombre email')
            .populate('materiales_solicitados.material_id', 'nombre unidad_medida stock_actual')
            .sort({ fecha_solicitud: -1 });
    }

    /**
     * Obtener solicitudes de un técnico
     */
    async obtenerSolicitudesTecnico(tecnicoId: string, limite: number = 20) {
        return await this.requestModel
            .find({ tecnico_id: tecnicoId })
            .populate('materiales_solicitados.material_id', 'nombre unidad_medida')
            .populate('aprobado_por', 'nombre')
            .sort({ fecha_solicitud: -1 })
            .limit(limite);
    }

    /**
     * Obtener estadísticas de solicitudes
     */
    async obtenerEstadisticasSolicitudes() {
        const totalSolicitudes = await this.requestModel.countDocuments();
        const solicitudesPendientes = await this.requestModel.countDocuments({ estado: 'pendiente' });
        const solicitudesAprobadas = await this.requestModel.countDocuments({ estado: 'aprobada' });
        const solicitudesEntregadas = await this.requestModel.countDocuments({ estado: 'entregada' });
        const solicitudesIA = await this.requestModel.countDocuments({ es_sugerencia_ia: true });

        // Materiales más solicitados
        const materialesMasSolicitados = await this.requestModel.aggregate([
            { $unwind: '$materiales_solicitados' },
            {
                $group: {
                    _id: '$materiales_solicitados.material_id',
                    total_solicitado: { $sum: '$materiales_solicitados.cantidad_solicitada' },
                    total_aprobado: { $sum: '$materiales_solicitados.cantidad_aprobada' },
                    veces_solicitado: { $sum: 1 }
                }
            },
            { $sort: { total_solicitado: -1 } },
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

        // Técnicos que más solicitan
        const tecnicosMasSolicitan = await this.requestModel.aggregate([
            {
                $group: {
                    _id: '$tecnico_id',
                    total_solicitudes: { $sum: 1 },
                    solicitudes_ia: { $sum: { $cond: ['$es_sugerencia_ia', 1, 0] } }
                }
            },
            { $sort: { total_solicitudes: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tecnico'
                }
            }
        ]);

        return {
            resumen: {
                total_solicitudes: totalSolicitudes,
                pendientes: solicitudesPendientes,
                aprobadas: solicitudesAprobadas,
                entregadas: solicitudesEntregadas,
                generadas_por_ia: solicitudesIA,
                porcentaje_ia: totalSolicitudes > 0 ? (solicitudesIA / totalSolicitudes) * 100 : 0
            },
            materiales_mas_solicitados: materialesMasSolicitados,
            tecnicos_mas_solicitan: tecnicosMasSolicitan,
            timestamp: new Date()
        };
    }

    /**
     * Comparar solicitud con patrones aprendidos
     */
    async compararConPatrones(solicitudId: string) {
        const solicitud = await this.requestModel
            .findById(solicitudId)
            .populate('materiales_solicitados.material_id', 'nombre');

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        const comparaciones = [];

        for (const material of solicitud.materiales_solicitados) {
            if (material.tipo_trabajo_estimado) {
                const sugerencias = await this.materialLearningService.generarSugerenciasMateriales(
                    material.tipo_trabajo_estimado
                );

                const sugerencia = sugerencias.sugerencias.find(
                    s => s.material.id.toString() === material.material_id.toString()
                );

                if (sugerencia) {
                    comparaciones.push({
                        material: material.material_id,
                        cantidad_solicitada: material.cantidad_solicitada,
                        cantidad_sugerida: sugerencia.cantidad_sugerida,
                        diferencia: material.cantidad_solicitada - sugerencia.cantidad_sugerida,
                        diferencia_porcentual: ((material.cantidad_solicitada - sugerencia.cantidad_sugerida) / sugerencia.cantidad_sugerida) * 100,
                        confianza_patron: sugerencia.confianza,
                        recomendacion: this.generarRecomendacion(material.cantidad_solicitada, sugerencia)
                    });
                }
            }
        }

        return {
            solicitud_id: solicitudId,
            comparaciones,
            timestamp: new Date()
        };
    }

    private generarRecomendacion(cantidadSolicitada: number, sugerencia: any): string {
        const diferencia = cantidadSolicitada - sugerencia.cantidad_sugerida;
        const porcentaje = Math.abs(diferencia / sugerencia.cantidad_sugerida) * 100;

        if (Math.abs(diferencia) <= 1) {
            return 'Cantidad apropiada según patrones históricos';
        } else if (diferencia > 0) {
            if (porcentaje > 50) {
                return `Cantidad excesiva. Considera reducir a ${sugerencia.cantidad_sugerida} unidades`;
            } else {
                return 'Cantidad ligeramente alta, pero dentro del rango aceptable';
            }
        } else {
            if (porcentaje > 30) {
                return `Cantidad baja. Considera aumentar a ${sugerencia.cantidad_sugerida} unidades`;
            } else {
                return 'Cantidad conservadora, pero aceptable';
            }
        }
    }
}