import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function PanelAnalistaInventarioOculto() {
    const [alerts, setAlerts] = useState([])
    const [movements, setMovements] = useState([])
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('alerts')
    const [stats, setStats] = useState({})

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [alertsRes, techRes] = await Promise.all([
                api.get('/alerts?resolved=false'),
                api.get('/users?rol=tecnico')
            ])
            setAlerts(alertsRes.data)
            setTechnicians(techRes.data)

            const alertsByType = alertsRes.data.reduce((acc, alert) => {
                acc[alert.tipo] = (acc[alert.tipo] || 0) + 1
                return acc
            }, {})
            setStats({
                totalAlerts: alertsRes.data.length,
                totalTechs: techRes.data.length,
                alertsByType
            })
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setLoading(false)
        }
    }

    const resolveAlert = async (alertId) => {
        try {
            await api.put(`/alerts/${alertId}/resolve`)
            loadData()
        } catch (error) {
            alert('Error al resolver alerta')
        }
    }

    const loadMovements = async (techId = null) => {
        try {
            const params = { visible_para_analistas: false }
            if (techId) params.tecnico_id = techId
            const response = await api.get('/inventario/movimientos', { params })
            setMovements(response.data)
        } catch (error) {
            console.error('Error cargando movimientos:', error)
        }
    }

    if (loading) return <div className="text-center py-8">Cargando...</div>

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Panel de Inventario Oculto</h1>
            <p className="text-red-600 mb-6">⚠️ Panel confidencial - Solo visible para analistas de inventario</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Alertas Activas</h3>
                    <p className="text-3xl font-bold text-red-600">{stats.totalAlerts || 0}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Técnicos Activos</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalTechs || 0}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Sobre-consumos</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {stats.alertsByType?.over_consumption || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Stock Bajo</h3>
                    <p className="text-3xl font-bold text-yellow-600">
                        {stats.alertsByType?.low_stock || 0}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded shadow">
                <div className="border-b">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('alerts')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'alerts'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Alertas ({alerts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('technicians')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'technicians'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Técnicos ({technicians.length})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('movements')
                                loadMovements()
                            }}
                            className={`px-6 py-3 font-semibold ${activeTab === 'movements'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Movimientos Ocultos
                        </button>
                    </div>
                </div>

                {activeTab === 'alerts' && (
                    <div>
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No hay alertas pendientes</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Tipo</th>
                                        <th className="p-3 text-left">Descripción</th>
                                        <th className="p-3 text-left">OT</th>
                                        <th className="p-3 text-left">Técnico</th>
                                        <th className="p-3 text-left">Fecha</th>
                                        <th className="p-3 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map(alert => (
                                        <tr key={alert._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                                    {alert.tipo}
                                                </span>
                                            </td>
                                            <td className="p-3">{alert.descripcion}</td>
                                            <td className="p-3 font-mono text-sm">{alert.order_id || '-'}</td>
                                            <td className="p-3">{alert.tecnico_id || '-'}</td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => resolveAlert(alert._id)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Resolver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'technicians' && (
                    <div className="p-4">
                        {technicians.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No hay técnicos registrados</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {technicians.map(tech => (
                                    <div key={tech._id} className="border rounded p-4 hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg">{tech.nombre}</h3>
                                                <p className="text-sm text-gray-600">{tech.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${tech.estado === 'activo'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-200 text-gray-800'
                                                }`}>
                                                {tech.estado}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Link
                                                to={`/inventario/tecnico/${tech._id}`}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Ver Inventario →
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('movements')
                                                    loadMovements(tech._id)
                                                }}
                                                className="text-purple-600 hover:underline text-sm"
                                            >
                                                Ver Movimientos →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'movements' && (
                    <div className="p-4">
                        {movements.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay movimientos ocultos. Haz clic en "Ver Movimientos" de un técnico.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Fecha</th>
                                        <th className="p-2 text-left">Técnico</th>
                                        <th className="p-2 text-left">Material</th>
                                        <th className="p-2 text-left">Tipo</th>
                                        <th className="p-2 text-left">Cantidad</th>
                                        <th className="p-2 text-left">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map(mov => (
                                        <tr key={mov._id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{new Date(mov.fecha).toLocaleString()}</td>
                                            <td className="p-2">{mov.tecnico_id}</td>
                                            <td className="p-2">{mov.material_id}</td>
                                            <td className="p-2">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    {mov.tipo}
                                                </span>
                                            </td>
                                            <td className="p-2 font-semibold">{mov.cantidad}</td>
                                            <td className="p-2 text-gray-600">{mov.motivo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
