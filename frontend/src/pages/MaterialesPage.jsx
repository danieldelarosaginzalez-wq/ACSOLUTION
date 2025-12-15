import { useState, useEffect } from 'react'
import { materialService } from '../services/materialService'
import { useAuthStore } from '../store/authStore'

export default function MaterialesPage() {
    const { user } = useAuthStore()
    const [materials, setMaterials] = useState([])
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState(null)
    const [filterCategoria, setFilterCategoria] = useState('all')
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: '',
        unidad_medida: 'unidades',
        costo_unitario: 0,
        stock_minimo: 0,
        estado: 'activo'
    })

    useEffect(() => {
        loadData()
    }, [filterCategoria])

    const loadData = async () => {
        try {
            const filters = filterCategoria !== 'all' ? { categoria: filterCategoria } : {}
            const [materialsRes, categoriasRes] = await Promise.all([
                materialService.getAll(filters),
                materialService.getCategorias()
            ])
            setMaterials(materialsRes.data)
            setCategorias(categoriasRes.data)
        } catch (error) {
            console.error('Error cargando materiales:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingMaterial) {
                await materialService.update(editingMaterial._id, formData)
            } else {
                await materialService.create(formData)
            }
            setShowModal(false)
            resetForm()
            loadData()
        } catch (error) {
            alert('Error al guardar material')
        }
    }

    const handleEdit = (material) => {
        setEditingMaterial(material)
        setFormData({
            nombre: material.nombre,
            descripcion: material.descripcion || '',
            categoria: material.categoria,
            unidad_medida: material.unidad_medida,
            costo_unitario: material.costo_unitario || 0,
            stock_minimo: material.stock_minimo || 0,
            estado: material.estado
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este material?')) return
        try {
            await materialService.delete(id)
            loadData()
        } catch (error) {
            alert('Error al eliminar material')
        }
    }

    const resetForm = () => {
        setEditingMaterial(null)
        setFormData({
            nombre: '',
            descripcion: '',
            categoria: '',
            unidad_medida: 'unidades',
            costo_unitario: 0,
            stock_minimo: 0,
            estado: 'activo'
        })
    }

    const canEdit = user?.rol === 'analista' || user?.rol === 'analista_inventario_oculto'

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Catálogo de Materiales</h1>
                {canEdit && (
                    <button
                        onClick={() => {
                            resetForm()
                            setShowModal(true)
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        + Nuevo Material
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded shadow p-4 mb-6">
                <div className="flex gap-2 items-center">
                    <span className="font-semibold">Categoría:</span>
                    <button
                        onClick={() => setFilterCategoria('all')}
                        className={`px-3 py-1 rounded ${filterCategoria === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Todas
                    </button>
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategoria(cat)}
                            className={`px-3 py-1 rounded capitalize ${filterCategoria === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Materiales */}
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Materiales ({materials.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">Cargando...</div>
                ) : materials.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay materiales registrados</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Nombre</th>
                                <th className="p-3 text-left">Categoría</th>
                                <th className="p-3 text-left">Unidad</th>
                                <th className="p-3 text-left">Costo</th>
                                <th className="p-3 text-left">Stock Mín.</th>
                                <th className="p-3 text-left">Estado</th>
                                {canEdit && <th className="p-3 text-left">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(material => (
                                <tr key={material._id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-semibold">{material.nombre}</td>
                                    <td className="p-3 capitalize">{material.categoria}</td>
                                    <td className="p-3">{material.unidad_medida}</td>
                                    <td className="p-3">${material.costo_unitario?.toFixed(2) || '0.00'}</td>
                                    <td className="p-3">{material.stock_minimo || 0}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${material.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-200'
                                            }`}>
                                            {material.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleEdit(material)}
                                                className="text-blue-600 hover:underline text-sm mr-2"
                                            >
                                                Editar
                                            </button>
                                            {user?.rol === 'analista_inventario_oculto' && (
                                                <button
                                                    onClick={() => handleDelete(material._id)}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingMaterial ? 'Editar Material' : 'Nuevo Material'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Categoría *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    placeholder="electricidad, plomeria, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Unidad de Medida *</label>
                                    <select
                                        required
                                        value={formData.unidad_medida}
                                        onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                                        className="w-full border px-3 py-2 rounded"
                                    >
                                        <option value="unidades">Unidades</option>
                                        <option value="metros">Metros</option>
                                        <option value="litros">Litros</option>
                                        <option value="kilogramos">Kilogramos</option>
                                        <option value="cajas">Cajas</option>
                                        <option value="rollos">Rollos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Costo Unitario *</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.costo_unitario}
                                        onChange={(e) => setFormData({ ...formData, costo_unitario: parseFloat(e.target.value) || 0 })}
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock_minimo}
                                        onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Estado</label>
                                <select
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                >
                                    {editingMaterial ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
