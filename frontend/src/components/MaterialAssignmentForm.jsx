import React, { useState, useEffect } from 'react';
import { materialService } from '../services/materialService';
import { inventoryService } from '../services/inventoryService';
import { otService } from '../services/otService';

const MaterialAssignmentForm = ({ onAssignmentComplete, onCancel }) => {
    const [formData, setFormData] = useState({
        tecnico_id: '',
        orden_trabajo_id: '',
        materiales: [],
        observaciones: ''
    });

    const [tecnicos, setTecnicos] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [materialesDisponibles, setMaterialesDisponibles] = useState([]);
    const [inventarioTecnico, setInventarioTecnico] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (formData.tecnico_id) {
            loadInventarioTecnico();
        }
    }, [formData.tecnico_id]);

    const loadInitialData = async () => {
        try {
            const [tecnicosRes, ordenesRes, materialesRes] = await Promise.all([
                fetch('/api/users?role=tecnico'),
                otService.getOrdenes({ estado: 'asignada' }),
                materialService.getMateriales()
            ]);

            setTecnicos(await tecnicosRes.json());
            setOrdenes(ordenesRes);
            setMaterialesDisponibles(materialesRes);
        } catch (error) {
            setError('Error cargando datos iniciales');
            console.error(error);
        }
    };

    const loadInventarioTecnico = async () => {
        try {
            const inventario = await inventoryService.getInventarioTecnico(formData.tecnico_id);
            setInventarioTecnico(inventario.materials || []);
        } catch (error) {
            console.error('Error cargando inventario del técnico:', error);
        }
    };

    const addMaterial = () => {
        setFormData(prev => ({
            ...prev,
            materiales: [...prev.materiales, { material_id: '', cantidad: 0 }]
        }));
    };

    const removeMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materiales: prev.materiales.filter((_, i) => i !== index)
        }));
    };

    const updateMaterial = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            materiales: prev.materiales.map((material, i) =>
                i === index ? { ...material, [field]: value } : material
            )
        }));
    };

    const getMaterialInfo = (materialId) => {
        const material = materialesDisponibles.find(m => m._id === materialId);
        const inventario = inventarioTecnico.find(i => i.material_id._id === materialId);
        return { material, inventario };
    };

    const validateForm = () => {
        if (!formData.tecnico_id) {
            setError('Debe seleccionar un técnico');
            return false;
        }

        if (formData.materiales.length === 0) {
            setError('Debe agregar al menos un material');
            return false;
        }

        for (const material of formData.materiales) {
            if (!material.material_id || material.cantidad <= 0) {
                setError('Todos los materiales deben tener ID y cantidad válida');
                return false;
            }

            const { inventario } = getMaterialInfo(material.material_id);
            if (!inventario || inventario.cantidad_disponible < material.cantidad) {
                const materialInfo = getMaterialInfo(material.material_id).material;
                setError(`Material ${materialInfo?.nombre} no tiene suficiente stock disponible`);
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
            const response = await fetch('/api/material-distribution/asignar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error asignando materiales');
            }

            const result = await response.json();
            onAssignmentComplete(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Asignar Materiales</h2>
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Técnico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Técnico *
                        </label>
                        <select
                            value={formData.tecnico_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, tecnico_id: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar técnico</option>
                            {tecnicos.map(tecnico => (
                                <option key={tecnico._id} value={tecnico._id}>
                                    {tecnico.nombre} - {tecnico.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Orden de Trabajo (Opcional)
                        </label>
                        <select
                            value={formData.orden_trabajo_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, orden_trabajo_id: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sin OT específica</option>
                            {ordenes.map(orden => (
                                <option key={orden._id} value={orden._id}>
                                    OT-{orden.numero} - {orden.poliza_id?.direccion}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Materiales */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Materiales a Asignar
                        </label>
                        <button
                            type="button"
                            onClick={addMaterial}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                            + Agregar Material
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.materiales.map((material, index) => {
                            const { material: materialInfo, inventario } = getMaterialInfo(material.material_id);

                            return (
                                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <select
                                            value={material.material_id}
                                            onChange={(e) => updateMaterial(index, 'material_id', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Seleccionar material</option>
                                            {materialesDisponibles.map(mat => {
                                                const inv = inventarioTecnico.find(i => i.material_id._id === mat._id);
                                                return (
                                                    <option key={mat._id} value={mat._id}>
                                                        {mat.nombre} - Disponible: {inv?.cantidad_disponible || 0} {mat.unidad_medida}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="w-32">
                                        <input
                                            type="number"
                                            placeholder="Cantidad"
                                            value={material.cantidad}
                                            onChange={(e) => updateMaterial(index, 'cantidad', parseInt(e.target.value) || 0)}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            max={inventario?.cantidad_disponible || 0}
                                            required
                                        />
                                    </div>

                                    {materialInfo && (
                                        <div className="text-sm text-gray-600">
                                            ${(materialInfo.costo_unitario * material.cantidad).toFixed(2)}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeMaterial(index)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Observaciones */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones
                    </label>
                    <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Observaciones adicionales sobre la asignación..."
                    />
                </div>

                {/* Resumen */}
                {formData.materiales.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Resumen de Asignación</h3>
                        <div className="space-y-2">
                            {formData.materiales.map((material, index) => {
                                const { material: materialInfo } = getMaterialInfo(material.material_id);
                                if (!materialInfo) return null;

                                return (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span>{materialInfo.nombre}</span>
                                        <span>{material.cantidad} {materialInfo.unidad_medida}</span>
                                        <span className="font-semibold">
                                            ${(materialInfo.costo_unitario * material.cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center font-bold text-blue-800">
                                    <span>Total Estimado:</span>
                                    <span>
                                        ${formData.materiales.reduce((total, material) => {
                                            const { material: materialInfo } = getMaterialInfo(material.material_id);
                                            return total + (materialInfo ? materialInfo.costo_unitario * material.cantidad : 0);
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading || formData.materiales.length === 0}
                    >
                        {loading ? 'Asignando...' : 'Asignar Materiales'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterialAssignmentForm;
