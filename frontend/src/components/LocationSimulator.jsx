import { useState, useEffect } from 'react'
import locationService from '../services/locationService'
import { useAuthStore } from '../store/authStore'

/**
 * Componente para simular ubicación de técnicos en desarrollo
 * Solo visible en modo desarrollo
 */
export default function LocationSimulator() {
    const { user } = useAuthStore()
    const [tecnicos, setTecnicos] = useState([])
    const [selectedTecnico, setSelectedTecnico] = useState('')
    const [lat, setLat] = useState(-12.0464)
    const [lng, setLng] = useState(-77.0428)
    const [isSimulating, setIsSimulating] = useState(false)
    const [intervalId, setIntervalId] = useState(null)

    // Solo mostrar en desarrollo
    if (import.meta.env.PROD) {
        return null
    }

    // Solo para analistas
    if (user?.rol !== 'analista') {
        return null
    }

    useEffect(() => {
        loadTecnicos()
    }, [])

    const loadTecnicos = async () => {
        try {
            const response = await locationService.getAllTechniciansLocations()
            setTecnicos(response.data)
        } catch (error) {
            console.error('Error cargando técnicos:', error)
        }
    }

    const updateLocation = async () => {
        if (!selectedTecnico) return

        try {
            await locationService.updateTechnicianLocation(
                selectedTecnico,
                lat,
                lng,
                10
            )
            console.log(`✅ Ubicación actualizada: ${lat}, ${lng}`)
        } catch (error) {
            console.error('Error actualizando ubicación:', error)
        }
    }

    const startSimulation = () => {
        if (!selectedTecnico) {
            alert('Selecciona un técnico')
            return
        }

        setIsSimulating(true)

        // Actualizar cada 5 segundos con movimiento aleatorio
        const id = setInterval(() => {
            setLat(prev => prev + (Math.random() - 0.5) * 0.01)
            setLng(prev => prev + (Math.random() - 0.5) * 0.01)
            updateLocation()
        }, 5000)

        setIntervalId(id)
    }

    const stopSimulation = () => {
        if (intervalId) {
            clearInterval(intervalId)
            setIntervalId(null)
        }
        setIsSimulating(false)
    }

    // Ubicaciones predefinidas de Lima
    const presetLocations = [
        { name: 'Miraflores', lat: -12.1191, lng: -77.0350 },
        { name: 'San Isidro', lat: -12.0931, lng: -77.0465 },
        { name: 'Surco', lat: -12.1391, lng: -76.9936 },
        { name: 'La Molina', lat: -12.0797, lng: -76.9422 },
        { name: 'Callao', lat: -12.0565, lng: -77.1181 },
    ]

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 w-80 border-2 border-yellow-400 z-50">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-yellow-700">🧪 Simulador de Ubicación</h3>
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">DEV</span>
            </div>

            <div className="space-y-3">
                {/* Seleccionar técnico */}
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                        Técnico
                    </label>
                    <select
                        value={selectedTecnico}
                        onChange={(e) => setSelectedTecnico(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        disabled={isSimulating}
                    >
                        <option value="">Seleccionar...</option>
                        {tecnicos.map(t => (
                            <option key={t.tecnico_id} value={t.tecnico_id}>
                                {t.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ubicaciones predefinidas */}
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                        Ubicación rápida
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                        {presetLocations.map(loc => (
                            <button
                                key={loc.name}
                                onClick={() => {
                                    setLat(loc.lat)
                                    setLng(loc.lng)
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                disabled={isSimulating}
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coordenadas manuales */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                            Latitud
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            value={lat}
                            onChange={(e) => setLat(parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-sm border rounded"
                            disabled={isSimulating}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                            Longitud
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            value={lng}
                            onChange={(e) => setLng(parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-sm border rounded"
                            disabled={isSimulating}
                        />
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                    {!isSimulating ? (
                        <>
                            <button
                                onClick={updateLocation}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                            >
                                Actualizar Una Vez
                            </button>
                            <button
                                onClick={startSimulation}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                            >
                                Simular Movimiento
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={stopSimulation}
                            className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                        >
                            Detener Simulación
                        </button>
                    )}
                </div>

                {isSimulating && (
                    <div className="text-xs text-center text-green-600 font-medium animate-pulse">
                        🔄 Simulando movimiento...
                    </div>
                )}
            </div>
        </div>
    )
}
