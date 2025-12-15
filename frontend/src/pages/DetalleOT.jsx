import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { otService } from '../services/otService'
import { useAuthStore } from '../store/authStore'
import AssignTechModal from '../components/AssignTechModal'
import PhotosUploaderByStage from '../components/PhotosUploaderByStage'
import SignatureSection from '../components/SignatureSection'
import api from '../services/api'

export default function DetalleOT() {
    const { id } = useParams()
    const { user } = useAuthStore()
    const [ot, setOt] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('general')
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [iaPrediction, setIaPrediction] = useState(null)

    useEffect(() => {
        console.log('DetalleOT - id from useParams:', id, 'tipo:', typeof id)
        if (id) {
            loadOT()
        }
    }, [id])

    const loadOT = async () => {
        try {
            const response = await otService.getById(id)
            setOt(response.data)

            // Cargar predicción IA si existe
            if (response.data.ia_prediction_id) {
                loadIAPrediction(response.data.ia_prediction_id)
            }
        } catch (error) {
            console.error('Error cargando OT:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadIAPrediction = async (predictionId) => {
        try {
            const response = await api.get(`/ai/predictions/${predictionId}`)
            setIaPrediction(response.data)
        } catch (error) {
            console.error('Error cargando predicción IA:', error)
        }
    }

    const requestIAPrediction = async () => {
        try {
            const response = await api.post('/ai/predict', { order_id: id })
            setIaPrediction(response.data)
            alert('Predicción generada')
            loadOT()
        } catch (error) {
            alert('Error al generar predicción')
        }
    }

    const [editingMaterial, setEditingMaterial] = useState(null)

    const handleCloseOT = async () => {
        if (ot.estado !== 'finalizada') {
            alert('⚠️ La OT debe estar finalizada por el técnico antes de cerrarla')
            return
        }

        if (!confirm('¿Está seguro de cerrar esta OT? Esta acción indica que el trabajo fue revisado y aprobado.')) return

        try {
            await otService.close(id)
            alert('✅ OT cerrada exitosamente')
            loadOT()
        } catch (error) {
            alert(error.response?.data?.message || 'Error al cerrar OT')
        }
    }

    const handleUpdateMaterial = async (materialIndex, cantidad, observacion) => {
        try {
            await otService.updateMaterial(id, materialIndex, { cantidad, observacion })
            alert('✅ Material actualizado')
            setEditingMaterial(null)
            loadOT()
        } catch (error) {
            alert('Error al actualizar material')
        }
    }

    const handleDeleteMaterial = async (materialIndex) => {
        if (!confirm('¿Está seguro de eliminar este material?')) return
        try {
            await otService.deleteMaterial(id, materialIndex)
            alert('✅ Material eliminado')
            loadOT()
        } catch (error) {
            alert('Error al eliminar material')
        }
    }

    if (loading) return <div className="text-center py-8">Cargando...</div>
    if (!ot) return <div className="text-center py-8">OT no encontrada</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">OT: {ot.codigo}</h1>
                    <p className="text-gray-600">Estado: <span className="font-semibold capitalize">{ot.estado}</span></p>
                </div>
                <div className="flex gap-2">
                    {user?.rol === 'analista' && ot.estado === 'creada' && (
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Asignar Técnico
                        </button>
                    )}
                    {user?.rol === 'analista' && !ot.ia_prediction_id && (
                        <button
                            onClick={requestIAPrediction}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                            Solicitar Predicción IA
                        </button>
                    )}
                    {user?.rol === 'analista' && ot.estado === 'finalizada' && (
                        <button
                            onClick={handleCloseOT}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Cerrar OT
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded shadow">
                <div className="border-b">
                    <div className="flex overflow-x-auto">
                        {['general', 'materiales', 'evidencias', 'firmas', 'historial', 'ia_prediction'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 font-semibold capitalize whitespace-nowrap ${activeTab === tab
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {tab === 'ia_prediction' ? 'IA Prediction' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Cliente</label>
                                    <p className="font-semibold">{ot.cliente}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Póliza</label>
                                    <p className="font-semibold font-mono">{ot.poliza_number}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Dirección</label>
                                    <p className="font-semibold">{ot.direccion}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Tipo de Trabajo</label>
                                    <p className="font-semibold capitalize">{ot.tipo_trabajo}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Estado</label>
                                    <p className="font-semibold capitalize">{ot.estado}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Técnico Asignado</label>
                                    <p className="font-semibold">{ot.tecnico_nombre || 'Sin asignar'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'materiales' && (
                        <div>
                            <h3 className="font-semibold mb-3">Materiales Sugeridos</h3>
                            {ot.materiales_sugeridos?.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left">Material</th>
                                            <th className="p-2 text-left">Cantidad</th>
                                            <th className="p-2 text-left">Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ot.materiales_sugeridos.map((m, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="p-2">{m.material_id}</td>
                                                <td className="p-2">{m.cantidad}</td>
                                                <td className="p-2">{m.unidad}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500">No hay materiales sugeridos</p>
                            )}

                            {ot.materiales_utilizados?.length > 0 && (
                                <>
                                    <div className="flex justify-between items-center mt-6 mb-3">
                                        <h3 className="font-semibold">Materiales Utilizados</h3>
                                        {user?.rol === 'analista' && ot.estado === 'finalizada' && (
                                            <p className="text-sm text-gray-600">
                                                💡 Puede editar o eliminar materiales directamente
                                            </p>
                                        )}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-left">Material</th>
                                                <th className="p-2 text-left">Categoría</th>
                                                <th className="p-2 text-left">Cantidad</th>
                                                <th className="p-2 text-left">Unidad</th>
                                                <th className="p-2 text-left">Fecha</th>
                                                {user?.rol === 'analista' && ot.estado === 'finalizada' && (
                                                    <th className="p-2 text-left">Acciones</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ot.materiales_utilizados.map((m, i) => (
                                                editingMaterial === i ? (
                                                    <tr key={i} className="border-b bg-yellow-50">
                                                        <td className="p-2 font-semibold" colSpan="2">
                                                            {m.material_id?.nombre || m.material_id}
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                defaultValue={m.cantidad}
                                                                id={`cantidad-${i}`}
                                                                className="w-20 border px-2 py-1 rounded"
                                                            />
                                                        </td>
                                                        <td className="p-2">{m.unidad}</td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Observación"
                                                                id={`obs-${i}`}
                                                                className="w-full border px-2 py-1 rounded text-xs"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <button
                                                                onClick={() => {
                                                                    const cantidad = parseFloat(document.getElementById(`cantidad-${i}`).value)
                                                                    const obs = document.getElementById(`obs-${i}`).value
                                                                    handleUpdateMaterial(i, cantidad, obs)
                                                                }}
                                                                className="text-green-600 hover:underline text-xs mr-2"
                                                            >
                                                                ✓ Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingMaterial(null)}
                                                                className="text-gray-600 hover:underline text-xs"
                                                            >
                                                                ✗ Cancelar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={i} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 font-semibold">
                                                            {m.material_id?.nombre || m.material_id}
                                                        </td>
                                                        <td className="p-2 capitalize text-gray-600">
                                                            {m.material_id?.categoria || '-'}
                                                        </td>
                                                        <td className="p-2 font-bold text-blue-600">{m.cantidad}</td>
                                                        <td className="p-2">{m.unidad}</td>
                                                        <td className="p-2 text-gray-600">
                                                            {new Date(m.fecha).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        {user?.rol === 'analista' && ot.estado === 'finalizada' && (
                                                            <td className="p-2">
                                                                <button
                                                                    onClick={() => setEditingMaterial(i)}
                                                                    className="text-blue-600 hover:underline text-xs mr-2"
                                                                >
                                                                    ✏️ Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMaterial(i)}
                                                                    className="text-red-600 hover:underline text-xs"
                                                                >
                                                                    🗑️ Eliminar
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'evidencias' && (
                        <div>
                            <h3 className="font-semibold mb-4 text-xl">Evidencias Fotográficas</h3>

                            {/* Componente para subir fotos - técnicos en OT asignadas O analistas */}
                            {((user?.rol === 'tecnico' && ['asignada', 'en_proceso'].includes(ot.estado)) ||
                                user?.rol === 'analista') && (
                                    <div className="mb-6">
                                        {user?.rol === 'analista' && (
                                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
                                                <div className="flex items-center">
                                                    <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <p className="text-sm text-blue-700">
                                                        <strong>Modo Analista:</strong> Puede cargar, editar y eliminar fotos de evidencia
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {console.log('DetalleOT - Pasando evidencias:', ot.evidencias)}
                                        <PhotosUploaderByStage
                                            existingPhotos={ot.evidencias || {}}
                                            onUploadComplete={loadOT}
                                        />
                                    </div>
                                )}

                            {ot.estado === 'finalizada' && user?.rol === 'analista' && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-r-lg">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                                ⚠️ Orden Finalizada - Pendiente de Revisión
                                            </h3>
                                            <p className="text-yellow-700 text-sm mb-3">
                                                El técnico ha completado esta orden. Por favor revise:
                                            </p>
                                            <ul className="text-yellow-700 text-sm space-y-1 mb-4">
                                                <li className="flex items-center gap-2">
                                                    <span className={ot.evidencias?.foto_inicial ? 'text-green-600' : 'text-red-600'}>
                                                        {ot.evidencias?.foto_inicial ? '✓' : '✗'}
                                                    </span>
                                                    Foto inicial del sitio
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className={ot.evidencias?.foto_durante ? 'text-green-600' : 'text-red-600'}>
                                                        {ot.evidencias?.foto_durante ? '✓' : '✗'}
                                                    </span>
                                                    Foto durante el trabajo
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className={ot.evidencias?.foto_materiales ? 'text-green-600' : 'text-red-600'}>
                                                        {ot.evidencias?.foto_materiales ? '✓' : '✗'}
                                                    </span>
                                                    Foto de materiales
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className={ot.evidencias?.foto_final ? 'text-green-600' : 'text-red-600'}>
                                                        {ot.evidencias?.foto_final ? '✓' : '✗'}
                                                    </span>
                                                    Foto final del sitio
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className={ot.materiales_utilizados?.length > 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {ot.materiales_utilizados?.length > 0 ? '✓' : '✗'}
                                                    </span>
                                                    Materiales registrados ({ot.materiales_utilizados?.length || 0})
                                                </li>
                                            </ul>
                                            <button
                                                onClick={handleCloseOT}
                                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                                            >
                                                ✓ Aprobar y Cerrar Orden
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { key: 'inicial', label: 'Foto Inicial', desc: 'Estado del sitio antes de iniciar el trabajo', icon: '📸' },
                                    { key: 'durante', label: 'Foto Durante', desc: 'Proceso de trabajo en ejecución', icon: '🔧' },
                                    { key: 'materiales', label: 'Foto Materiales', desc: 'Materiales utilizados en el trabajo', icon: '📦' },
                                    { key: 'final', label: 'Foto Final', desc: 'Estado del sitio al finalizar el trabajo', icon: '✅' }
                                ].map(({ key, label, desc, icon }) => (
                                    <div key={key} className="border-2 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-lg flex items-center gap-2">
                                                    <span>{icon}</span>
                                                    {label}
                                                </h4>
                                                {ot.evidencias?.[`foto_${key}`] ? (
                                                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                                                        ✓ Cargada
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs">
                                                        Sin foto
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700">{desc}</p>
                                        </div>

                                        <div className="p-4">
                                            {ot.evidencias?.[`foto_${key}`]?.meta?.filename ? (
                                                <div>
                                                    <img
                                                        src={`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`}
                                                        alt={label}
                                                        className="w-full h-64 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`, '_blank')}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none'
                                                            e.target.nextSibling.style.display = 'block'
                                                        }}
                                                    />
                                                    <div style={{ display: 'none' }} className="bg-gray-100 p-4 rounded text-center">
                                                        <p className="text-gray-500 text-sm mb-2">No se pudo cargar la imagen</p>
                                                        <a
                                                            href={`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline text-sm"
                                                        >
                                                            Abrir en nueva pestaña
                                                        </a>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded text-xs">
                                                        <p className="text-gray-600 mb-1">
                                                            <strong>Archivo:</strong> <span className="font-mono text-xs">{ot.evidencias[`foto_${key}`].meta.originalname}</span>
                                                        </p>
                                                        {ot.evidencias[`foto_${key}`].meta?.uploadDate && (
                                                            <p className="text-gray-600">
                                                                <strong>Fecha:</strong> {new Date(ot.evidencias[`foto_${key}`].meta.uploadDate).toLocaleString('es-ES')}
                                                            </p>
                                                        )}
                                                        <button
                                                            onClick={() => window.open(`${api.defaults.baseURL}/files/${ot.evidencias[`foto_${key}`].meta.filename}`, '_blank')}
                                                            className="mt-2 text-blue-600 hover:underline text-sm font-semibold"
                                                        >
                                                            🔍 Ver en tamaño completo
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 p-8 rounded-lg text-center">
                                                    <div className="text-6xl mb-3 opacity-20">{icon}</div>
                                                    <p className="text-gray-400 text-sm">No hay foto disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'firmas' && (
                        <div>
                            <h3 className="font-semibold mb-4 text-xl">Firmas Digitales</h3>
                            <SignatureSection orderId={id} orderData={ot} />
                        </div>
                    )}

                    {activeTab === 'historial' && (
                        <div>
                            <h3 className="font-semibold mb-3">Historial de Cambios</h3>
                            {ot.audit_trail?.length > 0 ? (
                                <div className="space-y-2">
                                    {ot.audit_trail.map((entry, i) => (
                                        <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                                            <p className="font-semibold">{entry.action}</p>
                                            <p className="text-sm text-gray-600">{entry.detail}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No hay historial</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'ia_prediction' && (
                        <div>
                            <h3 className="font-semibold mb-3">Predicción de IA</h3>
                            {iaPrediction ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600">Decisión</label>
                                            <p className={`font-semibold text-lg ${iaPrediction.decision === 'permitido' ? 'text-green-600' :
                                                iaPrediction.decision === 'imposible' ? 'text-red-600' :
                                                    'text-yellow-600'
                                                }`}>
                                                {iaPrediction.decision}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">Confianza</label>
                                            <p className="font-semibold text-lg">
                                                {(iaPrediction.confidence * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    {iaPrediction.reasons && iaPrediction.reasons.length > 0 && (
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-2">Razones</label>
                                            <ul className="list-disc list-inside space-y-1">
                                                {iaPrediction.reasons.map((reason, i) => (
                                                    <li key={i} className="text-sm">{reason}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                        Modelo: {iaPrediction.model_version || 'v1.0'} |
                                        Fecha: {new Date(iaPrediction.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No hay predicción de IA para esta OT</p>
                                    {user?.rol === 'analista' && (
                                        <button
                                            onClick={requestIAPrediction}
                                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                                        >
                                            Solicitar Predicción
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showAssignModal && (
                <AssignTechModal
                    ot_id={id}
                    onClose={() => setShowAssignModal(false)}
                    onAssigned={loadOT}
                />
            )}


        </div>
    )
}
