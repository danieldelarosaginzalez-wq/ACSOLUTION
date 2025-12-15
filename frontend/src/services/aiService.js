import api from './api'

export const aiService = {
    predict: (orderId) => api.post('/ai/predict', { order_id: orderId }),
    predictMaterials: (tipo_trabajo, cliente = null) =>
        api.post('/ai/predict-materials', { tipo_trabajo, cliente }),
    getPredictions: (filters = {}) => api.get('/ai/predictions', { params: filters }),
    getPrediction: (predictionId) => api.get(`/ai/predictions/${predictionId}`),
    labelPrediction: (predictionId, label) =>
        api.put(`/ai/predictions/${predictionId}/label`, { label_after: label }),
    getStats: () => api.get('/ai/stats')
}

export default aiService
