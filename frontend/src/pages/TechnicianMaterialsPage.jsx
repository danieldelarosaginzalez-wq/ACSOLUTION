import React, { useState, useEffect } from 'react';
import { materialDistributionService } from '../services/materialDistributionService';
import MaterialReturnFormAdvanced from '../components/MaterialReturnFormAdvanced';

const TechnicianMaterialsPage = () => {
    const [misAsignaciones, setMisAsignaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [selectedControlId, setSelectedControlId] = useState(null);

    useEffect(() => {
        loadMisAsignaciones();
    }, []);

    const loadMisAsignaciones = async () => {
        setLoading(true);
        try {
            const asignaciones = await materialDistributionService.getMisAsignaciones();
            setMisAsignaciones(asignaciones);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const iniciarTrabajo = async (controlId) => {
        try {
            await materialDistributionService.iniciarTrabajo(controlId);
            loadMisAsignaciones();
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

    if (showReturnForm && selectedControlId) {
        return (
            <MaterialReturnFormAdvanced
                controlId={selectedControlId}
                onReturnComplete={() => {
                    setShowReturnForm(false);
                    setSelectedControlId(null);
                    loadMisAsignaciones();
                }}
                onCancel={() => {
                    setShowReturnForm(false);
                    setSelectedControlId(null);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mis Materiales Asignados</h1>
                        <p className="mt-2 text-gray-600">
                            Gestiona los materiales que tienes asignados para tus trabajos
                        </p>
                    </div>
                    <button
                        onClick={loadMisAsignaciones}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Asignaciones */}
                <div className="space-y-6">
                    {misAsignaciones.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                            <div className="text-gray-400 text-6xl mb-4">📦</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No tienes materiales asignados
                            </h3>
                            <p className="text-gray-600">
                                Cuando el bodeguero te asigne materiales, aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        misAsignaciones.map((control) => (
                            <div key={control._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                                {/* Header del Control */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {control.orden_trabajo_id
                                                    ? `Orden de Trabajo #${control.orden_trabajo_id.numero}`
                                                    : 'Asignación General'
                                                }
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Asignado el: {new Date(control.fecha_asignacion).toLocaleDateString()}
                                            </p>
                                            {control.bodeguero_asigno && (
                                                <p className="text-sm text-gray-600">
                                                    Bodeguero: {control.bodeguero_asigno.nombre}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(control.estado_general)}`}>
                                                {control.estado_general.replace('_', ' ')}
                                            </span>
                                            {control.fecha_inicio_trabajo && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Iniciado: {new Date(control.fecha_inicio_trabajo).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Materiales Asignados */}
                                <div className="px-6 py-4">
                                    <h4 className="font-medium text-gray-800 mb-3">Materiales Asignados</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Material</th>
                                                    <th className="px-3 py-2 text-center">Asignado</th>
                                                    <th className="px-3 py-2 text-center">Utilizado</th>
                                                    <th className="px-3 py-2 text-center">Devuelto</th>
                                                    <th className="px-3 py-2 text-center">Perdido</th>
                                                    <th className="px-3 py-2 text-center">Estado</th>
                                                    <th className="px-3 py-2 text-center">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {control.materiales_asignados.map((material, index) => (
                                                    <tr key={index} className="border-t">
                                                        <td className="px-3 py-2">
                                                            <div>
                                                                <div className="font-medium">{material.material_id.nombre}</div>
                                                                <div className="text-gray-500 text-xs">
                                                                    {material.material_id.unidad_medida}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-medium">
                                                            {material.cantidad_asignada}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {material.cantidad_utilizada || 0}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {material.cantidad_devuelta || 0}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {material.cantidad_perdida > 0 ? (
                                                                <div>
                                                                    <div className="text-red-600 font-medium">
                                                                        {material.cantidad_perdida}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {material.motivo_perdida}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                '0'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs ${material.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                                                    material.estado === 'devuelto_total' ? 'bg-blue-100 text-blue-800' :
                                                                        material.estado === 'devuelto_parcial' ? 'bg-yellow-100 text-yellow-800' :
                                                                            material.estado === 'en_uso' ? 'bg-purple-100 text-purple-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {material.estado.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-sm">
                                                            {formatCurrency(material.material_id.costo_unitario * material.cantidad_asignada)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Observaciones */}
                                {(control.observaciones_bodeguero || control.observaciones_tecnico) && (
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                        <h5 className="font-medium text-gray-700 mb-2">Observaciones</h5>
                                        {control.observaciones_bodeguero && (
                                            <div className="mb-2">
                                                <span className="text-sm font-medium text-gray-600">Bodeguero:</span>
                                                <p className="text-sm text-gray-700">{control.observaciones_bodeguero}</p>
                                            </div>
                                        )}
                                        {control.observaciones_tecnico && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Técnico:</span>
                                                <p className="text-sm text-gray-700">{control.observaciones_tecnico}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        {control.estado_general === 'asignado' && (
                                            <button
                                                onClick={() => iniciarTrabajo(control._id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                                            >
                                                🚀 Iniciar Trabajo
                                            </button>
                                        )}

                                        {(control.estado_general === 'en_trabajo' || control.estado_general === 'trabajo_completado') && (
                                            <button
                                                onClick={() => {
                                                    setSelectedControlId(control._id);
                                                    setShowReturnForm(true);
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                                            >
                                                📦 Procesar Devolución
                                            </button>
                                        )}

                                        {control.tiene_descuadre && (
                                            <div className="flex items-center text-red-600 text-sm">
                                                <span className="mr-2">⚠️</span>
                                                <span>Descuadre: {formatCurrency(control.valor_descuadre)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechnicianMaterialsPage;