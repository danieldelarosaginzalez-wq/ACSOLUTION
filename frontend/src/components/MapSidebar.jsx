import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function MapSidebar({
    ordenes = [],
    tecnicos = [],
    onOrderSelect,
    onTechnicianSelect,
    selectedOrder,
    onAssignTechnician,
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('ordenes') // 'ordenes' | 'tecnicos'
    const [sortBy, setSortBy] = useState('fecha') // 'fecha' | 'prioridad' | 'distancia'
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
        const R = 6371 // Radio de la Tierra en km
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl shadow-2xl border-4 border-white ring-4 ring-blue-100 overflow-hidden">
            {/* Header con gradiente */}
            <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="text-4xl animate-bounce">🗺️</span>
                    <span>Mapa de Operaciones</span>
                </h2>

                {/* Búsqueda mejorada */}
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Buscar órdenes o técnicos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-4 focus:ring-white/30 focus:border-white/40 transition-all shadow-lg"
                    />
                    <svg className="absolute left-4 top-3.5 h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Tabs mejorados */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => setActiveTab('ordenes')}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeTab === 'ordenes'
                            ? 'bg-white text-blue-600 shadow-xl'
                            : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-2 border-white/20'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">📋</span>
                            <span>Órdenes</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'ordenes' ? 'bg-blue-100 text-blue-700' : 'bg-white/20'
                                }`}>
                                {ordenes.length}
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('tecnicos')}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeTab === 'tecnicos'
                            ? 'bg-white text-blue-600 shadow-xl'
                            : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-2 border-white/20'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">👷</span>
                            <span>Técnicos</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'tecnicos' ? 'bg-green-100 text-green-700' : 'bg-white/20'
                                }`}>
                                {tecnicos.filter(t => t.ubicacion).length}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Content con scroll personalizado */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'ordenes' ? (
                    // Lista de órdenes mejorada
                    filteredOrdenes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">No hay órdenes con ubicación</p>
                            <p className="text-xs text-gray-400 mt-2">Usa el botón "🔍 Geocodificar" para ubicar órdenes automáticamente</p>
                        </div>
                    ) : (
                        filteredOrdenes.map((orden) => (
                            <div
                                key={orden.order_id}
                                onClick={() => onOrderSelect(orden)}
                                className={`p-4 rounded-xl cursor-pointer transition-all transform hover:scale-102 hover:shadow-xl ${selectedOrder?.order_id === orden.order_id
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-2xl ring-4 ring-blue-200'
                                    : 'bg-white hover:bg-gray-50 shadow-md border-2 border-gray-100'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${selectedOrder?.order_id === orden.order_id
                                            ? 'bg-white/20'
                                            : orden.estado === 'creada' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                                                orden.estado === 'asignada' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                                                    orden.estado === 'en_proceso' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                        'bg-gradient-to-br from-green-400 to-green-500'
                                            }`}>
                                            <span className="text-2xl">📋</span>
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${selectedOrder?.order_id === orden.order_id ? 'text-white' : 'text-gray-900'}`}>
                                                {orden.codigo}
                                            </h3>
                                            <p className={`text-xs font-medium ${selectedOrder?.order_id === orden.order_id ? 'text-white/80' : 'text-gray-600'}`}>
                                                {orden.cliente}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder?.order_id === orden.order_id
                                        ? 'bg-white/20 text-white'
                                        : orden.estado === 'creada' ? 'bg-gray-100 text-gray-700' :
                                            orden.estado === 'asignada' ? 'bg-blue-100 text-blue-700' :
                                                orden.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                        }`}>
                                        {orden.estado.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>

                                <p className={`text-xs mb-3 flex items-start gap-2 ${selectedOrder?.order_id === orden.order_id ? 'text-white/90' : 'text-gray-600'}`}>
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {orden.direccion}
                                </p>

                                {orden.tecnico && (
                                    <p className={`text-xs font-semibold mb-3 flex items-center gap-2 ${selectedOrder?.order_id === orden.order_id ? 'text-white' : 'text-blue-600'}`}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        {orden.tecnico.nombre}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <Link
                                        to={`/ot/${orden.order_id}`}
                                        className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedOrder?.order_id === orden.order_id
                                            ? 'bg-white text-blue-600 hover:bg-white/90'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            } shadow-lg`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Ver Detalles
                                    </Link>
                                    {orden.estado === 'creada' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAssignTechnician && onAssignTechnician(orden)
                                            }}
                                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-lg transition-all"
                                        >
                                            Asignar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    // Lista de técnicos mejorada
                    filteredTecnicos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">No hay técnicos disponibles</p>
                        </div>
                    ) : (
                        filteredTecnicos.map((tecnico) => (
                            <div
                                key={tecnico.tecnico_id}
                                onClick={() => onTechnicianSelect(tecnico)}
                                className="p-4 bg-white rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 shadow-md hover:shadow-xl transition-all transform hover:scale-102 border-2 border-gray-100"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                            <span className="text-2xl">👷</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{tecnico.nombre}</h3>
                                            <p className="text-xs text-gray-600">{tecnico.email}</p>
                                        </div>
                                    </div>
                                    {tecnico.ubicacion ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            En línea
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">Sin ubicación</span>
                                    )}
                                </div>

                                {tecnico.ubicacion && tecnico.ubicacion.timestamp && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Actualizado: {new Date(tecnico.ubicacion.timestamp).toLocaleTimeString()}
                                    </div>
                                )}

                                {tecnico.distancia_km !== undefined && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg px-3 py-2">
                                        <p className="text-sm text-green-700 font-bold flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {tecnico.distancia_km} km de distancia
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Footer con estadísticas mejorado */}
            <div className="p-5 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-t-4 border-white">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-blue-100 hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {ordenes.length}
                                </p>
                                <p className="text-xs text-gray-600 font-bold mt-1">Órdenes</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
                                <span className="text-3xl">📋</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-green-100 hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {tecnicos.filter(t => t.ubicacion).length}
                                </p>
                                <p className="text-xs text-gray-600 font-bold mt-1">Técnicos</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                                <span className="text-3xl">👷</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
