import { useState } from 'react';
import api from '../services/api';

export default function MaterialReturnForm({ orderId, materialesApartados, onSuccess }) {
    const [devoluciones, setDevoluciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddDevolucion = (material) => {
        const apartado = materialesApartados.find(m => m.material_id._id === material.material_id._id);
        if (!apartado) return;

        const yaAgregado = devoluciones.find(d => d.material_id === material.material_id._id);
        if (yaAgregado) {
            setError('Este material ya está en la lista de devoluciones');
            return;
        }

        setDevoluciones([...devoluciones, {
            material_id: material.material_id._id,
            material_nombre: material.material_id.nombre,
            cantidad_apartada: apartado.cantidad,
            cantidad_usada: material.cantidad_usada || 0,
            cantidad_sobrante: apartado.cantidad - (material.cantidad_usada || 0),
            cantidad_devolver: apartado.cantidad - (material.cantidad_usada || 0),
            motivo: ''
        }]);
        setError('');
    };

    const handleUpdateDevolucion = (index, field, value) => {
        const updated = [...devoluciones];
        updated[index][field] = value;
        setDevoluciones(updated);
    };

    const handleRemoveDevolucion = (index) => {
        setDevoluciones(devoluciones.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (devoluciones.length === 0) {
            setError('Debes agregar al menos un material para devolver');
            return;
        }

        // Validar cantidades
        for (const dev of devoluciones) {
            if (dev.cantidad_devolver <= 0) {
                setError('Las cantidades a devolver deben ser mayores a 0');
                return;
            }
            if (dev.cantidad_devolver > dev.cantidad_sobrante) {
                setError(`No puedes devolver más de ${dev.cantidad_sobrante} ${dev.material_nombre}`);
                return;
            }
        }

        try {
            setLoading(true);
            setError('');

            await api.post(`/orders/${orderId}/devolver-materiales`, {
                devoluciones: devoluciones.map(d => ({
                    material_id: d.material_id,
                    cantidad: d.cantidad_devolver,
                    motivo: d.motivo || 'Material sobrante de OT'
                }))
            });

            alert('Materiales devueltos exitosamente');
            setDevoluciones([]);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al devolver materiales');
        } finally {
            setLoading(false);
        }
    };

    const materialesConSobrante = materialesApartados.filter(m => {
        const usado = m.cantidad_usada || 0;
        return m.cantidad > usado;
    });

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📦 Devolución de Materiales Sobrantes
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Materiales disponibles para devolver */}
            {materialesConSobrante.length > 0 && devoluciones.length === 0 && (
                <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-gray-700">Materiales con sobrante:</h4>
                    <div className="space-y-2">
                        {materialesConSobrante.map((material, idx) => {
                            const sobrante = material.cantidad - (material.cantidad_usada || 0);
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                    <div>
                                        <p className="font-medium">{material.material_id.nombre}</p>
                                        <p className="text-sm text-gray-600">
                                            Apartado: {material.cantidad} | Usado: {material.cantidad_usada || 0} |
                                            <span className="font-semibold text-orange-600"> Sobrante: {sobrante}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAddDevolucion(material)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Devolver
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Formulario de devoluciones */}
            {devoluciones.length > 0 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 mb-6">
                        {devoluciones.map((dev, idx) => (
                            <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h5 className="font-semibold text-lg">{dev.material_nombre}</h5>
                                        <p className="text-sm text-gray-600">
                                            Sobrante disponible: {dev.cantidad_sobrante} unidades
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDevolucion(idx)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Cantidad a devolver *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={dev.cantidad_sobrante}
                                            value={dev.cantidad_devolver}
                                            onChange={(e) => handleUpdateDevolucion(idx, 'cantidad_devolver', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Motivo (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={dev.motivo}
                                            onChange={(e) => handleUpdateDevolucion(idx, 'motivo', e.target.value)}
                                            placeholder="Ej: Material no utilizado"
                                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Devolución'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDevoluciones([])}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {materialesConSobrante.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">✅</p>
                    <p>No hay materiales sobrantes para devolver</p>
                </div>
            )}
        </div>
    );
}
