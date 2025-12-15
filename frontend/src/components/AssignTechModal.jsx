import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AssignTechModal({ ot_id, onClose, onAssigned }) {
    const [tecnicos, setTecnicos] = useState([])
    const [selectedTech, setSelectedTech] = useState(null)
    const [techInventory, setTechInventory] = useState(null)
    const [materialesRequeridos, setMaterialesRequeridos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTecnicos()
        loadOTMaterials()
    }, [ot_id])

    useEffect(() => {
        if (selectedTech) {
            loadTechInventory(selectedTech._id)
        }
    }, [selectedTech])

    const loadTecnicos = async () => {
        try {
            const response = await api.get('/users?rol=tecnico&estado=activo')
            setTecnicos(response.data)
        } catch (error) {
            console.error('Error cargando técnicos:', error)
        }
    }

    const loadOTMaterials = async () => {
        try {
            const response = await api.get(`/ot/${ot_id}`)
            setMaterialesRequeridos(response.data.materiales_sugeridos || [])
        } catch (error) {
            console.error('Error cargando materiales:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadTechInventory = async (techId) => {
        try {
            const response = await api.get(`/inventario/tecnico/${techId}`)
            setTechInventory(response.data)
        } catch (error) {
            console.error('Error cargando inventario:', error)
        }
    }

    const getMaterialDisponible = (materialId) => {
        if (!techInventory) return 0
        const item = techInventory.materials?.find(m => m.material_id === materialId)
        return item?.cantidad_disponible || 0
    }

    const handleApartar = (index, cantidad) => {
        const newMateriales = [...materialesRequeridos]
        newMateriales[index].cantidad_a_apartar = parseFloat(cantidad) || 0
        setMaterialesRequeridos(newMateriales)
    }

    const handleAssign = async () => {
        if (!selectedTech) {
            alert('Seleccione un técnico')
            return
        }

        // Validar que no se aparte más de lo disponible
        for (const material of materialesRequeridos) {
            const disponible = getMaterialDisponible(material.material_id)
            if ((material.cantidad_a_apartar || 0) > disponible) {
                alert(`No hay suficiente ${material.material_id} disponible. Disponible: ${disponible}`)
                return
            }
        }

        try {
            const apartados = materialesRequeridos
                .filter(m => m.cantidad_a_apartar > 0)
                .map(m => ({
                    material_id: m.material_id,
                    cantidad: m.cantidad_a_apartar
                }))

            await api.put(`/ot/${ot_id}/asignar`, {
                tecnico_id: selectedTech._id,
                apartados
            })

            alert('OT asignada exitosamente')
            if (onAssigned) onAssigned()
            onClose()
        } catch (error) {
            alert(error.response?.data?.message || 'Error al asignar OT')
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <p>Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
                <h2 className="text-2xl font-bold mb-4">Asignar Técnico y Apartar Materiales</h2>

                <div className="space-y-6">
                    {/* Selector de técnico */}
                    <div>
                        <label className="block font-semibold mb-2">Seleccionar Técnico *</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tecnicos.map(tech => (
                                <div
                                    key={tech._id}
                                    onClick={() => setSelectedTech(tech)}
                                    className={`border-2 p-3 rounded cursor-pointer transition ${selectedTech?._id === tech._id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-300 hover:border-blue-400'
                                        }`}
                                >
                                    <p className="font-semibold">{tech.nombre}</p>
                                    <p className="text-sm text-gray-600">{tech.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inventario del técnico seleccionado */}
                    {selectedTech && techInventory && (
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Inventario de {selectedTech.nombre}</h3>
                            <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                {techInventory.materials?.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Sin inventario</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="pb-2">Material</th>
                                                <th className="pb-2">Actual</th>
                                                <th className="pb-2">Apartado</th>
                                                <th className="pb-2">Disponible</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {techInventory.materials?.map((item, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="py-1">{item.material_id}</td>
                                                    <td className="py-1">{item.cantidad_actual}</td>
                                                    <td className="py-1 text-yellow-600">{item.cantidad_apartada}</td>
                                                    <td className="py-1 text-green-600 font-semibold">{item.cantidad_disponible}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Materiales a apartar */}
                    {selectedTech && (
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Materiales a Apartar</h3>
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left">Material</th>
                                        <th className="p-2 text-left">Sugerido</th>
                                        <th className="p-2 text-left">Disponible</th>
                                        <th className="p-2 text-left">Cantidad a Apartar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materialesRequeridos.map((material, index) => {
                                        const disponible = getMaterialDisponible(material.material_id)
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">{material.material_id}</td>
                                                <td className="p-2">{material.cantidad} {material.unidad}</td>
                                                <td className="p-2">
                                                    <span className={disponible < material.cantidad ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                                        {disponible}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={disponible}
                                                        step="0.01"
                                                        defaultValue={Math.min(material.cantidad, disponible)}
                                                        onChange={(e) => handleApartar(index, e.target.value)}
                                                        className="border px-2 py-1 rounded w-24"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleAssign}
                        disabled={!selectedTech}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Asignar OT
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
