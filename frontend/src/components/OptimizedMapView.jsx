import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayerGroup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 🔧 FIX CRÍTICO PARA ICONOS DE LEAFLET - ESTABILIZACIÓN COMPLETA
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// 🎯 ICONOS ESTABILIZADOS - COMPATIBLE CON EL SISTEMA ACTUAL
const iconCache = new Map()

const createStableTechnicianIcon = (nombre, especialidad = 'General', isActive = true) => {
    const cacheKey = `tech-${nombre}-${especialidad}-${isActive}`

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)
    }

    const especialidadColors = {
        'Aire Acondicionado': { color: '#0891b2', emoji: '❄️' },
        'Sistemas Eléctricos': { color: '#f59e0b', emoji: '⚡' },
        'Plomería': { color: '#3b82f6', emoji: '🔧' },
        'Refrigeración': { color: '#8b5cf6', emoji: '🧊' },
        'Mantenimiento General': { color: '#10b981', emoji: '🛠️' },
        'Fontanería': { color: '#3b82f6', emoji: '🔧' },
        'Electricidad': { color: '#f59e0b', emoji: '⚡' },
        'Alcantarillado': { color: '#10b981', emoji: '🚰' },
        'Medición': { color: '#8b5cf6', emoji: '📏' }
    }

    const colors = especialidadColors[especialidad] || especialidadColors['Mantenimiento General']
    const nombreCorto = nombre.split(' ')[0]

    const icon = L.divIcon({
        className: 'stable-technician-marker',
        html: `
            <div style="position: relative; width: 64px; height: 64px;">
                <!-- Pulso de fondo -->
                <div style="
                    position: absolute;
                    inset: 0;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: ${colors.color};
                    opacity: 0.3;
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
                
                <!-- Etiqueta de nombre -->
                <div style="
                    position: absolute;
                    top: -56px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, ${colors.color}, ${colors.color}dd);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 2px solid white;
                    z-index: 10;
                ">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>${colors.emoji}</span>
                        <span>${nombreCorto}</span>
                    </div>
                </div>
                
                <!-- Marcador principal -->
                <div style="
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, ${colors.color}, ${colors.color}cc);
                    border: 4px solid white;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 20;
                ">
                    <span style="font-size: 24px;">${colors.emoji}</span>
                </div>
                
                <!-- Indicador de estado -->
                <div style="
                    position: absolute;
                    top: 7px;
                    right: 7px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: ${isActive ? '#10b981' : '#6b7280'};
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 30;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                        ${isActive ? 'animation: pulse 2s infinite;' : ''}
                    "></div>
                </div>
            </div>
        `,
        iconSize: [64, 64],
        iconAnchor: [32, 32],
    })

    iconCache.set(cacheKey, icon)
    return icon
}

