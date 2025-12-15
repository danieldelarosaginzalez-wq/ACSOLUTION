import api from './api'

export const inventoryService = {
    getByTech: (techId) => api.get(`/inventario/tecnico/${techId}`),
    getMovimientos: (techId, filters = {}) => api.get(`/inventario/tecnico/${techId}/movimientos`, { params: filters }),
    adjust: (adjustData) => api.post('/inventario/ajuste', adjustData)
}

export default inventoryService
