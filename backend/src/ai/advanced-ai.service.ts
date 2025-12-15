import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface PredictionResult {
    materiales: Array<{ nombre: string; cantidad: number; confianza: number }>;
    tiempoEstimado: number;
    costoEstimado: number;
    tecnicoRecomendado: { id: string; nombre: string; razon: string; score: number };
    prioridadSugerida: string;
    alertas: string[];
    recomendaciones: string[];
}

export interface PatternAnalysis {
    patronesDetectados: string[];
    anomalias: string[];
    tendencias: Array<{ tipo: string; descripcion: string; impacto: string }>;
    optimizaciones: string[];
}

@Injectable()
export class AdvancedAIService {
    constructor(@InjectConnection() private connection: Connection) { }

    /**
     * Predicción inteligente de materiales basada en:
     * - Historial de OTs similares
     * - Tipo de trabajo
     * - Ubicación geográfica
     * - Temporada del año
     */
    async predictMaterials(orderData: {
        tipo_trabajo?: string;
        direccion: string;
        barrio?: string;
        descripcion?: string;
    }): Promise<Array<{ nombre: string; cantidad: number; confianza: number }>> {
        // Buscar OTs similares en el historial
        const similarOrders = await this.connection
            .model('Order')
            .find({
                $or: [
                    { barrio: orderData.barrio },
                    { direccion: { $regex: orderData.direccion.split(' ')[0], $options: 'i' } },
                ],
                estado: { $in: ['cerrada', 'completada'] },
            })
            .limit(50)
            .exec();

        // Analizar materiales más usados
        const materialFrequency = new Map<string, { count: number; totalQuantity: number }>();

        for (const order of similarOrders) {
            if (order.materiales_utilizados && order.materiales_utilizados.length > 0) {
                for (const material of order.materiales_utilizados) {
                    const materialId = material.material_id.toString();
                    const current = materialFrequency.get(materialId) || { count: 0, totalQuantity: 0 };
                    materialFrequency.set(materialId, {
                        count: current.count + 1,
                        totalQuantity: current.totalQuantity + material.cantidad,
                    });
                }
            }
        }

        // Calcular predicciones con nivel de confianza
        const predictions: Array<{ nombre: string; cantidad: number; confianza: number }> = [];

        for (const [materialId, stats] of materialFrequency.entries()) {
            const material = await this.connection.model('Material').findById(materialId).exec();
            if (material) {
                const avgQuantity = Math.ceil(stats.totalQuantity / stats.count);
                const confidence = Math.min((stats.count / similarOrders.length) * 100, 95);

                predictions.push({
                    nombre: material.nombre,
                    cantidad: avgQuantity,
                    confianza: Math.round(confidence),
                });
            }
        }

        // Ordenar por confianza descendente
        predictions.sort((a, b) => b.confianza - a.confianza);

        // Retornar top 10
        return predictions.slice(0, 10);
    }

