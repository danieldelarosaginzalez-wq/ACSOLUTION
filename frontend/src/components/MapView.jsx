import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Iconos personalizados mejorados con divIcon
const createTechnicianIcon = (nombre) => {
    return L.divIcon({
        className: 'custom-technician-marker',
        html: `
      <div class="relative">
        <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xl border-2 border-white">
          👷 ${nombre.split(' ')[0]}
        </div>
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pulse">
          <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="absolute top-0 left-0 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
    `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
    })
}

const createOrderIcon = (codigo, estado) => {
    const colorMap = {
        creada: { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', ring: 'ring-gray-400' },
        asignada: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', ring: 'ring-blue-400' },
        en_proceso: { bg: 'bg-gradient-to-br from-yellow-500 to-orange-500', ring: 'ring-yellow-400' },
        finalizada: { bg: 'bg-gradient-to-br from-green-500 to-green-600', ring: 'ring-green-400' },
    }
    const colors = colorMap[estado] || { bg: 'bg-gradient-to-br from-red-500 to-red-600', ring: 'ring-red-400' }

    return L.divIcon({
        className: 'custom-order-marker',
        html: `
      <div class="relative">
        <div class="absolute -top-11 left-1/2 transform -translate-x-1/2 ${colors.bg} text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl border-2 border-white">
          📋 ${codigo}
        </div>
        <div class="w-10 h-10 ${colors.bg} rounded-xl border-4 border-white shadow-2xl flex items-center justify-center transform rotate-45 ring-4 ${colors.ring} ring-opacity-50">
          <svg class="w-6 h-6 text-white transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    })
}

// Componente para centrar el mapa de forma inteligente
function MapCenter({ center, zoom }) {
    const map = useMap()
    const lastCenterRef = useRef(null)
    const userInteractionRef = useRef(false)

    useEffect(() => {
        // Detectar interacción del usuario
        const handleUserInteraction = () => {
            userInteractionRef.current = true
            // Resetear después de 3 segundos
            setTimeout(() => {
                userInteractionRef.current = false
            }, 3000)
        }

        map.on('dragstart', handleUserInteraction)
        map.on('zoomstart', handleUserInteraction)
        map.on('click', handleUserInteraction)

        return () => {
            map.off('dragstart', handleUserInteraction)
            map.off('zoomstart', handleUserInteraction)
            map.off('click', handleUserInteraction)
        }
    }, [map])

    useEffect(() => {
        if (!center) return

        const centerKey = `${center[0]},${center[1]},${zoom}`

        // Solo mover el mapa si:
        // 1. No hay interacción reciente del usuario
        // 2. El centro realmente cambió
        if (!userInteractionRef.current && lastCenterRef.current !== centerKey) {
            lastCenterRef.current = centerKey

            map.flyTo(center, zoom || map.getZoom(), {
                duration: 1.5,
                easeLinearity: 0.25
            })
        }
    }, [center, zoom, map])

    return null
}

export default function MapView({
    tecnicos = [],
    ordenes = [],
    center = [10.3910, -75.4794], // Cartagena, Bolívar, Colombia por defecto
    zoom = 13,
    onTechnicianClick,
    onOrderClick,
    selectedOrder,
    showRoutes = false,
    showCoverage = true,
    optimizeRendering = true,
    disableAutoCenter = false, // Nueva prop para deshabilitar auto-centrado
}) {
    const [mapInstance, setMapInstance] = useState(null)
    const [visibleBounds, setVisibleBounds] = useState(null)
    const [userHasInteracted, setUserHasInteracted] = useState(false)

    // 🚀 Memoización de datos para optimización - SOLO si el usuario no ha interactuado
    const { mapCenter, mapZoom } = useMemo(() => {
        // Si el usuario ha interactuado o está deshabilitado, no cambiar el centro
        if (userHasInteracted || disableAutoCenter) {
            return { mapCenter: null, mapZoom: null }
        }

        if (selectedOrder && selectedOrder.ubicacion) {
            return {
                mapCenter: [selectedOrder.ubicacion.lat, selectedOrder.ubicacion.lng],
                mapZoom: 16
            }
        } else if (ordenes.length > 0) {
            const ordenesConUbicacion = ordenes.filter(o => o.ubicacion)
            if (ordenesConUbicacion.length > 0) {
                const avgLat = ordenesConUbicacion.reduce((sum, o) => sum + o.ubicacion.lat, 0) / ordenesConUbicacion.length
                const avgLng = ordenesConUbicacion.reduce((sum, o) => sum + o.ubicacion.lng, 0) / ordenesConUbicacion.length
                return {
                    mapCenter: [avgLat, avgLng],
                    mapZoom: 13
                }
            }
        }
        return { mapCenter: center, mapZoom: zoom }
    }, [selectedOrder, ordenes, center, zoom, userHasInteracted, disableAutoCenter])

    // 🎯 Filtrar elementos visibles para optimización
    const visibleTechnicians = useMemo(() => {
        if (!optimizeRendering || !visibleBounds) return tecnicos

        return tecnicos.filter(tecnico => {
            if (!tecnico.ubicacion) return false
            const { lat, lng } = tecnico.ubicacion
            return lat >= visibleBounds.south && lat <= visibleBounds.north &&
                lng >= visibleBounds.west && lng <= visibleBounds.east
        })
    }, [tecnicos, visibleBounds, optimizeRendering])

    const visibleOrders = useMemo(() => {
        if (!optimizeRendering || !visibleBounds) return ordenes

        return ordenes.filter(orden => {
            if (!orden.ubicacion) return false
            const { lat, lng } = orden.ubicacion
            return lat >= visibleBounds.south && lat <= visibleBounds.north &&
                lng >= visibleBounds.west && lng <= visibleBounds.east
        })
    }, [ordenes, visibleBounds, optimizeRendering])

    // 📍 Callback para actualizar bounds visibles
    const handleMapMove = useCallback(() => {
        if (mapInstance && optimizeRendering) {
            const bounds = mapInstance.getBounds()
            setVisibleBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            })
        }
    }, [mapInstance, optimizeRendering])

    // 🎯 Configurar eventos del mapa
    useEffect(() => {
        if (mapInstance) {
            // Detectar cualquier interacción del usuario
            const handleUserInteraction = () => {
                setUserHasInteracted(true)
            }

            mapInstance.on('moveend', handleMapMove)
            mapInstance.on('zoomend', handleMapMove)
            mapInstance.on('dragstart', handleUserInteraction)
            mapInstance.on('zoomstart', handleUserInteraction)
            mapInstance.on('click', handleUserInteraction)

            // Configurar bounds iniciales
            handleMapMove()

            return () => {
                mapInstance.off('moveend', handleMapMove)
                mapInstance.off('zoomend', handleMapMove)
                mapInstance.off('dragstart', handleUserInteraction)
                mapInstance.off('zoomstart', handleUserInteraction)
                mapInstance.off('click', handleUserInteraction)
            }
        }
    }, [mapInstance, handleMapMove])

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-blue-100">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                whenCreated={setMapInstance}
            >
                {/* Tile Layer con estilo mejorado */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Controles de zoom personalizados */}
                <div className="leaflet-top leaflet-right">
                    <div className="leaflet-control leaflet-bar bg-white rounded-lg shadow-xl p-2 m-4">
                        <button
                            onClick={() => mapInstance?.zoomIn()}
                            className="block w-8 h-8 text-gray-700 hover:text-blue-600 font-bold text-xl"
                        >
                            +
                        </button>
                        <div className="border-t border-gray-300 my-1"></div>
                        <button
                            onClick={() => mapInstance?.zoomOut()}
                            className="block w-8 h-8 text-gray-700 hover:text-blue-600 font-bold text-xl"
                        >
                            −
                        </button>
                    </div>
                </div>

                {/* Marcadores de técnicos optimizados */}
                <LayerGroup>
                    {visibleTechnicians.map((tecnico) => {
                        if (!tecnico.ubicacion) return null

                        return (
                            <div key={tecnico.tecnico_id}>
                                {/* Círculo de cobertura condicional */}
                                {showCoverage && (
                                    <Circle
                                        center={[tecnico.ubicacion.lat, tecnico.ubicacion.lng]}
                                        radius={5000} // 5km de radio
                                        pathOptions={{
                                            color: '#3b82f6',
                                            fillColor: '#3b82f6',
                                            fillOpacity: 0.1,
                                            weight: 2,
                                            dashArray: '5, 10'
                                        }}
                                    />
                                )}

                                {/* Marcador del técnico */}
                                <Marker
                                    position={[tecnico.ubicacion.lat, tecnico.ubicacion.lng]}
                                    icon={createTechnicianIcon(tecnico.nombre)}
                                    eventHandlers={{
                                        click: () => onTechnicianClick && onTechnicianClick(tecnico),
                                    }}
                                >
                                    <Popup className="custom-popup">
                                        <div className="p-3 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-lg">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-blue-900">{tecnico.nombre}</h3>
                                                    <p className="text-xs text-gray-600">{tecnico.email}</p>
                                                </div>
                                            </div>
                                            {tecnico.ubicacion.timestamp && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Actualizado: {new Date(tecnico.ubicacion.timestamp).toLocaleTimeString()}
                                                </div>
                                            )}
                                            {tecnico.distancia_km !== undefined && (
                                                <div className="mt-2 bg-green-50 border border-green-200 rounded px-3 py-2">
                                                    <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {tecnico.distancia_km} km de distancia
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            </div>
                        )
                    })}

                </LayerGroup>

                {/* Marcadores de órdenes optimizados */}
                <LayerGroup>
                    {visibleOrders.map((orden) => {
                        if (!orden.ubicacion) return null

                        const isSelected = selectedOrder && selectedOrder.order_id === orden.order_id

                        return (
                            <Marker
                                key={orden.order_id}
                                position={[orden.ubicacion.lat, orden.ubicacion.lng]}
                                icon={createOrderIcon(orden.codigo, orden.estado)}
                                eventHandlers={{
                                    click: (e) => {
                                        // Prevenir que el evento se propague al mapa
                                        e.originalEvent?.stopPropagation()
                                        onOrderClick && onOrderClick(orden)
                                    },
                                }}
                                zIndexOffset={isSelected ? 1000 : 0}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-3 min-w-[250px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-10 h-10 ${orden.estado === 'creada' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                                                orden.estado === 'asignada' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                                    orden.estado === 'en_proceso' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                                        'bg-gradient-to-br from-green-500 to-green-600'
                                                } rounded-lg flex items-center justify-center shadow-lg`}>
                                                <span className="text-white text-lg">📋</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{orden.codigo}</h3>
                                                <p className="text-sm font-semibold text-gray-700">{orden.cliente}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                <p className="text-gray-600 flex-1">{orden.direccion}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-gray-500">Póliza: <span className="font-mono font-semibold">{orden.poliza_number}</span></p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${orden.estado === 'creada' ? 'bg-gray-100 text-gray-700' :
                                                orden.estado === 'asignada' ? 'bg-blue-100 text-blue-700' :
                                                    orden.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {orden.estado.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        {orden.tecnico && (
                                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                                <p className="text-xs text-blue-600 font-semibold flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    Técnico: {orden.tecnico.nombre}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}

                </LayerGroup>

                {/* Centrar mapa cuando cambia la selección - DESHABILITADO TEMPORALMENTE */}
                {false && mapCenter && !userHasInteracted && (
                    <MapCenter
                        center={mapCenter}
                        zoom={mapZoom}
                    />
                )}
            </MapContainer>
        </div>
    )
}
