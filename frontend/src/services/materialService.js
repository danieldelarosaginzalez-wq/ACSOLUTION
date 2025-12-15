import api from './api'

export const materialService = {
    getAll: (filters = {}) => api.get('/materials', { params: filters }),
    getById: (id) => api.get(`/materials/${id}`),
    getCategorias: () => api.get('/materials/categorias'),
    create: (materialData) => api.post('/materials', materialData),
    update: (id, materialData) => api.put(`/materials/${id}`, materialData),
    delete: (id) => api.delete(`/materials/${id}`),
    getConsumptionStats: (filters = {}) => api.get('/materials/stats/consumption', { params: filters })
}

export default materialService
