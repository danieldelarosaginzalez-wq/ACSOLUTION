# MatServices - Sistema de Gestión de Materiales y Órdenes de Trabajo

## 🚀 Descripción del Proyecto

MatServices es un sistema completo de gestión empresarial diseñado específicamente para empresas de servicios públicos como Aguas de Cartagena. El sistema integra múltiples módulos para la gestión eficiente de órdenes de trabajo, inventarios, técnicos y materiales.

## 🏗️ Arquitectura del Sistema

### Backend (NestJS + TypeScript)
- **Framework**: NestJS con TypeScript
- **Base de datos**: MongoDB con Mongoose
- **Autenticación**: JWT + Guards personalizados
- **WebSockets**: Para actualizaciones en tiempo real
- **Geocodificación**: Integración con servicios de mapas

### Frontend (React + Vite)
- **Framework**: React 18 con Vite
- **Estilos**: Tailwind CSS
- **Mapas**: Leaflet con React-Leaflet
- **Estado**: Context API + Zustand
- **Comunicación**: Axios + Socket.io

### Base de Datos
- **Motor**: MongoDB
- **ODM**: Mongoose
- **Esquemas**: Definidos en TypeScript

## 📋 Funcionalidades Principales

### 🔧 Gestión de Órdenes de Trabajo
- Creación y asignación automática de OT
- Seguimiento en tiempo real del estado
- Integración con mapas para ubicación
- Sistema de prioridades y escalamiento

### 👷 Gestión de Técnicos
- Registro y autenticación de técnicos
- Seguimiento GPS en tiempo real
- Asignación inteligente basada en ubicación
- Gestión de especialidades y disponibilidad

### 📦 Gestión de Inventarios
- Control de materiales por técnico
- Distribución automática de materiales
- Alertas de stock bajo
- Reportes de consumo y devoluciones

### 🗺️ Sistema de Mapas Avanzado
- Visualización en tiempo real de técnicos
- Optimización de rutas
- Mapas de calor de órdenes
- Integración con geocodificación

### 📊 Dashboard y Reportes
- Métricas en tiempo real
- Análisis predictivo con IA
- Reportes personalizables
- Alertas y notificaciones

### 🤖 Inteligencia Artificial
- Predicción de demanda de materiales
- Optimización de asignaciones
- Análisis de patrones de consumo
- Recomendaciones automáticas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- MongoDB 6+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/danieldelarosaginzalez-wq/MatServices.git
cd MatServices
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run start:dev
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run dev
```

### 4. Configurar Base de Datos
```bash
cd database
npm install
node init-db.js
node seed-data.js
```

## 🔧 Variables de Entorno

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/matservices
JWT_SECRET=tu_jwt_secret_aqui
PORT=3000
GEOCODING_API_KEY=tu_api_key_aqui
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_MAP_API_KEY=tu_map_api_key_aqui
```

## 📁 Estructura del Proyecto

```
MatServices/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Autenticación y autorización
│   │   ├── orders/         # Gestión de órdenes
│   │   ├── users/          # Gestión de usuarios
│   │   ├── materials/      # Gestión de materiales
│   │   ├── location/       # Servicios de ubicación
│   │   ├── ai/            # Servicios de IA
│   │   └── schemas/        # Esquemas de MongoDB
│   └── package.json
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── services/      # Servicios API
│   │   └── hooks/         # Hooks personalizados
│   └── package.json
├── database/              # Scripts de base de datos
│   ├── schemas/          # Esquemas JSON
│   └── seed-data.js      # Datos de prueba
└── README.md
```

## 🌟 Características Destacadas

### ⚡ Tiempo Real
- Actualizaciones instantáneas vía WebSockets
- Seguimiento GPS de técnicos
- Notificaciones push

### 🎯 Optimización Inteligente
- Asignación automática de técnicos
- Rutas optimizadas
- Predicciones de IA

### 📱 Responsive Design
- Interfaz adaptable a móviles
- PWA ready
- Offline capabilities

### 🔒 Seguridad
- Autenticación JWT
- Roles y permisos granulares
- Auditoría completa

## 🚀 Despliegue

### Producción con Docker
```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d
```

### Despliegue en la Nube
- **Backend**: Heroku, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify
- **Base de datos**: MongoDB Atlas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo de Desarrollo

- **Daniel de la Rosa González** - Desarrollador Principal
- **Aguas de Cartagena** - Cliente y Stakeholder

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@matservices.com
- Issues: [GitHub Issues](https://github.com/danieldelarosaginzalez-wq/MatServices/issues)

## 🔄 Roadmap

### Versión 2.0
- [ ] Integración con ERP existente
- [ ] App móvil nativa
- [ ] Análisis avanzado con ML
- [ ] API pública para integraciones

### Versión 2.1
- [ ] Módulo de facturación
- [ ] Integración con IoT
- [ ] Dashboard ejecutivo avanzado
- [ ] Reportes automáticos

---

⭐ **¡Dale una estrella al proyecto si te ha sido útil!** ⭐