import React, { useState, useEffect } from 'react';

const MaterialDiscrepancyManager = () => {
    const [descuadres, setDescuadres] = useState([]);
    const [descuadresResueltos, setDescuadresResueltos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTab, setSelectedTab] = useState('pendientes');
    const [resolvingId, setResolvingId] = useState(null);
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        loadDescuadres();
    }, [selectedTab]);

    const loadDescuadres = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/material-distribution/descuadres?resueltos=${selectedTab === 'resueltos'}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando descuadres');
            }

            const data = await response.json();

            if (selectedTab === 'pendientes') {
                setDescuadres(data);
            } else {
                setDescuadresResueltos(data);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resolverDescuadre = async (controlId) => {
        if (!observaciones.trim()) {
            setError('Debe agregar observaciones para resolver el descuadre');
            return;
        }

        try {
            const response = await fetch(`/api/material-distribution/resolver-descuadre/${controlId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ observaciones })
            });

            if (!response.ok) {
                throw new Error('Error resolviendo descuadre');
            }

            setResolvingId(null);
            setObservaciones('');
            loadDescuadres();
        } catch (error) {
            setError(error.message);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(amount);
    };

    const getEstadoColor = (estado) => {
        const colors = {
            'devolucion_completada': 'bg-yellow-100 text-yellow-800',
            'cerrado': 'bg-green-100 text-green-800',
            'en_trabajo': 'bg-blue-100 text-blue-800'
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const currentDescuadres = selectedTab === 'pendientes' ? descuadres : descuadresResueltos;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Descuadres de Materiales</h2>
                <button
                    onClick={loadDescuadres}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    disabled={loading}
                >
                    {loading ? 'Cargando...' : 'Actualizar'}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
                <button
                    onClick={() => setSelectedTab('pendientes')}
                    className={`px-4 py-2 rounded-lg font-medium ${selectedTab === 'pendientes'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Pendientes ({descuadres.length})
                </button>
                <button
                    onClick={() => setSelectedTab('resueltos')}
                    className={`px-4 py-2 rounded-lg font-medium ${selectedTab === 'resueltos'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Resueltos ({descuadresResueltos.length})
                </button>
            </div>

            {/* Lista de Descuadres */}
            <div className="space-y-4">
                {currentDescuadres.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {selectedTab === 'pendientes'
                            ? 'No hay descuadres pendientes'
                            : 'No hay descuadres resueltos'
                        }
                    </div>
                ) : (
                    currentDescuadres.map((control) => (
                        <div key={control._id} className="border border-gray-200 rounded-lg p-6">
                            {/* Header del Control */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Técnico: {control.tecnico_id.nombre}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {control.orden_trabajo_id
                                            ? `OT-${control.orden_trabajo_id.numero}`
                                            : 'Sin OT específica'
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(control.estado_general)}`}>
                                        {control.estado_general.replace('_', ' ')}
                                    </span>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {new Date(control.fecha_devolucion).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Información del Descuadre */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-red-800">Descuadre Detectado</h4>
                                    <span className="text-lg font-bold text-red-600">
                                        {formatCurrency(control.valor_descuadre)}
                                    </span>
                                </div>
                                <p className="text-red-700 text-sm">
                                    {control.motivo_descuadre}
                                </p>
                            </div>

                            {/* Detalle de Materiales */}
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Detalle de Materiales</h4>
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {control.materiales_asignados.map((material, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-3 py-2">
                                                        <div>
                                                            <div className="font-medium">{material.material_id.nombre}</div>
                                                            <div className="text-gray-500 text-xs">
                                                                {formatCurrency(material.material_id.costo_unitario)} / {material.material_id.unidad_medida}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">{material.cantidad_asignada}</td>
                                                    <td className="px-3 py-2 text-center">{material.cantidad_utilizada}</td>
                                                    <td className="px-3 py-2 text-center">{material.cantidad_devuelta}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        {material.cantidad_perdida > 0 ? (
                                                            <div>
                                                                <div className="text-red-600 font-medium">{material.cantidad_perdida}</div>
                                                                <div className="text-xs text-gray-500">{material.motivo_perdida}</div>
                                                            </div>
                                                        ) : (
                                                            '0'
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs ${material.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                                                material.estado === 'devuelto_total' ? 'bg-blue-100 text-blue-800' :
                                                                    material.estado === 'devuelto_parcial' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {material.estado.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {control.observaciones_bodeguero && (
                                    <div>
                                        <h5 className="font-medium text-gray-700">Observaciones Bodeguero:</h5>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {control.observaciones_bodeguero}
                                        </p>
                                    </div>
                                )}
                                {control.observaciones_tecnico && (
                                    <div>
                                        <h5 className="font-medium text-gray-700">Observaciones Técnico:</h5>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {control.observaciones_tecnico}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Resolución del Descuadre */}
                            {selectedTab === 'pendientes' ? (
                                <div className="border-t pt-4">
                                    {resolvingId === control._id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                rows="3"
                                                placeholder="Observaciones del analista sobre la resolución del descuadre..."
                                                required
                                            />
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => resolverDescuadre(control._id)}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                                                    disabled={!observaciones.trim()}
                                                >
                                                    Resolver Descuadre
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResolvingId(null);
                                                        setObservaciones('');
                                                    }}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setResolvingId(control._id)}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                                        >
                                            Resolver Descuadre
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="border-t pt-4">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <h5 className="font-medium text-green-800 mb-1">Resuelto por:</h5>
                                        <p className="text-sm text-green-700">
                                            {control.analista_supervisa?.nombre} - {new Date(control.fecha_resolucion_descuadre).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-green-600 mt-2">
                                            {control.observaciones_analista}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MaterialDiscrepancyManager;