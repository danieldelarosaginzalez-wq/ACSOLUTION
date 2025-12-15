import { useState, useEffect } from 'react'
import { materialService } from '../services/materialService'

export default function TechnicianConsumptionForm({ otId, poliza, materialesSugeridos, onSubmit }) {
    const [consumos, setConsumos] = useState([])
    const [materiales, setMateriales] = useState([])
    const [loadingMaterials, setLoadingMaterials] = useState(true)
    const [currentItem, setCurrentItem] = useState({
        material_id: '',
        cantidad: '',
        unidad: '',
        observacion: ''
    })

    useEffect(() => {
        loadMateriales()
    }, [])

    const loadMateriales = async () => {
        try {
            const response = await materialService.getAll({ estado: 'activo' })
            setMateriales(response.data)
        } catch (error) {
            console.error('Error cargando materiales:', error)
        } finally {
            setLoadingMaterials(false)
        }
    }

    const addConsumo = () => {
        if (!currentItem.material_id || !currentItem.cantidad) {
            alert('Complete material y cantidad')
            return
        }

        // Buscar información del material seleccionado
        const materialSeleccionado = materiales.find(m => m._id === currentItem.material_id)

        const consumoCompleto = {
            material_id: currentItem.material_id,
            cantidad: parseFloat(currentItem.cantidad),
            unidad: currentItem.unidad || materialSeleccionado?.unidad_medida || 'unidades',
            observacion: currentItem.observacion,
            nombre_material: materialSeleccionado?.nombre || 'Desconocido'
        }

        setConsumos([...consumos, consumoCompleto])
        setCurrentItem({ material_id: '', cantidad: '', unidad: '', observacion: '' })
    }

    const removeConsumo = (index) => {
        setConsumos(consumos.filter((_, i) => i !== index))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (consumos.length === 0) {
            alert('Debe agregar al menos un consumo')
            return
        }

        // Formatear consumos para el backend
        const consumosFormateados = consumos.map(c => ({
            material_id: c.material_id,
            cantidad: c.cantidad,
            unidad: c.unidad,
            observacion: c.observacion
        }))

        onSubmit({
            poliza_number: poliza,
            consumos: consumosFormateados
        })
    }

    const handleMaterialChange = (materialId) => {
        const material = materiales.find(m => m._id === materialId)
        setCurrentItem({
            ...currentItem,
            material_id: materialId,
            unidad: material?.unidad_medida || ''
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Póliza: {poliza}</p>
                <p className="text-sm text-gray-600">OT: {otId}</p>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Agregar Material Consumido</h3>

                {loadingMaterials ? (
                    <p className="text-gray-500 text-sm">Cargando materiales...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm mb-1">Material *</label>
                                <select
                                    value={currentItem.material_id}
                                    onChange={(e) => handleMaterialChange(e.target.value)}
                                    className="w-full border px-3 py-2 rounded"
                                >
                                    <option value="">Seleccione...</option>
                                    {materialesSugeridos && materialesSugeridos.length > 0 && (
                                        <optgroup label="Materiales Sugeridos por IA">
                                            {materialesSugeridos.map(m => (
                                                <option key={m.material_id} value={m.material_id}>
                                                    ⭐ {m.nombre} (Sugerido: {m.cantidad_sugerida} {m.unidad})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    <optgroup label="Todos los Materiales">
                                        {materiales.map(m => (
                                            <option key={m._id} value={m._id}>
                                                {m.nombre} - {m.categoria}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Cantidad Usada *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={currentItem.cantidad}
                                    onChange={(e) => setCurrentItem({ ...currentItem, cantidad: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Unidad</label>
                                <input
                                    type="text"
                                    value={currentItem.unidad}
                                    onChange={(e) => setCurrentItem({ ...currentItem, unidad: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    placeholder="Se autocompletará"
                                    readOnly
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm mb-1">Observación</label>
                                <input
                                    type="text"
                                    value={currentItem.observacion}
                                    onChange={(e) => setCurrentItem({ ...currentItem, observacion: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addConsumo}
                            className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            + Agregar
                        </button>
                    </>
                )}
            </div>

            {consumos.length > 0 && (
                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Consumos Registrados</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Material</th>
                                <th className="p-2 text-left">Cantidad</th>
                                <th className="p-2 text-left">Unidad</th>
                                <th className="p-2 text-left">Observación</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumos.map((c, i) => (
                                <tr key={i} className="border-b">
                                    <td className="p-2">{c.nombre_material}</td>
                                    <td className="p-2">{c.cantidad}</td>
                                    <td className="p-2">{c.unidad}</td>
                                    <td className="p-2">{c.observacion || '-'}</td>
                                    <td className="p-2">
                                        <button
                                            type="button"
                                            onClick={() => removeConsumo(i)}
                                            className="text-red-600 hover:underline text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
                Registrar Consumos
            </button>
        </form>
    )
}
