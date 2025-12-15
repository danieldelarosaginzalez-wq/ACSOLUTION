import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OTForm from '../components/OTForm'
import PolizaManager from '../components/PolizaManager'
import { otService } from '../services/otService'
import { aiService } from '../services/aiService'
import { polizaService } from '../services/polizaService'

export default function CrearOT() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [selectedPoliza, setSelectedPoliza] = useState(null)
    const [showPolizaManager, setShowPolizaManager] = useState(false)
    const [aiPrediction, setAiPrediction] = useState(null)
    const [loadingPrediction, setLoadingPrediction] = useState(false)

    // Cargar póliza desde URL si viene como parámetro
    useEffect(() => {
        const polizaFromUrl = searchParams.get('poliza')
        if (polizaFromUrl) {
            loadPolizaFromUrl(polizaFromUrl)
        }
    }, [searchParams])

    const loadPolizaFromUrl = async (polizaNumber) => {
        try {
            const response = await polizaService.get(polizaNumber)
            setSelectedPoliza(response.data)
            console.log('✅ Póliza cargada desde URL:', response.data.poliza_number)
        } catch (error) {
            console.error('Error cargando póliza desde URL:', error)
            // Si no se puede cargar, mostrar el manager para que el usuario busque/cree
            setShowPolizaManager(true)
        }
    }

    const handlePredictMaterials = async (tipo_trabajo, cliente) => {
        setLoadingPrediction(true)
        try {
            const response = await aiService.predictMaterials(tipo_trabajo, cliente)
            setAiPrediction(response.data)
        } catch (error) {
            console.error('Error al predecir materiales:', error)
            setAiPrediction(null)
        } finally {
            setLoadingPrediction(false)
        }
    }

    const handleSubmit = async (formData) => {
        try {
            // Validar que haya una póliza seleccionada con ubicación
            if (selectedPoliza && !selectedPoliza.ubicacion) {
                alert('⚠️ La póliza seleccionada no tiene ubicación. Por favor, ubícala en el mapa antes de crear la OT.');
                return;
            }

            const otData = {
                cliente: formData.cliente,
                direccion: formData.direccion,
                tipo_trabajo: formData.tipo_trabajo,
                poliza_number: formData.poliza,
                notas: formData.notas
            };

            // Si hay una póliza seleccionada con ubicación, incluir esos datos
            if (selectedPoliza) {
                otData.poliza_number = selectedPoliza.poliza_number;

                if (selectedPoliza.ubicacion) {
                    otData.ubicacion = selectedPoliza.ubicacion;
                    otData.direccion = selectedPoliza.direccion || formData.direccion;
                    console.log('✅ OT creada con ubicación:', otData.ubicacion);
                } else {
                    console.warn('⚠️ Póliza sin ubicación');
                }
            }

            const response = await otService.create(otData);
            alert('✅ OT creada exitosamente con ubicación');
            navigate(`/ot/${response.data._id}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al crear OT');
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Nueva Orden de Trabajo</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <OTForm
                        onSubmit={handleSubmit}
                        onPredictMaterials={handlePredictMaterials}
                        initialData={selectedPoliza ? {
                            poliza_number: selectedPoliza.poliza_number,
                            cliente: selectedPoliza.cliente,
                            direccion: selectedPoliza.direccion
                        } : {}}
                    />
                </div>

                <div className="space-y-6">
                    {/* Predicción de Materiales IA */}
                    {aiPrediction && (
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="text-purple-600">🤖</span>
                                Materiales Sugeridos por IA
                            </h2>

                            {aiPrediction.success ? (
                                <div>
                                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
                                        <p className="text-sm text-purple-800">
                                            <strong>Confianza:</strong> {(aiPrediction.confidence * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-sm text-purple-800">
                                            <strong>Análisis:</strong> {aiPrediction.ordenes_analizadas} trabajos similares
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {aiPrediction.materiales_sugeridos.map((mat, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded border">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{mat.nombre}</p>
                                                        <p className="text-sm text-gray-600">{mat.categoria}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-purple-600">
                                                            {mat.cantidad_sugerida} {mat.unidad}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Usado {mat.frecuencia_uso}% de las veces
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm text-yellow-800">{aiPrediction.message}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {loadingPrediction && (
                        <div className="bg-white p-6 rounded shadow">
                            <p className="text-center text-gray-600">Analizando trabajos similares...</p>
                        </div>
                    )}

                    {/* Gestión de Pólizas con Mapa */}
                    <div className="bg-white p-6 rounded shadow sticky top-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            🗺️ Gestión de Pólizas
                        </h2>
                        <button
                            onClick={() => setShowPolizaManager(!showPolizaManager)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 mb-4 font-medium transition-all shadow-md"
                        >
                            {showPolizaManager ? '🔼 Ocultar Gestión' : '🔽 Buscar/Crear/Ubicar Póliza'}
                        </button>

                        {showPolizaManager && (
                            <PolizaManager
                                onPolizaSelected={setSelectedPoliza}
                                showMap={true}
                            />
                        )}

                        {selectedPoliza && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-green-600 text-lg">✅</span>
                                    <p className="text-sm font-semibold text-green-800">
                                        Póliza seleccionada: <strong>{selectedPoliza.poliza_number}</strong>
                                    </p>
                                </div>
                                {selectedPoliza.ubicacion && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600 text-sm">📍</span>
                                        <p className="text-xs text-green-700">
                                            Ubicación: {selectedPoliza.direccion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
