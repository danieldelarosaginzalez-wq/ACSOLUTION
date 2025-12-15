import api from './api'

export const userService = {
    getAll: (filters = {}) => api.get('/users', { params: filters }),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    getTechnicians: () => api.get('/users', { params: { rol: 'tecnico', estado: 'activo' } })
}

export default userService