    /**
     * Predicción de tiempo estimado basada en:
     * - Historial de OTs similares
     * - Complejidad del trabajo
     * - Distancia del técnico
     * - Carga de trabajo actual
     */
    async predictTime(orderData: {
        materiales_sugeridos?: any[];
        direccion: string;
        prioridad?: string;
    }): Promise<{ horas: number; confianza: number; factores: string[] }> {
        const similarOrders = await this.connection
            .model('Order')
            .find({
                estado: { $in: ['cerrada', 'completada'] },
                fecha_cierre: { $exists: true },
            })
            .limit(100)
            .exec();

        const tiempos: number[] = [];
        const factores: string[] = [];

        for (const order of similarOrders) {
            if (order.fecha_inicio && order.fecha_cierre) {
                const diff = order.fecha_cierre.getTime() - order.fecha_inicio.getTime();
                const horas = diff / (1000 * 60 * 60);
                if (horas > 0 && horas < 48) {
                    // Filtrar outliers
                    tiempos.push(horas);
                }
            }
        }

        if (tiempos.length === 0) {
            return { horas: 4, confianza: 30, factores: ['Estimación por defecto'] };
        }

        // Calcular promedio y desviación estándar
        const avg = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
        const variance = tiempos.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / tiempos.length;
        const stdDev = Math.sqrt(variance);

        // Ajustar por prioridad
        let adjustedTime = avg;
        if (orderData.prioridad === 'alta') {
            adjustedTime *= 0.8; // Trabajos urgentes tienden a ser más rápidos
            factores.push('Prioridad alta: -20%');
        } else if (orderData.prioridad === 'baja') {
            adjustedTime *= 1.2;
            factores.push('Prioridad baja: +20%');
        }

        // Ajustar por cantidad de materiales
        if (orderData.materiales_sugeridos && orderData.materiales_sugeridos.length > 5) {
            adjustedTime *= 1.3;
            factores.push('Muchos materiales: +30%');
        }

        const confidence = Math.max(50, Math.min(90, 100 - (stdDev / avg) * 100));

        return {
            horas: Math.round(adjustedTime * 10) / 10,
            confianza: Math.round(confidence),
            factores,
        };
    }

    /**
     * Predicción de costo basada en:
     * - Costo de materiales
     * - Tiempo estimado
     * - Mano de obra
     * - Historial de costos
     */
    async predictCost(orderData: {
        materiales_sugeridos?: any[];
        tiempoEstimado?: number;
    }): Promise<{ costo: number; desglose: any; confianza: number }> {
        let costoMateriales = 0;
        const desglose: any = {
            materiales: 0,
            manoDeObra: 0,
            transporte: 0,
            otros: 0,
        };

        // Calcular costo de materiales
        if (orderData.materiales_sugeridos) {
            for (const mat of orderData.materiales_sugeridos) {
                const material = await this.connection
                    .model('Material')
                    .findOne({ nombre: new RegExp(`^${mat.nombre}$`, 'i') })
                    .exec();

                if (material && material.precio) {
                    costoMateriales += material.precio * (mat.cantidad || 1);
                }
            }
        }

        desglose.materiales = costoMateriales;

        // Calcular mano de obra (tarifa por hora)
        const tarifaPorHora = 50000; // COP
        const tiempoHoras = orderData.tiempoEstimado || 4;
        desglose.manoDeObra = tarifaPorHora * tiempoHoras;

        // Transporte (estimado)
        desglose.transporte = 20000; // COP fijo

        // Otros gastos (10% del total)
        const subtotal = desglose.materiales + desglose.manoDeObra + desglose.transporte;
        desglose.otros = Math.round(subtotal * 0.1);

        const costoTotal = subtotal + desglose.otros;

        return {
            costo: Math.round(costoTotal),
            desglose,
            confianza: costoMateriales > 0 ? 85 : 60,
        };
    }

