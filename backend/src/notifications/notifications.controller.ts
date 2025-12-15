import { Controller, Get, Post, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    async getMyNotifications(@Request() req) {
        return this.notificationsService.findByUser(req.user.userId);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.countUnread(req.user.userId);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    // Endpoint de prueba para enviar notificación
    @Post('test')
    async sendTestNotification(@Request() req) {
        const userId = req.user?.userId || req.user?._id || req.user?.id;

        if (!userId) {
            throw new Error('Usuario no autenticado');
        }

        return this.notificationsService.create({
            userId: userId,
            type: 'info',
            title: '🧪 Notificación de Prueba',
            message: 'Esta es una notificación de prueba del sistema en tiempo real',
            data: { test: true, timestamp: new Date() },
        });
    }
}
