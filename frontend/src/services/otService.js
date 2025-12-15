import api from './api'

export const otService = {
    create: (otData) => api.post('/ot', otData),
    getAll: () => api.get('/ot'),
    getById: (id) => api.get(`/ot/${id}`),
    assign: (id, assignData) => api.put(`/ot/${id}/asignar`, assignData),
    registerConsumption: (id, consumptionData) => api.post(`/ot/${id}/consumption`, consumptionData),
    complete: (id) => api.put(`/ot/${id}/complete`),
    updateMaterial: (id, materialIndex, updateData) => api.put(`/ot/${id}/materials/${materialIndex}`, updateData),
    deleteMaterial: (id, materialIndex) => api.delete(`/ot/${id}/materials/${materialIndex}`),
    requestCorrection: (id, correctionData) => api.post(`/ot/${id}/request-correction`, correctionData),
    close: (id) => api.put(`/ot/${id}/close`)
}
