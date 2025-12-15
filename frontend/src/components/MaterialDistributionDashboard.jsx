import React, { useState, useEffect } from 'react';
import MaterialAssignmentForm from './MaterialAssignmentForm';
import MaterialReturnFormAdvanced from './MaterialReturnFormAdvanced';

const MaterialDistributionDashboard = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [controlesPendientes, setControlesPendientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [selectedControlId, setSelectedControlId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [estadisticasRes, controlesRes] = await Promise.all([
                fetch('/api/material-distribution/estadisticas', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/material-distribution/controles-pendientes', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            if (!estadisticasRes.ok || !controlesRes.ok) {
                throw new Error('Error cargando datos');
            }

            const [estadisticasData, controlesData] = await Promise.all([
                estadisticasRes.json(),
                controlesRes.json()
            ]);

            setEstadisticas(estadisticasData);
            setControlesPendientes(controlesData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const iniciarTrabajo = async (controlId) => {
        try {
            const response = await fetch(`/api/material-distribution/iniciar-trabajo/${controlId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error iniciando trabajo');
            }

            loadData();
        } catch (error) {
            setError(error.message);
        }
    };

    const getEstadoColor = (estado) => {
        const colors = {
            'asignado': 'bg-yellow-100 text-yellow-800',
            'en_trabajo': 'bg-blue-100 text-blue-800',
            'trabajo_completado': 'bg-green-100 text-green-800',
            'devolucion_pendiente': 'bg-orange-100 text-orange-800',
            'devolucion_completada': 'bg-purple-100 text-purple-800'
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(amount);
    };

    if (showAssignmentForm) {
        return (
            <MaterialAssignmentForm
                onAssignmentComplete={() => {
                    setShowAssignmentForm(false);
                    loadData();
                }}
                onCancel={() => setShowAssignmentForm(false)}
            />
        );
    }

    if (showReturnForm && selectedControlId) {
        return (
            <MaterialReturnFormAdvanced
                controlId={selectedControlId}
                onReturnComplete={() => {
                    setShowReturnForm(false);
                    setSelectedControlId(null);
                    loadData();
                }}
                onCancel={() => {
                    setShowReturnForm(false);
                    setSelectedControlId(null);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Control de Distribución de Materiales</h1>
                <button
                    onClick={() => setShowAssignmentForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Asignar Materiales
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Estadísticas */}
            {estadisticas && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Controles Activos</p>
                                <p className="text-3xl font-bold text-blue-600">{estadisticas.controles_activos}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                📋
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Descuadres Pendientes</p>
                                <p className="text-3xl font-bold text-red-600">{estadisticas.descuadres_pendientes}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                ⚠️
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Valor Descuadres</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(estadisticas.valor_total_descuadres)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                💰
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Materiales en Uso</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {estadisticas.materiales_en_uso?.length || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                🔧
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controles Pendientes */}
            <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Controles Activos</h2>
                        <button
                            onClick={loadData}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {controlesPendientes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay controles activos
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {controlesPendientes.map((control) => (
                                <div key={control._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                {control.tecnico_id.nombre}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {control.orden_trabajo_id
                                                    ? `OT-${control.orden_trabajo_id.numero}`
                                                    : 'Sin OT específica'
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Asignado: {new Date(control.fecha_asignacion).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(control.estado_general)}`}>
                                                {control.estado_general.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Materiales */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Materiales Asignados:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {control.materiales_asignados.map((material, index) => (
                                                <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                                                    <div className="font-medium">{material.material_id.nombre}</div>
                                                    <div className="text-gray-600">
                                                        {material.cantidad_asignada} {material.material_id.unidad_medida}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex space-x-3">
                                        {control.estado_general === 'asignado' && (
                                            <button
                                                onClick={() => iniciarTrabajo(control._id)}
                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                                            >
                                                Iniciar Trabajo
                                            </button>
                                        )}

                                        {(control.estado_general === 'en_trabajo' || control.estado_general === 'trabajo_completado') && (
                                            <button
                                                onClick={() => {
                                                    setSelectedControlId(control._id);
                                                    setShowReturnForm(true);
                                                }}
                                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                            >
                                                Procesar Devolución
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                // Aquí podrías abrir un modal con más detalles
                                                console.log('Ver detalles:', control);
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Materiales en Uso */}
            {estadisticas?.materiales_en_uso && estadisticas.materiales_en_uso.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Materiales Actualmente en Uso</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estadisticas.materiales_en_uso.map((material, index) => (
                                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-blue-800">{material.nombre}</h3>
                                    <p className="text-blue-600">
                                        Cantidad: {material.cantidad_total}
                                    </p>
                                    <p className="text-blue-600">
                                        Valor: {formatCurrency(material.valor_total)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialDistributionDashboard;