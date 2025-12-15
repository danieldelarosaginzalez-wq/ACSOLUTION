import { useState } from 'react'
import PolizaManagerWithMap from './PolizaManagerWithMap'
import { polizaService } from '../services/polizaService'

export default function PolizaManager({ onPolizaSelected, showCreateButton = true, showMap = false }) {
    // Si showMap es true, usar el componente con mapa
    if (showMap) {
        return <PolizaManagerWithMap onPolizaSelected={onPolizaSelected} />;
    }

    // Mantener funcionalidad original para compatibilidad
    const [polizaNumber, setPolizaNumber] = useState('')
    const [polizaData, setPolizaData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newPoliza, setNewPoliza] = useState({
        poliza_number: '',
        descripcion: '',
        max_cost: '',
        entidades: ''
    })

    const searchPoliza = async () => {
        if (polizaNumber.length !== 6 || !/^\d+$/.test(polizaNumber)) {
            setError('La póliza debe ser un número de 6 dígitos')
            return
        }

        setLoading(true)
        setError('')
        try {
            const response = await polizaService.get(polizaNumber)
            setPolizaData(response.data)
            if (onPolizaSelected) {
                onPolizaSelected(response.data)
            }
        } catch (err) {
            setError('Póliza no encontrada')
            setPolizaData(null)
        } finally {
            setLoading(false)
        }
    }

    const createPoliza = async () => {
        if (newPoliza.poliza_number.length !== 6 || !/^\d+$/.test(newPoliza.poliza_number)) {
            alert('La póliza debe ser un número de 6 dígitos')
            return
        }

        try {
            const payload = {
                poliza_number: newPoliza.poliza_number,
                descripcion: newPoliza.descripcion,
                metadata: {
                    max_cost: newPoliza.max_cost ? parseFloat(newPoliza.max_cost) : null,
                    entidades: newPoliza.entidades ? newPoliza.entidades.split(',').map(e => e.trim()) : []
                },
                estado: 'activo'
            }

            await polizaService.create(payload)
            alert('Póliza creada exitosamente')
            setShowCreateModal(false)
            setPolizaNumber(newPoliza.poliza_number)
            searchPoliza()
        } catch (error) {
            alert(error.response?.data?.message || 'Error al crear póliza')
        }
    }

    const loadOTsByPoliza = async () => {
        if (!polizaData) return
        try {
            const response = await polizaService.getOTs(polizaData.poliza_number)
            setPolizaData({ ...polizaData, ots: response.data })
        } catch (error) {
            console.error('Error cargando OTs:', error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    maxLength={6}
                    placeholder="Número de póliza (6 dígitos)"
                    value={polizaNumber}
                    onChange={(e) => setPolizaNumber(e.target.value)}
                    className="flex-1 border px-3 py-2 rounded"
                />
                <button
                    onClick={searchPoliza}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
                {showCreateButton && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        + Crear
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {polizaData && (
                <div className="bg-white border rounded p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold font-mono">{polizaData.poliza_number}</h3>
                            <p className="text-gray-600">{polizaData.descripcion}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm ${polizaData.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {polizaData.estado}
                        </span>
                    </div>

                    {polizaData.metadata && (
                        <div className="border-t pt-3 space-y-2">
                            {polizaData.metadata.max_cost && (
                                <div>
                                    <span className="text-sm text-gray-600">Límite de costo: </span>
                                    <span className="font-semibold">${polizaData.metadata.max_cost.toLocaleString()}</span>
                                </div>
                            )}
                            {polizaData.metadata.entidades && polizaData.metadata.entidades.length > 0 && (
                                <div>
                                    <span className="text-sm text-gray-600">Entidades: </span>
                                    <span className="font-semibold">{polizaData.metadata.entidades.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={loadOTsByPoliza}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Ver OTs vinculadas
                    </button>

                    {polizaData.ots && (
                        <div className="border-t pt-3">
                            <h4 className="font-semibold mb-2">OTs Vinculadas ({polizaData.ots.length})</h4>
                            {polizaData.ots.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay OTs vinculadas</p>
                            ) : (
                                <ul className="space-y-1">
                                    {polizaData.ots.map(ot => (
                                        <li key={ot._id} className="text-sm">
                                            <span className="font-mono">{ot.codigo}</span> - {ot.cliente} ({ot.estado})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal para crear póliza */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Crear Nueva Póliza</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Número de Póliza (6 dígitos) *</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={newPoliza.poliza_number}
                                    onChange={(e) => setNewPoliza({ ...newPoliza, poliza_number: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Descripción *</label>
                                <textarea
                                    required
                                    value={newPoliza.descripcion}
                                    onChange={(e) => setNewPoliza({ ...newPoliza, descripcion: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Límite de Costo (opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newPoliza.max_cost}
                                    onChange={(e) => setNewPoliza({ ...newPoliza, max_cost: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    placeholder="ej: 50000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Entidades (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={newPoliza.entidades}
                                    onChange={(e) => setNewPoliza({ ...newPoliza, entidades: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    placeholder="ej: CFE, PEMEX"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={createPoliza}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Crear Póliza
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
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
