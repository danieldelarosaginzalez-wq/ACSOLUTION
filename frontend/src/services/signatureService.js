import api from './api';

export const signatureService = {
    // Crear firma digital
    async createSignature(orderId, signatureData) {
        const response = await api.post('/signatures', {
            orderId,
            ...signatureData,
        });
        return response.data;
    },

    // Obtener firmas de una orden
    async getOrderSignatures(orderId) {
        const response = await api.get(`/signatures/order/${orderId}`);
        return response.data;
    },

    // Obtener una firma específica
    async getSignature(signatureId) {
        const response = await api.get(`/signatures/${signatureId}`);
        return response.data;
    },

    // Verificar firma
    async verifySignature(signatureId) {
        const response = await api.post(`/signatures/verify/${signatureId}`);
        return response.data;
    },
};
