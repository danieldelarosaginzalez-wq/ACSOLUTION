import api from './api'

export const alertService = {
    getAll: (filters = {}) => api.get('/alerts', { params: filters }),
    resolve: (alertId) => api.put(`/alerts/${alertId}/resolve`),
    getByOrder: (orderId) => api.get(`/alerts?order_id=${orderId}`),
    getByTech: (techId) => api.get(`/alerts?tecnico_id=${techId}`)
}
