import React, { useState, useEffect } from 'react';

const MaterialRequestManager = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [comparacionPatrones, setComparacionPatrones] = useState(null);

    useEffect(() => {
        cargarSolicitudesPendientes();
    }, []);

    const cargarSolicitudesPendientes = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/material-requests/pendientes', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSolicitudes(data);
            }
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        } finally {
            setLoading(false);
        }
    };

    const compararConPatrones = async (solicitudId) => {
        try {
            const response = await fetch(`/api/material-requests/${solicitudId}/comparar-patrones`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setComparacionPatrones(data);
            }
        } catch (error) {
            console.error('Error comparando con patrones:', error);
        }
    };

    const aprobarSolicitud = async (solicitudId, ajustes = null) => {
        try {
            const response = await fetch(`/api/material-requests/${solicitudId}/aprobar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ajustes })
            });

            if (response.ok) {
                alert('Solicitud aprobada exitosamente');
                cargarSolicitudesPendientes();
                setSolicitudSeleccionada(null);
                setComparacionPatrones(null);
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            alert('Error aprobando solicitud');
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getColorConfianza = (confianza) => {
        if (confianza >= 0.8) return 'text-green-600';
        if (confianza >= 0.5) return 'text-yellow-600';
        return 'text-red-600';
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
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Solicitudes Pendientes ({solicitudes.length})
                </h2>

                {solicitudes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No hay solicitudes pendientes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {solicitudes.map((solicitud) => (
                            <div key={solicitud._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {solicitud.tecnico_id?.nombre || 'Técnico desconocido'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {formatearFecha(solicitud.fecha_solicitud)}
                                        </p>
                                        {solicitud.es_sugerencia_ia && (
                                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
                                                🤖 Generada por IA
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSolicitudSeleccionada(solicitud);
                                                compararConPatrones(solicitud._id);
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Analizar IA
                                        </button>
                                        <button
                                            onClick={() => aprobarSolicitud(solicitud._id)}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                        >
                                            Aprobar
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {solicitud.materiales_solicitados.map((material, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium text-gray-800">
                                                {material.material_id?.nombre || 'Material desconocido'}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                Cantidad: {material.cantidad_solicitada} {material.material_id?.unidad_medida}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Stock: {material.material_id?.stock_actual}
                                            </p>
                                            {material.motivo && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Motivo: {material.motivo}
                                                </p>
                                            )}
                                            {material.tipo_trabajo_estimado && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Trabajo: {material.tipo_trabajo_estimado.replace(/_/g, ' ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {solicitud.observaciones && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded">
                                        <p className="text-sm text-blue-800">{solicitud.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de análisis IA */}
            {solicitudSeleccionada && comparacionPatrones && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                Análisis IA - {solicitudSeleccionada.tecnico_id?.nombre}
                            </h3>
                            <button
                                onClick={() => {
                                    setSolicitudSeleccionada(null);
                                    setComparacionPatrones(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {comparacionPatrones.comparaciones.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No hay patrones disponibles para comparar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comparacionPatrones.comparaciones.map((comp, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">
                                            {comp.material?.nombre || 'Material desconocido'}
                                        </h4>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Solicitado</p>
                                                <p className="text-lg font-semibold">{comp.cantidad_solicitada}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Sugerido IA</p>
                                                <p className="text-lg font-semibold">{comp.cantidad_sugerida}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Diferencia</p>
                                                <p className={`text-lg font-semibold ${comp.diferencia > 0 ? 'text-red-600' : comp.diferencia < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {comp.diferencia > 0 ? '+' : ''}{comp.diferencia}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Confianza</p>
                                                <p className={`text-lg font-semibold ${getColorConfianza(comp.confianza_patron)}`}>
                                                    {(comp.confianza_patron * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-sm text-blue-800">
                                                <strong>Recomendación:</strong> {comp.recomendacion}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setSolicitudSeleccionada(null);
                                    setComparacionPatrones(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => aprobarSolicitud(solicitudSeleccionada._id)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Aprobar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialRequestManager;