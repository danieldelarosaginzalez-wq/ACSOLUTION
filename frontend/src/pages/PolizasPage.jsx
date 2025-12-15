import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { polizaService } from '../services/polizaService'
import PolizaManager from '../components/PolizaManager'

export default function PolizasPage() {
    const navigate = useNavigate()
    const [allPolizas, setAllPolizas] = useState([])
    const [selectedPoliza, setSelectedPoliza] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showSearch, setShowSearch] = useState(false)

    // Cargar todas las pólizas al iniciar
    useEffect(() => {
        loadAllPolizas()
    }, [])

    const loadAllPolizas = async () => {
        try {
            setLoading(true)
            const response = await polizaService.getAll()
            setAllPolizas(response.data || [])
        } catch (err) {
            setError('Error al cargar pólizas')
            console.error('Error loading polizas:', err)
        } finally {
            setLoading(false)
        }
    }

    const handlePolizaSelected = (poliza) => {
        setSelectedPoliza(poliza)
        // Recargar la lista para reflejar cambios
        loadAllPolizas()
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Gestión de Pólizas</h1>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
                    >
                        {showSearch ? '📋 Ver Lista' : '🔍 Buscar/Crear'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Componente de búsqueda/creación */}
            {showSearch && (
                <div className="bg-white rounded shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        🔍 Buscar o Crear Póliza
                    </h2>
                    <PolizaManager
                        onPolizaSelected={handlePolizaSelected}
                        showMap={true}
                    />
                </div>
            )}

            {/* Lista de todas las pólizas */}
            <div className="bg-white rounded shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        📋 Todas las Pólizas ({allPolizas.length})
                    </h2>
                    <button
                        onClick={loadAllPolizas}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                    >
                        {loading ? '🔄' : '🔄 Actualizar'}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Cargando pólizas...</p>
                    </div>
                ) : allPolizas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No hay pólizas registradas</p>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="mt-2 text-blue-600 hover:underline"
                        >
                            Crear la primera póliza
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {allPolizas.map((poliza) => (
                            <div
                                key={poliza._id}
                                className={`border rounded-lg p-4 transition-all hover:shadow-md ${selectedPoliza?._id === poliza._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold font-mono text-blue-900">
                                                📄 {poliza.poliza_number}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${poliza.estado === 'activa' || poliza.estado === 'activo'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {poliza.estado}
                                            </span>
                                            {poliza.ubicacion && (
                                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                                    📍 Ubicada
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-sm">
                                            <div>
                                                <span className="text-gray-600">Cliente:</span>
                                                <span className="ml-2 font-medium">{poliza.cliente || 'No definido'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Dirección:</span>
                                                <span className="ml-2">{poliza.direccion || 'No definida'}</span>
                                            </div>
                                            {poliza.created_at && (
                                                <div>
                                                    <span className="text-gray-600">Creada:</span>
                                                    <span className="ml-2">{new Date(poliza.created_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedPoliza(poliza)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Ver Detalles
                                        </button>
                                        <button
                                            onClick={() => navigate(`/crear-ot?poliza=${poliza.poliza_number}`)}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                        >
                                            Crear OT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detalles de póliza seleccionada */}
            {selectedPoliza && (
                <div className="mt-6 bg-white rounded shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        📄 Detalles de Póliza {selectedPoliza.poliza_number}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Número</label>
                                <p className="text-lg font-mono">{selectedPoliza.poliza_number}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Estado</label>
                                <p className="capitalize">{selectedPoliza.estado}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Cliente</label>
                                <p>{selectedPoliza.cliente || 'No definido'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                                <p>{selectedPoliza.direccion || 'No definida'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Ubicación</label>
                                {selectedPoliza.ubicacion ? (
                                    <div className="text-sm">
                                        <p className="text-green-600 font-medium">✅ Ubicada</p>
                                        <p className="text-gray-600">
                                            Lat: {selectedPoliza.ubicacion.lat?.toFixed(6)}<br />
                                            Lng: {selectedPoliza.ubicacion.lng?.toFixed(6)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-red-600">❌ Sin ubicar</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Fecha de Creación</label>
                                <p>{selectedPoliza.created_at ? new Date(selectedPoliza.created_at).toLocaleString() : 'No disponible'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => navigate(`/crear-ot?poliza=${selectedPoliza.poliza_number}`)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            ➕ Crear OT
                        </button>
                        <button
                            onClick={() => setSelectedPoliza(null)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
