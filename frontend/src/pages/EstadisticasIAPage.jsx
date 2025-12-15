import { useState, useEffect } from 'react'
import { aiService } from '../services/aiService'
import { materialService } from '../services/materialService'

export default function EstadisticasIAPage() {
    const [stats, setStats] = useState(null)
    const [consumptionStats, setConsumptionStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tipoTrabajo, setTipoTrabajo] = useState('all')

    useEffect(() => {
        loadStats()
    }, [tipoTrabajo])

    const loadStats = async () => {
        try {
            const filters = tipoTrabajo !== 'all' ? { tipo_trabajo: tipoTrabajo } : {}
            const [aiStatsRes, consumptionRes] = await Promise.all([
                aiService.getStats(),
                materialService.getConsumptionStats(filters)
            ])
            setStats(aiStatsRes.data)
            setConsumptionStats(consumptionRes.data)
        } catch (error) {
            console.error('Error cargando estadísticas:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center py-8">Cargando estadísticas...</div>

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Estadísticas de IA y Consumo</h1>

            {/* Estadísticas de IA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Total Predicciones</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Precisión</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {((stats?.accuracy || 0) * 100).toFixed(1)}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Confianza Promedio</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {((stats?.avg_confidence || 0) * 100).toFixed(1)}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-600 text-sm">Etiquetadas</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {Object.values(stats?.by_label || {}).reduce((a, b) => a + b, 0)}
                    </p>
                </div>
            </div>

            {/* Decisiones de IA */}
            <div className="bg-white rounded shadow mb-6 p-6">
                <h2 className="text-xl font-semibold mb-4">Distribución de Decisiones</h2>
                <div className="grid grid-cols-3 gap-4">
                    {stats?.by_decision && Object.entries(stats.by_decision).map(([decision, count]) => (
                        <div key={decision} className="border rounded p-4">
                            <h3 className="font-semibold capitalize mb-2">{decision.replace('_', ' ')}</h3>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm text-gray-600">
                                {((count / stats.total) * 100).toFixed(1)}% del total
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filtro de Tipo de Trabajo */}
            <div className="bg-white rounded shadow p-4 mb-6">
                <div className="flex gap-2 items-center">
                    <span className="font-semibold">Tipo de Trabajo:</span>
                    <button
                        onClick={() => setTipoTrabajo('all')}
                        className={`px-3 py-1 rounded ${tipoTrabajo === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    {['instalacion', 'mantenimiento', 'reparacion', 'inspeccion'].map(tipo => (
                        <button
                            key={tipo}
                            onClick={() => setTipoTrabajo(tipo)}
                            className={`px-3 py-1 rounded capitalize ${tipoTrabajo === tipo ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            {tipo}
                        </button>
                    ))}
                </div>
            </div>

            {/* Estadísticas de Consumo */}
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">
                        Consumo de Materiales
                        {tipoTrabajo !== 'all' && ` - ${tipoTrabajo}`}
                    </h2>
                    <p className="text-sm text-gray-600">
                        Basado en {consumptionStats?.total_orders || 0} órdenes completadas
                    </p>
                </div>

                {consumptionStats?.consumption_by_material?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay datos de consumo para este filtro
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Material</th>
                                <th className="p-3 text-right">Total Consumido</th>
                                <th className="p-3 text-right">Veces Usado</th>
                                <th className="p-3 text-right">Promedio por OT</th>
                                <th className="p-3 text-right">Frecuencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionStats?.consumption_by_material?.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-mono text-sm">{item.material_id}</td>
                                    <td className="p-3 text-right font-bold">{item.total_cantidad.toFixed(2)}</td>
                                    <td className="p-3 text-right">{item.total_usos}</td>
                                    <td className="p-3 text-right text-blue-600 font-semibold">
                                        {item.promedio.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                            {((item.total_usos / consumptionStats.total_orders) * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
                <h3 className="font-bold text-blue-800 mb-2">💡 Cómo funciona la IA</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• La IA analiza trabajos similares completados anteriormente</li>
                    <li>• Detecta patrones de consumo entre diferentes técnicos</li>
                    <li>• Sugiere materiales basándose en promedios históricos</li>
                    <li>• Mejora sus predicciones con cada OT completada</li>
                    <li>• Requiere mínimo 5 trabajos similares para predicciones precisas</li>
                </ul>
            </div>
        </div>
    )
}
