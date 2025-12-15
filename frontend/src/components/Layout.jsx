import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'
import NotificationBell from './NotificationBell'
import TestNotifications from './TestNotifications'
import socketService from '../services/socketService'

export default function Layout({ children }) {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        // Conectar socket cuando el usuario está autenticado
        if (user?._id) {
            socketService.connect(user._id)
        }

        return () => {
            socketService.disconnect()
        }
    }, [user])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => location.pathname === path

    // 🎨 Estilos mejorados para navegación sin blancos
    const navLinkClass = (path) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(path)
        ? 'bg-gradient-to-r from-accent-600 to-accent-700 text-accent-100 shadow-lg backdrop-blur-sm border border-accent-500/50 transform scale-105'
        : 'text-primary-200 hover:bg-gradient-to-r hover:from-primary-700 hover:to-accent-700 hover:text-accent-100 hover:shadow-md hover:scale-105'
        }`

    const navLinkClassTechnician = (path) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname.includes(path) || isActive(path)
        ? 'bg-gradient-to-r from-accent-600 to-accent-700 text-accent-100 shadow-lg backdrop-blur-sm border border-accent-500/50 transform scale-105'
        : 'text-primary-200 hover:bg-gradient-to-r hover:from-primary-700 hover:to-accent-700 hover:text-accent-100 hover:shadow-md hover:scale-105'
        }`

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-accent-900">
            <nav className="bg-gradient-to-r from-primary-800 via-primary-900 to-accent-800 text-primary-100 shadow-2xl border-b border-accent-700/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center backdrop-blur-sm border border-accent-400/50 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-100 to-accent-200 bg-clip-text">
                                ServiceOps Pro
                            </div>
                        </Link>

                        {/* Menú Central */}
                        <div className="hidden lg:flex items-center space-x-2">
                            {/* Menú Analista */}
                            {user?.rol === 'analista' && (
                                <>
                                    <Link to="/" className={navLinkClass('/')}>
                                        🏠 Dashboard
                                    </Link>
                                    <Link to="/dashboard-avanzado" className={navLinkClass('/dashboard-avanzado')}>
                                        📊 Avanzado
                                    </Link>
                                    <Link to="/ot/nueva" className={navLinkClass('/ot/nueva')}>
                                        ➕ Nueva OT
                                    </Link>
                                    <Link to="/mapa" className={navLinkClass('/mapa')}>
                                        🗺️ Mapa & Tracking
                                    </Link>
                                    <Link to="/importar-excel" className={navLinkClass('/importar-excel')}>
                                        📊 Excel
                                    </Link>
                                    <Link to="/materiales" className={navLinkClass('/materiales')}>
                                        📦 Materiales
                                    </Link>
                                    <Link to="/polizas" className={navLinkClass('/polizas')}>
                                        📋 Pólizas
                                    </Link>
                                    <Link to="/estadisticas-ia" className={navLinkClass('/estadisticas-ia')}>
                                        🤖 IA
                                    </Link>
                                    <Link to="/alertas" className={navLinkClass('/alertas')}>
                                        🚨 Alertas
                                    </Link>
                                    <Link to="/reportes" className={navLinkClass('/reportes')}>
                                        📈 Reportes
                                    </Link>
                                </>
                            )}

                            {/* Menú Técnico */}
                            {user?.rol === 'tecnico' && (
                                <>
                                    <Link to="/" className={navLinkClass('/')}>
                                        🔧 Mis OTs
                                    </Link>
                                    <Link to={`/inventario/tecnico/${user._id}`} className={navLinkClassTechnician('/inventario/tecnico')}>
                                        📦 Mi Inventario
                                    </Link>
                                    <Link to="/mis-alertas" className={navLinkClass('/mis-alertas')}>
                                        🔔 Mis Alertas
                                    </Link>
                                    <Link to="/tecnico-tracker" className={navLinkClass('/tecnico-tracker')}>
                                        📍 Mi Ubicación
                                    </Link>
                                </>
                            )}

                            {/* Menú Analista Inventario Oculto */}
                            {user?.rol === 'analista_inventario_oculto' && (
                                <>
                                    <Link to="/" className={navLinkClass('/')}>
                                        🏠 Dashboard
                                    </Link>
                                    <Link to="/secret/inventario" className={navLinkClass('/secret/inventario')}>
                                        🔒 Inventario
                                    </Link>
                                    <Link to="/materiales" className={navLinkClass('/materiales')}>
                                        📦 Materiales
                                    </Link>
                                    <Link to="/estadisticas-ia" className={navLinkClass('/estadisticas-ia')}>
                                        🤖 IA
                                    </Link>
                                    <Link to="/tecnicos" className={navLinkClass('/tecnicos')}>
                                        👷 Técnicos
                                    </Link>
                                    <Link to="/reportes" className={navLinkClass('/reportes')}>
                                        📈 Reportes
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Usuario y Notificaciones */}
                        <div className="flex items-center space-x-4">
                            <NotificationBell />
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-primary-100">{user?.nombre}</div>
                                <div className="text-xs text-accent-300 capitalize">{user?.rol?.replace('_', ' ')}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-accent-400/30"
                            >
                                🚪 Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="w-full px-4 py-6">
                {children}
            </main>

            {/* Componente de prueba - remover en producción */}
            {process.env.NODE_ENV === 'development' && <TestNotifications />}
        </div>
    )
}