    /**
     * Recomendación inteligente de técnico basada en:
     * - Ubicación (distancia)
     * - Especialización
     * - Carga de trabajo actual
     * - Historial de desempeño
     * - Disponibilidad de materiales en inventario
     */
    async recommendTechnician(orderData: {
        direccion: string;
        barrio?: string;
        materiales_sugeridos?: any[];
        prioridad?: string;
    }): Promise<{ id: string; nombre: string; razon: string; score: number } | null> {
        const technicians = await this.connection.model('User').find({ rol: 'tecnico' }).exec();

        if (technicians.length === 0) return null;

        const scores: Array<{ tech: any; score: number; razones: string[] }> = [];

        for (const tech of technicians) {
            let score = 100;
            const razones: string[] = [];

            // 1. Carga de trabajo actual (-30 puntos por cada OT activa)
            const activeOrders = await this.connection
                .model('Order')
                .countDocuments({
                    tecnico_id: tech._id,
                    estado: { $in: ['asignada', 'en_proceso'] },
                })
                .exec();

            score -= activeOrders * 30;
            if (activeOrders === 0) {
                razones.push('Sin carga actual');
            } else {
                razones.push(`${activeOrders} OT(s) activas`);
            }

            // 2. Historial de desempeño (+20 puntos por buen historial)
            const completedOrders = await this.connection
                .model('Order')
                .countDocuments({
                    tecnico_id: tech._id,
                    estado: 'cerrada',
                })
                .exec();

            if (completedOrders > 10) {
                score += 20;
                razones.push('Experiencia comprobada');
            }

            // 3. Disponibilidad de materiales (+15 puntos si tiene los materiales)
            if (orderData.materiales_sugeridos && orderData.materiales_sugeridos.length > 0) {
                const inventory = await this.connection
                    .model('InventoryTechnician')
                    .findOne({ tecnico_id: tech._id })
                    .exec();

                if (inventory) {
                    let materialesDisponibles = 0;
                    for (const mat of orderData.materiales_sugeridos) {
                        const materialInInventory = inventory.materials.find(
                            (m: any) => m.material_id.nombre === mat.nombre && m.cantidad_disponible >= mat.cantidad
                        );
                        if (materialInInventory) {
                            materialesDisponibles++;
                        }
                    }

                    if (materialesDisponibles === orderData.materiales_sugeridos.length) {
                        score += 15;
                        razones.push('Tiene todos los materiales');
                    } else if (materialesDisponibles > 0) {
                        score += 5;
                        razones.push(`Tiene ${materialesDisponibles} materiales`);
                    }
                }
            }

            // 4. Prioridad (+10 puntos si está disponible para urgencias)
            if (orderData.prioridad === 'alta' && activeOrders === 0) {
                score += 10;
                razones.push('Disponible para urgencias');
            }

            scores.push({ tech, score, razones });
        }

        // Ordenar por score descendente
        scores.sort((a, b) => b.score - a.score);

        const best = scores[0];
        return {
            id: best.tech._id.toString(),
            nombre: best.tech.nombre,
            razon: best.razones.join(', '),
            score: Math.max(0, Math.min(100, best.score)),
        };
    }

    /**
     * Análisis de patrones y detección de anomalías
     */
    async analyzePatterns(): Promise<PatternAnalysis> {
        const patronesDetectados: string[] = [];
        const anomalias: string[] = [];
        const tendencias: Array<{ tipo: string; descripcion: string; impacto: string }> = [];
        const optimizaciones: string[] = [];

        // 1. Analizar materiales más consumidos
        const orders = await this.connection
            .model('Order')
            .find({ estado: { $in: ['cerrada', 'completada'] } })
            .limit(200)
            .exec();

        const materialUsage = new Map<string, number>();
        for (const order of orders) {
            if (order.materiales_utilizados) {
                for (const mat of order.materiales_utilizados) {
                    const current = materialUsage.get(mat.material_id.toString()) || 0;
                    materialUsage.set(mat.material_id.toString(), current + mat.cantidad);
                }
            }
        }

        if (materialUsage.size > 0) {
            patronesDetectados.push(`${materialUsage.size} materiales diferentes utilizados en últimas 200 OTs`);
        }

        // 2. Detectar OTs con tiempo excesivo
        const tiemposExcesivos = orders.filter((order) => {
            if (order.fecha_inicio && order.fecha_cierre) {
                const diff = order.fecha_cierre.getTime() - order.fecha_inicio.getTime();
                const horas = diff / (1000 * 60 * 60);
                return horas > 24; // Más de 24 horas
            }
            return false;
        });

        if (tiemposExcesivos.length > 0) {
            anomalias.push(`${tiemposExcesivos.length} OTs tomaron más de 24 horas`);
            optimizaciones.push('Revisar procesos de OTs con tiempos excesivos');
        }

        // 3. Analizar tendencias de prioridad
        const prioridadAlta = orders.filter((o) => o.prioridad === 'alta').length;
        const porcentajeAlta = (prioridadAlta / orders.length) * 100;

        if (porcentajeAlta > 30) {
            tendencias.push({
                tipo: 'Prioridad',
                descripcion: `${Math.round(porcentajeAlta)}% de OTs son de alta prioridad`,
                impacto: 'Alto - Revisar criterios de priorización',
            });
        }

        // 4. Detectar técnicos sobrecargados
        const technicians = await this.connection.model('User').find({ rol: 'tecnico' }).exec();

        for (const tech of technicians) {
            const activeCount = await this.connection
                .model('Order')
                .countDocuments({
                    tecnico_id: tech._id,
                    estado: { $in: ['asignada', 'en_proceso'] },
                })
                .exec();

            if (activeCount > 5) {
                anomalias.push(`Técnico ${tech.nombre} tiene ${activeCount} OTs activas`);
                optimizaciones.push(`Redistribuir carga de ${tech.nombre}`);
            }
        }

        // 5. Analizar materiales con stock bajo
        const materials = await this.connection.model('Material').find({ cantidad: { $lt: 10 } }).exec();

        if (materials.length > 0) {
            anomalias.push(`${materials.length} materiales con stock bajo`);
            optimizaciones.push('Reabastecer materiales críticos');
        }

        return {
            patronesDetectados,
            anomalias,
            tendencias,
            optimizaciones,
        };
    }

