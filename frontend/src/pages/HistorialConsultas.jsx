import { useState, useEffect } from 'react'
import api from '../services/api'

export default function HistorialConsultas() {
    const [predictions, setPredictions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [selectedPrediction, setSelectedPrediction] = useState(null)
    const [showLabelModal, setShowLabelModal] = useState(false)

    useEffect(() => {
        loadPredictions()
    }, [filter])

    const loadPredictions = async () => {
        try {
            const params = filter !== 'all' ? { decision: filter } : {}
            const response = await api.get('/ai/predictions', { params })
            setPredictions(response.data)
        } catch (error) {
            console.error('Error cargando predicciones:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLabelPrediction = async (predictionId, label) => {
        try {
            await api.put(`/ai/predictions/${predictionId}/label`, { label_after: label })
            alert('Predicción etiquetada exitosamente')
            setShowLabelModal(false)
            loadPredictions()
        } catch (error) {
            alert('Error al etiquetar predicción')
        }
    }

    const getDecisionColor = (decision) => {
        const colors = {
            permitido: 'bg-green-100 text-green-800',
            imposible: 'bg-red-100 text-red-800',
            requiere_verificacion: 'bg-yellow-100 text-yellow-800'
        }
        return colors[decision] || 'bg-gray-100'
    }

    if (loading) return <div className="text-center py-8">Cargando...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Historial de Predicciones IA</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('permitido')}
                        className={`px-4 py-2 rounded ${filter === 'permitido' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                    >
                        Permitidas
                    </button>
                    <button
                        onClick={() => setFilter('imposible')}
                        className={`px-4 py-2 rounded ${filter === 'imposible' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
                    >
                        Imposibles
                    </button>
                    <button
                        onClick={() => setFilter('requiere_verificacion')}
                        className={`px-4 py-2 rounded ${filter === 'requiere_verificacion' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
                    >
                        Requiere Verificación
                    </button>
                </div>
            </div>

            <div className="bg-white rounded shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Consultas Realizadas ({predictions.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">Cargando...</div>
                ) : predictions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay predicciones registradas</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Fecha</th>
                                <th className="p-3 text-left">OT</th>
                                <th className="p-3 text-left">Decisión</th>
                                <th className="p-3 text-left">Confianza</th>
                                <th className="p-3 text-left">Razones</th>
                                <th className="p-3 text-left">Etiqueta</th>
                                <th className="p-3 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map(pred => (
                                <tr key={pred._id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm">{new Date(pred.timestamp).toLocaleString()}</td>
                                    <td className="p-3 font-mono text-sm">{pred.order_id}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getDecisionColor(pred.decision)}`}>
                                            {pred.decision}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold">{(pred.confidence * 100).toFixed(1)}%</td>
                                    <td className="p-3 text-sm text-gray-600">
                                        {pred.reasons?.slice(0, 2).join(', ') || '-'}
                                    </td>
                                    <td className="p-3">
                                        {pred.label_after ? (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                {pred.label_after}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Sin etiquetar</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => {
                                                setSelectedPrediction(pred)
                                                setShowLabelModal(true)
                                            }}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Etiquetar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showLabelModal && selectedPrediction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Etiquetar Predicción</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Predicción: <span className="font-semibold">{selectedPrediction.decision}</span>
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleLabelPrediction(selectedPrediction._id, 'correcto')}
                                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                            >
                                ✓ Correcto
                            </button>
                            <button
                                onClick={() => handleLabelPrediction(selectedPrediction._id, 'incorrecto')}
                                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                            >
                                ✗ Incorrecto
                            </button>
                            <button
                                onClick={() => handleLabelPrediction(selectedPrediction._id, 'parcial')}
                                className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
                            >
                                ~ Parcialmente Correcto
                            </button>
                            <button
                                onClick={() => setShowLabelModal(false)}
                                className="w-full bg-gray-300 py-2 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
