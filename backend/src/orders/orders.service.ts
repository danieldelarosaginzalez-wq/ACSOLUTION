import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { PolizasService } from '../polizas/polizas.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectConnection() private connection: Connection,
        private polizasService: PolizasService,
        private inventoryService: InventoryService,
        private auditService: AuditService,
        private alertsService: AlertsService,
        private notificationsService: NotificationsService,
    ) { }

    async create(orderData: any, userId: string): Promise<OrderDocument> {
        // Validar póliza
        const isValidPoliza = await this.polizasService.validate(orderData.poliza_number);
        if (!isValidPoliza) {
            throw new BadRequestException('Póliza inválida o inactiva');
        }

        // 🆕 Obtener ubicación (priorizar la del frontend, luego la de la póliza)
        let ubicacion = orderData.ubicacion || null;

        if (!ubicacion) {
            const poliza = await this.polizasService.findByNumber(orderData.poliza_number);
            if (poliza && poliza.ubicacion) {
                ubicacion = poliza.ubicacion;
            }
        }

        // Generar código único
        const codigo = await this.generateOrderCode();

        const order = new this.orderModel({
            ...orderData,
            codigo,
            analista_id: userId,
            estado: 'creada',
            fecha_creacion: new Date(),
            ubicacion, // 🆕 Heredar ubicación de la póliza
            audit_trail: [{
                actor: userId,
                action: 'OT_CREADA',
                detail: 'Orden de trabajo creada',
                timestamp: new Date(),
            }],
        });

        const savedOrder = await order.save();

        // Registrar en audit logs
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_CREADA',
            detalle: `OT ${codigo} creada`,
            meta: { order_id: savedOrder._id },
        });

        // Notificar a todos los analistas
        const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
        const analystIds = analysts.map(a => a._id.toString()).filter(id => id !== userId);
        if (analystIds.length > 0) {
            await this.notificationsService.notifyOrderCreated(savedOrder, analystIds);
        }

        return savedOrder;
    }

    async assignOrder(orderId: string, assignData: any, userId: string): Promise<OrderDocument> {
        try {
            const order = await this.orderModel.findById(orderId);
            if (!order) {
                throw new NotFoundException('OT no encontrada');
            }

            if (order.estado !== 'creada') {
                throw new BadRequestException('La OT ya fue asignada');
            }

            const { tecnico_id, apartados } = assignData;

            // Asegurar que el técnico tenga inventario inicializado
            await this.inventoryService.createOrGetInventory(tecnico_id);

            // Verificar y apartar materiales
            const apartadosResult = [];
            for (const apartado of apartados) {
                const result = await this.inventoryService.reserveMaterial(
                    tecnico_id,
                    apartado.material_id,
                    apartado.cantidad,
                    `Apartado para OT ${order.codigo}`,
                    orderId,
                    userId,
                );

                apartadosResult.push({
                    material_id: apartado.material_id,
                    cantidad: apartado.cantidad,
                    tecnico_id,
                    reservation_id: result.movimiento_id,
                });
            }

            // Actualizar orden
            order.tecnico_id = new Types.ObjectId(tecnico_id);
            order.estado = 'asignada';
            order.materiales_apartados = apartadosResult;
            order.audit_trail.push({
                actor: new Types.ObjectId(userId),
                action: 'OT_ASIGNADA',
                detail: `OT asignada a técnico ${tecnico_id}`,
                timestamp: new Date(),
            });

            await order.save();

            // Audit log
            await this.auditService.log({
                usuario_id: new Types.ObjectId(userId),
                accion: 'OT_ASIGNADA',
                detalle: `OT ${order.codigo} asignada a técnico`,
                meta: { order_id: orderId, tecnico_id },
            });

            // Notificar al técnico asignado
            const technician = await this.connection.model('User').findById(tecnico_id).exec();
            await this.notificationsService.notifyOrderAssigned(
                order,
                tecnico_id,
                technician?.nombre || 'Técnico'
            );

            return order;
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new ConflictException('Error al asignar OT: ' + error.message);
        }
    }

    async registerConsumption(orderId: string, consumptionData: any, userId: string, uploadedFiles: any = {}): Promise<OrderDocument> {
        try {
            const order = await this.orderModel.findById(orderId);
            if (!order) {
                throw new NotFoundException('OT no encontrada');
            }

            // Validar póliza
            if (consumptionData.poliza_number !== order.poliza_number) {
                throw new BadRequestException('La póliza no coincide con la OT');
            }

            const { consumos } = consumptionData;

            // Guardar evidencias fotográficas
            if (Object.keys(uploadedFiles).length > 0) {
                if (!order.evidencias) {
                    order.evidencias = {} as any;
                }

                for (const [etapa, fileData] of Object.entries(uploadedFiles)) {
                    const file = fileData as any;
                    (order.evidencias as any)[`foto_${etapa}`] = {
                        file_id: new Types.ObjectId(file.filename),
                        meta: {
                            originalname: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                            uploadDate: new Date(),
                            filename: file.filename,
                        },
                    };
                }
                order.markModified('evidencias');
            }

            // Registrar consumos
            for (const consumo of consumos) {
                const cantidadUsada = consumo.cantidad || consumo.cantidad_usada;

                await this.inventoryService.commitConsumption(
                    order.tecnico_id.toString(),
                    consumo.material_id,
                    cantidadUsada,
                    orderId,
                    order.poliza_number,
                    userId,
                );

                // Agregar a materiales utilizados
                order.materiales_utilizados.push({
                    material_id: new Types.ObjectId(consumo.material_id),
                    cantidad: cantidadUsada,
                    unidad: consumo.unidad || 'unidades',
                    registrado_por: new Types.ObjectId(userId),
                    fecha: new Date(),
                    poliza_number: order.poliza_number,
                });

                // Verificar over_consumption
                const apartado = order.materiales_apartados.find(
                    a => a.material_id.toString() === consumo.material_id
                );

                if (apartado && cantidadUsada > apartado.cantidad) {
                    await this.alertsService.create({
                        tipo: 'over_consumption',
                        descripcion: `Consumo excedido en material ${consumo.material_id}: apartado ${apartado.cantidad}, usado ${cantidadUsada}`,
                        order_id: new Types.ObjectId(orderId),
                        tecnico_id: order.tecnico_id,
                        visible_para_analistas: false,
                    });
                }
            }

            // Actualizar estado
            const wasAssigned = order.estado === 'asignada';
            order.estado = 'en_proceso';
            order.audit_trail.push({
                actor: new Types.ObjectId(userId),
                action: 'CONSUMO_REGISTRADO',
                detail: `Consumos registrados: ${consumos.length} materiales`,
                timestamp: new Date(),
            });

            await order.save();

            await this.auditService.log({
                usuario_id: new Types.ObjectId(userId),
                accion: 'CONSUMO_REGISTRADO',
                detalle: `Consumos registrados en OT ${order.codigo}`,
                meta: { order_id: orderId, consumos_count: consumos.length },
            });

            // Si la orden acaba de iniciar, notificar a analistas
            if (wasAssigned) {
                const technician = await this.connection.model('User').findById(userId).exec();
                const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
                const analystIds = analysts.map(a => a._id.toString());
                if (analystIds.length > 0) {
                    await this.notificationsService.notifyOrderStarted(
                        order,
                        analystIds,
                        technician?.nombre || 'Técnico'
                    );
                }
            }

            return order;
        } catch (error) {
            throw error;
        }
    }

    async findAll(filters: any = {}): Promise<OrderDocument[]> {
        return this.orderModel
            .find(filters)
            .populate('analista_id', 'nombre email')
            .populate('tecnico_id', 'nombre email')
            .sort({ fecha_creacion: -1 })
            .exec();
    }

    async findById(id: string): Promise<OrderDocument> {
        const order = await this.orderModel
            .findById(id)
            .populate('analista_id', 'nombre email')
            .populate('tecnico_id', 'nombre email')
            .populate('materiales_utilizados.material_id', 'nombre categoria unidad_medida')
            .populate('materiales_sugeridos.material_id', 'nombre categoria unidad_medida')
            .populate('materiales_apartados.material_id', 'nombre categoria unidad_medida')
            .exec();

        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        return order;
    }

    async findByPoliza(polizaNumber: string): Promise<OrderDocument[]> {
        return this.orderModel
            .find({ poliza_number: polizaNumber })
            .populate('analista_id', 'nombre email')
            .populate('tecnico_id', 'nombre email')
            .exec();
    }

    async completeOrder(orderId: string, userId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (order.estado !== 'en_proceso') {
            throw new BadRequestException('La OT debe estar en proceso para completarse');
        }

        order.estado = 'finalizada';
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'OT_COMPLETADA',
            detail: 'OT completada por técnico, esperando revisión del analista',
            timestamp: new Date(),
        });

        await order.save();

        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_COMPLETADA',
            detalle: `OT ${order.codigo} completada por técnico`,
            meta: { order_id: orderId },
        });

        return order;
    }

    async updateMaterialUtilizado(
        orderId: string,
        materialIndex: number,
        updateData: { cantidad: number; observacion?: string },
        userId: string,
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (!order.materiales_utilizados || !order.materiales_utilizados[materialIndex]) {
            throw new NotFoundException('Material no encontrado');
        }

        const material = order.materiales_utilizados[materialIndex];
        const cantidadAnterior = material.cantidad;

        material.cantidad = updateData.cantidad;
        if (updateData.observacion) {
            (material as any).observacion_analista = updateData.observacion;
        }

        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'MATERIAL_CORREGIDO',
            detail: `Material ${material.material_id} corregido: ${cantidadAnterior} → ${updateData.cantidad}`,
            timestamp: new Date(),
        });

        await order.save();

        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'MATERIAL_CORREGIDO',
            detalle: `Material corregido en OT ${order.codigo}`,
            meta: { order_id: orderId, material_index: materialIndex },
        });

        return order;
    }

    async deleteMaterialUtilizado(orderId: string, materialIndex: number, userId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (!order.materiales_utilizados || !order.materiales_utilizados[materialIndex]) {
            throw new NotFoundException('Material no encontrado');
        }

        const material = order.materiales_utilizados[materialIndex];
        order.materiales_utilizados.splice(materialIndex, 1);

        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'MATERIAL_ELIMINADO',
            detail: `Material ${material.material_id} eliminado por analista`,
            timestamp: new Date(),
        });

        await order.save();

        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'MATERIAL_ELIMINADO',
            detalle: `Material eliminado de OT ${order.codigo}`,
            meta: { order_id: orderId },
        });

        return order;
    }

    async requestCorrection(
        orderId: string,
        correctionData: { motivo: string; detalles: string },
        userId: string,
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        // Cambiar estado a "en_proceso" para que el técnico pueda corregir
        order.estado = 'en_proceso';
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'CORRECCION_SOLICITADA',
            detail: `Corrección solicitada: ${correctionData.motivo} - ${correctionData.detalles}`,
            timestamp: new Date(),
        });

        // Crear alerta para el técnico
        await this.alertsService.create({
            tipo: 'correccion_solicitada',
            descripcion: `El analista solicita correcciones en OT ${order.codigo}: ${correctionData.motivo}`,
            order_id: new Types.ObjectId(orderId),
            tecnico_id: order.tecnico_id,
            visible_para_analistas: false,
        });

        await order.save();

        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'CORRECCION_SOLICITADA',
            detalle: `Corrección solicitada en OT ${order.codigo}`,
            meta: { order_id: orderId, motivo: correctionData.motivo },
        });

        return order;
    }

    async closeOrder(orderId: string, userId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (order.estado !== 'finalizada') {
            throw new BadRequestException('La OT debe estar finalizada para cerrarse');
        }

        order.estado = 'cerrada';
        order.fecha_cierre = new Date();
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'OT_CERRADA',
            detail: 'OT cerrada por analista después de revisión',
            timestamp: new Date(),
        });

        await order.save();

        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_CERRADA',
            detalle: `OT ${order.codigo} cerrada`,
            meta: { order_id: orderId },
        });

        return order;
    }

    private async generateOrderCode(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.orderModel.countDocuments();
        return `OT-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // ========================================
    // MÉTODOS DE IMPOSIBILIDAD Y REVISIÓN
    // ========================================

    async markAsImpossible(
        orderId: string,
        imposibilidadData: any,
        files: Express.Multer.File[],
        userId: string
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        // Validar que el técnico sea el asignado
        if (order.tecnico_id.toString() !== userId) {
            throw new BadRequestException('Solo el técnico asignado puede marcar como imposibilidad');
        }

        // Validar que exista foto de tirilla
        const fotoTirilla = files.find(f => f.fieldname === 'foto_tirilla');
        if (!fotoTirilla) {
            throw new BadRequestException('La foto de la tirilla es obligatoria');
        }

        const fotoPredio = files.find(f => f.fieldname === 'foto_predio');

        // Si no hay foto del predio, debe haber justificación
        if (!fotoPredio && !imposibilidadData.justificacion_sin_foto_predio) {
            throw new BadRequestException('Debe subir foto del predio o justificar por qué no puede tomarla');
        }

        order.estado = 'imposibilidad';
        order.imposibilidad = {
            motivo: imposibilidadData.motivo,
            descripcion_detallada: imposibilidadData.descripcion_detallada,
            foto_tirilla: `/uploads/imposibilidad/${fotoTirilla.filename}`,
            foto_predio: fotoPredio ? `/uploads/imposibilidad/${fotoPredio.filename}` : null,
            justificacion_sin_foto_predio: imposibilidadData.justificacion_sin_foto_predio || null,
            fecha_registro: new Date(),
            registrado_por: new Types.ObjectId(userId),
            ubicacion: imposibilidadData.ubicacion ? JSON.parse(imposibilidadData.ubicacion) : null,
        };

        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'IMPOSIBILIDAD_REGISTRADA',
            detail: `Imposibilidad registrada: ${imposibilidadData.motivo}`,
            timestamp: new Date(),
        });

        await order.save();

        // Audit log
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'IMPOSIBILIDAD_REGISTRADA',
            detalle: `OT ${order.codigo} marcada como imposibilidad`,
            meta: { order_id: orderId, motivo: imposibilidadData.motivo },
        });

        // Notificar a todos los analistas
        const technician = await this.connection.model('User').findById(userId).exec();
        const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
        const analystIds = analysts.map(a => a._id.toString());
        if (analystIds.length > 0) {
            await this.notificationsService.notifyImpossibility(
                order,
                analystIds,
                technician?.nombre || 'Técnico',
                imposibilidadData.motivo
            );
        }

        return order;
    }

    async finalizarPorTecnico(orderId: string, userId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (order.tecnico_id.toString() !== userId) {
            throw new BadRequestException('Solo el técnico asignado puede finalizar la OT');
        }

        if (order.estado !== 'en_proceso') {
            throw new BadRequestException('La OT debe estar en proceso para finalizarla');
        }

        order.estado = 'pendiente_revision';
        order.fecha_pendiente_revision = new Date();
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'FINALIZADA_POR_TECNICO',
            detail: 'OT finalizada por técnico, pendiente de revisión del analista',
            timestamp: new Date(),
        });

        await order.save();

        // Audit log
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_FINALIZADA_TECNICO',
            detalle: `OT ${order.codigo} finalizada por técnico`,
            meta: { order_id: orderId },
        });

        // Notificar a todos los analistas
        const technician = await this.connection.model('User').findById(userId).exec();
        const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
        const analystIds = analysts.map(a => a._id.toString());
        if (analystIds.length > 0) {
            await this.notificationsService.notifyOrderCompleted(
                order,
                analystIds,
                technician?.nombre || 'Técnico'
            );
        }

        return order;
    }

    /**
     * Finalizar orden con aprendizaje automático
     */
    async finalizarConAprendizaje(orderId: string, userId: string, datosFinalizacion: {
        tipo_trabajo?: string;
        observaciones?: string;
        materiales_utilizados?: any[];
        tiempo_total?: number;
    }) {
        try {
            const order = await this.orderModel.findById(orderId);
            if (!order) {
                throw new NotFoundException('Orden no encontrada');
            }

            // Actualizar estado de la orden
            order.estado = 'finalizada';
            order.fecha_finalizacion = new Date();
            order.finalizada_por = new Types.ObjectId(userId);

            // Agregar datos de finalización
            if (datosFinalizacion.observaciones) {
                order.observaciones_finalizacion = datosFinalizacion.observaciones;
            }
            if (datosFinalizacion.materiales_utilizados) {
                order.materiales_utilizados = datosFinalizacion.materiales_utilizados;
            }
            if (datosFinalizacion.tiempo_total) {
                order.tiempo_total = datosFinalizacion.tiempo_total;
            }
            if (datosFinalizacion.tipo_trabajo) {
                order.tipo_trabajo = datosFinalizacion.tipo_trabajo;
            }

            order.audit_trail.push({
                actor: new Types.ObjectId(userId),
                action: 'OT_FINALIZADA_CON_APRENDIZAJE',
                detail: `OT finalizada con datos para aprendizaje automático. Tipo: ${datosFinalizacion.tipo_trabajo || 'No especificado'}`,
                timestamp: new Date(),
            });

            await order.save();

            // Audit log
            await this.auditService.log({
                usuario_id: new Types.ObjectId(userId),
                accion: 'OT_FINALIZADA_APRENDIZAJE',
                detalle: `OT ${order.codigo} finalizada con aprendizaje automático`,
                meta: {
                    order_id: orderId,
                    tipo_trabajo: datosFinalizacion.tipo_trabajo
                },
            });

            return {
                success: true,
                message: 'Orden finalizada correctamente',
                orden: order,
                tipo_trabajo: datosFinalizacion.tipo_trabajo
            };
        } catch (error) {
            console.error('Error finalizando orden con aprendizaje:', error);
            throw error;
        }
    }

    async aprobarPorAnalista(
        orderId: string,
        observaciones: string,
        userId: string
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (order.estado !== 'pendiente_revision' && order.estado !== 'imposibilidad') {
            throw new BadRequestException('La OT debe estar pendiente de revisión o en imposibilidad');
        }

        order.estado = 'cerrada';
        order.fecha_cierre = new Date();
        order.observaciones_analista = observaciones;
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'APROBADA_POR_ANALISTA',
            detail: `OT aprobada por analista${observaciones ? ': ' + observaciones : ''}`,
            timestamp: new Date(),
        });

        await order.save();

        // Audit log
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_APROBADA',
            detalle: `OT ${order.codigo} aprobada por analista`,
            meta: { order_id: orderId, observaciones },
        });

        // Notificar al técnico
        const analyst = await this.connection.model('User').findById(userId).exec();
        await this.notificationsService.notifyOrderApproved(
            order,
            order.tecnico_id.toString(),
            analyst?.nombre || 'Analista'
        );

        return order;
    }

    async rechazarPorAnalista(
        orderId: string,
        motivo: string,
        observaciones: string,
        userId: string
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (order.estado !== 'pendiente_revision') {
            throw new BadRequestException('La OT debe estar pendiente de revisión');
        }

        order.estado = 'en_proceso'; // Devolver a en proceso
        order.observaciones_analista = observaciones;
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'RECHAZADA_POR_ANALISTA',
            detail: `OT rechazada por analista. Motivo: ${motivo}`,
            timestamp: new Date(),
        });

        await order.save();

        // Audit log
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'OT_RECHAZADA',
            detalle: `OT ${order.codigo} rechazada por analista`,
            meta: { order_id: orderId, motivo, observaciones },
        });

        // Notificar al técnico
        const analyst = await this.connection.model('User').findById(userId).exec();
        await this.notificationsService.notifyOrderRejected(
            order,
            order.tecnico_id.toString(),
            motivo,
            analyst?.nombre || 'Analista'
        );

        return order;
    }

    async devolverMateriales(
        orderId: string,
        devoluciones: Array<{ material_id: string; cantidad: number; motivo?: string }>,
        userId: string
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('OT no encontrada');
        }

        if (!order.tecnico_id) {
            throw new BadRequestException('Esta OT no tiene técnico asignado');
        }

        // Procesar cada devolución
        for (const devolucion of devoluciones) {
            // Verificar que el material esté en materiales_apartados
            const materialApartado = order.materiales_apartados.find(
                m => m.material_id.toString() === devolucion.material_id
            );

            if (!materialApartado) {
                throw new BadRequestException(`Material ${devolucion.material_id} no está apartado en esta OT`);
            }

            // Calcular cuánto se usó
            const materialUtilizado = order.materiales_utilizados.find(
                m => m.material_id.toString() === devolucion.material_id
            );
            const cantidadUsada = materialUtilizado?.cantidad || 0;
            const cantidadSobrante = materialApartado.cantidad - cantidadUsada;

            if (devolucion.cantidad > cantidadSobrante) {
                throw new BadRequestException(
                    `No puedes devolver ${devolucion.cantidad} unidades. Solo sobran ${cantidadSobrante}`
                );
            }

            // Devolver material al inventario del técnico
            await this.inventoryService.returnMaterial(
                order.tecnico_id.toString(),
                devolucion.material_id,
                devolucion.cantidad,
                devolucion.motivo || 'Devolución de material sobrante de OT',
                orderId,
                userId
            );
        }

        // Registrar en audit trail
        order.audit_trail.push({
            actor: new Types.ObjectId(userId),
            action: 'MATERIALES_DEVUELTOS',
            detail: `${devoluciones.length} material(es) devuelto(s) al inventario`,
            timestamp: new Date(),
        });

        await order.save();

        // Audit log
        await this.auditService.log({
            usuario_id: new Types.ObjectId(userId),
            accion: 'MATERIALES_DEVUELTOS',
            detalle: `Materiales devueltos de OT ${order.codigo}`,
            meta: { order_id: orderId, devoluciones_count: devoluciones.length },
        });

        // Notificar a analistas
        const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
        const analystIds = analysts.map(a => a._id.toString());
        if (analystIds.length > 0) {
            await this.notificationsService.createForUsers(analystIds, {
                type: 'info',
                title: '📦 Materiales Devueltos',
                message: `${devoluciones.length} material(es) devuelto(s) de OT #${order.codigo}`,
                data: { orderId: order._id, orderNumber: order.codigo },
            });
        }

        return order;
    }
}