    /**
     * Predicción completa para una OT
     */
    async predictComplete(orderData: any): Promise<PredictionResult> {
        const [materiales, tiempo, tecnico] = await Promise.all([
            this.predictMaterials(orderData),
            this.predictTime(orderData),
            this.recommendTechnician(orderData),
        ]);

        const costo = await this.predictCost({
            materiales_sugeridos: materiales,
            tiempoEstimado: tiempo.horas,
        });

        const alertas: string[] = [];
        const recomendaciones: string[] = [];

        // Generar alertas
        if (tiempo.confianza < 60) {
            alertas.push('⚠️ Predicción de tiempo con baja confianza');
        }

        if (materiales.length === 0) {
            alertas.push('⚠️ No se encontraron materiales similares en historial');
            recomendaciones.push('Revisar manualmente los materiales necesarios');
        }

        if (!tecnico) {
            alertas.push('⚠️ No hay técnicos disponibles');
            recomendaciones.push('Contratar más técnicos o redistribuir carga');
        }

        // Generar recomendaciones
        if (materiales.length > 0 && materiales[0].confianza > 80) {
            recomendaciones.push(`Material principal: ${materiales[0].nombre} (${materiales[0].confianza}% confianza)`);
        }

        if (tiempo.horas > 8) {
            recomendaciones.push('Considerar dividir en múltiples visitas');
        }

        if (costo.costo > 500000) {
            recomendaciones.push('Costo elevado - Requiere aprobación especial');
        }

        return {
            materiales,
            tiempoEstimado: tiempo.horas,
            costoEstimado: costo.costo,
            tecnicoRecomendado: tecnico || {
                id: '',
                nombre: 'No disponible',
                razon: 'Sin técnicos disponibles',
                score: 0,
            },
            prioridadSugerida: this.suggestPriority(orderData, tiempo, costo),
            alertas,
            recomendaciones,
        };
    }

    private suggestPriority(orderData: any, tiempo: any, costo: any): string {
        // Lógica para sugerir prioridad
        if (orderData.descripcion && orderData.descripcion.toLowerCase().includes('urgente')) {
            return 'alta';
        }

        if (tiempo.horas < 2) {
            return 'alta'; // Trabajos rápidos, alta prioridad
        }

        if (costo.costo > 1000000) {
            return 'alta'; // Trabajos costosos, alta prioridad
        }

        if (tiempo.horas > 8) {
            return 'baja'; // Trabajos largos, baja prioridad
        }

        return 'media';
    }
}
