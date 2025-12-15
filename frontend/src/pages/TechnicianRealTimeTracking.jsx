import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet'
import L from 'leaflet'
import useRealtimeLocation from '../hooks/useRealtimeLocation'
import locationService from '../services/locationService'
import EpicMapNotifications, { useEpicMapNotifications } from '../components/EpicMapNotifications'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// 🎨 Icono épico para técnico en tiempo real
const createRealtimeTechnicianIcon = (nombre, especialidad, isOnline, lastUpdate) => {
    const especialidadColors = {
        'Aire Acondicionado': { bg: 'from-cyan-500 to-blue-600', emoji: '❄️' },
        'Sistemas Eléctricos': { bg: 'from-yellow-500 to-orange-600', emoji: '⚡' },
        'Plomería': { bg: 'from-blue-500 to-indigo-600', emoji: '🔧' },
        'Refrigeración': { bg: 'from-purple-500 to-pink-600', emoji: '🧊' },
        'Mantenimiento General': { bg: 'from-green-500 to-emerald-600', emoji: '🛠️' }
    }

    const colors = especialidadColors[especialidad] || especialidadColors['Mantenimiento General']

    // Determinar estado basado en última actualización
    const now = new Date()
    const lastUpdateTime = new Date(lastUpdate)
    const minutesAgo = (now - lastUpdateTime) / (1000 * 60)

    let statusColor = 'bg-green-500' // Online
    let statusText = 'En línea'

    if (minutesAgo > 5) {
        statusColor = 'bg-yellow-500' // Warning
        statusText = 'Inactivo'
    }
    if (minutesAgo > 15) {
        statusColor = 'bg-red-500' // Offline
        statusText = 'Desconectado'
    }

    return L.divIcon({
        className: 'realtime-technician-marker',
        html: `
            <div class="relative transform hover:scale-110 transition-all duration-300">
                <!-- Ondas de radar animadas -->
                <div class="absolute inset-0 rounded-full bg-gradient-to-r ${colors.bg} opacity-30 animate-ping"></div>
                <div class="absolute inset-0 rounded-full bg-gradient-to-r ${colors.bg} opacity-20 animate-ping" style="animation-delay: 0.5s; animation-duration: 2s;"></div>
                <div class="absolute inset-0 rounded-full bg-gradient-to-r ${colors.bg} opacity-10 animate-ping" style="animation-delay: 1s; animation-duration: 3s;"></div>
                
                <!-- Información flotante -->
                <div class="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${colors.bg} text-white px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xl border-2 border-white backdrop-blur-sm z-50">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">${colors.emoji}</span>
                        <div>
                            <div class="font-bold">${nombre.split(' ')[0]}</div>
                            <div class="text-xs opacity-80">${especialidad}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <div class="w-2 h-2 ${statusColor} rounded-full animate-pulse"></div>
                        <span>${statusText}</span>
                        <span class="opacity-70">• ${Math.round(minutesAgo)}min</span>
                    </div>
                    <!-- Flecha -->
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
                
                <!-- Marcador principal -->
                <div class="w-20 h-20 bg-gradient-to-br ${colors.bg} rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pulse ring-4 ring-white/30">
                    <span class="text-3xl">${colors.emoji}</span>
                </div>
                
                <!-- Indicador de estado en tiempo real -->
                <div class="absolute -top-2 -right-2 w-8 h-8 ${statusColor} rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-bounce">
                    <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                
                <!-- Timestamp -->
                <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                    ${lastUpdateTime.toLocaleTimeString()}
                </div>
            </div>
        `,
        iconSize: [80, 80],
        iconAnchor: [40, 40],
    })
}

