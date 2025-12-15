import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { fileService } from '../services/fileService'
import api from '../services/api'

const ETAPAS = [
    { key: 'inicial', label: 'Foto Inicial', desc: 'Estado del sitio antes de iniciar', icon: '📸', required: true },
    { key: 'durante', label: 'Foto Durante', desc: 'Proceso de trabajo en ejecución', icon: '🔧', required: false },
    { key: 'materiales', label: 'Foto Materiales', desc: 'Materiales utilizados', icon: '📦', required: false },
    { key: 'final', label: 'Foto Final', desc: 'Estado del sitio al finalizar', icon: '✅', required: false }
]

export default function PhotosUploaderByStage({ onUploadComplete, existingPhotos = {} }) {
    const { id: orderId } = useParams()
    const [uploading, setUploading] = useState({})
    const [uploadedPhotos, setUploadedPhotos] = useState({})

    // Calcular fotos existentes con useMemo para evitar loops
    const initialPhotos = useMemo(() => {
        const photos = {}
        ETAPAS.forEach(({ key }) => {
            if (existingPhotos && existingPhotos[`foto_${key}`]) {
                photos[key] = existingPhotos[`foto_${key}`]
            }
        })
        return photos
    }, [JSON.stringify(existingPhotos)]) // Usar JSON.stringify para comparación profunda

    useEffect(() => {
        console.log('PhotosUploaderByStage - Cargando fotos:', initialPhotos)
        setUploadedPhotos(initialPhotos)
    }, [orderId, initialPhotos])

    const handleFileChange = async (etapa, file) => {
        if (!file) return

        // Validar que existe orderId
        if (!orderId) {
            alert('❌ Error: No se puede subir la foto sin ID de orden')
            console.error('orderId no está definido:', orderId)
            return
        }

        // Validar orden de etapas (solo para la primera foto)
        const etapaIndex = ETAPAS.findIndex(e => e.key === etapa)
        for (let i = 0; i < etapaIndex; i++) {
            const prevEtapa = ETAPAS[i]
            if (prevEtapa.required && !uploadedPhotos[prevEtapa.key]) {
                alert(`⚠️ Debe subir primero la foto: ${prevEtapa.label}`)
                return
            }
        }

        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ La foto no debe superar 5MB')
            return
        }

        setUploading({ ...uploading, [etapa]: true })

        try {
            console.log('Subiendo foto - orderId:', orderId, 'tipo:', typeof orderId, 'stage:', etapa)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('order_id', orderId)
            formData.append('stage', etapa)

            console.log('FormData creado:', {
                file: file.name,
                order_id: orderId,
                stage: etapa
            })

            const response = await fileService.uploadPhoto(formData)

            // Actualizar estado local inmediatamente
            setUploadedPhotos(prev => ({ ...prev, [etapa]: response.data }))
            alert(`✅ Foto ${etapa} subida exitosamente`)

            // Recargar la OT completa para actualizar todo
            if (onUploadComplete) {
                await onUploadComplete()
            }
        } catch (error) {
            console.error('Error subiendo foto:', error)
            alert(`❌ Error al subir foto: ${error.response?.data?.message || error.message}`)
        } finally {
            setUploading({ ...uploading, [etapa]: false })
        }
    }

    // Mostrar error si no hay orderId
    if (!orderId) {
        return (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="font-bold text-xl text-red-800 mb-2">Error: ID de Orden no disponible</h3>
                <p className="text-red-600">
                    No se puede cargar el componente de fotos sin un ID de orden válido.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    orderId recibido: {String(orderId)}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-xl text-gray-800">📷 Evidencias Fotográficas por Etapa</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Suba las fotos en orden para documentar el trabajo realizado
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Orden ID: {orderId}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Fotos subidas</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {Object.keys(uploadedPhotos).length} / {ETAPAS.length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ETAPAS.map(({ key, label, desc, icon, required }) => {
                    const isUploaded = uploadedPhotos[key]
                    const isUploading = uploading[key]

                    return (
                        <div
                            key={key}
                            className={`border-2 rounded-lg p-4 transition-all ${isUploaded
                                ? 'bg-green-50 border-green-400'
                                : 'bg-white border-gray-300 hover:border-blue-400'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <label className="block font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <span className="text-2xl">{icon}</span>
                                        <span>{label}</span>
                                        {required && <span className="text-red-500">*</span>}
                                    </label>
                                    <p className="text-xs text-gray-600">{desc}</p>
                                </div>
                                {isUploaded && (
                                    <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                                        ✓ Subida
                                    </span>
                                )}
                            </div>

                            {isUploaded ? (
                                <div className="space-y-2">
                                    {uploadedPhotos[key].meta?.filename && (
                                        <img
                                            src={`${api.defaults.baseURL}/files/${uploadedPhotos[key].meta.filename}`}
                                            alt={label}
                                            className="w-full h-32 object-cover rounded border-2 border-green-300"
                                        />
                                    )}
                                    <p className="text-xs text-gray-600">
                                        📁 {uploadedPhotos[key].meta?.originalname}
                                    </p>
                                    <label className="block">
                                        <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                                            🔄 Reemplazar foto
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(key, e.target.files[0])}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div>
                                    <label className="block">
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isUploading
                                            ? 'bg-gray-100 border-gray-400'
                                            : 'hover:bg-blue-50 hover:border-blue-400 border-gray-300'
                                            }`}>
                                            {isUploading ? (
                                                <div className="text-gray-600">
                                                    <div className="animate-spin text-2xl mb-2">⏳</div>
                                                    <p className="text-sm font-semibold">Subiendo...</p>
                                                </div>
                                            ) : (
                                                <div className="text-gray-600">
                                                    <div className="text-3xl mb-2">📤</div>
                                                    <p className="text-sm font-semibold">Click para subir foto</p>
                                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (máx 5MB)</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(key, e.target.files[0])}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>💡 Consejo:</strong> Asegúrese de que las fotos sean claras y muestren claramente el trabajo realizado.
                    Las fotos son evidencia importante para la aprobación de la orden.
                </p>
            </div>
        </div>
    )
}
