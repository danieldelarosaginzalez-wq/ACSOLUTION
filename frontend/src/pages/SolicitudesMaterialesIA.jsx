import React, { useState } from 'react';
import MaterialRequestForm from '../components/MaterialRequestForm';
import MaterialRequestManager from '../components/MaterialRequestManager';
import MaterialLearningDashboard from '../components/MaterialLearningDashboard';

const SolicitudesMaterialesIA = () => {
    const [vistaActiva, setVistaActiva] = useState('solicitar');
    const [actualizarSolicitudes, setActualizarSolicitudes] = useState(0);

    const handleRequestCreated = () => {
        setActualizarSolicitudes(prev => prev + 1);
        if (vistaActiva === 'solicitar') {
            setVistaActiva('gestionar');
        }
    };

    const tabs = [
        { id: 'solicitar', label: 'Solicitar Materiales', icon: '📝' },
        { id: 'gestionar', label: 'Gestionar Solicitudes', icon: '📋' },
        { id: 'estadisticas', label: 'Estadísticas IA', icon: '📊' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🤖 Sistema Inteligente de Materiales
                    </h1>
                    <p className="text-gray-600">
                        Solicita materiales basándote en patrones de consumo históricos y aprendizaje automático
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setVistaActiva(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${vistaActiva === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="transition-all duration-300">
                    {vistaActiva === 'solicitar' && (
                        <MaterialRequestForm onRequestCreated={handleRequestCreated} />
                    )}

                    {vistaActiva === 'gestionar' && (
                        <MaterialRequestManager key={actualizarSolicitudes} />
                    )}

                    {vistaActiva === 'estadisticas' && (
                        <MaterialLearningDashboard />
                    )}
                </div>

                {/* Información del sistema */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        ¿Cómo funciona el Sistema Inteligente?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-700">
                        <div>
                            <h4 className="font-semibold mb-2">1. Aprendizaje Automático</h4>
                            <p>
                                El sistema aprende de cada trabajo completado, registrando qué materiales
                                se utilizaron y en qué cantidades para cada tipo de trabajo.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">2. Sugerencias Inteligentes</h4>
                            <p>
                                Basándose en patrones históricos, el sistema sugiere automáticamente
                                los materiales y cantidades necesarias para cada tipo de trabajo.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">3. Mejora Continua</h4>
                            <p>
                                Mientras más trabajos se completen, más preciso se vuelve el sistema,
                                optimizando el inventario y reduciendo desperdicios.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Indicadores de estado */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Sistema Activo</p>
                                <p className="text-xs text-gray-500">Aprendiendo continuamente</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">IA Entrenada</p>
                                <p className="text-xs text-gray-500">Patrones detectados</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Optimización</p>
                                <p className="text-xs text-gray-500">Reduciendo desperdicios</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">📈</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Mejora Continua</p>
                                <p className="text-xs text-gray-500">Cada trabajo cuenta</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudesMaterialesIA;