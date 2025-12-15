import api from './api'

export const locationService = {
    // Actualizar ubicación de técnico
    updateTechnicianLocation: async (tecnicoId, lat, lng, accuracy) => {
        return api.post(`/location/technician/${tecnicoId}`, { lat, lng, accuracy })
    },

    // Obtener ubicación de un técnico
    getTechnicianLocation: async (tecnicoId) => {
        return api.get(`/location/technician/${tecnicoId}`)
    },

    // Obtener ubicaciones de todos los técnicos
    getAllTechniciansLocations: async () => {
        return api.get('/location/technicians')
    },

    // Obtener órdenes con ubicación
    getOrdersWithLocation: async (estado) => {
        const params = estado ? { estado } : {}
        return api.get('/location/orders', { params })
    },

    // Encontrar técnicos cercanos
    findNearbyTechnicians: async (lat, lng, maxDistance = 50) => {
        return api.post('/location/nearby-technicians', { lat, lng, maxDistance })
    },

    // Sugerir mejor técnico para una OT
    suggestBestTechnician: async (orderId) => {
        return api.get(`/location/suggest-technician/${orderId}`)
    },

    // Obtener datos completos del mapa
    getMapData: async (estado) => {
        const params = estado ? { estado } : {}
        return api.get('/location/map-data', { params })
    },

    // Geocodificar dirección
    geocodeAddress: async (direccion) => {
        return api.post('/location/geocode', { direccion })
    },

    // Reverse geocoding
    reverseGeocode: async (lat, lng) => {
        return api.post('/location/reverse-geocode', { lat, lng })
    },

    // Geocodificar órdenes sin ubicación
    geocodeOrders: async (limit = 10) => {
        return api.post('/location/geocode-orders', { limit })
    },

    // Obtener estadísticas de tracking
    getTrackingStats: async () => {
        return api.get('/location/tracking-stats')
    },

    // Obtener historial de un técnico
    getTechnicianHistory: async (tecnicoId, hours = 24) => {
        return api.get(`/location/technician/${tecnicoId}/history?hours=${hours}`)
    },

    // Encontrar técnicos en un área
    getTechniciansInArea: async (lat, lng, radius = 10) => {
        return api.post('/location/technicians-in-area', { lat, lng, radius })
    },

    // 🚀 FUNCIONES DE OPTIMIZACIÓN AGREGADAS

    // Obtener datos del mapa con paginación y filtros
    getOptimizedMapData: async (bounds, zoom, filters = {}) => {
        return api.post('/location/optimized-map-data', {
            bounds,
            zoom,
            filters,
            limit: zoom > 15 ? 100 : zoom > 12 ? 50 : 25 // Menos elementos en zoom bajo
        })
    },

    // Clustering de marcadores para mejor rendimiento
    getClusteredData: async (bounds, zoom, clusterRadius = 50) => {
        return api.post('/location/clustered-data', { bounds, zoom, clusterRadius })
    },

    // Cache de ubicaciones con TTL
    getCachedLocations: async (cacheKey, ttl = 30000) => {
        return api.get(`/location/cached/${cacheKey}?ttl=${ttl}`)
    },

    // Batch update de múltiples ubicaciones
    batchUpdateLocations: async (updates) => {
        return api.post('/location/batch-update', { updates })
    },

    // Obtener solo cambios desde timestamp
    getLocationUpdates: async (since) => {
        return api.get(`/location/updates?since=${since}`)
    },

    // Predicción de rutas optimizadas
    getOptimizedRoutes: async (technicianId, orderIds) => {
        return api.post('/location/optimized-routes', { technicianId, orderIds })
    },

    // Análisis de densidad de órdenes
    getDensityAnalysis: async (bounds) => {
        return api.post('/location/density-analysis', { bounds })
    },

    // Configurar geofencing para técnicos
    setGeofence: async (technicianId, lat, lng, radius, alertType) => {
        return api.post('/location/geofence', { technicianId, lat, lng, radius, alertType })
    },

    // Obtener métricas de rendimiento del mapa
    getMapPerformanceMetrics: async () => {
        return api.get('/location/performance-metrics')
    },
}

export default locationService
