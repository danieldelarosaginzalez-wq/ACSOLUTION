import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// 🎨 ICONOS SÚPER AVANZADOS
const createAdvancedTechnicianIcon = (nombre, especialidad = 'General', isActive = true) => {
    const especialidadColors = {
        'Aire Acondicionado': { bg: 'from-cyan-500 to-blue-600', emoji: '❄️' },
        'Sistemas Eléctricos': { bg: 'from-yellow-500 to-orange-600', emoji: '⚡' },
        'Plomería': { bg: 'from-blue-500 to-indigo-600', emoji: '🔧' },
        'Refrigeración': { bg: 'from-purple-500 to-pink-600', emoji: '🧊' },
        'Mantenimiento General': { bg: 'from-green-500 to-emerald-600', emoji: '🛠️' }
    }

    const colors = especialidadColors[especialidad] || especialidadColors['Mantenimiento General']

    return L.divIcon({
        className: 'advanced-technician-marker',
        html: `
            <div class="relative transform hover:scale-110 transition-all duration-300">
                <div class="absolute inset-0 rounded-full bg-gradient-to-r ${colors.bg} opacity-20 animate-ping"></div>
                
                <div class="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${colors.bg} text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xl border-2 border-white backdrop-blur-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${colors.emoji}</span>
                        <div>
                            <div class="font-bold">${nombre.split(' ')[0]}</div>
                            <div class="text-xs opacity-80">${especialidad}</div>
                        </div>
                    </div>
                </div>
                
                <div class="w-16 h-16 bg-gradient-to-br ${colors.bg} rounded-full border-4 border-white shadow-2xl flex items-center justify-center ${isActive ? 'animate-pulse' : ''}">
                    <span class="text-2xl">${colors.emoji}</span>
                </div>
                
                <div class="absolute -top-1 -right-1 w-6 h-6 ${isActive ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div class="w-2 h-2 bg-white rounded-full ${isActive ? 'animate-pulse' : ''}"></div>
                </div>
            </div>
        `,
        iconSize: [64, 64],
        iconAnchor: [32, 32],
    })
}

