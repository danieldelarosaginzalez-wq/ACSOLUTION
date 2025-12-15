# ISES-ISEA Backend

Backend NestJS con TypeScript para el sistema de gestión de órdenes de trabajo.

## Tecnologías

- **NestJS** - Framework Node.js
- **TypeScript** - Lenguaje
- **MongoDB + Mongoose** - Base de datos
- **JWT + Passport** - Autenticación
- **Bcrypt** - Hash de contraseñas

## Estructura del Proyecto

```
src/
├── auth/                 # Autenticación JWT
│   ├── guards/          # Guards de autenticación y roles
│   ├── strategies/      # Estrategias Passport
│   └── decorators/      # Decoradores personalizados
├── users/               # Gestión de usuarios
├── polizas/             # Gestión de pólizas
├── orders/              # Órdenes de trabajo (con transacciones)
├── inventory/           # Inventario por técnico
├── materials/           # Catálogo de materiales
├── files/               # Gestión de archivos
├── ai/                  # Predicciones IA
├── alerts/              # Sistema de alertas
├── audit/               # Logs de auditoría
├── reports/             # Reportes
└── schemas/             # Esquemas Mongoose
```

## Instalación

```bash
npm install
```

## Configuración

Copiar `.env.example` a `.env` y configurar:

```env
MONGODB_URI=mongodb://localhost:27017/ises_isea?replicaSet=rs0
JWT_SECRET=your-secret-key
PORT=4000
```

**IMPORTANTE:** MongoDB debe estar configurado con Replica Set para transacciones.

## Desarrollo

```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:4000/api`

## Build

```bash
npm run build
npm run start:prod
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Perfil actual

### Pólizas
- `POST /api/polizas` - Crear póliza
- `GET /api/polizas/:polizaNumber` - Obtener póliza
- `GET /api/polizas/:polizaNumber/validate` - Validar póliza
- `GET /api/polizas/:polizaNumber/ots` - OTs de una póliza

### Órdenes de Trabajo
- `POST /api/ot` - Crear OT
- `GET /api/ot` - Listar OTs
- `GET /api/ot/:id` - Detalle de OT
- `PUT /api/ot/:id/asignar` - Asignar técnico (con transacción)
- `POST /api/ot/:id/consumption` - Registrar consumos (con transacción)
- `PUT /api/ot/:id/close` - Cerrar OT

### Inventario
- `GET /api/inventario/tecnico/:techId` - Inventario de técnico
- `GET /api/inventario/tecnico/:techId/movimientos` - Movimientos
- `POST /api/inventario/ajuste` - Ajuste manual (solo analista_inventario_oculto)

### IA
- `POST /api/ai/predict` - Solicitar predicción
- `GET /api/ai/predictions` - Historial de predicciones
- `PUT /api/ai/predictions/:id/label` - Etiquetar predicción

### Alertas
- `GET /api/alerts` - Listar alertas
- `PUT /api/alerts/:id/resolve` - Resolver alerta

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Detalle de usuario

## Características Implementadas

### Autenticación y Autorización ✅
- JWT con Passport
- Guards de autenticación
- Guards de roles (analista, tecnico, analista_inventario_oculto)
- Decoradores personalizados

### Transacciones MongoDB ✅
- Apartado de materiales (assignOrder)
- Registro de consumos (registerConsumption)
- Rollback automático en caso de error

### Validaciones ✅
- Póliza: 6 dígitos numéricos
- Stock suficiente antes de apartar
- Póliza activa antes de crear OT
- Validación de datos con class-validator

### Auditoría ✅
- Registro de todas las acciones críticas
- Audit trail en cada OT
- Logs centralizados en audit_logs

### Alertas ✅
- Over consumption (consumo > apartado)
- Alertas ocultas para analista_inventario_oculto
- Resolución de alertas

### Inventario ✅
- Apartado de materiales con validación
- Registro de consumos
- Movimientos con trazabilidad
- Cálculo automático de disponible

## Reglas de Negocio Implementadas

1. **Póliza Obligatoria**: Toda OT requiere póliza válida de 6 dígitos
2. **Transacciones Atómicas**: Operaciones críticas usan transacciones MongoDB
3. **Validación de Stock**: No se puede apartar más de lo disponible
4. **Auditoría Completa**: Todo movimiento crítico genera audit log
5. **Alertas Automáticas**: Sistema detecta over_consumption automáticamente

## Seguridad

- Contraseñas hasheadas con bcrypt
- JWT con expiración configurable
- Guards de roles para endpoints sensibles
- Validación de datos en todos los endpoints
- CORS configurado

## Pendiente de Implementación

- [ ] Servicio de archivos completo (multer + S3)
- [ ] Extracción de EXIF de fotos
- [ ] Módulo de IA real (actualmente mock)
- [ ] Reportes descargables (PDF/Excel)
- [ ] Tests unitarios e integración
- [ ] Documentación Swagger/OpenAPI
- [ ] Rate limiting
- [ ] Logging avanzado (Winston)

## Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod

# Lint
npm run lint

# Format
npm run format
```

## Notas Importantes

1. **MongoDB Replica Set**: Obligatorio para transacciones
2. **Variables de Entorno**: Configurar JWT_SECRET en producción
3. **CORS**: Ajustar CORS_ORIGIN según frontend
4. **Uploads**: Crear carpeta `uploads/` para archivos

## Licencia

Propietario - ISES-ISEA
