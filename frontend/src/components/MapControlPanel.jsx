import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MapControlPanel({
    ordenes = [],
    tecnicos = [],
    onFilterChange,
    onViewModeChange,
    onGeocodeOrders,
    isGeocoding = false,
    connected = false,
    performanceMetrics = {},
    onOptimizationToggle,
    optimizationSettings = {
        enableClustering: true,
        enableBatching: true,
        throttleMs: 1000,
        maxMarkersPerCluster: 50
    }
}) {
    const [activeFilters, setActiveFilters] = useState(['all'])
    const [viewMode, setViewMode] = useState('standard')
    const [showStats, setShowStats] = useState(true)
    const [realTimeStats, setRealTimeStats] = useState({
        totalOrdenes: 0,
        ordenesUbicadas: 0,
        tecnicosActivos: 0,
        eficienciaUbicacion: 0
    })

    // 📊 Calcular estadísticas en tiempo real
    useEffect(() => {
        const totalOrdenes = ordenes.length
        const ordenesUbicadas = ordenes.filter(o => o.ubicacion).length
        const tecnicosActivos = tecnicos.filter(t => t.ubicacion_actual).length
        const eficienciaUbicacion = totalOrdenes > 0 ? Math.round((ordenesUbicadas / totalOrdenes) * 100) : 0

        setRealTimeStats({
            totalOrdenes,
            ordenesUbicadas,
            tecnicosActivos,
            eficienciaUbicacion
        })
    }, [ordenes, tecnicos])

    const handleFilterToggle = (filter) => {
        let newFilters
        if (filter === 'all') {
            newFilters = ['all']
        } else {
            newFilters = activeFilters.includes('all')
                ? [filter]
                : activeFilters.includes(filter)
                    ? activeFilters.filter(f => f !== filter)
                    : [...activeFilters.filter(f => f !== 'all'), filter]

            if (newFilters.length === 0) {
                newFilters = ['all']
            }
        }

        setActiveFilters(newFilters)
        onFilterChange(newFilters)
    }

    const handleViewModeChange = (mode) => {
        setViewMode(mode)
        onViewModeChange(mode)
    }

    const estadoStats = {
        creada: { count: ordenes.filter(o => o.estado === 'creada').length, color: 'text-gray-600', bg: 'bg-gray-100' },
        asignada: { count: ordenes.filter(o => o.estado === 'asignada').length, color: 'text-blue-600', bg: 'bg-blue-100' },
        en_proceso: { count: ordenes.filter(o => o.estado === 'en_proceso').length, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        finalizada: { count: ordenes.filter(o => o.estado === 'finalizada').length, color: 'text-green-600', bg: 'bg-green-100' }
    }

    return (
        <div className="bg-gradient-to-br from-white via-gray-50 to-primary-50 rounded-3xl shadow-2xl border-4 border-white ring-4 ring-primary-100 p-6 space-y-6">
            {/* 🎯 Header con estado de conexión */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                        🎛️ Control de Mapa
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {connected ? 'Tiempo Real Activo' : 'Desconectado'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setShowStats(!showStats)}
                    className="p-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </button>
            </div>

            {/* 📊 Estadísticas en tiempo real */}
            <AnimatePresence>
                {showStats && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Órdenes</p>
                                    <p className="text-3xl font-black">{realTimeStats.totalOrdenes}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Ubicadas</p>
                                    <p className="text-3xl font-black">{realTimeStats.ordenesUbicadas}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📍</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Técnicos Activos</p>
                                    <p className="text-3xl font-black">{realTimeStats.tecnicosActivos}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">👷</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm font-medium">Eficiencia</p>
                                    <p className="text-3xl font-black">{realTimeStats.eficienciaUbicacion}%</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🎨 Modos de vista */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">👁️</span>
                    Modo de Vista
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'standard', name: 'Estándar', icon: '🗺️' },
                        { id: 'satellite', name: 'Satélite', icon: '🛰️' },
                        { id: 'heatmap', name: 'Mapa de Calor', icon: '🌡️' },
                        { id: 'routes', name: 'Rutas', icon: '🛣️' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => handleViewModeChange(mode.id)}
                            className={`p-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${viewMode === mode.id
                                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border-2 border-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{mode.icon}</span>
                                <span>{mode.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 🔍 Filtros avanzados */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    Filtros de Estado
                </h3>
                <div className="space-y-2">
                    <button
                        onClick={() => handleFilterToggle('all')}
                        className={`w-full p-3 rounded-xl text-sm font-bold transition-all ${activeFilters.includes('all')
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border-2 border-gray-100'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>🌟 Todas las Órdenes</span>
                            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                                {realTimeStats.totalOrdenes}
                            </span>
                        </div>
                    </button>

                    {Object.entries(estadoStats).map(([estado, stats]) => (
                        <button
                            key={estado}
                            onClick={() => handleFilterToggle(estado)}
                            className={`w-full p-3 rounded-xl text-sm font-bold transition-all ${activeFilters.includes(estado)
                                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border-2 border-gray-100'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="capitalize">
                                    {estado === 'en_proceso' ? '⚡ En Proceso' :
                                        estado === 'creada' ? '📋 Creadas' :
                                            estado === 'asignada' ? '👤 Asignadas' :
                                                '✅ Finalizadas'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${activeFilters.includes(estado) ? 'bg-white/20' : stats.bg + ' ' + stats.color
                                    }`}>
                                    {stats.count}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 🚀 Acciones rápidas */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    Acciones Rápidas
                </h3>
                <div className="space-y-2">
                    <button
                        onClick={onGeocodeOrders}
                        disabled={isGeocoding}
                        className={`w-full p-4 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${isGeocoding
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-accent-500 to-orange-500 text-white hover:from-accent-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isGeocoding ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Geocodificando...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">🔍</span>
                                    <span>Geocodificar Órdenes</span>
                                </>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 text-sm font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🔄</span>
                            <span>Actualizar Mapa</span>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            const map = document.querySelector('.leaflet-container')?._leaflet_map
                            if (map) {
                                map.flyTo([10.3910, -75.4794], 13, { duration: 2 })
                            }
                        }}
                        className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 text-sm font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span>Centrar en Cartagena</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* 📈 Barra de progreso de ubicación */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Progreso de Ubicación</span>
                    <span className="text-sm font-bold text-primary-600">{realTimeStats.eficienciaUbicacion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${realTimeStats.eficienciaUbicacion}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {realTimeStats.ordenesUbicadas} de {realTimeStats.totalOrdenes} órdenes ubicadas
                </p>
            </div>

            {/* 🚀 Panel de Optimización */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 shadow-lg border-2 border-purple-100">
                <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Optimización de Rendimiento
                </h3>

                {/* Métricas de rendimiento */}
                {performanceMetrics.updateCount !== undefined && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-purple-600">{performanceMetrics.updateCount}</div>
                            <div className="text-xs text-gray-600">Actualizaciones</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-purple-600">{Math.round(performanceMetrics.avgLatency || 0)}ms</div>
                            <div className="text-xs text-gray-600">Latencia Prom.</div>
                        </div>
                    </div>
                )}

                {/* Controles de optimización */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">Clustering</span>
                        <input
                            type="checkbox"
                            checked={optimizationSettings.enableClustering}
                            onChange={(e) => onOptimizationToggle?.('enableClustering', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                    </label>

                    <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">Batching</span>
                        <input
                            type="checkbox"
                            checked={optimizationSettings.enableBatching}
                            onChange={(e) => onOptimizationToggle?.('enableBatching', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-purple-800 mb-1">
                            Throttle: {optimizationSettings.throttleMs}ms
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            step="100"
                            value={optimizationSettings.throttleMs}
                            onChange={(e) => onOptimizationToggle?.('throttleMs', parseInt(e.target.value))}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}