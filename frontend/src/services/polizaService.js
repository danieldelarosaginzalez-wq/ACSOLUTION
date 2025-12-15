import api from './api'

export const polizaService = {
    create: (polizaData) => api.post('/polizas', polizaData),
    get: (polizaNumber) => api.get(`/polizas/${polizaNumber}`),
    validate: (polizaNumber) => api.get(`/polizas/${polizaNumber}/validate`),
    getOTs: (polizaNumber) => api.get(`/polizas/${polizaNumber}/ots`),

    // 🗺️ Métodos de ubicación
    getAll: (params = {}) => api.get('/polizas/all', { params }),
    updateLocation: (polizaId, locationData) => api.put(`/polizas/${polizaId}/location`, locationData),
    geocodePolizas: () => api.post('/polizas/geocode'),

    // 📊 Métodos de estadísticas
    getLocationStats: () => api.get('/polizas/stats/location'),
}

export default polizaService