const createStableOrderIcon = (codigo, estado, prioridad = 'media') => {
    const cacheKey = `order-${codigo}-${estado}-${prioridad}`

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)
    }

    const estadoColors = {
        creada: { color: '#6b7280', emoji: '📋', text: 'NUEVA' },
        asignada: { color: '#3b82f6', emoji: '👤', text: 'ASIGNADA' },
        en_proceso: { color: '#f59e0b', emoji: '⚡', text: 'EN PROCESO' },
        finalizada: { color: '#10b981', emoji: '✅', text: 'FINALIZADA' },
    }

    const prioridadColors = {
        alta: '#ef4444',
        media: '#f59e0b',
        baja: '#10b981'
    }

    const colors = estadoColors[estado] || estadoColors['creada']
    const prioColor = prioridadColors[prioridad] || prioridadColors['media']

    const icon = L.divIcon({
        className: 'stable-order-marker',
        html: `
            <div style="position: relative; width: 56px; height: 56px;">
                <!-- Etiqueta de información -->
                <div style="
                    position: absolute;
                    top: -48px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${colors.color};
                    color: white;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 2px solid white;
                    z-index: 10;
                ">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>${colors.emoji}</span>
                        <span>${codigo}</span>
                    </div>
                </div>
                
                <!-- Marcador principal -->
                <div style="
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    width: 40px;
                    height: 40px;
                    border-radius: 16px;
                    background: ${colors.color};
                    border: 4px solid white;
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: rotate(45deg);
                    z-index: 20;
                ">
                    <span style="
                        font-size: 20px;
                        transform: rotate(-45deg);
                    ">${colors.emoji}</span>
                </div>
                
                <!-- Indicador de prioridad -->
                <div style="
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${prioColor};
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 30;
                ">
                    <span style="
                        font-size: 10px;
                        color: white;
                        font-weight: bold;
                    ">${prioridad === 'alta' ? '!' : prioridad === 'media' ? '•' : '·'}</span>
                </div>
            </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
    })

    iconCache.set(cacheKey, icon)
    return icon
}

// 🎯 COMPONENTE DE CENTRADO ESTABILIZADO
function StableMapCenter({ center, zoom }) {
    const map = useMap()
    const lastCenterRef = useRef(null)
    const userInteractionRef = useRef(false)
    const timeoutRef = useRef(null)

    useEffect(() => {
        const handleUserInteraction = () => {
            userInteractionRef.current = true

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
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

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [map])

    useEffect(() => {
        if (!center || userInteractionRef.current) return

        const centerKey = `${center[0]},${center[1]},${zoom}`

        if (lastCenterRef.current !== centerKey) {
            lastCenterRef.current = centerKey

            map.flyTo(center, zoom || map.getZoom(), {
                duration: 1.5,
                easeLinearity: 0.25
            })
        }
    }, [center, zoom, map])

    return null
}

export default function OptimizedMapView({
    tecnicos = [],
    ordenes = [],
    center = [10.3910, -75.4794], // Cartagena por defecto
    zoom = 13,
    onTechnicianClick,
    onOrderClick,
    selectedOrder,
    showCoverage = true,
    showRoutes = false,
    showHeatmap = false,
    showTechnicianTracking = true,
    realTimeMode = true,
    enableClustering = true,
    optimizeRendering = true,
    maxMarkersPerCluster = 50,
    disableAutoCenter = false,
    viewMode = 'standard', // standard, satellite, heatmap, routes
}) {
    const [mapInstance, setMapInstance] = useState(null)
    const [visibleBounds, setVisibleBounds] = useState(null)
    const [userHasInteracted, setUserHasInteracted] = useState(false)
    const [routes, setRoutes] = useState([])
    const [heatmapData, setHeatmapData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentTileLayer, setCurrentTileLayer] = useState('standard')

    // 🚀 MEMOIZACIÓN ESTABLE DE DATOS
    const { mapCenter, mapZoom } = useMemo(() => {
        if (userHasInteracted || disableAutoCenter) {
            return { mapCenter: null, mapZoom: null }
        }

        if (selectedOrder?.ubicacion) {
            return {
                mapCenter: [selectedOrder.ubicacion.lat, selectedOrder.ubicacion.lng],
                mapZoom: 16
            }
        }

        if (ordenes.length > 0) {
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

    // 🎯 TÉCNICOS MEMOIZADOS CON ICONOS ESTABLES
    const stableTechnicians = useMemo(() => {
        return tecnicos
            .filter(tecnico => tecnico.ubicacion_actual || tecnico.ubicacion)
            .map(tecnico => {
                const ubicacion = tecnico.ubicacion_actual || tecnico.ubicacion
                return {
                    ...tecnico,
                    ubicacion,
                    stableIcon: createStableTechnicianIcon(
                        tecnico.nombre,
                        tecnico.especialidad || 'Mantenimiento General',
                        true
                    )
                }
            })
    }, [tecnicos])

    // 🎯 ÓRDENES MEMOIZADAS CON ICONOS ESTABLES
    const stableOrders = useMemo(() => {
        return ordenes
            .filter(orden => orden.ubicacion)
            .map(orden => ({
                ...orden,
                stableIcon: createStableOrderIcon(
                    orden.codigo,
                    orden.estado,
                    orden.prioridad || 'media'
                )
            }))
    }, [ordenes])

    // �️ OCONFIGURAR DIFERENTES TIPOS DE MAPA
    const tileLayerConfigs = useMemo(() => ({
        standard: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        },
        terrain: {
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }
    }), [])

    // 🔥 GENERAR DATOS DE MAPA DE CALOR
    const generateHeatmapData = useCallback(() => {
        if (!showHeatmap || !ordenes.length) return []

        return ordenes
            .filter(orden => orden.ubicacion)
            .map(orden => ({
                lat: orden.ubicacion.lat,
                lng: orden.ubicacion.lng,
                intensity: orden.prioridad === 'alta' ? 1.0 : orden.prioridad === 'media' ? 0.6 : 0.3
            }))
    }, [ordenes, showHeatmap])

    // 🛣️ CALCULAR RUTAS ENTRE TÉCNICOS Y ÓRDENES
    const calculateRoutes = useCallback(async () => {
        if (!showRoutes || !selectedOrder || !selectedOrder.ubicacion) {
            setRoutes([])
            return
        }

        setIsLoading(true)
        const newRoutes = []

        for (const tecnico of tecnicos) {
            if (tecnico.ubicacion_actual || tecnico.ubicacion) {
                const ubicacion = tecnico.ubicacion_actual || tecnico.ubicacion
                newRoutes.push({
                    id: tecnico.tecnico_id || tecnico.id,
                    positions: [
                        [ubicacion.lat, ubicacion.lng],
                        [selectedOrder.ubicacion.lat, selectedOrder.ubicacion.lng]
                    ],
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '10, 10'
                })
            }
        }

        setRoutes(newRoutes)
        setIsLoading(false)
    }, [showRoutes, selectedOrder, tecnicos])

    // 📍 CONFIGURAR EVENTOS DEL MAPA
    const handleMapMove = useCallback(() => {
        if (mapInstance) {
            const bounds = mapInstance.getBounds()
            setVisibleBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            })
        }
    }, [mapInstance])

    // 🎯 ACTUALIZAR MODO DE VISTA
    useEffect(() => {
        if (viewMode === 'satellite') {
            setCurrentTileLayer('satellite')
        } else if (viewMode === 'terrain') {
            setCurrentTileLayer('terrain')
        } else {
            setCurrentTileLayer('standard')
        }
    }, [viewMode])

    // 🔥 ACTUALIZAR DATOS DE HEATMAP
    useEffect(() => {
        if (showHeatmap) {
            setHeatmapData(generateHeatmapData())
        }
    }, [showHeatmap, generateHeatmapData])

    // 🛣️ ACTUALIZAR RUTAS
    useEffect(() => {
        calculateRoutes()
    }, [calculateRoutes])

    useEffect(() => {
        if (mapInstance) {
            const handleUserInteraction = () => {
                setUserHasInteracted(true)
            }

            mapInstance.on('moveend', handleMapMove)
            mapInstance.on('zoomend', handleMapMove)
            mapInstance.on('dragstart', handleUserInteraction)
            mapInstance.on('zoomstart', handleUserInteraction)
            mapInstance.on('click', handleUserInteraction)

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
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-blue-100 relative">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                whenCreated={setMapInstance}
            >
                {/* Capa de tiles dinámica según el modo */}
                <TileLayer
                    key={currentTileLayer}
                    attribution={tileLayerConfigs[currentTileLayer].attribution}
                    url={tileLayerConfigs[currentTileLayer].url}
                />

                {/* Indicador de carga para rutas */}
                {isLoading && (
                    <div className="leaflet-top leaflet-left">
                        <div className="leaflet-control bg-blue-600 text-white px-3 py-2 rounded-lg shadow-xl m-4 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold">Calculando rutas...</span>
                        </div>
                    </div>
                )}

                {/* Controles de zoom estabilizados */}
                <div className="leaflet-top leaflet-right">
                    <div className="leaflet-control leaflet-bar bg-white rounded-lg shadow-xl p-2 m-4">
                        <button
                            onClick={() => mapInstance?.zoomIn()}
                            className="block w-8 h-8 text-gray-700 hover:text-blue-600 font-bold text-xl transition-colors duration-200"
                        >
                            +
                        </button>
                        <div className="border-t border-gray-300 my-1"></div>
                        <button
                            onClick={() => mapInstance?.zoomOut()}
                            className="block w-8 h-8 text-gray-700 hover:text-blue-600 font-bold text-xl transition-colors duration-200"
                        >
                            −
                        </button>
                    </div>
                </div>

                {/* Marcadores de técnicos estabilizados */}
                <LayerGroup>
                    {stableTechnicians.map((tecnico) => (
                        <div key={`tech-${tecnico.tecnico_id || tecnico.id}`}>
                            {/* Círculo de cobertura */}
                            {showCoverage && (
                                <Circle
                                    center={[tecnico.ubicacion.lat, tecnico.ubicacion.lng]}
                                    radius={3000}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        dashArray: '5, 10'
                                    }}
                                />
                            )}

                            {/* Marcador estable */}
                            <Marker
                                position={[tecnico.ubicacion.lat, tecnico.ubicacion.lng]}
                                icon={tecnico.stableIcon}
                                eventHandlers={{
                                    click: (e) => {
                                        e.originalEvent?.stopPropagation()
                                        onTechnicianClick?.(tecnico)
                                    },
                                }}
                            >
                                <Popup className="stable-popup">
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

                                        {tecnico.especialidad && (
                                            <div className="mb-2 bg-blue-50 rounded px-2 py-1">
                                                <p className="text-xs text-blue-700 font-semibold">{tecnico.especialidad}</p>
                                            </div>
                                        )}

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
                    ))}
                </LayerGroup>

                {/* Marcadores de órdenes estabilizados */}
                <LayerGroup>
                    {stableOrders.map((orden) => {
                        const isSelected = selectedOrder?.order_id === orden.order_id

                        return (
                            <Marker
                                key={`order-${orden.order_id || orden.id}`}
                                position={[orden.ubicacion.lat, orden.ubicacion.lng]}
                                icon={orden.stableIcon}
                                eventHandlers={{
                                    click: (e) => {
                                        e.originalEvent?.stopPropagation()
                                        onOrderClick?.(orden)
                                    },
                                }}
                                zIndexOffset={isSelected ? 1000 : 0}
                            >
                                <Popup className="stable-popup">
                                    <div className="p-3 min-w-[250px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${orden.estado === 'creada' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                                                orden.estado === 'asignada' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                                    orden.estado === 'en_proceso' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                                        'bg-gradient-to-br from-green-500 to-green-600'
                                                }`}>
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

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${orden.estado === 'creada' ? 'bg-gray-100 text-gray-700' :
                                                orden.estado === 'asignada' ? 'bg-blue-100 text-blue-700' :
                                                    orden.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {orden.estado.replace('_', ' ').toUpperCase()}
                                            </span>

                                            {orden.prioridad && (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${orden.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                                    orden.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {orden.prioridad.toUpperCase()}
                                                </span>
                                            )}
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

                {/* Capa de rutas entre técnicos y órdenes */}
                {showRoutes && routes.length > 0 && (
                    <LayerGroup>
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
                    </LayerGroup>
                )}

                {/* Capa de mapa de calor */}
                {showHeatmap && heatmapData.length > 0 && (
                    <LayerGroup>
                        {heatmapData.map((point, index) => (
                            <Circle
                                key={index}
                                center={[point.lat, point.lng]}
                                radius={500 * point.intensity}
                                pathOptions={{
                                    color: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.4 ? '#f59e0b' : '#10b981',
                                    fillColor: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.4 ? '#f59e0b' : '#10b981',
                                    fillOpacity: 0.3 * point.intensity,
                                    weight: 2,
                                    opacity: 0.6
                                }}
                            />
                        ))}
                    </LayerGroup>
                )}

                {/* Centrado estabilizado del mapa */}
                {mapCenter && !userHasInteracted && !disableAutoCenter && (
                    <StableMapCenter
                        center={mapCenter}
                        zoom={mapZoom}
                    />
                )}
            </MapContainer>

            {/* Estilos CSS globales para el mapa optimizado */}
            <style jsx global>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .5;
                    }
                }
                
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(-25%);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(0);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }
                
                .stable-technician-marker,
                .stable-order-marker {
                    background: transparent !important;
                    border: none !important;
                }
                
                .stable-technician-marker .leaflet-marker-icon,
                .stable-order-marker .leaflet-marker-icon {
                    background: transparent !important;
                    border: none !important;
                }
                
                .stable-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border: none;
                }
                
                .stable-popup .leaflet-popup-tip {
                    background: white;
                    box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1);
                }
                
                .stable-popup .leaflet-popup-close-button {
                    color: #6b7280;
                    font-size: 18px;
                    padding: 4px 8px;
                }
                
                .stable-popup .leaflet-popup-close-button:hover {
                    color: #374151;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    )
}