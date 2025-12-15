import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { alertService } from '../services/alertService'
import { useAuthStore } from '../store/authStore'

export default function AlertasPage() {
    const { user } = useAuthStore()
    const [alerts, setAlerts] = useState([])
    const [filter, setFilter] = useState('active')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAlerts()
    }, [filter, user])

    const loadAlerts = async () => {
        try {
            const filters = {}
            if (filter === 'active') {
                filters.resolved = false
            }
            if (user?.rol === 'tecnico') {
                filters.tecnico_id = user._id
            }

            const response = await alertService.getAll(filters)
            setAlerts(response.data)
        } catch (error) {
            console.error('Error cargando alertas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (alertId) => {
        try {
            await alertService.resolve(alertId)
            loadAlerts()
        } catch (error) {
            console.error('Error resolviendo alerta:', error)
        }
    }

    const getAlertIcon = (tipo) => {
        const icons = {
            over_consumption: '⚠️',
            low_stock: '📦',
            missing_material: '❌',
            delay: '⏰'
        }
        return icons[tipo] || '🔔'
    }

    const getAlertColor = (tipo) => {
        const colors = {
            over_consumption: 'bg-red-100 border-red-300',
            low_stock: 'bg-yellow-100 border-yellow-300',
            missing_material: 'bg-orange-100 border-orange-300',
            delay: 'bg-blue-100 border-blue-300'
        }
        return colors[tipo] || 'bg-gray-100 border-gray-300'
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Alertas</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                    >
                        Activas
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                    >
                        Todas
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded shadow p-8 text-center">Cargando...</div>
            ) : alerts.length === 0 ? (
                <div className="bg-white rounded shadow p-8 text-center text-gray-500">
                    {filter === 'active' ? 'No hay alertas activas' : 'No hay alertas'}
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div
                            key={alert._id}
                            className={`border rounded p-4 ${getAlertColor(alert.tipo)} ${alert.resolved ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{getAlertIcon(alert.tipo)}</span>
                                        <h3 className="font-bold text-lg capitalize">
                                            {alert.tipo.replace('_', ' ')}
                                        </h3>
                                        {alert.resolved && (
                                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                Resuelta
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-2">{alert.descripcion}</p>
                                    <div className="text-sm text-gray-600">
                                        <span>Fecha: {new Date(alert.created_at).toLocaleString()}</span>
                                        {alert.order_id && (
                                            <Link
                                                to={`/ot/${alert.order_id}`}
                                                className="ml-4 text-blue-600 hover:underline"
                                            >
                                                Ver OT →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                {!alert.resolved && user?.rol === 'analista' && (
                                    <button
                                        onClick={() => handleResolve(alert._id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Resolver
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
