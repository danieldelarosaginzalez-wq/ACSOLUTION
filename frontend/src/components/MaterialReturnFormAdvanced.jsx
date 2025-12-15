import React, { useState, useEffect } from 'react';

const MaterialReturnFormAdvanced = ({ controlId, onReturnComplete, onCancel }) => {
    const [control, setControl] = useState(null);
    const [formData, setFormData] = useState({
        materiales_devueltos: [],
        observaciones_tecnico: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (controlId) {
            loadControlData();
        }
    }, [controlId]);

    const loadControlData = async () => {
        try {
            const response = await fetch(`/api/material-distribution/control/${controlId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando datos del control');
            }

            const controlData = await response.json();
            setControl(controlData);

            // Inicializar form data con los materiales asignados
            const materialesDevueltos = controlData.materiales_asignados.map(material => ({
                material_id: material.material_id._id,
                cantidad_utilizada: 0,
                cantidad_devuelta: material.cantidad_asignada,
                cantidad_perdida: 0,
                motivo_perdida: ''
            }));

            setFormData(prev => ({
                ...prev,
                materiales_devueltos: materialesDevueltos
            }));
        } catch (error) {
            setError(error.message);
        }
    };

    const updateMaterial = (materialId, field, value) => {
        setFormData(prev => ({
            ...prev,
            materiales_devueltos: prev.materiales_devueltos.map(material =>
                material.material_id === materialId
                    ? { ...material, [field]: value }
                    : material
            )
        }));
    };

    const recalcularCantidades = (materialId, cantidadUtilizada) => {
        const materialAsignado = control.materiales_asignados.find(m => m.material_id._id === materialId);
        if (!materialAsignado) return;

        const cantidadDevuelta = Math.max(0, materialAsignado.cantidad_asignada - cantidadUtilizada);

        setFormData(prev => ({
            ...prev,
            materiales_devueltos: prev.materiales_devueltos.map(material =>
                material.material_id === materialId
                    ? {
                        ...material,
                        cantidad_utilizada: cantidadUtilizada,
                        cantidad_devuelta: cantidadDevuelta,
                        cantidad_perdida: 0
                    }
                    : material
            )
        }));
    };

    const validateForm = () => {
        for (const material of formData.materiales_devueltos) {
            const materialAsignado = control.materiales_asignados.find(m => m.material_id._id === material.material_id);
            const total = material.cantidad_utilizada + material.cantidad_devuelta + material.cantidad_perdida;

            if (total !== materialAsignado.cantidad_asignada) {
                setError(`Las cantidades del material ${materialAsignado.material_id.nombre} no cuadran`);
                return false;
            }

            if (material.cantidad_perdida > 0 && !material.motivo_perdida.trim()) {
                setError(`Debe especificar el motivo de pérdida para ${materialAsignado.material_id.nombre}`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/material-distribution/devolver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    control_id: controlId,
                    ...formData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error procesando devolución');
            }

            const result = await response.json();
            onReturnComplete(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!control) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="text-center">Cargando datos...</div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Devolver Materiales</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Información del Control */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Información de la Asignación</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Fecha Asignación:</span>
                        <div className="font-medium">
                            {new Date(control.fecha_asignacion).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-600">OT:</span>
                        <div className="font-medium">
                            {control.orden_trabajo_id?.numero || 'Sin OT específica'}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-600">Estado:</span>
                        <div className="font-medium capitalize">
                            {control.estado_general.replace('_', ' ')}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-600">Bodeguero:</span>
                        <div className="font-medium">
                            {control.bodeguero_asigno?.nombre}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Materiales */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Materiales Asignados</h3>
                    <div className="space-y-4">
                        {control.materiales_asignados.map((materialAsignado, index) => {
                            const materialDevuelto = formData.materiales_devueltos.find(
                                m => m.material_id === materialAsignado.material_id._id
                            );

                            return (
                                <div key={materialAsignado.material_id._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">
                                                {materialAsignado.material_id.nombre}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                Cantidad asignada: {materialAsignado.cantidad_asignada} {materialAsignado.material_id.unidad_medida}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-gray-600">
                                            Costo unitario: ${materialAsignado.material_id.costo_unitario}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Cantidad Utilizada */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad Utilizada
                                            </label>
                                            <input
                                                type="number"
                                                value={materialDevuelto?.cantidad_utilizada || 0}
                                                onChange={(e) => {
                                                    const valor = parseInt(e.target.value) || 0;
                                                    recalcularCantidades(materialAsignado.material_id._id, valor);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                max={materialAsignado.cantidad_asignada}
                                            />
                                        </div>

                                        {/* Cantidad Devuelta */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad Devuelta
                                            </label>
                                            <input
                                                type="number"
                                                value={materialDevuelto?.cantidad_devuelta || 0}
                                                onChange={(e) => updateMaterial(
                                                    materialAsignado.material_id._id,
                                                    'cantidad_devuelta',
                                                    parseInt(e.target.value) || 0
                                                )}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                max={materialAsignado.cantidad_asignada}
                                            />
                                        </div>

                                        {/* Cantidad Perdida */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad Perdida
                                            </label>
                                            <input
                                                type="number"
                                                value={materialDevuelto?.cantidad_perdida || 0}
                                                onChange={(e) => updateMaterial(
                                                    materialAsignado.material_id._id,
                                                    'cantidad_perdida',
                                                    parseInt(e.target.value) || 0
                                                )}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                max={materialAsignado.cantidad_asignada}
                                            />
                                        </div>
                                    </div>

                                    {/* Motivo de Pérdida */}
                                    {(materialDevuelto?.cantidad_perdida || 0) > 0 && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Motivo de Pérdida *
                                            </label>
                                            <input
                                                type="text"
                                                value={materialDevuelto?.motivo_perdida || ''}
                                                onChange={(e) => updateMaterial(
                                                    materialAsignado.material_id._id,
                                                    'motivo_perdida',
                                                    e.target.value
                                                )}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                placeholder="Explique por qué se perdió este material..."
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Validación Visual */}
                                    <div className="mt-3 p-2 rounded text-sm">
                                        {(() => {
                                            const total = (materialDevuelto?.cantidad_utilizada || 0) +
                                                (materialDevuelto?.cantidad_devuelta || 0) +
                                                (materialDevuelto?.cantidad_perdida || 0);
                                            const diferencia = materialAsignado.cantidad_asignada - total;

                                            if (diferencia === 0) {
                                                return (
                                                    <div className="text-green-700 bg-green-100 p-2 rounded">
                                                        ✓ Las cantidades cuadran correctamente
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="text-red-700 bg-red-100 p-2 rounded">
                                                        ⚠ Diferencia: {diferencia} unidades
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Observaciones */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones del Técnico
                    </label>
                    <textarea
                        value={formData.observaciones_tecnico}
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones_tecnico: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Observaciones sobre el trabajo realizado y los materiales utilizados..."
                    />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Procesar Devolución'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterialReturnFormAdvanced;