import React, { useState, useEffect } from 'react';

const MaterialLearningDashboard = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [estadisticasSolicitudes, setEstadisticasSolicitudes] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        setLoading(true);
        try {
            const [respuestaAprendizaje, respuestaSolicitudes] = await Promise.all([
                fetch('/api/material-requests/estadisticas-aprendizaje', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/material-requests/estadisticas', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            if (respuestaAprendizaje.ok) {
                const dataAprendizaje = await respuestaAprendizaje.json();
                setEstadisticas(dataAprendizaje);
            }

            if (respuestaSolicitudes.ok) {
                const dataSolicitudes = await respuestaSolicitudes.json();
                setEstadisticasSolicitudes(dataSolicitudes);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColorConfianza = (porcentaje) => {
        if (porcentaje >= 80) return 'text-green-600 bg-green-100';
        if (porcentaje >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Resumen de Aprendizaje */}
            {estadisticas && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        🤖 Sistema de Aprendizaje Automático
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Patrones Totales</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {estadisticas.resumen.total_patrones}
                            </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">Patrones Confiables</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {estadisticas.resumen.patrones_confiables}
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg ${getColorConfianza(estadisticas.resumen.porcentaje_confiabilidad)}`}>
                            <h3 className="text-lg font-semibold mb-2">Confiabilidad</h3>
                            <p className="text-3xl font-bold">
                                {estadisticas.resumen.porcentaje_confiabilidad.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Tipos de Trabajo */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Tipos de Trabajo Aprendidos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estadisticas.tipos_trabajo.map((tipo, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">
                                        {tipo._id.replace(/_/g, ' ').toUpperCase()}
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-600">
                                            Patrones: <span className="font-semibold">{tipo.total_patrones}</span>
                                        </p>
                                        <p className="text-gray-600">
                                            Trabajos: <span className="font-semibold">{tipo.total_trabajos}</span>
                                        </p>
                                        <p className={`font-semibold ${getColorConfianza(tipo.confianza_promedio * 100).split(' ')[0]}`}>
                                            Confianza: {(tipo.confianza_promedio * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Materiales Más Usados */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Materiales Más Utilizados
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Material</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Consumo Total</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Trabajos</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Tipos de Trabajo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estadisticas.materiales_mas_usados.map((material, index) => (
                                        <tr key={index} className="border-t border-gray-200">
                                            <td className="px-4 py-2 text-sm text-gray-800">
                                                {material.material?.[0]?.nombre || 'Material desconocido'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {material.total_consumo}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {material.total_trabajos}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {material.tipos_trabajo.length}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas de Solicitudes */}
            {estadisticasSolicitudes && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        📋 Estadísticas de Solicitudes
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-800">
                                {estadisticasSolicitudes.resumen.total_solicitudes}
                            </p>
                            <p className="text-sm text-gray-600">Total</p>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                                {estadisticasSolicitudes.resumen.pendientes}
                            </p>
                            <p className="text-sm text-gray-600">Pendientes</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {estadisticasSolicitudes.resumen.aprobadas}
                            </p>
                            <p className="text-sm text-gray-600">Aprobadas</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {estadisticasSolicitudes.resumen.entregadas}
                            </p>
                            <p className="text-sm text-gray-600">Entregadas</p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {estadisticasSolicitudes.resumen.porcentaje_ia.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">Generadas por IA</p>
                        </div>
                    </div>

                    {/* Materiales Más Solicitados */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Materiales Más Solicitados
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {estadisticasSolicitudes.materiales_mas_solicitados.slice(0, 6).map((material, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">
                                        {material.material?.[0]?.nombre || 'Material desconocido'}
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-600">Solicitado</p>
                                            <p className="font-semibold">{material.total_solicitado}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Aprobado</p>
                                            <p className="font-semibold">{material.total_aprobado}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Veces</p>
                                            <p className="font-semibold">{material.veces_solicitado}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Técnicos Más Activos */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Técnicos Más Activos
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Técnico</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Solicitudes</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Solicitudes IA</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">% IA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estadisticasSolicitudes.tecnicos_mas_solicitan.slice(0, 10).map((tecnico, index) => (
                                        <tr key={index} className="border-t border-gray-200">
                                            <td className="px-4 py-2 text-sm text-gray-800">
                                                {tecnico.tecnico?.[0]?.nombre || 'Técnico desconocido'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {tecnico.total_solicitudes}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {tecnico.solicitudes_ia}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-purple-600 font-semibold">
                                                {((tecnico.solicitudes_ia / tecnico.total_solicitudes) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón de actualización */}
            <div className="text-center">
                <button
                    onClick={cargarEstadisticas}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Actualizando...' : 'Actualizar Estadísticas'}
                </button>
            </div>
        </div>
    );
};

export default MaterialLearningDashboard;