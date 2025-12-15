import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import locationService from '../services/locationService'
import { useAuthStore } from '../store/authStore'

export default function TechnicianTracker() {
    const { technicianId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [location, setLocation] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [accuracy, setAccuracy] = useState(null)
    const [error, setError] = useState(null)
    const [technicianInfo, setTechnicianInfo] = useState(null)

    // Auto-tracking cada 30 segundos
    useEffect(() => {
        let interval = null
        if (isTracking) {
            interval = setInterval(() => {
                getCurrentLocation()
            }, 30000) // 30 segundos
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isTracking])

    // Cargar información del técnico
    useEffect(() => {
        if (user && user.rol === 'tecnico') {
            setTechnicianInfo(user)
        } else if (technicianId) {
            // Cargar info del técnico por ID (para testing)
            setTechnicianInfo({
                _id: technicianId,
                nombre: `Técnico ${technicianId.slice(-4)}`,
                especialidad: 'Mantenimiento General'
            })
        }
    }, [user, technicianId])

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada en este dispositivo')
            return
        }

        setError(null)

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date()
                }

                setLocation(newLocation)
                setAccuracy(position.coords.accuracy)
                setLastUpdate(new Date())

                // Enviar al backend
                try {
                    const targetId = technicianInfo?._id || user?._id
                    if (targetId) {
                        await locationService.updateTechnicianLocation(
                            targetId,
                            newLocation.lat,
                            newLocation.lng,
                            newLocation.accuracy
                        )
                        console.log('✅ Ubicación enviada al servidor')
                    }
                } catch (error) {
                    console.error('❌ Error enviando ubicación:', error)
                    setError('Error enviando ubicación al servidor')
                }
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error)
                setError(`Error GPS: ${error.message}`)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        )
    }

    const startTracking = () => {
        setIsTracking(true)
        getCurrentLocation()
    }

    const stopTracking = () => {
        setIsTracking(false)
    }

    const formatAccuracy = (acc) => {
        if (!acc) return 'N/A'
        if (acc < 10) return `${Math.round(acc)}m (Excelente)`
        if (acc < 50) return `${Math.round(acc)}m (Buena)`
        if (acc < 100) return `${Math.round(acc)}m (Regular)`
        return `${Math.round(acc)}m (Baja)`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-purple-600 p-4">
            {/* Header móvil */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👷</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {technicianInfo?.nombre || 'Técnico'}
                            </h1>
                            <p className="text-white/80 text-sm">
                                {technicianInfo?.especialidad || 'ServiceOps Pro'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"
                    >
                        <span className="text-white text-xl">🏠</span>
                    </button>
                </div>

                {/* Estado de tracking */}
                <div className={`flex items-center gap-2 p-3 rounded-xl ${isTracking
                        ? 'bg-green-500/20 border-2 border-green-400/50'
                        : 'bg-gray-500/20 border-2 border-gray-400/50'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                        }`}></div>
                    <span className="text-white font-semibold">
                        {isTracking ? '🟢 Tracking Activo' : '⚪ Tracking Inactivo'}
                    </span>
                </div>
            </div>

            {/* Información de ubicación */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-white/20">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    Ubicación Actual
                </h2>

                {location ? (
                    <div className="space-y-3">
                        <div className="bg-white/10 rounded-xl p-4">
                            <p className="text-white/80 text-sm mb-1">Coordenadas</p>
                            <p className="text-white font-mono text-sm">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                        </div>

                        <div className="bg-white/10 rounded-xl p-4">
                            <p className="text-white/80 text-sm mb-1">Precisión GPS</p>
                            <p className="text-white font-semibold">
                                {formatAccuracy(accuracy)}
                            </p>
                        </div>

                        {lastUpdate && (
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/80 text-sm mb-1">Última Actualización</p>
                                <p className="text-white font-semibold">
                                    {lastUpdate.toLocaleTimeString()}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📍</span>
                        </div>
                        <p className="text-white/80">
                            No hay ubicación disponible
                        </p>
                        <p className="text-white/60 text-sm mt-2">
                            Presiona "Iniciar Tracking" para comenzar
                        </p>
                    </div>
                )}
            </div>

            {/* Controles */}
            <div className="space-y-4">
                {!isTracking ? (
                    <button
                        onClick={startTracking}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <span className="text-2xl">▶️</span>
                        <span className="text-lg">Iniciar Tracking</span>
                    </button>
                ) : (
                    <button
                        onClick={stopTracking}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <span className="text-2xl">⏹️</span>
                        <span className="text-lg">Detener Tracking</span>
                    </button>
                )}

                <button
                    onClick={getCurrentLocation}
                    disabled={isTracking}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                >
                    <span className="text-2xl">🎯</span>
                    <span className="text-lg">Actualizar Ubicación</span>
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mt-6 bg-red-500/20 border-2 border-red-400/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-white font-semibold">Error</p>
                            <p className="text-white/80 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Información adicional */}
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-3xl p-6 border-2 border-white/20">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">ℹ️</span>
                    Información
                </h3>
                <div className="space-y-2 text-sm text-white/80">
                    <p>• El tracking se actualiza automáticamente cada 30 segundos</p>
                    <p>• Tu ubicación se envía de forma segura al centro de operaciones</p>
                    <p>• Mantén la aplicación abierta para un tracking continuo</p>
                    <p>• La precisión GPS mejora en espacios abiertos</p>
                </div>
            </div>
        </div>
    )
}