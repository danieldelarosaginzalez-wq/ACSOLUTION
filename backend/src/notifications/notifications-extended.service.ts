import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsExtendedService {
    constructor(private notificationsService: NotificationsService) { }

    // ========================================
    // NOTIFICACIONES EXTENDIDAS DE ÓRDENES
    // ========================================

    async notifyOrderStarted(order: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'info',
            title: '🚀 OT Iniciada',
            message: `El técnico ha iniciado la OT #${order.numeroOT}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, action: 'view' },
        });
    }

    async notifyOrderApproved(order: any, technicianId: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'success',
            title: '🎉 OT Aprobada',
            message: `Tu OT #${order.numeroOT} ha sido aprobada por el analista`,
            data: { orderId: order._id, orderNumber: order.numeroOT, action: 'view' },
        });
    }

    async notifyOrderRejected(order: any, technicianId: string, reason: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'warning',
            title: '⚠️ OT Requiere Correcciones',
            message: `La OT #${order.numeroOT} necesita correcciones: ${reason}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, reason, action: 'correct' },
        });
    }

    async notifyOrderCancelled(order: any, userIds: string[], reason: string) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'error',
            title: '❌ OT Cancelada',
            message: `La OT #${order.numeroOT} ha sido cancelada. Motivo: ${reason}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, reason },
        });
    }

    async notifyOrderDelayed(order: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'warning',
            title: '⏰ OT Retrasada',
            message: `La OT #${order.numeroOT} está retrasada. Fecha estimada vencida.`,
            data: { orderId: order._id, orderNumber: order.numeroOT, action: 'check' },
        });
    }

    async notifyOrderUrgent(order: any, technicianId: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'error',
            title: '🚨 OT URGENTE',
            message: `La OT #${order.numeroOT} es de prioridad CRÍTICA. Atención inmediata requerida.`,
            data: { orderId: order._id, orderNumber: order.numeroOT, priority: 'critical' },
        });
    }

    async notifyOrderPhotoUploaded(order: any, photoType: string, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'info',
            title: '📸 Nueva Foto Subida',
            message: `Se subió foto ${photoType} para OT #${order.numeroOT}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, photoType },
        });
    }

    // ========================================
    // NOTIFICACIONES DE MATERIALES EXTENDIDAS
    // ========================================

    async notifyOutOfStock(material: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'error',
            title: '🚫 Material Agotado',
            message: `${material.nombre} está AGOTADO. Reposición urgente necesaria.`,
            data: { materialId: material._id, materialName: material.nombre, action: 'urgent_restock' },
        });
    }

    async notifyMaterialRequestApproved(request: any, technicianId: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'success',
            title: '✅ Solicitud Aprobada',
            message: `Tu solicitud de ${request.materialNombre} ha sido aprobada`,
            data: { requestId: request._id, materialName: request.materialNombre },
        });
    }

    async notifyMaterialRequestRejected(request: any, technicianId: string, reason: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'warning',
            title: '❌ Solicitud Rechazada',
            message: `Solicitud de ${request.materialNombre} rechazada: ${reason}`,
            data: { requestId: request._id, materialName: request.materialNombre, reason },
        });
    }

    async notifyMaterialAdded(material: any, userIds: string[]) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'info',
            title: '➕ Nuevo Material',
            message: `Se ha agregado ${material.nombre} al inventario`,
            data: { materialId: material._id, materialName: material.nombre },
        });
    }

    async notifyMaterialRestocked(material: any, quantity: number, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'success',
            title: '📈 Material Reabastecido',
            message: `${material.nombre} reabastecido: +${quantity} ${material.unidad}. Stock actual: ${material.cantidad}`,
            data: { materialId: material._id, materialName: material.nombre, quantity },
        });
    }

    // ========================================
    // NOTIFICACIONES DE INVENTARIO
    // ========================================

    async notifyInventoryAssigned(technician: any, materials: any[], analystId: string) {
        return this.notificationsService.create({
            userId: analystId,
            type: 'info',
            title: '🎒 Inventario Asignado',
            message: `Se asignaron ${materials.length} materiales al técnico ${technician.nombre}`,
            data: { technicianId: technician._id, materialsCount: materials.length },
        });
    }

    async notifyInventoryReceived(materials: any[], technicianId: string) {
        return this.notificationsService.create({
            userId: technicianId,
            type: 'success',
            title: '📥 Materiales Recibidos',
            message: `Has recibido ${materials.length} materiales en tu inventario`,
            data: { materialsCount: materials.length, action: 'view_inventory' },
        });
    }

    async notifyInventoryLow(technician: any, material: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'warning',
            title: '⚠️ Inventario Técnico Bajo',
            message: `${technician.nombre} tiene poco ${material.nombre}: ${material.cantidad} ${material.unidad}`,
            data: { technicianId: technician._id, materialId: material._id, action: 'assign_more' },
        });
    }

    // ========================================
    // NOTIFICACIONES DE ALERTAS
    // ========================================

    async notifyNewAlert(alert: any, userIds: string[]) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'alert',
            title: `🔔 Alerta ${alert.prioridad.toUpperCase()}`,
            message: `${alert.titulo}: ${alert.descripcion}`,
            data: { alertId: alert._id, priority: alert.prioridad, action: 'view_alert' },
        });
    }

    async notifyAlertResolved(alert: any, userIds: string[]) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'success',
            title: '✅ Alerta Resuelta',
            message: `La alerta "${alert.titulo}" ha sido resuelta`,
            data: { alertId: alert._id },
        });
    }

    // ========================================
    // NOTIFICACIONES DE FIRMAS
    // ========================================

    async notifySignatureRequired(order: any, userId: string, signatureType: string) {
        return this.notificationsService.create({
            userId,
            type: 'warning',
            title: '✍️ Firma Requerida',
            message: `Se requiere tu firma (${signatureType}) para la OT #${order.numeroOT}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, signatureType, action: 'sign' },
        });
    }

    async notifySignatureCompleted(order: any, analystIds: string[], signerName: string, signatureType: string) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'success',
            title: '✅ Firma Registrada',
            message: `${signerName} ha firmado (${signatureType}) la OT #${order.numeroOT}`,
            data: { orderId: order._id, orderNumber: order.numeroOT, signerName, signatureType },
        });
    }

    // ========================================
    // NOTIFICACIONES DE REPORTES Y IA
    // ========================================

    async notifyReportGenerated(report: any, userIds: string[]) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'info',
            title: '📊 Reporte Generado',
            message: `Nuevo reporte disponible: ${report.nombre}`,
            data: { reportId: report._id, reportName: report.nombre, action: 'download' },
        });
    }

    async notifyAIPrediction(prediction: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'info',
            title: '🤖 Predicción IA Disponible',
            message: `Nueva predicción de IA para OT #${prediction.orderNumber}`,
            data: { predictionId: prediction._id, orderNumber: prediction.orderNumber, action: 'view' },
        });
    }

    async notifyAnomalyDetected(anomaly: any, analystIds: string[]) {
        return this.notificationsService.createForUsers(analystIds, {
            type: 'warning',
            title: '🔍 Anomalía Detectada',
            message: `Se detectó una anomalía: ${anomaly.description}`,
            data: { anomalyId: anomaly._id, type: anomaly.type, action: 'investigate' },
        });
    }

    // ========================================
    // NOTIFICACIONES DE USUARIOS
    // ========================================

    async notifyNewUser(user: any, adminIds: string[]) {
        return this.notificationsService.createForUsers(adminIds, {
            type: 'info',
            title: '👤 Nuevo Usuario',
            message: `${user.nombre} (${user.rol}) se ha registrado en el sistema`,
            data: { userId: user._id, userName: user.nombre, role: user.rol },
        });
    }

    async notifyUserActivated(user: any) {
        return this.notificationsService.create({
            userId: user._id,
            type: 'success',
            title: '🎉 Cuenta Activada',
            message: `Tu cuenta ha sido activada. ¡Bienvenido al sistema!`,
            data: { action: 'start' },
        });
    }

    async notifyUserDeactivated(user: any) {
        return this.notificationsService.create({
            userId: user._id,
            type: 'warning',
            title: '⚠️ Cuenta Desactivada',
            message: `Tu cuenta ha sido desactivada. Contacta al administrador.`,
            data: {},
        });
    }

    // ========================================
    // NOTIFICACIONES DE MANTENIMIENTO
    // ========================================

    async notifySystemMaintenance(userIds: string[], startTime: Date, duration: string) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'warning',
            title: '🔧 Mantenimiento Programado',
            message: `El sistema estará en mantenimiento el ${startTime.toLocaleString('es-ES')} por ${duration}`,
            data: { startTime, duration },
        });
    }

    async notifySystemUpdate(userIds: string[], version: string, features: string[]) {
        return this.notificationsService.createForUsers(userIds, {
            type: 'info',
            title: '🚀 Actualización del Sistema',
            message: `Nueva versión ${version} disponible con ${features.length} mejoras`,
            data: { version, features },
        });
    }

    // ========================================
    // NOTIFICACIONES PERSONALIZADAS
    // ========================================

    async notifyCustom(userIds: string[], title: string, message: string, type: string, data?: any) {
        return this.notificationsService.createForUsers(userIds, {
            type: type as any,
            title,
            message,
            data: data || {},
        });
    }

    async notifyBroadcast(title: string, message: string, type: string) {
        // Broadcast a todos los usuarios conectados
        this.notificationsService['notificationsGateway'].broadcast('broadcast', {
            title,
            message,
            type,
            timestamp: new Date(),
        });
    }
}
