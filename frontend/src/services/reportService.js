import api from './api'

export const reportService = {
    polizaReport: (polizaNumber) => api.get(`/reports/poliza/${polizaNumber}`),
    techConsumption: (techId, from, to) =>
        api.get(`/reports/tech/${techId}`, { params: { from, to } }),
    downloadPolizaReport: (polizaNumber) =>
        api.get(`/reports/poliza/${polizaNumber}/download`, { responseType: 'blob' })
}
