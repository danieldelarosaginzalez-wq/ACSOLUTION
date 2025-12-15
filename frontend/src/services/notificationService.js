import api from './api';

export const notificationService = {
    // Obtener notificaciones del usuario
    async getMyNotifications() {
        const response = await api.get('/notifications');
        return response.data;
    },

    // Obtener contador de no leídas
    async getUnreadCount() {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    },

    // Marcar como leída
    async markAsRead(notificationId) {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    // Marcar todas como leídas
    async markAllAsRead() {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },
};