const createAdvancedOrderIcon = (codigo, estado, prioridad = 'media', cliente) => {
    const estadoColors = {
        creada: { bg: 'from-gray-500 to-gray-600', emoji: '📋', text: 'NUEVA' },
        asignada: { bg: 'from-blue-500 to-blue-600', emoji: '👤', text: 'ASIGNADA' },
        en_proceso: { bg: 'from-yellow-500 to-orange-500', emoji: '⚡', text: 'EN PROCESO' },
        finalizada: { bg: 'from-green-500 to-green-600', emoji: '✅', text: 'FINALIZADA' },
    }

    const colors = estadoColors[estado] || estadoColors['creada']

    return L.divIcon({
        className: 'advanced-order-marker',
        html: `
            <div class="relative transform hover:scale-110 transition-all duration-300">
                <div class="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-3 min-w-[200px] z-50">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xl">${colors.emoji}</span>
                        <div class="flex-1">
                            <div class="font-bold text-gray-900 text-sm">${codigo}</div>
                            <div class="text-xs text-gray-600">${cliente}</div>
                        </div>
                        <div class="text-xs font-bold px-2 py-1 rounded-full ${estado === 'creada' ? 'bg-gray-100 text-gray-700' :
                estado === 'asignada' ? 'bg-blue-100 text-blue-700' :
                    estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
            }">
                            ${colors.text}
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-xs font-semibold px-2 py-1 rounded-full ${prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
            }">
                            🔥 ${prioridad.toUpperCase()}
                        </div>
                        <div class="text-xs text-gray-500">Click para detalles</div>
                    </div>
                </div>
                
                <div class="w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center transform rotate-45 hover:rotate-12 transition-transform duration-300">
                    <span class="text-2xl transform -rotate-45">${colors.emoji}</span>
                </div>
                
                <div class="absolute -top-2 -right-2 w-6 h-6 ${prioridad === 'alta' ? 'bg-red-500' : prioridad === 'media' ? 'bg-yellow-500' : 'bg-green-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                    <span class="text-xs text-white font-bold">${prioridad === 'alta' ? '!' : prioridad === 'media' ? '•' : '·'}</span>
                </div>
            </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
    })
}

// Componente para centrar el mapa
function AdvancedMapCenter({ center, zoom, duration = 2 }) {
    const map = useMap()

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), {
                duration: duration,
                easeLinearity: 0.1
            })
        }
    }, [center, zoom, map, duration])

    return null
}

export default function SimpleAdvancedMapView({
    tecnicos = [],
    ordenes = [],
    center = [10.3910, -75.4794],
    zoom = 13,
    onTechnicianClick,
    onOrderClick,
    selectedOrder,
    showRoutes = false,
}) {
    const [mapCenter, setMapCenter] = useState(center)
    const [mapZoom, setMapZoom] = useState(zoom)
    const [routes, setRoutes] = useState([])

    // Determinar centro inteligente del mapa
    useEffect(() => {
        if (selectedOrder && selectedOrder.ubicacion) {
            setMapCenter([selectedOrder.ubicacion.lat, selectedOrder.ubicacion.lng])
            setMapZoom(16)
        } else if (ordenes.length > 0) {
            const ordenesConUbicacion = ordenes.filter(o => o.ubicacion)
            if (ordenesConUbicacion.length > 0) {
                const avgLat = ordenesConUbicacion.reduce((sum, o) => sum + o.ubicacion.lat, 0) / ordenesConUbicacion.length
                const avgLng = ordenesConUbicacion.reduce((sum, o) => sum + o.ubicacion.lng, 0) / ordenesConUbicacion.length
                setMapCenter([avgLat, avgLng])
                setMapZoom(13)
            }
        }
    }, [selectedOrder, ordenes])

    // Calcular rutas si es necesario
    useEffect(() => {
        if (showRoutes && selectedOrder && selectedOrder.ubicacion) {
            const newRoutes = tecnicos
                .filter(t => t.ubicacion_actual)
                .map(tecnico => ({
                    id: tecnico.tecnico_id,
                    positions: [
                        [tecnico.ubicacion_actual.lat, tecnico.ubicacion_actual.lng],
                        [selectedOrder.ubicacion.lat, selectedOrder.ubicacion.lng]
                    ],
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '10, 10'
                }))
            setRoutes(newRoutes)
        } else {
            setRoutes([])
        }
    }, [showRoutes, selectedOrder, tecnicos])

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-8 ring-primary-100 relative">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                className="advanced-map-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Controles de zoom épicos */}
                <div className="leaflet-top leaflet-right">
                    <div className="leaflet-control leaflet-bar bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-3 m-4 border-2 border-gray-100">
                        <button
                            onClick={() => {
                                const map = document.querySelector('.leaflet-container')?._leaflet_map
                                map?.zoomIn()
                            }}
                            className="block w-10 h-10 text-gray-700 hover:text-primary-600 font-bold text-2xl hover:bg-primary-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                        >
                            +
                        </button>
                        <div className="border-t border-gray-300 my-2"></div>
                        <button
                            onClick={() => {
                                const map = document.querySelector('.leaflet-container')?._leaflet_map
                                map?.zoomOut()
                            }}
                            className="block w-10 h-10 text-gray-700 hover:text-primary-600 font-bold text-2xl hover:bg-primary-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                        >
                            −
                        </button>
                    </div>
                </div>

                {/* Marcadores de técnicos */}
                <LayerGroup>
                    {tecnicos.map((tecnico) => {
                        if (!tecnico.ubicacion_actual) return null

                        return (
                            <div key={tecnico.tecnico_id}>
                                {/* Círculo de cobertura */}
                                <Circle
                                    center={[tecnico.ubicacion_actual.lat, tecnico.ubicacion_actual.lng]}
                                    radius={3000}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        dashArray: '5, 10'
                                    }}
                                />

                                <Marker
                                    position={[tecnico.ubicacion_actual.lat, tecnico.ubicacion_actual.lng]}
                                    icon={createAdvancedTechnicianIcon(
                                        tecnico.nombre,
                                        tecnico.especialidad || 'Mantenimiento General',
                                        true
                                    )}
                                    eventHandlers={{
                                        click: () => onTechnicianClick && onTechnicianClick(tecnico),
                                    }}
                                >
                                    <Popup className="advanced-popup">
                                        <div className="p-4 min-w-[250px]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-xl">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-primary-900 text-lg">{tecnico.nombre}</h3>
                                                    <p className="text-sm text-gray-600">{tecnico.especialidad || 'Técnico General'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 bg-primary-50 rounded-lg p-2">
                                                    <span className="text-primary-600">📧</span>
                                                    <span>{tecnico.email}</span>
                                                </div>

                                                {tecnico.telefono && (
                                                    <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                                                        <span className="text-green-600">📱</span>
                                                        <span>{tecnico.telefono}</span>
                                                    </div>
                                                )}

                                                {tecnico.ubicacion_actual?.timestamp && (
                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                        <span className="text-gray-600">🕒</span>
                                                        <span>Actualizado: {new Date(tecnico.ubicacion_actual.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                )}

                                                {tecnico.distancia_km !== undefined && (
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3">
                                                        <p className="text-green-700 font-bold flex items-center gap-2">
                                                            <span className="text-lg">📍</span>
                                                            {tecnico.distancia_km} km de distancia
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </div>
                        )
                    })}
                </LayerGroup>

                {/* Marcadores de órdenes */}
                {ordenes.map((orden) => {
                    if (!orden.ubicacion) return null

                    const isSelected = selectedOrder && selectedOrder.order_id === orden.order_id

                    return (
                        <Marker
                            key={orden.order_id}
                            position={[orden.ubicacion.lat, orden.ubicacion.lng]}
                            icon={createAdvancedOrderIcon(
                                orden.codigo,
                                orden.estado,
                                orden.prioridad || 'media',
                                orden.cliente
                            )}
                            eventHandlers={{
                                click: () => onOrderClick && onOrderClick(orden),
                            }}
                            zIndexOffset={isSelected ? 2000 : 0}
                        >
                            <Popup className="advanced-popup">
                                <div className="p-4 min-w-[300px]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${orden.estado === 'creada' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                                                orden.estado === 'asignada' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                                                    orden.estado === 'en_proceso' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                                        'bg-gradient-to-br from-green-500 to-green-600'
                                            }`}>
                                            <span className="text-white text-xl">📋</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{orden.codigo}</h3>
                                            <p className="text-sm font-semibold text-gray-700">{orden.cliente}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-600 text-lg">📍</span>
                                            <p className="text-gray-700 flex-1">{orden.direccion}</p>
                                        </div>

                                        <div className="flex items-center gap-2 bg-primary-50 rounded-lg p-3">
                                            <span className="text-primary-600 text-lg">📄</span>
                                            <p className="text-primary-700">Póliza: <span className="font-mono font-bold">{orden.poliza_number}</span></p>
                                        </div>

                                        {orden.descripcion && (
                                            <div className="bg-yellow-50 rounded-lg p-3">
                                                <p className="text-yellow-800 text-sm">{orden.descripcion}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${orden.estado === 'creada' ? 'bg-gray-100 text-gray-700' :
                                                orden.estado === 'asignada' ? 'bg-primary-100 text-primary-700' :
                                                    orden.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                            }`}>
                                            {orden.estado.replace('_', ' ').toUpperCase()}
                                        </span>

                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${orden.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                                orden.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            🔥 {(orden.prioridad || 'media').toUpperCase()}
                                        </span>
                                    </div>

                                    {orden.tecnico && (
                                        <div className="mt-3 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-lg p-3">
                                            <p className="text-primary-700 font-bold flex items-center gap-2">
                                                <span className="text-lg">👤</span>
                                                Técnico: {orden.tecnico.nombre}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}

                {/* Rutas entre técnicos y órdenes */}
                {routes.map((route) => (
                    <Polyline
                        key={route.id}
                        positions={route.positions}
                        color={route.color}
                        weight={route.weight}
                        opacity={route.opacity}
                        dashArray={route.dashArray}
                    />
                ))}

                {/* Centrado inteligente del mapa */}
                <AdvancedMapCenter
                    center={mapCenter}
                    zoom={mapZoom}
                    duration={1.5}
                />
            </MapContainer>
        </div>
    )
}