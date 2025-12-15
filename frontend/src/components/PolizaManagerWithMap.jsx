import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { polizaService } from '../services/polizaService';
import locationService from '../services/locationService';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 🎯 Icono para póliza ubicada
const createPolizaIcon = (numero, isSelected = false) => {
    const size = isSelected ? 'w-12 h-12' : 'w-10 h-10';
    const pulseClass = isSelected ? 'animate-pulse' : '';

    return L.divIcon({
        className: 'poliza-marker',
        html: `
            <div class="relative">
                <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl border-2 border-white">
                    📄 ${numero}
                </div>
                <div class="${size} bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center ${pulseClass}">
                    <span class="text-white text-lg">📄</span>
                </div>
            </div>
        `,
        iconSize: isSelected ? [48, 48] : [40, 40],
        iconAnchor: isSelected ? [24, 24] : [20, 20],
    });
};

// 🎯 Icono para nueva ubicación
const createNewLocationIcon = () => {
    return L.divIcon({
        className: 'new-location-marker',
        html: `
            <div class="relative">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-2xl animate-bounce flex items-center justify-center">
                    <span class="text-white text-lg">📍</span>
                </div>
                <div class="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// 🗺️ Componente para manejar clicks en el mapa
function MapClickHandler({ onMapClick, isLocationMode }) {
    useMapEvents({
        click: (e) => {
            if (isLocationMode && onMapClick) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
}

// 🎯 Componente para centrar el mapa
function MapCenter({ center, zoom }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);

    return null;
}

export default function PolizaManagerWithMap({ onPolizaSelected }) {
    const [polizaNumber, setPolizaNumber] = useState('');
    const [polizaData, setPolizaData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [isLocationMode, setIsLocationMode] = useState(false);
    const [newLocation, setNewLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([10.3910, -75.4794]); // Cartagena
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Buscar póliza
    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await polizaService.get(polizaNumber);
            setPolizaData(response.data);

            // Si la póliza tiene ubicación, centrar el mapa
            if (response.data.ubicacion) {
                setMapCenter([response.data.ubicacion.lat, response.data.ubicacion.lng]);
                setShowMap(true);
            }

            // Notificar al componente padre
            if (onPolizaSelected) {
                onPolizaSelected(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al buscar póliza');
            setPolizaData(null);
        } finally {
            setLoading(false);
        }
    };

    // Crear nueva póliza
    const handleCreatePoliza = async () => {
        if (!polizaNumber || polizaNumber.length !== 6) {
            setError('Ingrese un número de póliza válido (6 dígitos)');
            return;
        }

        try {
            setLoading(true);
            const response = await polizaService.create({
                poliza_number: polizaNumber,
                estado: 'activa',
                cliente: 'Cliente por definir',
                direccion: 'Dirección por definir'
            });

            setPolizaData(response.data);
            setError('');

            // Notificar al componente padre
            if (onPolizaSelected) {
                onPolizaSelected(response.data);
            }

            alert('✅ Póliza creada exitosamente');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear póliza');
        } finally {
            setLoading(false);
        }
    };

    // Manejar click en el mapa
    const handleMapClick = (latlng) => {
        if (!isLocationMode || !polizaData) return;

        setNewLocation({
            lat: latlng.lat,
            lng: latlng.lng
        });
    };

    // Guardar nueva ubicación
    const handleSaveLocation = async () => {
        if (!newLocation || !polizaData) return;

        try {
            setIsGeocoding(true);

            // Debug: verificar estructura de polizaData
            console.log('polizaData:', polizaData);
            console.log('polizaData._id:', polizaData._id);
            console.log('polizaData.id:', polizaData.id);

            // Obtener dirección de las coordenadas
            let addressResponse;
            try {
                addressResponse = await locationService.reverseGeocode(newLocation.lat, newLocation.lng);
            } catch (geocodeError) {
                console.warn('Error en reverse geocoding:', geocodeError);
                // Continuar sin dirección si falla el geocoding
                addressResponse = { data: {} };
            }

            const locationData = {
                lat: newLocation.lat,
                lng: newLocation.lng,
                direccion: addressResponse.data.direccion || `Lat: ${newLocation.lat.toFixed(6)}, Lng: ${newLocation.lng.toFixed(6)}`,
                barrio: addressResponse.data.barrio,
                ciudad: addressResponse.data.ciudad || 'Cartagena',
                departamento: addressResponse.data.departamento || 'Bolívar'
            };

            // Usar el ID correcto (puede ser _id o id)
            const polizaId = polizaData._id || polizaData.id;
            if (!polizaId) {
                throw new Error('No se pudo obtener el ID de la póliza');
            }

            // Actualizar póliza con nueva ubicación
            await polizaService.updateLocation(polizaId, locationData);

            // Actualizar datos locales
            const updatedPoliza = {
                ...polizaData,
                ubicacion: locationData,
                direccion: locationData.direccion
            };

            setPolizaData(updatedPoliza);

            // Notificar al componente padre
            if (onPolizaSelected) {
                onPolizaSelected(updatedPoliza);
            }

            // Limpiar estado
            setNewLocation(null);
            setIsLocationMode(false);

            alert('✅ Ubicación actualizada correctamente');
        } catch (error) {
            console.error('Error actualizando ubicación:', error);
            alert('❌ Error al actualizar la ubicación');
        } finally {
            setIsGeocoding(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Búsqueda de póliza */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🔍 Buscar o Crear Póliza
                </h3>

                <form onSubmit={handleSearch} className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Número de póliza (6 dígitos)"
                            value={polizaNumber}
                            onChange={(e) => setPolizaNumber(e.target.value)}
                            pattern="[0-9]{6}"
                            maxLength="6"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                        >
                            {loading ? '...' : '🔍'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreatePoliza}
                        disabled={loading || !polizaNumber}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                        ➕ Crear Nueva Póliza
                    </button>
                </form>

                {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}
            </div>

            {/* Información de póliza encontrada */}
            {polizaData && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            📄 Póliza {polizaData.poliza_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${polizaData.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {polizaData.estado}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-600">Cliente:</span>
                            <span className="ml-2 font-medium">{polizaData.cliente || 'No definido'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Dirección:</span>
                            <span className="ml-2">{polizaData.direccion || 'No definida'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Ubicación:</span>
                            {polizaData.ubicacion ? (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                    <span>📍</span>
                                    Ubicada
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                    <span>❓</span>
                                    Sin ubicar
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Ver en Mapa'}
                        </button>

                        {!polizaData.ubicacion && (
                            <button
                                onClick={() => {
                                    setShowMap(true);
                                    setIsLocationMode(true);
                                }}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                                📍 Ubicar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Mapa */}
            {showMap && polizaData && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Controles del mapa */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                🗺️ Ubicación de Póliza {polizaData.poliza_number}
                            </h4>

                            <div className="flex gap-2">
                                {!polizaData.ubicacion && (
                                    <button
                                        onClick={() => {
                                            setIsLocationMode(!isLocationMode);
                                            setNewLocation(null);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${isLocationMode
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                    >
                                        {isLocationMode ? '❌ Cancelar' : '📍 Ubicar'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Instrucciones */}
                        {isLocationMode && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-blue-800 text-sm flex items-center gap-2">
                                    <span>👆</span>
                                    Haz click en el mapa para ubicar la póliza
                                </p>
                            </div>
                        )}

                        {/* Confirmación de nueva ubicación */}
                        {newLocation && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <div className="flex items-center justify-between">
                                    <p className="text-green-800 text-sm flex items-center gap-2">
                                        <span>📍</span>
                                        Nueva ubicación seleccionada
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNewLocation(null)}
                                            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveLocation}
                                            disabled={isGeocoding}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isGeocoding ? (
                                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                '💾'
                                            )}
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mapa */}
                    <div className="h-64">
                        <MapContainer
                            center={mapCenter}
                            zoom={polizaData.ubicacion ? 16 : 13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Marcador de póliza existente */}
                            {polizaData.ubicacion && (
                                <Marker
                                    position={[polizaData.ubicacion.lat, polizaData.ubicacion.lng]}
                                    icon={createPolizaIcon(polizaData.poliza_number, true)}
                                >
                                    <Popup>
                                        <div className="p-2 text-center">
                                            <p className="font-bold text-green-900">📄 Póliza {polizaData.poliza_number}</p>
                                            <p className="text-sm text-gray-600">{polizaData.direccion}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Marcador de nueva ubicación */}
                            {newLocation && (
                                <Marker
                                    position={[newLocation.lat, newLocation.lng]}
                                    icon={createNewLocationIcon()}
                                >
                                    <Popup>
                                        <div className="p-2 text-center">
                                            <p className="font-bold text-blue-900">📍 Nueva Ubicación</p>
                                            <p className="text-xs text-gray-600">
                                                {newLocation.lat.toFixed(6)}, {newLocation.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Manejador de clicks */}
                            <MapClickHandler
                                onMapClick={handleMapClick}
                                isLocationMode={isLocationMode}
                            />

                            {/* Centrado del mapa */}
                            <MapCenter center={mapCenter} zoom={polizaData.ubicacion ? 16 : 13} />
                        </MapContainer>
                    </div>
                </div>
            )}
        </div>
    );
}