export default function TechnicianRealTimeTracking() {
    const [tecnicos, setTecnicos] = useState([])
    const [selectedTechnician, setSelectedTechnician] = useState(null)
    const [showTrails, setShowTrails] = useState(false)
    const [trails, setTrails] = useState({})
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [refreshInterval, setRefreshInterval] = useState(30) // segundos

    // WebSocket en tiempo real
    const { connected, mapData } = useRealtimeLocation()

    // Sistema de notificaciones
    const notifications = useEpicMapNotifications()

    // Cargar datos iniciales
    useEffect(() => {
        loadTechnicians()
    }, [])

    // Actualizar con datos del WebSocket
    useEffect(() => {
        if (mapData.tecnicos) {
            const previousTecnicos = tecnicos
            setTecnicos(mapData.tecnicos)

            // Detectar cambios de ubicación
            mapData.tecnicos.forEach(newTech => {
                const oldTech = previousTecnicos.find(t => t.tecnico_id === newTech.tecnico_id)
                if (oldTech && oldTech.ubicacion_actual && newTech.ubicacion_actual) {
                    const oldLat = oldTech.ubicacion_actual.lat
                    const oldLng = oldTech.ubicacion_actual.lng
                    const newLat = newTech.ubicacion_actual.lat
                    const newLng = newTech.ubicacion_actual.lng

                    // Si la ubicación cambió significativamente (más de 10 metros)
                    const distance = calculateDistance(oldLat, oldLng, newLat, newLng)
                    if (distance > 0.01) { // 10 metros aproximadamente
                        notifications.technician(
                            '📍 Técnico en Movimiento',
                            `${newTech.nombre} cambió de ubicación`,
                            {
                                'Distancia': `${Math.round(distance * 1000)}m`,
                                'Hora': new Date().toLocaleTimeString()
                            }
                        )

                        // Agregar al trail
                        setTrails(prev => ({
                            ...prev,
                            [newTech.tecnico_id]: [
                                ...(prev[newTech.tecnico_id] || []).slice(-20), // Mantener últimos 20 puntos
                                [newLat, newLng]
                            ]
                        }))
                    }
                }
            })
        }
    }, [mapData])

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            loadTechnicians()
        }, refreshInterval * 1000)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval])

    const loadTechnicians = async () => {
        try {
            const response = await locationService.getAllTechniciansLocations()
            setTecnicos(response.data || [])
        } catch (error) {
            console.error('Error cargando técnicos:', error)
            notifications.error(
                '❌ Error de Conexión',
                'No se pudieron cargar los técnicos',
                { 'Error': error.message }
            )
        }
    }

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371 // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const handleTechnicianClick = (tecnico) => {
        setSelectedTechnician(tecnico)
        notifications.technician(
            '👷 Técnico Seleccionado',
            `${tecnico.nombre} - ${tecnico.especialidad || 'General'}`,
            {
                'Estado': tecnico.ubicacion_actual ? 'Con ubicación' : 'Sin ubicación',
                'Última actualización': tecnico.ubicacion_actual?.timestamp
                    ? new Date(tecnico.ubicacion_actual.timestamp).toLocaleTimeString()
                    : 'N/A'
            }
        )
    }

    const getOnlineTechnicians = () => {
        return tecnicos.filter(t => {
            if (!t.ubicacion_actual) return false
            const now = new Date()
            const lastUpdate = new Date(t.ubicacion_actual.timestamp)
            const minutesAgo = (now - lastUpdate) / (1000 * 60)
            return minutesAgo <= 15 // Consideramos online si se actualizó en los últimos 15 minutos
        })
    }

    const getOfflineTechnicians = () => {
        return tecnicos.filter(t => {
            if (!t.ubicacion_actual) return true
            const now = new Date()
            const lastUpdate = new Date(t.ubicacion_actual.timestamp)
            const minutesAgo = (now - lastUpdate) / (1000 * 60)
            return minutesAgo > 15
        })
    }

    const onlineTecnicos = getOnlineTechnicians()
    const offlineTecnicos = getOfflineTechnicians()

    return (
        <div className="h-[calc(100vh-120px)] relative">
            {/* Header con estadísticas */}
            <div className="mb-4 bg-gradient-to-r from-primary-600 via-accent-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <span className="text-3xl animate-bounce">📡</span>
                            Tracking en Tiempo Real
                        </h1>
                        <p className="text-white/80">Monitoreo de técnicos en Cartagena</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${connected ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'
                            }`}>
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                                }`}></div>
                            <span className="font-semibold">
                                {connected ? 'Tiempo Real Activo' : 'Desconectado'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black">{tecnicos.length}</div>
                        <div className="text-sm opacity-80">Total Técnicos</div>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 text-center border-2 border-green-400/50">
                        <div className="text-3xl font-black text-green-300">{onlineTecnicos.length}</div>
                        <div className="text-sm opacity-80">🟢 En Línea</div>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-4 text-center border-2 border-red-400/50">
                        <div className="text-3xl font-black text-red-300">{offlineTecnicos.length}</div>
                        <div className="text-sm opacity-80">🔴 Desconectados</div>
                    </div>
                    <div className="bg-blue-500/20 rounded-xl p-4 text-center border-2 border-blue-400/50">
                        <div className="text-3xl font-black text-blue-300">
                            {onlineTecnicos.length > 0 ? Math.round((onlineTecnicos.length / tecnicos.length) * 100) : 0}%
                        </div>
                        <div className="text-sm opacity-80">📊 Cobertura</div>
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div className="mb-4 flex items-center gap-4">
                <button
                    onClick={() => setShowTrails(!showTrails)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${showTrails
                            ? 'bg-accent-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {showTrails ? '🛤️ Ocultar Rutas' : '🛤️ Mostrar Rutas'}
                </button>

                <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${autoRefresh
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
                </button>

                <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary-500"
                >
                    <option value={10}>10 segundos</option>
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                </select>

                <button
                    onClick={loadTechnicians}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-all"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Mapa */}
            <div className="h-[calc(100%-200px)] rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-8 ring-primary-100">
                <MapContainer
                    center={[10.3910, -75.4794]} // Cartagena
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    className="realtime-tracking-map"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marcadores de técnicos */}
                    {tecnicos.map((tecnico) => {
                        if (!tecnico.ubicacion_actual) return null

                        return (
                            <div key={tecnico.tecnico_id}>
                                {/* Círculo de cobertura */}
                                <Circle
                                    center={[tecnico.ubicacion_actual.lat, tecnico.ubicacion_actual.lng]}
                                    radius={2000} // 2km de radio
                                    pathOptions={{
                                        color: '#3b82f6',
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        dashArray: '5, 10'
                                    }}
                                />

                                {/* Marcador del técnico */}
                                <Marker
                                    position={[tecnico.ubicacion_actual.lat, tecnico.ubicacion_actual.lng]}
                                    icon={createRealtimeTechnicianIcon(
                                        tecnico.nombre,
                                        tecnico.especialidad || 'Mantenimiento General',
                                        true,
                                        tecnico.ubicacion_actual.timestamp
                                    )}
                                    eventHandlers={{
                                        click: () => handleTechnicianClick(tecnico),
                                    }}
                                >
                                    <Popup className="realtime-popup">
                                        <div className="p-4 min-w-[300px]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-2xl">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-primary-900 text-xl">{tecnico.nombre}</h3>
                                                    <p className="text-gray-600">{tecnico.especialidad || 'Técnico General'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm">
                                                <div className="bg-primary-50 rounded-lg p-3">
                                                    <p className="font-semibold text-primary-700 mb-1">📧 Contacto</p>
                                                    <p>{tecnico.email}</p>
                                                </div>

                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <p className="font-semibold text-green-700 mb-1">📍 Ubicación</p>
                                                    <p className="font-mono text-xs">
                                                        {tecnico.ubicacion_actual.lat.toFixed(6)}, {tecnico.ubicacion_actual.lng.toFixed(6)}
                                                    </p>
                                                </div>

                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <p className="font-semibold text-blue-700 mb-1">🕒 Última Actualización</p>
                                                    <p>{new Date(tecnico.ubicacion_actual.timestamp).toLocaleString()}</p>
                                                </div>

                                                {tecnico.ubicacion_actual.accuracy && (
                                                    <div className="bg-yellow-50 rounded-lg p-3">
                                                        <p className="font-semibold text-yellow-700 mb-1">🎯 Precisión GPS</p>
                                                        <p>{Math.round(tecnico.ubicacion_actual.accuracy)}m</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* Trail/Ruta del técnico */}
                                {showTrails && trails[tecnico.tecnico_id] && trails[tecnico.tecnico_id].length > 1 && (
                                    <Polyline
                                        positions={trails[tecnico.tecnico_id]}
                                        color="#3b82f6"
                                        weight={3}
                                        opacity={0.7}
                                        dashArray="10, 5"
                                    />
                                )}
                            </div>
                        )
                    })}
                </MapContainer>
            </div>

            {/* Notificaciones */}
            <EpicMapNotifications
                notifications={notifications.notifications}
                onDismiss={notifications.removeNotification}
                position="top-right"
            />
        </div>
    )
}