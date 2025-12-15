import { useState, useEffect } from 'react'
import { polizaService } from '../services/polizaService'

export default function OTForm({ onSubmit, onPredictMaterials, initialData = {} }) {
    const [formData, setFormData] = useState({
        cliente: initialData.cliente || '',
        direccion: initialData.direccion || '',
        tipo_trabajo: initialData.tipo_trabajo || '',
        poliza: initialData.poliza_number || '',
        notas: initialData.notas || ''
    })

    const [polizaValid, setPolizaValid] = useState(null)
    const [polizaError, setPolizaError] = useState('')
    const [showCreatePoliza, setShowCreatePoliza] = useState(false)
    const [polizaData, setPolizaData] = useState(null)
    const [loadingPoliza, setLoadingPoliza] = useState(false)

    // Trigger AI prediction when tipo_trabajo changes
    useEffect(() => {
        if (formData.tipo_trabajo && onPredictMaterials) {
            onPredictMaterials(formData.tipo_trabajo, formData.cliente)
        }
    }, [formData.tipo_trabajo, formData.cliente])

    const validatePoliza = async (polizaNumber) => {
        if (polizaNumber.length !== 6 || !/^\d+$/.test(polizaNumber)) {
            setPolizaError('La póliza debe ser un número de 6 dígitos')
            setPolizaValid(false)
            setPolizaData(null)
            return
        }

        setLoadingPoliza(true)
        try {
            // Obtener datos completos de la póliza
            const response = await polizaService.get(polizaNumber)
            const poliza = response.data

            setPolizaValid(true)
            setPolizaError('')
            setPolizaData(poliza)
            setShowCreatePoliza(false)

            // Auto-llenar los campos con los datos de la póliza
            setFormData(prev => ({
                ...prev,
                cliente: poliza.cliente || prev.cliente,
                direccion: poliza.direccion || prev.direccion
            }))

        } catch (error) {
            setPolizaValid(false)
            setPolizaError('Póliza no encontrada')
            setPolizaData(null)
            setShowCreatePoliza(true)
        } finally {
            setLoadingPoliza(false)
        }
    }

    const handlePolizaBlur = () => {
        if (formData.poliza) {
            validatePoliza(formData.poliza)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!polizaValid) {
            alert('Debe ingresar una póliza válida')
            return
        }
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            {/* Orden reorganizado: Primero la póliza */}
            <div>
                <label className="block font-semibold mb-1">Póliza (6 dígitos) *</label>
                <div className="relative">
                    <input
                        type="text"
                        required
                        maxLength={6}
                        value={formData.poliza}
                        onChange={(e) => setFormData({ ...formData, poliza: e.target.value })}
                        onBlur={handlePolizaBlur}
                        className={`w-full border px-3 py-2 rounded ${polizaValid === true ? 'border-green-500' :
                            polizaValid === false ? 'border-red-500' : ''
                            }`}
                        placeholder="Ej: 123456"
                    />
                    {loadingPoliza && (
                        <div className="absolute right-3 top-2">
                            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>

                {polizaError && <p className="text-red-500 text-sm mt-1">{polizaError}</p>}

                {/* Mostrar datos de la póliza encontrada */}
                {polizaData && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <span className="text-sm font-semibold text-green-800">
                                Póliza encontrada - Datos cargados automáticamente
                            </span>
                        </div>
                        <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Cliente:</strong> {polizaData.cliente}</p>
                            <p><strong>Dirección:</strong> {polizaData.direccion}</p>
                            {polizaData.ubicacion && (
                                <p className="flex items-center gap-1">
                                    <span>📍</span>
                                    <strong>Ubicación GPS:</strong> Disponible
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {showCreatePoliza && (
                    <button
                        type="button"
                        onClick={() => alert('Funcionalidad de crear póliza pendiente')}
                        className="mt-2 text-blue-600 underline text-sm"
                    >
                        Crear nueva póliza
                    </button>
                )}
            </div>

            <div>
                <label className="block font-semibold mb-1 flex items-center gap-2">
                    Cliente *
                    {polizaData && <span className="text-xs text-green-600 font-normal">📋 Desde póliza</span>}
                </label>
                <input
                    type="text"
                    required
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className={`w-full border px-3 py-2 rounded ${polizaData ? 'bg-green-50 border-green-300' : ''}`}
                    readOnly={!!polizaData}
                    placeholder={polizaData ? "Cargado desde póliza" : "Nombre del cliente"}
                />
            </div>

            <div>
                <label className="block font-semibold mb-1 flex items-center gap-2">
                    Dirección *
                    {polizaData && <span className="text-xs text-green-600 font-normal">📍 Desde póliza</span>}
                </label>
                <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className={`w-full border px-3 py-2 rounded ${polizaData ? 'bg-green-50 border-green-300' : ''}`}
                    readOnly={!!polizaData}
                    placeholder={polizaData ? "Cargada desde póliza" : "Dirección del trabajo"}
                />
            </div>

            <div>
                <label className="block font-semibold mb-1 flex items-center gap-2">
                    Tipo de Trabajo *
                    {onPredictMaterials && (
                        <span className="text-xs text-purple-600 font-normal">
                            🤖 IA analizará materiales
                        </span>
                    )}
                </label>
                <select
                    required
                    value={formData.tipo_trabajo}
                    onChange={(e) => setFormData({ ...formData, tipo_trabajo: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                >
                    <option value="">Seleccione...</option>
                    <option value="instalacion">Instalación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="reparacion">Reparación</option>
                    <option value="inspeccion">Inspección</option>
                </select>
            </div>



            <div>
                <label className="block font-semibold mb-1">Notas</label>
                <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    rows={3}
                />
            </div>

            <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
                Crear Orden de Trabajo
            </button>
        </form>
    )
}
