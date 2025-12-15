import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        loadNotifications();
        loadUnreadCount();

        // Escuchar nuevas notificaciones en tiempo real
        socketService.on('notification', handleNewNotification);

        return () => {
            socketService.off('notification', handleNewNotification);
        };
    }, []);

    const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Mostrar notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
            });
        }

        // Reproducir sonido
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => { });
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getMyNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error cargando contador:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            order: '📦',
            material: '🔧',
            alert: '🔔',
        };
        return icons[type] || '📬';
    };

    const getNotificationColor = (type) => {
        const colors = {
            info: 'bg-blue-100 text-blue-700 border border-blue-200',
            success: 'bg-green-100 text-green-700 border border-green-200',
            warning: 'bg-amber-100 text-amber-700 border border-amber-200',
            error: 'bg-red-100 text-red-700 border border-red-200',
            order: 'bg-purple-100 text-purple-700 border border-purple-200',
            material: 'bg-orange-100 text-orange-700 border border-orange-200',
            alert: 'bg-pink-100 text-pink-700 border border-pink-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    return (
        <div className="relative">
            {/* Botón de campana */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel de notificaciones */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 z-20 w-96 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[600px] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        🔔 Notificaciones
                                    </h3>
                                    {unreadCount > 0 && (
                                        <p className="text-xs text-blue-100 mt-0.5">
                                            {unreadCount} sin leer
                                        </p>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                    >
                                        Marcar todas
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista de notificaciones */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="mt-3 text-sm text-gray-500">Cargando notificaciones...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-3">📭</div>
                                    <p className="text-gray-600 font-medium">No hay notificaciones</p>
                                    <p className="text-xs text-gray-500 mt-1">Te avisaremos cuando haya algo nuevo</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent cursor-pointer transition-all duration-200 ${!notification.read ? 'bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500' : ''
                                                }`}
                                            onClick={() => handleMarkAsRead(notification._id)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getNotificationColor(notification.type)}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                                {notification.title}
                                                            </p>
                                                            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        {!notification.read && (
                                                            <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full mt-1 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationColor(
                                                                notification.type
                                                            )}`}
                                                        >
                                                            {notification.type === 'order' ? '📦 Orden' :
                                                                notification.type === 'material' ? '🔧 Material' :
                                                                    notification.type === 'alert' ? '🔔 Alerta' :
                                                                        notification.type === 'success' ? '✅ Éxito' :
                                                                            notification.type === 'warning' ? '⚠️ Aviso' :
                                                                                notification.type === 'error' ? '❌ Error' :
                                                                                    '📋 Info'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {new Date(notification.createdAt).toLocaleString(
                                                                'es-ES',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
