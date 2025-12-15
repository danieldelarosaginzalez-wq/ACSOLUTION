import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { otService } from '../services/otService'
import api from '../services/api'

export default function AsignarOT() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [ot, setOt] = useState(null)
    const [tecnicos, setTecnicos] = useState([])
    const [selectedTech, setSelectedTech] = useState('')
    const [apartados, setApartados] = useState([])

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const [otRes, techRes] = await Promise.all([
                otService.getById(id),
                api.get('/users?rol=tecnico')
            ])
            setOt(otRes.data)
            setTecnicos(techRes.data)

            // Inicializar apartados con materiales sugeridos
            if (otRes.data.materiales_sugeridos) {
                setApartados(otRes.data.materiales_sugeridos.map(m => ({
                    material_id: m.material_id,
                    cantidad: m.cantidad || 0
                })))
            }
        } catch (error) {
            console.error('Error cargando datos:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTech) {
            alert('Seleccione un técnico')
            return
        }

        try {
            await otService.assign(id, {
                tecnico_id: selectedTech,
                apartados: apartados.filter(a => a.cantidad > 0)
            })
            alert('OT asignada exitosamente')
            navigate(`/ot/${id}`)
        } catch (error) {
            alert(error.response?.data?.message || 'Error al asignar OT')
        }
    }

    if (!ot) return <div className="text-center py-8">Cargando...</div>

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Asignar OT: {ot.codigo}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Información de la OT</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-600">Cliente</label>
                            <p className="font-semibold">{ot.cliente}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Póliza</label>
                            <p className="font-semibold font-mono">{ot.poliza_number}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Seleccionar Técnico</h2>
                    <select
                        required
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="">Seleccione un técnico...</option>
                        {tecnicos.map(tech => (
                            <option key={tech._id} value={tech._id}>
                                {tech.nombre} - {tech.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Materiales a Apartar</h2>
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Material</th>
                                <th className="p-2 text-left">Cantidad Sugerida</th>
                                <th className="p-2 text-left">Cantidad a Apartar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apartados.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{item.material_id}</td>
                                    <td className="p-2">{ot.materiales_sugeridos[index]?.cantidad || 0}</td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.cantidad}
                                            onChange={(e) => {
                                                const newApartados = [...apartados]
                                                newApartados[index].cantidad = parseFloat(e.target.value) || 0
                                                setApartados(newApartados)
                                            }}
                                            className="border px-2 py-1 rounded w-24"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Asignar OT
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/ot/${id}`)}
                        className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    )
}
