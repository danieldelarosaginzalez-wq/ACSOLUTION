import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function EpicMapNotifications({
    notifications = [],
    onDismiss,
    position = 'top-right'
}) {
    const [visibleNotifications, setVisibleNotifications] = useState([])

    useEffect(() => {
        setVisibleNotifications(notifications)
    }, [notifications])

    const handleDismiss = (id) => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== id))
        if (onDismiss) onDismiss(id)
    }

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4'
            case 'top-right':
                return 'top-4 right-4'
            case 'bottom-left':
                return 'bottom-4 left-4'
            case 'bottom-right':
                return 'bottom-4 right-4'
            default:
                return 'top-4 right-4'
        }
    }

    const getTypeStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                    icon: '✅',
                    ring: 'ring-green-200'
                }
            case 'error':
                return {
                    bg: 'bg-gradient-to-r from-red-500 to-pink-600',
                    icon: '❌',
                    ring: 'ring-red-200'
                }
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
                    icon: '⚠️',
                    ring: 'ring-yellow-200'
                }
            case 'info':
                return {
                    bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                    icon: 'ℹ️',
                    ring: 'ring-blue-200'
                }
            case 'geocoding':
                return {
                    bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
                    icon: '🔍',
                    ring: 'ring-purple-200'
                }
            case 'technician':
                return {
                    bg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
                    icon: '👷',
                    ring: 'ring-cyan-200'
                }
            default:
                return {
                    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    icon: '📢',
                    ring: 'ring-gray-200'
                }
        }
    }

    return (
        <div className={`fixed ${getPositionClasses()} z-[9999] max-w-sm space-y-3`}>
            <AnimatePresence>
                {visibleNotifications.map((notification) => {
                    const styles = getTypeStyles(notification.type)

                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.5
                            }}
                            className={`${styles.bg} text-white rounded-2xl shadow-2xl border-4 border-white ring-4 ${styles.ring} overflow-hidden relative`}
                        >
                            {/* Efecto de brillo */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>

                            <div className="relative p-4">
                                <div className="flex items-start gap-3">
                                    {/* Icono animado */}
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                                            <span className="text-xl">{styles.icon}</span>
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold mb-1">
                                            {notification.title}
                                        </h4>
                                        <p className="text-xs opacity-90 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        {/* Timestamp */}
                                        {notification.timestamp && (
                                            <p className="text-xs opacity-70 mt-2">
                                                {new Date(notification.timestamp).toLocaleTimeString()}
                                            </p>
                                        )}

                                        {/* Datos adicionales */}
                                        {notification.data && (
                                            <div className="mt-2 text-xs bg-white/10 rounded-lg p-2">
                                                {Object.entries(notification.data).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="opacity-80">{key}:</span>
                                                        <span className="font-semibold">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de cerrar */}
                                    <button
                                        onClick={() => handleDismiss(notification.id)}
                                        className="flex-shrink-0 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                        <span className="text-xs">✕</span>
                                    </button>
                                </div>

                                {/* Barra de progreso para auto-dismiss */}
                                {notification.autoDismiss && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 h-1 bg-white/30"
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{
                                            duration: notification.duration || 5,
                                            ease: "linear"
                                        }}
                                        onAnimationComplete={() => handleDismiss(notification.id)}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}

// Hook para usar las notificaciones épicas
export function useEpicMapNotifications() {
    const [notifications, setNotifications] = useState([])

    const addNotification = (notification) => {
        const id = Date.now() + Math.random()
        const newNotification = {
            id,
            timestamp: new Date(),
            autoDismiss: true,
            duration: 5,
            ...notification
        }

        setNotifications(prev => [...prev, newNotification])

        // Auto-dismiss si está habilitado
        if (newNotification.autoDismiss) {
            setTimeout(() => {
                removeNotification(id)
            }, (newNotification.duration || 5) * 1000)
        }

        return id
    }

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const clearAll = () => {
        setNotifications([])
    }

    // Métodos de conveniencia
    const success = (title, message, data) =>
        addNotification({ type: 'success', title, message, data })

    const error = (title, message, data) =>
        addNotification({ type: 'error', title, message, data, autoDismiss: false })

    const warning = (title, message, data) =>
        addNotification({ type: 'warning', title, message, data })

    const info = (title, message, data) =>
        addNotification({ type: 'info', title, message, data })

    const geocoding = (title, message, data) =>
        addNotification({ type: 'geocoding', title, message, data })

    const technician = (title, message, data) =>
        addNotification({ type: 'technician', title, message, data })

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
        geocoding,
        technician
    }
}