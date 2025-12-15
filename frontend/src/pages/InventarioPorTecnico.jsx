import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { inventoryService } from '../services/inventoryService'

export default function InventarioPorTecnico() {
    const { id } = useParams()
    const [inventory, setInventory] = useState(null)
    const [movements, setMovements] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('stock')

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const response = await inventoryService.getByTech(id)
            setInventory(response.data)

            // Cargar movimientos
            const movResponse = await inventoryService.getMovimientos(id)
            setMovements(movResponse.data)
        } catch (error) {
            console.error('Error cargando inventario:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMovementColor = (tipo) => {
        const colors = {
            entrada: 'bg-green-100 text-green-800',
            salida: 'bg-red-100 text-red-800',
            apartado: 'bg-yellow-100 text-yellow-800',
            devolucion: 'bg-blue-100 text-blue-800',
            ajuste: 'bg-purple-100 text-purple-800'
        }
        return colors[tipo] || 'bg-gray-100'
    }

    if (loading) return <div className="text-center py-8">Cargando...</div>
    if (!inventory) return <div className="text-center py-8">Inventario no encontrado</div>

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Mi Inventario</h1>

            <div className="bg-white rounded shadow">
                <div className="border-b">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'stock'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Stock Actual
                        </button>
                        <button
                            onClick={() => setActiveTab('movimientos')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'movimientos'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Historial de Movimientos
                        </button>
                    </div>
                </div>

                {activeTab === 'stock' ? (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Material</th>
                                <th className="p-3 text-left">Cantidad Actual</th>
                                <th className="p-3 text-left">Apartado</th>
                                <th className="p-3 text-left">Disponible</th>
                                <th className="p-3 text-left">Último Movimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory?.materials?.map((item, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{item.material_id}</td>
                                    <td className="p-3">{item.cantidad_actual}</td>
                                    <td className="p-3 text-yellow-600">{item.cantidad_apartada}</td>
                                    <td className="p-3 text-green-600 font-semibold">{item.cantidad_disponible}</td>
                                    <td className="p-3 text-sm text-gray-600">
                                        {item.ultimo_movimiento ? new Date(item.ultimo_movimiento).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-4">
                        {movements.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Fecha</th>
                                        <th className="p-2 text-left">Material</th>
                                        <th className="p-2 text-left">Tipo</th>
                                        <th className="p-2 text-left">Cantidad</th>
                                        <th className="p-2 text-left">Motivo</th>
                                        <th className="p-2 text-left">Origen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map((mov, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{new Date(mov.fecha).toLocaleString()}</td>
                                            <td className="p-2">{mov.material_id}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-1 rounded text-xs ${getMovementColor(mov.tipo)}`}>
                                                    {mov.tipo}
                                                </span>
                                            </td>
                                            <td className="p-2 font-semibold">{mov.cantidad}</td>
                                            <td className="p-2">{mov.motivo}</td>
                                            <td className="p-2 text-gray-600">{mov.origen || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
                <p className="text-sm">
                    <strong>Nota:</strong> Si necesita re-abastecimiento, contacte al analista de inventario.
                </p>
            </div>
        </div>
    )
}
