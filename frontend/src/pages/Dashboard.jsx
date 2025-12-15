import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { otService } from '../services/otService'
import { alertService } from '../services/alertService'
import { polizaService } from '../services/polizaService'

export default function Dashboard() {
    const { user } = useAuthStore()
    const [ots, setOts] = useState([])
    const [polizas, setPolizas] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('ots')

    useEffect(() => {
        loadData()
    }, [user, filter])

    const loadData = async () => {
        try {
            // Cargar OTs según el rol
            let otsResponse
            if (user?.rol === 'tecnico') {
                otsResponse = await otService.getAll({ tecnico_id: user._id })
            } else {
                otsResponse = await otService.getAll()
            }
            setOts(otsResponse.data || [])

            // Cargar pólizas (solo para analistas)
            if (user?.rol === 'analista' || user?.rol === 'analista_inventario_oculto') {
                try {
                    const polizasResponse = await polizaService.getAll()
                    setPolizas(polizasResponse.data || [])
                } catch (polizaError) {
                    console.error('Error cargando pólizas:', polizaError)
                    setPolizas([])
                }
            }

            // Cargar alertas
            const alertsResponse = await alertService.getAll({ resolved: false })
            setAlerts(alertsResponse.data || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (estado) => {
        const colors = {
            creada: 'bg-gray-200',
            asignada: 'bg-blue-200',
            en_proceso: 'bg-yellow-200',
            finalizada: 'bg-green-200',
            cerrada: 'bg-gray-400'
        }
        return colors[estado] || 'bg-gray-200'
    }

    const filteredOts = filter === 'all' ? ots : ots.filter(ot => ot.estado === filter)

    return (
        <div>
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
                    </div>
                    <div className="flex gap-3">
                        {user?.rol === 'analista' && (
                            <>
                                <Link
                                    to="/ot/nueva"
                                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium shadow-md hover:shadow-lg"
                                >
                                    + Nueva OT
                                </Link>
                                <Link
                                    to="/polizas"
                                    className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-5 py-2.5 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-medium shadow-md hover:shadow-lg"
                                >
                                    Gestionar Pólizas
                                </Link>
                            </>
                        )}
                        {user?.rol === 'tecnico' && (
                            <Link
                                to={`/inventario/tecnico/${user._id}`}
                                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md hover:shadow-lg"
                            >
                                Mi Inventario
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Alertas */}
            {alerts.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-6 shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="font-semibold text-red-900 mb-3">Alertas Activas ({alerts.length})</h3>
                            <div className="space-y-2">
                                {alerts.slice(0, 3).map(alert => (
                                    <div key={alert._id} className="text-sm text-red-800 flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{alert.descripcion}</span>
                                    </div>
                                ))}
                                {alerts.length > 3 && (
                                    <Link to="/alertas" className="text-red-700 hover:text-red-900 text-sm font-medium inline-flex items-center mt-2">
                                        Ver todas las alertas
                                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total OTs</p>
                            <p className="text-3xl font-bold text-gray-900">{ots.length}</p>
                        </div>
                        <div className="bg-gray-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                            <p className="text-3xl font-bold text-primary-600">
                                {ots.filter(ot => ['creada', 'asignada'].includes(ot.estado)).length}
                            </p>
                        </div>
                        <div className="bg-primary-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">En Proceso</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {ots.filter(ot => ot.estado === 'en_proceso').length}
                            </p>
                        </div>
                        <div className="bg-yellow-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Finalizadas</p>
                            <p className="text-3xl font-bold text-green-600">
                                {ots.filter(ot => ot.estado === 'finalizada').length}
                            </p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas de Pólizas (solo para analistas) */}
            {(user?.rol === 'analista' || user?.rol === 'analista_inventario_oculto') && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        📄 Resumen de Pólizas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Pólizas</p>
                                    <p className="text-2xl font-bold text-blue-600">{polizas.length}</p>
                                </div>
                                <span className="text-2xl">📄</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Activas</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {polizas.filter(p => p.estado === 'activo' || p.estado === 'activa').length}
                                    </p>
                                </div>
                                <span className="text-2xl">✅</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Ubicadas</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {polizas.filter(p => p.ubicacion).length}
                                    </p>
                                </div>
                                <span className="text-2xl">📍</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Sin Ubicar</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {polizas.filter(p => !p.ubicacion).length}
                                    </p>
                                </div>
                                <span className="text-2xl">❓</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerta de órdenes finalizadas */}
            {user?.rol === 'analista' && ots.filter(ot => ot.estado === 'finalizada').length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 font-semibold">
                                Tienes {ots.filter(ot => ot.estado === 'finalizada').length} orden(es) finalizada(s) pendiente(s) de revisión
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Revisa las evidencias y materiales antes de cerrar las órdenes
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pestañas y Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    {/* Pestañas principales */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab('ots')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ots'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                📋 Órdenes de Trabajo ({ots.length})
                            </button>
                            {(user?.rol === 'analista' || user?.rol === 'analista_inventario_oculto') && (
                                <button
                                    onClick={() => setActiveTab('polizas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'polizas'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    📄 Pólizas ({polizas.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtros para OTs */}
                    {activeTab === 'ots' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter('creada')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'creada'
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Creadas
                            </button>
                            <button
                                onClick={() => setFilter('asignada')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'asignada'
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Asignadas
                            </button>
                            <button
                                onClick={() => setFilter('en_proceso')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'en_proceso'
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                En Proceso
                            </button>
                            <button
                                onClick={() => setFilter('finalizada')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'finalizada'
                                    ? 'bg-accent-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Finalizadas
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-600">Cargando...</p>
                    </div>
                ) : activeTab === 'ots' ? (
                    // Contenido de Órdenes de Trabajo
                    filteredOts.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2">No hay órdenes de trabajo</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cliente</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Póliza</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Estado</th>
                                        {user?.rol !== 'tecnico' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Técnico</th>}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOts.map(ot => (
                                        <tr key={ot._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-sm text-gray-900">{ot.codigo}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{ot.cliente}</td>
                                            <td className="px-4 py-3 font-mono text-sm text-gray-600">{ot.poliza_number}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 capitalize">{ot.tipo_trabajo}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ot.estado)}`}>
                                                    {ot.estado === 'finalizada' ? '⚠️ Finalizada' : ot.estado.replace('_', ' ')}
                                                </span>
                                            </td>
                                            {user?.rol !== 'tecnico' && (
                                                <td className="px-4 py-3 text-sm text-gray-900">{ot.tecnico_id?.nombre || '-'}</td>
                                            )}
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(ot.fecha_creacion).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-3">
                                                    <Link
                                                        to={`/ot/${ot._id}`}
                                                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                                    >
                                                        Ver
                                                    </Link>
                                                    {user?.rol === 'analista' && (
                                                        <Link
                                                            to={`/mapa?ot=${ot._id}`}
                                                            className="text-accent-600 hover:text-accent-800 text-sm font-medium"
                                                        >
                                                            📍 Ubicar
                                                        </Link>
                                                    )}
                                                    {user?.rol === 'analista' && ot.estado === 'creada' && (
                                                        <Link
                                                            to={`/ot/${ot._id}/asignar`}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        >
                                                            Asignar
                                                        </Link>
                                                    )}
                                                    {user?.rol === 'tecnico' && ot.estado === 'asignada' && (
                                                        <Link
                                                            to={`/mi-ot/${ot._id}`}
                                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                                        >
                                                            Trabajar
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    // Contenido de Pólizas
                    polizas.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2">No hay pólizas registradas</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 p-4">
                            {polizas.map((poliza) => (
                                <div
                                    key={poliza._id}
                                    className="border rounded-lg p-4 transition-all hover:shadow-md border-gray-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold font-mono text-blue-900">
                                                    📄 {poliza.poliza_number}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${poliza.estado === 'activa' || poliza.estado === 'activo'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {poliza.estado}
                                                </span>
                                                {poliza.ubicacion && (
                                                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                                        📍 Ubicada
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Cliente:</span>
                                                    <span className="ml-2 font-medium">{poliza.cliente || 'No definido'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Dirección:</span>
                                                    <span className="ml-2">{poliza.direccion || 'No definida'}</span>
                                                </div>
                                                {poliza.created_at && (
                                                    <div>
                                                        <span className="text-gray-600">Creada:</span>
                                                        <span className="ml-2">{new Date(poliza.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to="/polizas"
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                            >
                                                Ver Detalles
                                            </Link>
                                            <Link
                                                to={`/crear-ot?poliza=${poliza.poliza_number}`}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                            >
                                                Crear OT
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
