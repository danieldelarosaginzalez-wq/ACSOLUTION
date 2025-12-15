import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userService } from '../services/userService'

export default function TecnicosPage() {
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTechnicians()
    }, [])

    const loadTechnicians = async () => {
        try {
            const response = await userService.getAll({ rol: 'tecnico' })
            setTechnicians(response.data)
        } catch (error) {
            console.error('Error cargando técnicos:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gestión de Técnicos</h1>

            {loading ? (
                <div className="bg-white rounded shadow p-8 text-center">Cargando...</div>
            ) : (
                <div className="bg-white rounded shadow">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold">
                            Técnicos Registrados ({technicians.length})
                        </h2>
                    </div>

                    {technicians.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No hay técnicos registrados
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Nombre</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {technicians.map(tech => (
                                    <tr key={tech._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-semibold">{tech.nombre}</td>
                                        <td className="p-3 text-gray-600">{tech.email}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${tech.estado === 'activo'
                                                    ? 'bg-green-200 text-green-800'
                                                    : 'bg-gray-200 text-gray-800'
                                                }`}>
                                                {tech.estado}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <Link
                                                to={`/inventario/tecnico/${tech._id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Ver Inventario
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}
