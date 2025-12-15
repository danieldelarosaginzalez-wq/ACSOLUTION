import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OptimizedMapView from '../components/OptimizedMapView'
import EpicMapSidebar from '../components/EpicMapSidebar'
import MapControlPanel from '../components/MapControlPanel'
import MapParticleEffect from '../components/MapParticleEffect'
import EpicMapNotifications, { useEpicMapNotifications } from '../components/EpicMapNotifications'
import useRealtimeLocation from '../hooks/useRealtimeLocation'
import locationService from '../services/locationService'

export default function MapaOperaciones() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [ordenes, setOrdenes] = useState([])
    const [tecnicos, setTecnicos] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [viewMode, setViewMode] = useState('standard')
    const [isGeocoding, setIsGeocoding] = useState(false)

    // WebSocket en tiempo real
    const { connected, mapData } = useRealtimeLocation()

    // Sistema de notificaciones épicas
    const notifications = useEpicMapNotifications()

    // Cargar datos iniciales
    useEffect(() => {
        loadMapData()
    }, [filter])

    // Actualizar con datos del WebSocket
    useEffect(() => {
        if (mapData.tecnicos) {
            setTecnicos(mapData.tecnicos)
        }
        if (mapData.ordenes) {
            setOrdenes(mapData.ordenes)
        }
    }, [mapData])

    // Notificaciones de conexión
    useEffect(() => {
        if (connected) {
            notifications.success(
                '🌐 Conexión Establecida',
                'Sistema de tiempo real activo',
                { 'Estado': 'Conectado', 'Ubicación': 'Cartagena, Bolívar' }
            )
        } else {
            notifications.warning(
                '⚠️ Conexión Perdida',
                'Intentando reconectar al sistema en tiempo real...'
            )
        }
    }, [connected])

    // Si viene un parámetro de OT en la URL, seleccionarla
    useEffect(() => {
        const otId = searchParams.get('ot')
        if (otId && ordenes.length > 0) {
            const orden = ordenes.find(o => o.order_id === otId)
            if (orden) {
                setSelectedOrder(orden)
                // Cargar técnicos cercanos
                loadNearbyTechnicians(orden)
            }
        }
    }, [searchParams, ordenes])

    const loadMapData = async () => {
        try {
            setLoading(true)
            const estado = filter === 'all' ? undefined : filter
            const response = await locationService.getMapData(estado)

            setOrdenes(response.data.ordenes || [])
            setTecnicos(response.data.tecnicos || [])
        } catch (error) {
            console.error('Error cargando datos del mapa:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadNearbyTechnicians = async (orden) => {
        if (!orden.ubicacion) return

        try {
            const response = await locationService.findNearbyTechnicians(
                orden.ubicacion.lat,
                orden.ubicacion.lng,
                50 // 50 km de radio
            )

            // Actualizar técnicos con distancias
            setTecnicos(response.data)
        } catch (error) {
            console.error('Error cargando técnicos cercanos:', error)
        }
    }

    const handleOrderSelect = (orden) => {
        setSelectedOrder(orden)
        loadNearbyTechnicians(orden)

        // Notificación épica de selección
        notifications.info(
            '📋 Orden Seleccionada',
            `${orden.codigo} - ${orden.cliente}`,
            {
                'Estado': orden.estado,
                'Prioridad': orden.prioridad || 'media',
                'Dirección': orden.direccion
            }
        )
    }

    const handleTechnicianSelect = (tecnico) => {
        console.log('Técnico seleccionado:', tecnico)

        // Notificación épica de técnico
        notifications.technician(
            '👷 Técnico Seleccionado',
            `${tecnico.nombre} - ${tecnico.especialidad || 'General'}`,
            {
                'Email': tecnico.email,
                'Distancia': tecnico.distancia_km ? `${tecnico.distancia_km} km` : 'N/A',
                'Estado': tecnico.ubicacion_actual ? 'En línea' : 'Sin ubicación'
            }
        )
    }

    const handleAssignTechnician = (orden) => {
        // Redirigir a la página de asignación tradicional
        navigate(`/ot/${orden.order_id}/asignar`)
    }

    const handleOrderClick = (orden) => {
        handleOrderSelect(orden)
    }

    const handleTechnicianClick = (tecnico) => {
        handleTechnicianSelect(tecnico)
    }

    // 🎨 Manejar cambios de modo de vista
    const handleViewModeChange = (mode) => {
        setViewMode(mode)
        console.log('Modo de vista cambiado a:', mode)
    }

    // 🔍 Manejar geocodificación masiva
    const handleGeocodeOrders = async () => {
        setIsGeocoding(true)
        notifications.geocoding('🔍 Geocodificación Iniciada', 'Procesando direcciones automáticamente...')

        try {
            const response = await locationService.geocodeOrders(20)

            if (response.data.success > 0) {
                notifications.success(
                    '✅ Geocodificación Exitosa',
                    `Se ubicaron ${response.data.success} órdenes correctamente`,
                    {
                        'Exitosas': response.data.success,
                        'Fallidas': response.data.failed,
                        'Total': response.data.processed
                    }
                )
            }

            if (response.data.failed > 0) {
                notifications.warning(
                    '⚠️ Algunas Direcciones Fallaron',
                    `${response.data.failed} direcciones no pudieron ser ubicadas`,
                    { 'Fallidas': response.data.failed }
                )
            }

            loadMapData() // Recargar datos
        } catch (error) {
            console.error('Error geocodificando:', error)
            notifications.error(
                '❌ Error de Geocodificación',
                'No se pudo completar la geocodificación automática',
                { 'Error': error.message }
            )
        } finally {
            setIsGeocoding(false)
        }
    }

    // 🔍 Manejar cambios de filtros
    const handleFilterChange = (filters) => {
        if (filters.includes('all')) {
            setFilter('all')
        } else {
            setFilter(filters[0] || 'all')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 to-accent-50">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">🗺️ Cargando Mapa de Cartagena</h2>
                    <p className="text-gray-600 mb-4">Geocodificando órdenes automáticamente...</p>
                    <div className="flex items-center justify-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Cartagena de Indias, Bolívar
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-140px)] relative">
            {/* 🎨 Efecto de partículas épico */}
            <MapParticleEffect isActive={connected} particleCount={30} />

            {/* Header compacto */}
            <div className="mb-3 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                        🗺️ Mapa de Operaciones & Tracking
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm">
                            {connected ? (
                                <span className="text-success-600 flex items-center">
                                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></span>
                                    En vivo
                                </span>
                            ) : (
                                <span className="text-neutral-500">Conectando...</span>
                            )}
                        </div>
                        <div className="text-sm text-neutral-600">
                            <span className="font-semibold text-primary-600">{ordenes.length}</span> órdenes •
                            <span className="font-semibold text-success-600 ml-1">{tecnicos.filter(t => t.ubicacion_actual).length}</span> técnicos activos
                        </div>
                    </div>
                </div>

                {/* Filtros compactos */}
                <div className="flex gap-1">
                    <button
                        onClick={async () => {
                            try {
                                const response = await locationService.geocodeOrders(20);
                                alert(`Geocodificación completada:\n✅ ${response.data.success} exitosas\n❌ ${response.data.failed} fallidas`);
                                loadMapData();
                            } catch (error) {
                                console.error('Error geocodificando:', error);
                                alert('Error al geocodificar órdenes');
                            }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-accent-500 to-accent-600 text-primary-100 hover:from-accent-600 hover:to-accent-700 transition-all shadow-md"
                        title="Geocodificar órdenes sin ubicación"
                    >
                        🔍 Geocodificar
                    </button>
                    {['all', 'creada', 'asignada', 'en_proceso'].map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === filterType
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-primary-100 shadow-md'
                                : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'
                                }`}
                        >
                            {filterType === 'all' ? 'Todas' :
                                filterType === 'creada' ? 'Creadas' :
                                    filterType === 'asignada' ? 'Asignadas' : 'En Proceso'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🎯 Layout ÉPICO del mapa con TRACKING INTEGRADO - AMPLIADO */}
            <div className="grid grid-cols-12 gap-4 h-full relative z-10">
                {/* 🗺️ Mapa principal AVANZADO con TRACKING - MÁS ESPACIO */}
                <div className="col-span-9 h-full">
                    <div className="h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-accent-600/30">
                        <OptimizedMapView
                            tecnicos={tecnicos}
                            ordenes={ordenes}
                            selectedOrder={selectedOrder}
                            onOrderClick={handleOrderClick}
                            onTechnicianClick={handleTechnicianClick}
                            showCoverage={true}
                            showRoutes={viewMode === 'routes'}
                            showHeatmap={viewMode === 'heatmap'}
                            showTechnicianTracking={true}
                            realTimeMode={true}
                            viewMode={viewMode}
                            disableAutoCenter={true}
                        />
                    </div>
                </div>

                {/* 📋 Sidebar ÉPICO con TRACKING - COMPACTO */}
                <div className="col-span-3 h-full">
                    <EpicMapSidebar
                        ordenes={ordenes}
                        tecnicos={tecnicos}
                        selectedOrder={selectedOrder}
                        onOrderSelect={handleOrderSelect}
                        onTechnicianSelect={handleTechnicianSelect}
                        onAssignTechnician={handleAssignTechnician}
                        showTechnicianTracking={true}
                        realTimeMode={true}
                    />
                </div>
            </div>

            {/* 🎛️ Panel de control flotante */}
            <div className="absolute top-20 left-6 z-20">
                <MapControlPanel
                    ordenes={ordenes}
                    tecnicos={tecnicos}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={handleViewModeChange}
                    onGeocodeOrders={handleGeocodeOrders}
                    isGeocoding={isGeocoding}
                    connected={connected}
                    showTrackingStats={true}
                />
            </div>

            {/* 🎨 Sistema de notificaciones épicas */}
            <EpicMapNotifications
                notifications={notifications.notifications}
                onDismiss={notifications.removeNotification}
                position="top-right"
            />
        </div>
    )
}
