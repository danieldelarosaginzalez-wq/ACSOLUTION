import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardAnalistaAvanzado() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');

    useEffect(() => {
        loadDashboard();

        // Auto-refresh cada 5 minutos
        const interval = setInterval(() => {
            refreshDashboard();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/analyst');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshDashboard = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/dashboard/analyst');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error refrescando dashboard:', error);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-6">
                <div className="text-center text-red-600">
                    Error cargando el dashboard
                </div>
            </div>
        );
    }

    const { orders, materials, technicians, alerts, recentActivity, predictions, performance } = dashboardData;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard Analista
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Vista completa del sistema en tiempo real
                    </p>
                </div>
                <button
                    onClick={refreshDashboard}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    <svg
                        className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Órdenes Totales"
                    value={orders.total}
                    subtitle={`${orders.thisMonth} este mes`}
                    icon="📦"
                    color="blue"
                    trend={orders.trend?.length > 0 ? 'up' : 'neutral'}
                />
                <KPICard
                    title="Tasa de Completado"
                    value={`${orders.completionRate}%`}
                    subtitle={`${orders.completed} completadas`}
                    icon="✅"
                    color="green"
                    trend="up"
                />
                <KPICard
                    title="Alertas Activas"
                    value={alerts.active}
                    subtitle={`${alerts.byPriority.critical} críticas`}
                    icon="🔔"
                    color="red"
                    trend={alerts.active > 5 ? 'down' : 'neutral'}
                />
                <KPICard
                    title="Stock Bajo"
                    value={materials.lowStock}
                    subtitle={`${materials.healthScore}% saludable`}
                    icon="📊"
                    color="yellow"
                    trend={materials.lowStock > 10 ? 'down' : 'up'}
                />
            </div>

            {/* Gráficos Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendencia de Órdenes */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tendencia de Órdenes (30 días)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={orders.trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                name="Órdenes"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Órdenes por Estado */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución por Estado
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={Object.entries(orders.byStatus).map(([key, value]) => ({
                                    name: key,
                                    value,
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {Object.keys(orders.byStatus).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Rendimiento de Técnicos */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rendimiento de Técnicos
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Técnico
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asignadas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completadas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    En Progreso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tasa Completado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Eficiencia
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {technicians.technicians.map((tech) => (
                                <tr key={tech.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {tech.name}
                                        </div>
                                        <div className="text-sm text-gray-500">{tech.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {tech.assigned}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        {tech.completed}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                        {tech.inProgress}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full"
                                                    style={{ width: `${tech.completionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {tech.completionRate}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tech.efficiency >= 80
                                                    ? 'bg-green-100 text-green-800'
                                                    : tech.efficiency >= 60
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {tech.efficiency}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actividad Reciente y Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actividad Reciente */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Actividad Reciente
                    </h3>
                    <div className="space-y-4">
                        {recentActivity.orders.slice(0, 5).map((order) => (
                            <div
                                key={order._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        OT #{order.numeroOT}
                                    </p>
                                    <p className="text-sm text-gray-600">{order.cliente}</p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.estado === 'completada'
                                                ? 'bg-green-100 text-green-800'
                                                : order.estado === 'en_progreso'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {order.estado}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(order.updatedAt).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alertas Críticas */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Alertas Críticas
                    </h3>
                    <div className="space-y-4">
                        {recentActivity.alerts.map((alert) => (
                            <div
                                key={alert._id}
                                className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                            >
                                <span className="text-2xl">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {alert.titulo}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {alert.descripcion}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(alert.createdAt).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Tiempo Promedio de Completado"
                    value={`${Math.round(performance.avgCompletionTime / (1000 * 60 * 60))}h`}
                    icon="⏱️"
                    color="purple"
                />
                <MetricCard
                    title="Tasa de Cumplimiento"
                    value={`${performance.onTimeRate}%`}
                    icon="🎯"
                    color="green"
                />
                <MetricCard
                    title="Satisfacción del Cliente"
                    value={`${performance.customerSatisfaction.toFixed(1)}/5`}
                    icon="⭐"
                    color="yellow"
                />
            </div>
        </div>
    );
}

// Componente KPI Card
function KPICard({ title, value, subtitle, icon, color, trend }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
    };

    const trendIcons = {
        up: '📈',
        down: '📉',
        neutral: '➡️',
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <span className="text-2xl">{icon}</span>
                </div>
                <span className="text-xl">{trendIcons[trend]}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
    );
}

// Componente Metric Card
function MetricCard({ title, value, icon, color }) {
    const colorClasses = {
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <span className="text-3xl">{icon}</span>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
