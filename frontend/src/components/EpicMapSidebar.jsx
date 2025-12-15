import { useState } from 'react'

export default function EpicMapSidebar({
    ordenes = [],
    tecnicos = [],
    onOrderSelect,
    onTechnicianSelect,
    selectedOrder,
    onAssignTechnician,
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('ordenes')
    const [sortBy, setSortBy] = useState('fecha')
    const [showFilters, setShowFilters] = useState(false)

    // 🔍 Filtrado y ordenamiento inteligente
    const filteredOrdenes = ordenes
        .filter(orden =>
            orden.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orden.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orden.poliza_number.includes(searchTerm) ||
            orden.direccion.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'prioridad':
                    const prioridadOrder = { alta: 3, media: 2, baja: 1 }
                    return (prioridadOrder[b.prioridad] || 2) - (prioridadOrder[a.prioridad] || 2)
                case 'distancia':
                    if (selectedOrder && selectedOrder.ubicacion) {
                        const distA = a.ubicacion ? calculateDistance(selectedOrder.ubicacion, a.ubicacion) : Infinity
                        const distB = b.ubicacion ? calculateDistance(selectedOrder.ubicacion, b.ubicacion) : Infinity
                        return distA - distB
                    }
                    return 0
                case 'fecha':
                default:
                    return new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
            }
        })

    const filteredTecnicos = tecnicos
        .filter(tecnico =>
            tecnico.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tecnico.especialidad && tecnico.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            if (selectedOrder && selectedOrder.ubicacion) {
                const distA = a.ubicacion_actual ? calculateDistance(selectedOrder.ubicacion, a.ubicacion_actual) : Infinity
                const distB = b.ubicacion_actual ? calculateDistance(selectedOrder.ubicacion, b.ubicacion_actual) : Infinity
                return distA - distB
            }
            return a.nombre.localeCompare(b.nombre)
        })

    // 📐 Función para calcular distancia
    const calculateDistance = (pos1, pos2) => {
        const R = 6371
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-neutral-800 via-primary-900 to-accent-900 rounded-2xl shadow-2xl border-2 border-accent-600/50 overflow-hidden">
            {/* 🎨 Header ÉPICO */}
            <div className="p-4 bg-gradient-to-r from-primary-700 via-accent-600 to-primary-800 text-primary-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-500/20 to-accent-700/20 animate-pulse"></div>

                <div className="relative z-10">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="text-2xl animate-bounce">🗺️</span>
                        <span>Operaciones</span>
                    </h2>

                    {/* 🔍 Búsqueda compacta */}
                    <div className="relative group mb-3">
                        <input
                            type="text"
                            placeholder="Buscar por código, cliente, dirección..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 pl-10 pr-10 bg-neutral-700/50 backdrop-blur-sm border border-accent-500/30 rounded-lg text-primary-100 placeholder-primary-300 focus:ring-2 focus:ring-accent-500/50 focus:border-accent-400 transition-all shadow-md text-sm"
                        />
                        <svg className="absolute left-4 top-3.5 h-5 w-5 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="absolute right-3 top-2.5 p-1 bg-accent-600/30 rounded-lg hover:bg-accent-500/50 transition-all"
                        >
                            <svg className="w-4 h-4 text-primary-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>

                    {/* 🎛️ Filtros de ordenamiento */}
                    {showFilters && (
                        <div className="mb-4 p-3 bg-neutral-700/30 rounded-xl backdrop-blur-sm">
                            <p className="text-sm font-semibold mb-2 text-primary-200">Ordenar por:</p>
                            <div className="flex gap-2">
                                {[
                                    { id: 'fecha', label: '📅 Fecha', icon: '📅' },
                                    { id: 'prioridad', label: '🔥 Prioridad', icon: '🔥' },
                                    { id: 'distancia', label: '📍 Distancia', icon: '📍' }
                                ].map(sort => (
                                    <button
                                        key={sort.id}
                                        onClick={() => setSortBy(sort.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${sortBy === sort.id
                                            ? 'bg-accent-600 text-primary-100'
                                            : 'bg-neutral-600/50 text-primary-200 hover:bg-accent-500/30'
                                            }`}
                                    >
                                        {sort.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 🎯 Tabs ÉPICOS */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('ordenes')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 ${activeTab === 'ordenes'
                                ? 'bg-accent-600 text-primary-100 shadow-xl'
                                : 'bg-neutral-700/30 backdrop-blur-sm text-primary-200 hover:bg-accent-500/30 border-2 border-accent-500/20'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📋</span>
                                <span>Órdenes</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'ordenes' ? 'bg-primary-700 text-primary-100' : 'bg-accent-600/30'}`}>
                                    {filteredOrdenes.length}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('tecnicos')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 ${activeTab === 'tecnicos'
                                ? 'bg-accent-600 text-primary-100 shadow-xl'
                                : 'bg-neutral-700/30 backdrop-blur-sm text-primary-200 hover:bg-accent-500/30 border-2 border-accent-500/20'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">👷</span>
                                <span>Técnicos</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'tecnicos' ? 'bg-success-700 text-success-100' : 'bg-accent-600/30'}`}>
                                    {filteredTecnicos.filter(t => t.ubicacion_actual).length}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('tracking')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 ${activeTab === 'tracking'
                                ? 'bg-accent-600 text-primary-100 shadow-xl'
                                : 'bg-neutral-700/30 backdrop-blur-sm text-primary-200 hover:bg-accent-500/30 border-2 border-accent-500/20'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg animate-pulse">📡</span>
                                <span>Tracking</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* 📋 Contenido principal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'ordenes' && (
                    filteredOrdenes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-neutral-400 font-medium">No hay órdenes disponibles</p>
                        </div>
                    ) : (
                        filteredOrdenes.map((orden, index) => (
                            <div
                                key={orden.order_id}
                                onClick={() => onOrderSelect(orden)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all transform hover:scale-102 hover:shadow-xl ${selectedOrder?.order_id === orden.order_id
                                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-primary-100 shadow-2xl ring-4 ring-accent-400/50'
                                    : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-primary-800 hover:to-accent-800 shadow-md border-2 border-neutral-600 text-neutral-200'
                                    }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${selectedOrder?.order_id === orden.order_id
                                            ? 'bg-accent-500/30'
                                            : orden.estado === 'creada' ? 'bg-gradient-to-br from-neutral-500 to-neutral-600' :
                                                orden.estado === 'asignada' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                                                    orden.estado === 'en_progreso' ? 'bg-gradient-to-br from-warning-500 to-warning-600' :
                                                        orden.estado === 'completada' ? 'bg-gradient-to-br from-success-500 to-success-600' :
                                                            'bg-gradient-to-br from-danger-500 to-danger-600'
                                            }`}>
                                            <span className="text-2xl">
                                                {orden.estado === 'creada' ? '📝' :
                                                    orden.estado === 'asignada' ? '👷' :
                                                        orden.estado === 'en_progreso' ? '⚡' :
                                                            orden.estado === 'completada' ? '✅' : '❌'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${selectedOrder?.order_id === orden.order_id ? 'text-primary-100' : 'text-neutral-100'}`}>
                                                {orden.codigo}
                                            </h3>
                                            <p className={`text-xs font-medium ${selectedOrder?.order_id === orden.order_id ? 'text-primary-200' : 'text-neutral-300'}`}>
                                                {orden.cliente}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder?.order_id === orden.order_id
                                            ? 'bg-accent-500/30 text-primary-100'
                                            : orden.estado === 'creada' ? 'bg-neutral-600 text-neutral-200' :
                                                orden.estado === 'asignada' ? 'bg-primary-700 text-primary-100' :
                                                    orden.estado === 'en_progreso' ? 'bg-warning-700 text-warning-100' :
                                                        orden.estado === 'completada' ? 'bg-success-700 text-success-100' :
                                                            'bg-danger-700 text-danger-100'
                                            }`}>
                                            {orden.estado.replace('_', ' ').toUpperCase()}
                                        </span>

                                        <span className={`px-2 py-1 rounded-full text-xs font-bold text-center ${orden.prioridad === 'alta' ? 'bg-danger-700 text-danger-100' :
                                            orden.prioridad === 'media' ? 'bg-warning-700 text-warning-100' :
                                                'bg-success-700 text-success-100'
                                            }`}>
                                            {orden.prioridad === 'alta' ? '🔥' :
                                                orden.prioridad === 'media' ? '⚡' : '🌱'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`text-xs ${selectedOrder?.order_id === orden.order_id ? 'text-primary-200' : 'text-neutral-400'} mb-2`}>
                                    📍 {orden.direccion}
                                </div>

                                {orden.tecnico_asignado && (
                                    <div className={`flex items-center gap-2 text-xs ${selectedOrder?.order_id === orden.order_id ? 'text-primary-200' : 'text-neutral-400'} bg-gradient-to-r ${selectedOrder?.order_id === orden.order_id ? 'from-accent-600/20 to-primary-600/20' : 'from-neutral-600/30 to-neutral-700/30'} rounded-lg px-3 py-2`}>
                                        <span>👷</span>
                                        <span>Asignado a: {orden.tecnico_asignado.nombre}</span>
                                    </div>
                                )}

                                {selectedOrder?.order_id === orden.order_id && onAssignTechnician && (
                                    <div className="mt-3 pt-3 border-t border-accent-400/30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAssignTechnician(orden)
                                            }}
                                            className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-primary-100 py-2 px-4 rounded-lg font-bold text-sm transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            Asignar Técnico
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )
                )}

                {activeTab === 'tecnicos' && (
                    filteredTecnicos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-neutral-400 font-medium">No hay técnicos disponibles</p>
                        </div>
                    ) : (
                        filteredTecnicos.map((tecnico, index) => (
                            <div
                                key={tecnico.tecnico_id}
                                onClick={() => onTechnicianSelect(tecnico)}
                                className="p-4 bg-gradient-to-r from-neutral-700 to-neutral-800 rounded-2xl cursor-pointer hover:from-primary-800 hover:to-accent-800 shadow-md hover:shadow-xl transition-all transform hover:scale-102 border-2 border-neutral-600 text-neutral-200"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                            <span className="text-2xl">👷</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-100">{tecnico.nombre}</h3>
                                            <p className="text-xs text-neutral-400">{tecnico.especialidad || 'Técnico General'}</p>
                                        </div>
                                    </div>
                                    {tecnico.ubicacion_actual ? (
                                        <span className="flex items-center gap-1 text-xs text-success-400 font-bold bg-success-800/30 px-3 py-1 rounded-full">
                                            <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
                                            En línea
                                        </span>
                                    ) : (
                                        <span className="text-xs text-neutral-500 bg-neutral-700 px-3 py-1 rounded-full font-medium">Sin ubicación</span>
                                    )}
                                </div>

                                {tecnico.ubicacion_actual && tecnico.ubicacion_actual.timestamp && (
                                    <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-700/50 rounded-lg px-3 py-2 mb-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Actualizado: {new Date(tecnico.ubicacion_actual.timestamp).toLocaleTimeString()}
                                    </div>
                                )}

                                {tecnico.distancia_km !== undefined && (
                                    <div className="bg-gradient-to-r from-success-800/30 to-success-700/30 border-2 border-success-600/30 rounded-lg px-3 py-2">
                                        <p className="text-sm text-success-300 font-bold flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {tecnico.distancia_km.toFixed(1)} km de distancia
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )
                )}

                {activeTab === 'tracking' && (
                    <div className="space-y-4">
                        {/* Header de tracking */}
                        <div className="bg-gradient-to-r from-accent-600 to-primary-700 rounded-2xl p-4 text-primary-100">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <span className="text-2xl animate-pulse">📡</span>
                                Tracking en Vivo
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-accent-700/30 rounded-lg p-2 text-center">
                                    <div className="font-bold text-lg">
                                        {filteredTecnicos.filter(t => {
                                            if (!t.ubicacion_actual) return false;
                                            const now = new Date();
                                            const lastUpdate = new Date(t.ubicacion_actual.timestamp);
                                            const minutesAgo = (now - lastUpdate) / (1000 * 60);
                                            return minutesAgo <= 5;
                                        }).length}
                                    </div>
                                    <div className="text-xs opacity-80">🟢 Activos</div>
                                </div>
                                <div className="bg-accent-700/30 rounded-lg p-2 text-center">
                                    <div className="font-bold text-lg">
                                        {filteredTecnicos.filter(t => {
                                            if (!t.ubicacion_actual) return true;
                                            const now = new Date();
                                            const lastUpdate = new Date(t.ubicacion_actual.timestamp);
                                            const minutesAgo = (now - lastUpdate) / (1000 * 60);
                                            return minutesAgo > 5;
                                        }).length}
                                    </div>
                                    <div className="text-xs opacity-80">🔴 Inactivos</div>
                                </div>
                            </div>
                        </div>

                        {/* Lista de técnicos con estado de tracking */}
                        {filteredTecnicos.map((tecnico, index) => {
                            const now = new Date();
                            const lastUpdate = tecnico.ubicacion_actual ? new Date(tecnico.ubicacion_actual.timestamp) : null;
                            const minutesAgo = lastUpdate ? (now - lastUpdate) / (1000 * 60) : Infinity;

                            let statusColor = 'bg-danger-500';
                            let statusText = 'Desconectado';
                            let statusIcon = '🔴';

                            if (minutesAgo <= 2) {
                                statusColor = 'bg-success-500';
                                statusText = 'En línea';
                                statusIcon = '🟢';
                            } else if (minutesAgo <= 5) {
                                statusColor = 'bg-warning-500';
                                statusText = 'Reciente';
                                statusIcon = '🟡';
                            } else if (minutesAgo <= 15) {
                                statusColor = 'bg-warning-600';
                                statusText = 'Inactivo';
                                statusIcon = '🟠';
                            }

                            return (
                                <div
                                    key={`tracking-${tecnico.tecnico_id}`}
                                    onClick={() => onTechnicianSelect(tecnico)}
                                    className="bg-gradient-to-r from-neutral-700 to-neutral-800 rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-all transform hover:scale-102 border-2 border-neutral-600 text-neutral-200"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-xl">👷</span>
                                                </div>
                                                <div className={`absolute -top-1 -right-1 w-4 h-4 ${statusColor} rounded-full border-2 border-neutral-800 flex items-center justify-center`}>
                                                    <div className="w-2 h-2 bg-neutral-100 rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-neutral-100 text-sm">{tecnico.nombre}</h4>
                                                <p className="text-xs text-neutral-400">{tecnico.especialidad || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs font-bold">
                                                <span>{statusIcon}</span>
                                                <span className={minutesAgo <= 5 ? 'text-success-400' : minutesAgo <= 15 ? 'text-warning-400' : 'text-danger-400'}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1">
                                                {lastUpdate ? `${Math.round(minutesAgo)}min` : 'Sin datos'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de ubicación */}
                                    {tecnico.ubicacion_actual && (
                                        <div className="space-y-2">
                                            <div className="bg-neutral-600/50 rounded-lg p-2">
                                                <div className="flex items-center gap-2 text-xs text-neutral-300">
                                                    <span>📍</span>
                                                    <span className="font-mono">
                                                        {tecnico.ubicacion_actual.lat.toFixed(4)}, {tecnico.ubicacion_actual.lng.toFixed(4)}
                                                    </span>
                                                </div>
                                            </div>

                                            {tecnico.ubicacion_actual.accuracy && (
                                                <div className="bg-primary-800/30 rounded-lg p-2">
                                                    <div className="flex items-center gap-2 text-xs text-primary-300">
                                                        <span>🎯</span>
                                                        <span>Precisión: {Math.round(tecnico.ubicacion_actual.accuracy)}m</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-success-800/30 rounded-lg p-2">
                                                <div className="flex items-center gap-2 text-xs text-success-300">
                                                    <span>🕒</span>
                                                    <span>{lastUpdate.toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sin ubicación */}
                                    {!tecnico.ubicacion_actual && (
                                        <div className="bg-danger-800/30 rounded-lg p-3 text-center">
                                            <div className="text-danger-300 text-sm font-semibold">
                                                📵 Sin ubicación disponible
                                            </div>
                                            <div className="text-danger-400 text-xs mt-1">
                                                El técnico no ha activado el tracking
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 📊 Footer compacto con estadísticas */}
            <div className="p-3 bg-gradient-to-r from-neutral-800 via-primary-800 to-accent-800 border-t-2 border-accent-600">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl p-3 shadow-lg border border-primary-600/30 hover:shadow-xl transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-black bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                                    {filteredOrdenes.length}
                                </p>
                                <p className="text-xs text-neutral-300 font-bold">Órdenes</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-xl">📋</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-2xl p-4 shadow-xl border-2 border-success-600/30 hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-4xl font-black bg-gradient-to-r from-success-400 to-success-300 bg-clip-text text-transparent">
                                    {filteredTecnicos.filter(t => t.ubicacion_actual).length}
                                </p>
                                <p className="text-xs text-neutral-300 font-bold mt-1">Técnicos</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-success-500 to-success-400 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                                <span className="text-3xl">👷</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🎯 Indicadores de rendimiento */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-r from-danger-600 to-danger-700 text-primary-100 rounded-xl p-2 text-center">
                        <p className="text-lg font-bold">{filteredOrdenes.filter(o => o.prioridad === 'alta').length}</p>
                        <p className="text-xs">🔥 Alta</p>
                    </div>
                    <div className="bg-gradient-to-r from-warning-600 to-warning-700 text-primary-100 rounded-xl p-2 text-center">
                        <p className="text-lg font-bold">{filteredOrdenes.filter(o => o.prioridad === 'media').length}</p>
                        <p className="text-xs">⚡ Media</p>
                    </div>
                    <div className="bg-gradient-to-r from-success-600 to-success-700 text-primary-100 rounded-xl p-2 text-center">
                        <p className="text-lg font-bold">{filteredOrdenes.filter(o => o.prioridad === 'baja').length}</p>
                        <p className="text-xs">🌱 Baja</p>
                    </div>
                </div>
            </div>
        </div>
    )
}