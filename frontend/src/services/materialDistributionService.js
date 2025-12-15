import api from './api';

class MaterialDistributionService {
    // Asignar materiales a un técnico (bodeguero)
    async asignarMateriales(asignacionData) {
        try {
            const response = await api.post('/material-distribution/asignar', asignacionData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error asignando materiales');
        }
    }

    // Iniciar trabajo (técnico)
    async iniciarTrabajo(controlId) {
        try {
            const response = await api.post(`/material-distribution/iniciar-trabajo/${controlId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error iniciando trabajo');
        }
    }

    // Devolver materiales (técnico)
    async devolverMateriales(devolucionData) {
        try {
            const response = await api.post('/material-distribution/devolver', devolucionData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error procesando devolución');
        }
    }

    // Obtener controles pendientes
    async getControlesPendientes(tecnicoId = null) {
        try {
            const url = tecnicoId
                ? `/material-distribution/controles-pendientes?tecnico_id=${tecnicoId}`
                : '/material-distribution/controles-pendientes';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo controles');
        }
    }

    // Obtener mis asignaciones (técnico)
    async getMisAsignaciones() {
        try {
            const response = await api.get('/material-distribution/mis-asignaciones');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo asignaciones');
        }
    }

    // Obtener descuadres (analista)
    async getDescuadres(resueltos = false) {
        try {
            const response = await api.get(`/material-distribution/descuadres?resueltos=${resueltos}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo descuadres');
        }
    }

    // Resolver descuadre (analista)
    async resolverDescuadre(controlId, observaciones) {
        try {
            const response = await api.put(`/material-distribution/resolver-descuadre/${controlId}`, {
                observaciones
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error resolviendo descuadre');
        }
    }

    // Obtener estadísticas
    async getEstadisticas() {
        try {
            const response = await api.get('/material-distribution/estadisticas');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
        }
    }

    // Obtener control por ID
    async getControlById(controlId) {
        try {
            const response = await api.get(`/material-distribution/control/${controlId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo control');
        }
    }

    // Obtener historial de un técnico
    async getHistorialTecnico(tecnicoId) {
        try {
            const response = await api.get(`/material-distribution/historial/${tecnicoId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo historial');
        }
    }

    // Obtener resumen de materiales por técnico
    async getResumenMaterialesTecnico(tecnicoId) {
        try {
            const controles = await this.getHistorialTecnico(tecnicoId);

            // Procesar datos para crear resumen
            const resumen = {
                total_asignaciones: controles.length,
                asignaciones_activas: controles.filter(c =>
                    ['asignado', 'en_trabajo', 'trabajo_completado', 'devolucion_pendiente'].includes(c.estado_general)
                ).length,
                descuadres_totales: controles.filter(c => c.tiene_descuadre).length,
                valor_total_descuadres: controles
                    .filter(c => c.tiene_descuadre)
                    .reduce((sum, c) => sum + c.valor_descuadre, 0),
                materiales_mas_utilizados: this.calcularMaterialesMasUtilizados(controles),
                eficiencia_promedio: this.calcularEficienciaPromedio(controles)
            };

            return resumen;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error generando resumen');
        }
    }

    // Calcular materiales más utilizados
    calcularMaterialesMasUtilizados(controles) {
        const materialesUtilizados = {};

        controles.forEach(control => {
            control.materiales_asignados.forEach(material => {
                const materialId = material.material_id._id || material.material_id;
                const materialNombre = material.material_id.nombre || 'Material desconocido';

                if (!materialesUtilizados[materialId]) {
                    materialesUtilizados[materialId] = {
                        nombre: materialNombre,
                        cantidad_total_asignada: 0,
                        cantidad_total_utilizada: 0,
                        cantidad_total_devuelta: 0,
                        cantidad_total_perdida: 0,
                        veces_asignado: 0
                    };
                }

                materialesUtilizados[materialId].cantidad_total_asignada += material.cantidad_asignada;
                materialesUtilizados[materialId].cantidad_total_utilizada += material.cantidad_utilizada || 0;
                materialesUtilizados[materialId].cantidad_total_devuelta += material.cantidad_devuelta || 0;
                materialesUtilizados[materialId].cantidad_total_perdida += material.cantidad_perdida || 0;
                materialesUtilizados[materialId].veces_asignado += 1;
            });
        });

        // Convertir a array y ordenar por cantidad utilizada
        return Object.values(materialesUtilizados)
            .sort((a, b) => b.cantidad_total_utilizada - a.cantidad_total_utilizada)
            .slice(0, 10); // Top 10
    }

    // Calcular eficiencia promedio
    calcularEficienciaPromedio(controles) {
        const controlesCompletados = controles.filter(c =>
            c.estado_general === 'devolucion_completada' || c.estado_general === 'cerrado'
        );

        if (controlesCompletados.length === 0) return 0;

        let eficienciaTotal = 0;

        controlesCompletados.forEach(control => {
            let materialesTotalesAsignados = 0;
            let materialesUtilizados = 0;

            control.materiales_asignados.forEach(material => {
                materialesTotalesAsignados += material.cantidad_asignada;
                materialesUtilizados += material.cantidad_utilizada || 0;
            });

            if (materialesTotalesAsignados > 0) {
                eficienciaTotal += (materialesUtilizados / materialesTotalesAsignados) * 100;
            }
        });

        return eficienciaTotal / controlesCompletados.length;
    }

    // Obtener alertas de materiales
    async getAlertasMateriales() {
        try {
            const [controles, descuadres] = await Promise.all([
                this.getControlesPendientes(),
                this.getDescuadres(false)
            ]);

            const alertas = [];

            // Alertas por controles vencidos (más de 24 horas asignados sin iniciar)
            const ahora = new Date();
            controles.forEach(control => {
                if (control.estado_general === 'asignado') {
                    const fechaAsignacion = new Date(control.fecha_asignacion);
                    const horasTranscurridas = (ahora - fechaAsignacion) / (1000 * 60 * 60);

                    if (horasTranscurridas > 24) {
                        alertas.push({
                            tipo: 'control_vencido',
                            mensaje: `Control ${control._id} lleva más de 24 horas sin iniciar`,
                            tecnico: control.tecnico_id.nombre,
                            control_id: control._id,
                            prioridad: 'alta'
                        });
                    }
                }
            });

            // Alertas por descuadres
            descuadres.forEach(descuadre => {
                alertas.push({
                    tipo: 'descuadre',
                    mensaje: `Descuadre de $${descuadre.valor_descuadre.toFixed(2)} pendiente de resolución`,
                    tecnico: descuadre.tecnico_id.nombre,
                    control_id: descuadre._id,
                    prioridad: descuadre.valor_descuadre > 100000 ? 'alta' : 'media'
                });
            });

            return alertas;
        } catch (error) {
            throw new Error('Error obteniendo alertas de materiales');
        }
    }
}

export const materialDistributionService = new MaterialDistributionService();