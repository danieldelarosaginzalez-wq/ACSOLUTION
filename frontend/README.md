# ISES-ISEA Frontend

Frontend del sistema de gestión de órdenes de trabajo construido con React + Vite + TailwindCSS.

## Tecnologías

- **React 18** - Librería UI
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.jsx
│   ├── OTForm.jsx
│   ├── PolizaManager.jsx
│   ├── AssignTechModal.jsx
│   ├── TechnicianConsumptionForm.jsx
│   └── PhotosUploaderByStage.jsx
├── pages/              # Páginas/Vistas
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx
│   ├── CrearOT.jsx
│   ├── DetalleOT.jsx
│   ├── AsignarOT.jsx
│   ├── OTParaTecnico.jsx
│   ├── InventarioPorTecnico.jsx
│   ├── PanelAnalistaInventarioOculto.jsx
│   └── HistorialConsultas.jsx
├── services/           # Servicios API
│   ├── api.js
│   ├── authService.js
│   ├── otService.js
│   ├── polizaService.js
│   ├── inventoryService.js
│   ├── fileService.js
│   ├── aiService.js
│   ├── alertService.js
│   └── reportService.js
├── store/              # Zustand stores
│   └── authStore.js
├── utils/              # Utilidades
│   ├── validators.js
│   └── constants.js
├── App.jsx
├── main.jsx
└── index.css
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:3000`

## Build

```bash
npm run build
```

## Características Implementadas

### Autenticación
- Login con JWT
- Protección de rutas por rol
- Persistencia de sesión en localStorage

### Gestión de OTs
- Crear OT con validación de póliza
- Asignar técnico y apartar materiales
- Ver detalle completo con pestañas
- Registro de consumos por técnico
- Subida de evidencias fotográficas por etapas

### Gestión de Pólizas
- Buscar póliza existente
- Crear nueva póliza
- Ver OTs vinculadas
- Validación de formato (6 dígitos)

### Inventario
- Ver inventario por técnico
- Apartado de materiales
- Registro de consumos
- Alertas de stock crítico

### IA y Predicciones
- Solicitar predicción para OT
- Ver historial de predicciones
- Etiquetar resultados para entrenamiento

### Panel Oculto
- Alertas ocultas para analista_inventario_oculto
- Movimientos ocultos
- Auditoría completa

## Roles de Usuario

1. **analista**: Crea y asigna OTs, gestiona pólizas
2. **tecnico**: Ejecuta OTs, registra consumos, sube evidencias
3. **analista_inventario_oculto**: Acceso a panel secreto con alertas ocultas

## Validaciones Implementadas

- Póliza: 6 dígitos numéricos obligatorios
- Fotos: Orden secuencial (inicial → durante → materiales → final)
- Materiales: No apartar más de lo disponible
- Cantidades: Positivas y según unidad de medida

## Configuración

Copiar `.env.example` a `.env` y configurar:

```env
VITE_API_URL=http://localhost:4000/api
```

## Próximos Pasos

- [ ] Modo offline con sincronización
- [ ] Notificaciones en tiempo real
- [ ] Reportes descargables (PDF/Excel)
- [ ] Gráficas y dashboards avanzados
- [ ] Búsqueda y filtros avanzados
- [ ] Internacionalización (i18n)
