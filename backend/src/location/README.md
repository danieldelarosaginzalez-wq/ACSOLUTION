# 🗺️ Sistema de Mapas y Ubicación en Tiempo Real

## Descripción

Sistema completo de geolocalización y mapas para ServiceOps Pro que permite:
- Tracking en tiempo real de técnicos
- Visualización de órdenes de trabajo en mapa
- Geocodificación automática de direcciones
- Sugerencia inteligente de técnicos por proximidad
- WebSocket para actualizaciones en tiempo real

## Arquitectura

### Backend
- **LocationModule**: Módulo principal de ubicaciones
- **LocationService**: Lógica de negocio para ubicaciones
- **GeocodingService**: Servicio de geocodificación (Nominatim/OpenStreetMap)
- **LocationGateway**: WebSocket para tiempo real
- **LocationController**: Endpoints REST

### Frontend
- **MapaOperaciones**: Página principal del mapa
- **MapView**: Componente del mapa con Leaflet
- **MapSidebar**: Panel lateral con listas
- **useRealtimeLocation**: Hook para WebSocket
- **locationService**: Cliente HTTP para API

## Endpoints API

### GET /location/technicians
Obtiene ubicaciones de todos los técnicos activos
```json
[
  {
    "tecnico_id": "...",
    "nombre": "Carlos López",
    "email": "carlos@example.com",
    "ubicacion": {
      "lat": -12.0464,
      "lng": -77.0428,
      "timestamp": "2024-12-08T10:30:00Z",
      "accuracy": 10
    }
  }
]
```

### POST /location/technician/:id
Actualiza ubicación de un técnico (desde app móvil)
```json
{
  "lat": -12.0464,
  "lng": -77.0428,
  "accuracy": 10
}
```

### GET /location/orders?estado=creada
Obtiene órdenes con ubicación
```json
[
  {
    "order_id": "...",
    "codigo": "OT-2024-001",
    "cliente": "Juan Pérez",
    "direccion": "Av. Principal 123",
    "ubicacion": {
      "lat": -12.0464,
      "lng": -77.0428
    },
    "estado": "creada"
  }
]
```

### POST /location/nearby-technicians
Encuentra técnicos cercanos a una ubicación
```json
{
  "lat": -12.0464,
  "lng": -77.0428,
  "maxDistance": 50
}
```

Respuesta:
```json
[
  {
    "tecnico_id": "...",
    "nombre": "Carlos López",
    "ubicacion": {...},
    "distancia_km": 2.5
  }
]
```

### GET /location/suggest-technician/:orderId
Sugiere el mejor técnico para una OT basado en proximidad

### GET /location/map-data?estado=creada
Obtiene datos completos para el mapa (técnicos + órdenes)

### POST /location/geocode
Geocodifica una dirección
```json
{
  "direccion": "Av. Principal 123, Lima"
}
```

## WebSocket Events

### Namespace: /location

**Cliente → Servidor:**
- `updateLocation`: Técnico actualiza su ubicación
- `requestMapData`: Solicita datos del mapa

**Servidor → Cliente:**
- `technicianLocationUpdated`: Ubicación de técnico actualizada
- `mapData`: Datos completos del mapa
- `mapUpdateRequired`: Solicitud de actualización

## Flujo de Datos

### 1. Crear Póliza
```
Analista → Crea póliza con dirección
         → Backend geocodifica automáticamente
         → Guarda coordenadas en póliza
```

### 2. Crear OT
```
Analista → Crea OT seleccionando póliza
         → OT hereda ubicación de póliza
         → Aparece en mapa automáticamente
```

### 3. Tracking de Técnico
```
App Móvil → Envía GPS cada 30s
          → Backend actualiza ubicación
          → WebSocket broadcast a analistas
          → Mapa actualiza marcador
```

### 4. Asignación Inteligente
```
Analista → Selecciona OT en mapa
         → Sistema calcula técnicos cercanos
         → Muestra lista ordenada por distancia
         → Analista asigna con un click
```

## Uso en Frontend

### Importar el hook
```javascript
import useRealtimeLocation from '../hooks/useRealtimeLocation'

const { connected, mapData, requestMapData } = useRealtimeLocation()
```

### Usar el servicio
```javascript
import locationService from '../services/locationService'

// Obtener datos del mapa
const response = await locationService.getMapData('creada')

// Encontrar técnicos cercanos
const nearby = await locationService.findNearbyTechnicians(lat, lng, 50)
```

## Configuración

### Variables de Entorno
No requiere configuración adicional. Usa Nominatim (OpenStreetMap) que es gratuito.

### Límites de Geocoding
Nominatim tiene límite de 1 request/segundo. El servicio incluye:
- Cache automático
- Delay entre requests
- Manejo de errores

## Scripts Útiles

### Geocodificar pólizas existentes
```bash
cd backend
npx ts-node src/scripts/geocode-existing-polizas.ts
```

## Desarrollo

### Simular ubicación de técnico
```javascript
// En consola del navegador
await fetch('http://localhost:3000/location/technician/TECNICO_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    lat: -12.0464,
    lng: -77.0428,
    accuracy: 10
  })
})
```

## Mejoras Futuras

- [ ] Rutas optimizadas entre múltiples OTs
- [ ] Historial de ubicaciones
- [ ] Geofencing (alertas por zona)
- [ ] Heatmap de actividad
- [ ] Clustering avanzado
- [ ] Exportar mapa a PDF
- [ ] Integración con Google Maps (opcional)
- [ ] Modo offline para técnicos

## Troubleshooting

### El mapa no carga
- Verificar que Leaflet CSS esté importado en index.css
- Verificar conexión a internet (tiles de OpenStreetMap)

### WebSocket no conecta
- Verificar que el backend esté corriendo
- Verificar CORS en backend
- Verificar URL en VITE_API_URL

### Geocoding falla
- Verificar formato de dirección
- Verificar límite de requests (1/segundo)
- Verificar conexión a Nominatim

### Técnicos no aparecen en mapa
- Verificar que tengan ubicación_actual en DB
- Verificar que estén activos
- Verificar permisos de rol
