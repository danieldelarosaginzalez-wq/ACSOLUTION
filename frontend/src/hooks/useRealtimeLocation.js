import { useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

export const useRealtimeLocation = (options = {}) => {
    const [socket, setSocket] = useState(null)
    const [mapData, setMapData] = useState({ tecnicos: [], ordenes: [] })
    const [connected, setConnected] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [performanceMetrics, setPerformanceMetrics] = useState({
        updateCount: 0,
        avgLatency: 0,
        lastLatency: 0
    })

    // 🚀 Configuración de optimización
    const {
        throttleMs = 1000, // Throttle de actualizaciones
        enableBatching = true, // Agrupar actualizaciones
        enableCompression = true, // Comprimir datos
        maxRetries = 3 // Reintentos de conexión
    } = options

    const updateQueue = useRef([])
    const batchTimer = useRef(null)
    const retryCount = useRef(0)
    const latencyTracker = useRef([])

    // 🔄 Función para procesar batch de actualizaciones
    const processBatch = useCallback(() => {
        if (updateQueue.current.length === 0) return

        const updates = [...updateQueue.current]
        updateQueue.current = []

        // Procesar todas las actualizaciones de una vez
        setMapData(prev => {
            let newData = { ...prev }

            updates.forEach(update => {
                if (update.type === 'technician') {
                    newData.tecnicos = newData.tecnicos.map(t =>
                        t.tecnico_id === update.data.tecnicoId
                            ? { ...t, ubicacion: update.data.ubicacion }
                            : t
                    )
                } else if (update.type === 'mapData') {
                    newData = update.data
                }
            })

            return newData
        })

        setLastUpdate(Date.now())
    }, [])

    // 🚀 Función optimizada para agregar actualizaciones
    const addToQueue = useCallback((update) => {
        updateQueue.current.push(update)

        if (enableBatching) {
            // Cancelar timer anterior y crear uno nuevo
            if (batchTimer.current) {
                clearTimeout(batchTimer.current)
            }

            batchTimer.current = setTimeout(processBatch, throttleMs)
        } else {
            // Procesar inmediatamente si no hay batching
            processBatch()
        }
    }, [enableBatching, throttleMs, processBatch])

    useEffect(() => {
        // Conectar al namespace de location con opciones optimizadas
        const newSocket = io(`${SOCKET_URL}/location`, {
            transports: ['websocket'],
            compression: enableCompression,
            timeout: 5000,
            forceNew: true
        })

        newSocket.on('connect', () => {
            console.log('✅ Conectado al WebSocket de ubicaciones')
            setConnected(true)
            retryCount.current = 0

            // Solicitar datos iniciales con configuración de optimización
            newSocket.emit('requestMapData', {
                enableBatching,
                throttleMs,
                enableCompression
            })
        })

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Desconectado del WebSocket:', reason)
            setConnected(false)

            // Reintentar conexión automáticamente
            if (retryCount.current < maxRetries) {
                retryCount.current++
                setTimeout(() => {
                    console.log(`🔄 Reintentando conexión (${retryCount.current}/${maxRetries})`)
                    newSocket.connect()
                }, 2000 * retryCount.current)
            }
        })

        newSocket.on('connect_error', (error) => {
            console.error('❌ Error de conexión WebSocket:', error)
        })

        // 📍 Escuchar actualizaciones optimizadas de ubicación
        newSocket.on('technicianLocationUpdated', (data) => {
            const startTime = Date.now()
            console.log('📍 Ubicación de técnico actualizada:', data)

            addToQueue({
                type: 'technician',
                data,
                timestamp: startTime
            })

            // Tracking de latencia
            const latency = Date.now() - (data.timestamp || startTime)
            latencyTracker.current.push(latency)
            if (latencyTracker.current.length > 10) {
                latencyTracker.current.shift()
            }

            setPerformanceMetrics(prev => ({
                updateCount: prev.updateCount + 1,
                lastLatency: latency,
                avgLatency: latencyTracker.current.reduce((a, b) => a + b, 0) / latencyTracker.current.length
            }))
        })

        // 🗺️ Escuchar datos completos del mapa con batching
        newSocket.on('mapData', (data) => {
            console.log('🗺️ Datos del mapa recibidos:', data)
            addToQueue({
                type: 'mapData',
                data,
                timestamp: Date.now()
            })
        })

        // 🔄 Escuchar solicitudes de actualización con throttling
        newSocket.on('mapUpdateRequired', () => {
            console.log('🔄 Actualización de mapa requerida')

            // Throttle las solicitudes de actualización
            if (!newSocket._lastUpdateRequest || Date.now() - newSocket._lastUpdateRequest > throttleMs) {
                newSocket._lastUpdateRequest = Date.now()
                newSocket.emit('requestMapData', {})
            }
        })

        // 📊 Escuchar métricas de rendimiento del servidor
        newSocket.on('performanceMetrics', (metrics) => {
            console.log('📊 Métricas de rendimiento:', metrics)
        })

        // 🚨 Escuchar errores del servidor
        newSocket.on('error', (error) => {
            console.error('🚨 Error del servidor:', error)
        })

        setSocket(newSocket)

        return () => {
            // Limpiar timers y cerrar conexión
            if (batchTimer.current) {
                clearTimeout(batchTimer.current)
            }
            newSocket.close()
        }
    }, [enableBatching, throttleMs, enableCompression, maxRetries, addToQueue])

    // 🚀 Función optimizada para actualizar ubicación
    const updateLocation = useCallback((tecnicoId, lat, lng, accuracy) => {
        if (socket && connected) {
            const timestamp = Date.now()
            socket.emit('updateLocation', {
                tecnicoId,
                lat,
                lng,
                accuracy,
                timestamp
            })
        }
    }, [socket, connected])

    // 📍 Función optimizada para solicitar datos del mapa
    const requestMapData = useCallback((estado, bounds) => {
        if (socket && connected) {
            socket.emit('requestMapData', {
                estado,
                bounds,
                timestamp: Date.now(),
                enableOptimization: true
            })
        }
    }, [socket, connected])

    // 🎯 Función para solicitar datos en un área específica
    const requestAreaData = useCallback((bounds, zoom) => {
        if (socket && connected) {
            socket.emit('requestAreaData', {
                bounds,
                zoom,
                timestamp: Date.now()
            })
        }
    }, [socket, connected])

    // 📊 Función para obtener métricas de rendimiento
    const getPerformanceMetrics = useCallback(() => {
        return {
            ...performanceMetrics,
            connected,
            lastUpdate,
            queueSize: updateQueue.current.length
        }
    }, [performanceMetrics, connected, lastUpdate])

    // 🔄 Función para limpiar cache y reiniciar
    const resetConnection = useCallback(() => {
        if (socket) {
            updateQueue.current = []
            if (batchTimer.current) {
                clearTimeout(batchTimer.current)
            }
            socket.disconnect()
            socket.connect()
        }
    }, [socket])

    return {
        socket,
        connected,
        mapData,
        lastUpdate,
        performanceMetrics: getPerformanceMetrics(),
        updateLocation,
        requestMapData,
        requestAreaData,
        resetConnection,
    }
}

export default useRealtimeLocation
