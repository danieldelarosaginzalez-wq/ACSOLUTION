import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsGateway } from './notifications.gateway';

export interface Notification {
    _id?: string;
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'material' | 'alert';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel('Notification') private notificationModel: Model<Notification>,
        private notificationsGateway: NotificationsGateway,
    ) { }

    // Crear y enviar notificación
    async create(notification: Partial<Notification>) {
        const newNotification = new this.notificationModel({
            ...notification,
            read: false,
            createdAt: new Date(),
        });
        const saved = await newNotification.save();

        // Enviar notificación en tiempo real
        this.notificationsGateway.notifyUser(
            notification.userId,
            'notification',
            saved,
        );

        return saved;
    }

    // Crear notificación para múltiples usuarios
    async createForUsers(userIds: string[], notification: Partial<Notification>) {
        const notifications = await Promise.all(
            userIds.map(userId =>
                this.notificationModel.create({
                    ...notification,
                    userId,
                    read: false,
                    createdAt: new Date(),
                }),
            ),
        );

        // Enviar notificaciones en tiempo real
        notifications.forEach(notif => {
            this.notificationsGateway.notifyUser(
                notif.userId,
                'notification',
                notif,
            );
        });

        return notifications;
    }

    // Obtener notificaciones de un usuario
    async findByUser(userId: string, limit = 50) {
        return this.notificationModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    // Marcar como leída
    async markAsRead(notificationId: string) {
        return this.notificationModel
            .findByIdAndUpdate(notificationId, { read: true }, { new: true })
            .exec();
    }

    // Marcar todas como leídas
    async markAllAsRead(userId: string) {
        return this.notificationModel
            .updateMany({ userId, read: false }, { read: true })
            .exec();
    }

    // Contar no leídas
    async countUnread(userId: string) {
        return this.notificationModel.countDocuments({ userId, read: false }).exec();
    }

    // Notificaciones específicas del sistema - MEJORADAS
    async notifyOrderCreated(order: any, analystIds: string[]) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'order',
            title: '📋 Nueva Orden de Trabajo',
            message: `OT #${orderNum} creada para ${order.cliente || 'cliente'} - ${order.direccion || 'Sin dirección'}`,
            data: {
                orderId: order._id?.toString() || order.id,
                orderNumber: orderNum,
                cliente: order.cliente,
                prioridad: order.prioridad
            },
        });
    }

    async notifyOrderAssigned(order: any, technicianId: string, technicianName?: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.create({
            userId: technicianId,
            type: 'order',
            title: '🔧 Nueva OT Asignada',
            message: `Te han asignado la OT #${orderNum} - ${order.cliente || 'Cliente'} en ${order.direccion || 'dirección pendiente'}`,
            data: {
                orderId: order._id?.toString() || order.id,
                orderNumber: orderNum,
                cliente: order.cliente,
                direccion: order.direccion,
                prioridad: order.prioridad
            },
        });
    }

    async notifyOrderStarted(order: any, analystIds: string[], technicianName: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'info',
            title: '▶️ OT Iniciada',
            message: `${technicianName} ha iniciado la OT #${orderNum} - ${order.cliente}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum },
        });
    }

    async notifyOrderCompleted(order: any, analystIds: string[], technicianName?: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'success',
            title: '✅ OT Completada',
            message: `${technicianName || 'Técnico'} completó la OT #${orderNum} - ${order.cliente}. Pendiente de revisión.`,
            data: {
                orderId: order._id?.toString(),
                orderNumber: orderNum,
                requiresReview: true
            },
        });
    }

    async notifyOrderApproved(order: any, technicianId: string, analystName?: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.create({
            userId: technicianId,
            type: 'success',
            title: '🎉 OT Aprobada',
            message: `${analystName || 'Analista'} aprobó tu OT #${orderNum} - ${order.cliente}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum },
        });
    }

    async notifyOrderRejected(order: any, technicianId: string, reason: string, analystName?: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.create({
            userId: technicianId,
            type: 'warning',
            title: '⚠️ OT Requiere Correcciones',
            message: `${analystName || 'Analista'} requiere correcciones en OT #${orderNum}: ${reason}`,
            data: {
                orderId: order._id?.toString(),
                orderNumber: orderNum,
                reason
            },
        });
    }

    async notifyOrderCancelled(order: any, userIds: string[], reason?: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(userIds, {
            type: 'error',
            title: '❌ OT Cancelada',
            message: `La OT #${orderNum} ha sido cancelada${reason ? ': ' + reason : ''}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum, reason },
        });
    }

    async notifyPhotoUploaded(order: any, analystIds: string[], stage: string, photoCount: number) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'info',
            title: '📸 Fotos Subidas',
            message: `${photoCount} foto(s) subida(s) en etapa "${stage}" - OT #${orderNum}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum, stage, photoCount },
        });
    }

    async notifyImpossibility(order: any, analystIds: string[], technicianName: string, reason: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'warning',
            title: '🚫 Imposibilidad Reportada',
            message: `${technicianName} reportó imposibilidad en OT #${orderNum}: ${reason}`,
            data: {
                orderId: order._id?.toString(),
                orderNumber: orderNum,
                reason,
                requiresReview: true
            },
        });
    }

    async notifyLowStock(material: any, analystIds: string[]) {
        return this.createForUsers(analystIds, {
            type: 'warning',
            title: '⚠️ Stock Bajo',
            message: `${material.nombre} tiene stock crítico: ${material.cantidad} ${material.unidad || 'unidades'}`,
            data: {
                materialId: material._id?.toString(),
                materialName: material.nombre,
                cantidad: material.cantidad,
                stockMinimo: material.stockMinimo
            },
        });
    }

    async notifyMaterialRequest(request: any, analystIds: string[], technicianName?: string) {
        return this.createForUsers(analystIds, {
            type: 'material',
            title: '📦 Solicitud de Material',
            message: `${technicianName || 'Técnico'} solicita ${request.cantidad} ${request.materialNombre}`,
            data: {
                requestId: request._id?.toString(),
                materialName: request.materialNombre,
                cantidad: request.cantidad
            },
        });
    }

    async notifyMaterialAssigned(technicianId: string, materialName: string, cantidad: number) {
        return this.create({
            userId: technicianId,
            type: 'success',
            title: '✅ Material Asignado',
            message: `Se te han asignado ${cantidad} ${materialName} a tu inventario`,
            data: { materialName, cantidad },
        });
    }

    async notifySignatureRequired(order: any, technicianId: string, signatureType: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.create({
            userId: technicianId,
            type: 'warning',
            title: '✍️ Firma Requerida',
            message: `Se requiere firma de ${signatureType} para OT #${orderNum}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum, signatureType },
        });
    }

    async notifySignatureCompleted(order: any, analystIds: string[], signatureType: string) {
        const orderNum = order.codigo || order.numeroOT || order.numero_ot || 'N/A';
        return this.createForUsers(analystIds, {
            type: 'success',
            title: '✍️ Firma Completada',
            message: `Firma de ${signatureType} completada en OT #${orderNum}`,
            data: { orderId: order._id?.toString(), orderNumber: orderNum, signatureType },
        });
    }
}
