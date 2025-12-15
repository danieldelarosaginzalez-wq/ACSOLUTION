import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { otService } from '../services/otService'
import TechnicianConsumptionForm from '../components/TechnicianConsumptionForm'
import MaterialReturnForm from '../components/MaterialReturnForm'
import PhotosUploaderByStage from '../components/PhotosUploaderByStage'
import api from '../services/api'

export default function OTParaTecnico() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [ot, setOt] = useState(null)
    const [photos, setPhotos] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOT()
    }, [id])

    const loadOT = async () => {
        try {
            const response = await otService.getById(id)
            setOt(response.data)
        } catch (error) {
            console.error('Error cargando OT:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleConsumptionSubmit = async (consumptionData) => {
        try {
            const formData = new FormData()
            formData.append('poliza_number', consumptionData.poliza_number)
            formData.append('consumos', JSON.stringify(consumptionData.consumos))

            // Agregar fotos
            Object.entries(photos).forEach(([etapa, file]) => {
                if (file) {
                    formData.append(`foto_${etapa}`, file)
                }
            })

            await otService.registerConsumption(id, formData)
            alert('✅ Consumos registrados exitosamente')
            loadOT() // Recargar OT para ver los cambios
        } catch (error) {
            console.error('Error al registrar consumos:', error)
            alert(error.response?.data?.message || 'Error al registrar consumos')
        }
    }

    const handleCompleteOrder = async () => {
        if (!ot.materiales_utilizados || ot.materiales_utilizados.length === 0) {
            alert('⚠️ Debe registrar al menos un consumo de material antes de completar la orden')
            return
        }

        if (!confirm('¿Está seguro de completar esta orden? El analista la revisará antes de cerrarla.')) {
            return
        }

        try {
            await otService.complete(id)
            alert('✅ Orden completada exitosamente. Esperando revisión del analista.')
            navigate('/')
        } catch (error) {
            console.error('Error al completar orden:', error)
            alert(error.response?.data?.message || 'Error al completar orden')
        }
    }

    if (loading) return <div className="text-center py-8">Cargando...</div>
    if (!ot) return <div className="text-center py-8">OT no encontrada</div>

    const canComplete = ot.estado === 'en_proceso' && ot.materiales_utilizados?.length > 0

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mi OT: {ot.codigo}</h1>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${ot.estado === 'asignada' ? 'bg-blue-100 text-blue-800' :
                        ot.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                            ot.estado === 'finalizada' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {ot.estado === 'asignada' ? 'Asignada' :
                            ot.estado === 'en_proceso' ? 'En Proceso' :
                                ot.estado === 'finalizada' ? 'Finalizada - Esperando Revisión' :
                                    ot.estado}
                    </span>
                </div>
            </div>

            {ot.estado === 'finalizada' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-semibold">
                        ✅ Orden completada exitosamente
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                        El analista revisará tu trabajo y cerrará la orden. Recibirás retroalimentación si es necesario.
                    </p>
                </div>
            )}

            <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">Información</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Cliente</label>
                        <p className="font-semibold">{ot.cliente}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Dirección</label>
                        <p className="font-semibold">{ot.direccion}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Póliza</label>
                        <p className="font-semibold font-mono">{ot.poliza_number}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Tipo de Trabajo</label>
                        <p className="font-semibold capitalize">{ot.tipo_trabajo}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <PhotosUploaderByStage onPhotosChange={setPhotos} />
            </div>

            {ot.estado !== 'finalizada' && ot.estado !== 'cerrada' && (
                <TechnicianConsumptionForm
                    otId={id}
                    poliza={ot.poliza_number}
                    materialesSugeridos={ot.materiales_sugeridos}
                    onSubmit={handleConsumptionSubmit}
                />
            )}

            {/* Formulario de devolución de materiales sobrantes */}
            {(ot.estado === 'en_proceso' || ot.estado === 'pendiente_revision') &&
                ot.materiales_apartados && ot.materiales_apartados.length > 0 && (
                    <div className="mt-6">
                        <MaterialReturnForm
                            orderId={id}
                            materialesApartados={ot.materiales_apartados.map(m => ({
                                ...m,
                                cantidad_usada: ot.materiales_utilizados?.find(
                                    u => u.material_id._id === m.material_id._id
                                )?.cantidad || 0
                            }))}
                            onSuccess={loadOT}
                        />
                    </div>
                )}

            {canComplete && (
                <div className="mt-6 bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-semibold mb-3">Completar Orden</h3>
                    <p className="text-gray-600 mb-4">
                        Una vez que hayas registrado todos los consumos y subido las fotos, puedes completar la orden.
                        El analista la revisará antes de cerrarla definitivamente.
                    </p>
                    <button
                        onClick={handleCompleteOrder}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                    >
                        ✓ Completar Orden
                    </button>
                </div>
            )}

            {ot.evidencias && Object.keys(ot.evidencias).length > 0 && (
                <div className="mt-6 bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-semibold mb-4">📸 Mis Fotos Subidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'inicial', label: 'Foto Inicial', icon: '📸', desc: 'Estado antes de iniciar' },
                            { key: 'durante', label: 'Foto Durante', icon: '🔧', desc: 'Trabajo en proceso' },
                            { key: 'materiales', label: 'Foto Materiales', icon: '📦', desc: 'Materiales usados' },
                            { key: 'final', label: 'Foto Final', icon: '✅', desc: 'Estado al finalizar' }
                        ].map(({ key, label, icon, desc }) => (
                            <div key={key} className="border-2 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 p-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <span>{icon}</span>
                                            {label}
                                        </h4>
                                        {ot.evidencias?.[`foto_${key}`] ? (
                                            <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                                                ✓ Subida
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-300 text-gray-700 rounded-full text-xs">
                                                Pendiente
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{desc}</p>
                                </div>
                                <div className="p-3">
                                    {ot.evidencias?.[`foto_${key}`]?.meta?.filename ? (
                                        <div>
                                            <img
                                                src={`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`}
                                                alt={label}
                                                className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`, '_blank')}
                                                onError={(e) => {
                                                    e.target.style.display = 'none'
                                                    e.target.nextSibling.style.display = 'block'
                                                }}
                                            />
                                            <div style={{ display: 'none' }} className="bg-gray-100 p-4 rounded text-center">
                                                <p className="text-gray-500 text-sm">No se pudo cargar la imagen</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                🔍 Click para ver en tamaño completo
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-8 rounded text-center">
                                            <div className="text-4xl mb-2 opacity-20">{icon}</div>
                                            <p className="text-gray-400 text-sm">Aún no subida</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {ot.materiales_utilizados?.length > 0 && (
                <div className="mt-6 bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-semibold mb-3">Materiales Registrados</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Material</th>
                                <th className="p-2 text-left">Cantidad</th>
                                <th className="p-2 text-left">Unidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ot.materiales_utilizados.map((m, i) => (
                                <tr key={i} className="border-b">
                                    <td className="p-2">{m.material_id?.nombre || m.material_id}</td>
                                    <td className="p-2 font-bold">{m.cantidad}</td>
                                    <td className="p-2">{m.unidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
