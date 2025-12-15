import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const login = useAuthStore(state => state.login)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await api.post('/auth/login', { email, password })
            login(response.data.user, response.data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-900 to-accent-800 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-700/30 via-transparent to-accent-700/30"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-accent-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-success-500/10 rounded-full blur-lg animate-bounce"></div>

            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md border border-accent-600/30 relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-4xl">⚡</span>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
                    ServiceOps Pro
                </h1>
                <h2 className="text-lg text-center mb-6 text-neutral-300">Iniciar Sesión</h2>

                {error && (
                    <div className="bg-gradient-to-r from-danger-800 to-danger-900 border border-danger-600 text-danger-200 px-4 py-3 rounded-lg mb-4 shadow-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-neutral-200">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gradient-to-r from-neutral-700 to-neutral-800 border-2 border-neutral-600 text-neutral-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-neutral-400"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-neutral-200">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gradient-to-r from-neutral-700 to-neutral-800 border-2 border-neutral-600 text-neutral-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-neutral-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 text-primary-100 py-3 rounded-lg hover:from-primary-700 hover:via-primary-800 hover:to-accent-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] border border-primary-500/30"
                    >
                        🚀 Ingresar
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/register"
                        className="text-accent-300 hover:text-accent-200 font-medium hover:underline transition-colors"
                    >
                        ¿No tienes cuenta? Regístrate
                    </Link>
                </div>
            </div>
        </div>
    )
}