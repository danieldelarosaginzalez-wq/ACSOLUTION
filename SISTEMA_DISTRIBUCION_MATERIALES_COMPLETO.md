# Sistema de Distribución y Control de Materiales

## Descripción General

Este sistema resuelve el problema de descuadres de materiales implementando un control completo del flujo de materiales desde la asignación hasta la devolución, permitiendo rastrear exactamente qué materiales tiene cada técnico, qué utiliza y qué devuelve.

## Problema Resuelto

**Situación Anterior:**
- Los técnicos pedían materiales en la mañana
- No había control de qué se utilizaba realmente
- Si no completaban todos los trabajos, sobraban materiales
- No se sabía dónde estaban los materiales sobrantes
- Descuadres constantes en el inventario

**Solución Implementada:**
- Control granular de asignación de materiales por técnico
- Seguimiento del estado de cada material asignado
- Proceso obligatorio de devolución con justificación
- Detección automática de descuadres
- Resolución supervisada por analistas

## Arquitectura del Sistema

### Backend (NestJS)

#### 1. Esquemas de Base de Datos

**MaterialControl Schema** (`backend/src/schemas/material-control.schema.ts`)
- Control principal de asignaciones de materiales
- Rastrea materiales asignados, utilizados, devueltos y perdidos
- Detecta y registra descuadres automáticamente
- Estados: asignado → en_trabajo → devolucion_completada → cerrado

**Campos Principales:**
```typescript
- tecnico_id: Técnico asignado
- orden_trabajo_id: OT asociada (opcional)
- materiales_asignados: Array de materiales con cantidades
- estado_general: Estado del control
- tiene_descuadre: Boolean para descuadres
- valor_descuadre: Valor monetario del descuadre
- fechas de seguimiento completas
```

#### 2. Servicios

**MaterialDistributionService** (`backend/src/materials/material-distribution.service.ts`)

**Funciones Principales:**
- `asignarMateriales()`: Bodeguero asigna materiales a técnico
- `iniciarTrabajo()`: Técnico confirma inicio de uso
- `devolverMateriales()`: Técnico reporta uso y devuelve sobrantes
- `resolverDescuadre()`: Analista resuelve descuadres
- `getEstadisticas()`: Dashboard con métricas

**Lógica de Validación:**
- Verifica disponibilidad antes de asignar
- Calcula descuadres automáticamente
- Actualiza inventario en tiempo real
- Registra todos los movimientos

#### 3. Controladores

**MaterialDistributionController** (`backend/src/materials/material-distribution.controller.ts`)

**Endpoints por Rol:**

**Bodeguero:**
- `POST /asignar` - Asignar materiales
- `GET /controles-pendientes` - Ver asignaciones activas

**Técnico:**
- `POST /iniciar-trabajo/:id` - Iniciar uso de materiales
- `POST /devolver` - Devolver materiales
- `GET /mis-asignaciones` - Ver mis materiales

**Analista:**
- `GET /descuadres` - Ver descuadres pendientes
- `PUT /resolver-descuadre/:id` - Resolver descuadre
- `GET /estadisticas` - Métricas del sistema

### Frontend (React)

#### 1. Componentes Principales

**MaterialAssignmentForm** (`frontend/src/components/MaterialAssignmentForm.jsx`)
- Formulario para que bodegueros asignen materiales
- Validación de stock disponible
- Cálculo de costos en tiempo real
- Selección de técnico y OT

**MaterialReturnFormAdvanced** (`frontend/src/components/MaterialReturnFormAdvanced.jsx`)
- Formulario para devolución de materiales
- Separación de cantidades: utilizadas, devueltas, perdidas
- Validación automática de cuadre
- Justificación obligatoria para pérdidas

**MaterialDiscrepancyManager** (`frontend/src/components/MaterialDiscrepancyManager.jsx`)
- Panel para analistas gestionar descuadres
- Vista de descuadres pendientes y resueltos
- Detalle completo de cada descuadre
- Resolución con observaciones

**MaterialDistributionDashboard** (`frontend/src/components/MaterialDistributionDashboard.jsx`)
- Dashboard principal para bodegueros
- Estadísticas en tiempo real
- Lista de controles activos
- Acciones rápidas

#### 2. Páginas

**BodegueroPage** (`frontend/src/pages/BodegueroPage.jsx`)
- Panel principal del bodeguero
- Tabs: Dashboard y Descuadres
- Acceso a todas las funciones de distribución

**TechnicianMaterialsPage** (`frontend/src/pages/TechnicianMaterialsPage.jsx`)
- Vista para técnicos de sus materiales asignados
- Inicio de trabajo y devolución
- Historial de asignaciones

#### 3. Servicios

**MaterialDistributionService** (`frontend/src/services/materialDistributionService.js`)
- Cliente para todas las operaciones de distribución
- Manejo de errores centralizado
- Cálculos de estadísticas y resúmenes
- Generación de alertas

## Flujo de Trabajo Completo

### 1. Asignación de Materiales (Bodeguero)

```
1. Bodeguero selecciona técnico
2. Opcionalmente asocia una OT
3. Selecciona materiales y cantidades
4. Sistema valida disponibilidad
5. Crea control de materiales
6. Aparta materiales en inventario técnico
7. Registra movimiento de "apartado"
```

### 2. Inicio de Trabajo (Técnico)

```
1. Técnico ve materiales asignados
2. Confirma inicio de trabajo
3. Sistema cambia estado a "en_trabajo"
4. Materiales pasan de "apartado" a "en uso"
5. Se descuenta del inventario técnico
```

### 3. Devolución de Materiales (Técnico)

```
1. Técnico completa trabajo
2. Reporta cantidades:
   - Utilizadas (consumidas)
   - Devueltas (sobrantes)
   - Perdidas (con justificación)
3. Sistema valida que sumen el total asignado
4. Detecta descuadres automáticamente
5. Devuelve sobrantes al inventario
6. Registra todos los movimientos
```

### 4. Resolución de Descuadres (Analista)

```
1. Analista revisa descuadres detectados
2. Analiza causas y justificaciones
3. Agrega observaciones de resolución
4. Marca descuadre como resuelto
5. Cierra el control de materiales
```

## Características Clave

### Control Total
- Cada material asignado es rastreado individualmente
- Estados granulares para cada material
- Fechas de seguimiento completas
- Trazabilidad total del flujo

### Detección Automática de Descuadres
- Validación matemática: asignado = utilizado + devuelto + perdido
- Cálculo automático del valor monetario del descuadre
- Alertas inmediatas para descuadres

### Roles y Permisos
- **Bodeguero**: Asigna materiales, ve controles activos
- **Técnico**: Inicia trabajo, devuelve materiales
- **Analista**: Resuelve descuadres, supervisa proceso

### Reportes y Estadísticas
- Controles activos en tiempo real
- Valor total de descuadres pendientes
- Materiales actualmente en uso
- Historial completo por técnico
- Eficiencia de uso de materiales

### Integración Completa
- Se integra con sistema de inventario existente
- Compatible con órdenes de trabajo
- Registra en movimientos de inventario
- Actualiza stocks en tiempo real

## Beneficios del Sistema

### Para la Empresa
- **Eliminación de descuadres**: Control total del flujo de materiales
- **Reducción de pérdidas**: Justificación obligatoria de faltantes
- **Mejor planificación**: Datos reales de consumo por técnico
- **Trazabilidad completa**: Saber exactamente dónde está cada material

### Para Bodegueros
- **Control visual**: Dashboard con estado de todas las asignaciones
- **Proceso estructurado**: Flujo claro de asignación y devolución
- **Alertas automáticas**: Notificación de descuadres y problemas

### Para Técnicos
- **Claridad**: Saben exactamente qué materiales tienen asignados
- **Responsabilidad**: Proceso claro de devolución
- **Historial**: Pueden ver su historial de asignaciones

### Para Analistas
- **Supervisión**: Control total sobre descuadres
- **Datos precisos**: Información real para toma de decisiones
- **Eficiencia**: Identificación de patrones de uso

## Implementación

### Base de Datos
- Nuevo esquema `MaterialControl` para controles
- Integración con esquemas existentes de materiales e inventario
- Índices optimizados para consultas frecuentes

### API
- Endpoints RESTful organizados por rol
- Validaciones robustas en cada operación
- Manejo de errores detallado

### Frontend
- Componentes reutilizables y modulares
- Interfaz intuitiva para cada rol
- Validaciones en tiempo real
- Feedback visual inmediato

### Seguridad
- Autenticación JWT requerida
- Autorización basada en roles
- Validación de permisos en cada endpoint
- Logs de auditoría completos

## Próximos Pasos

1. **Implementar notificaciones push** para alertas críticas
2. **Agregar reportes avanzados** con gráficos y tendencias
3. **Integrar con sistema de GPS** para validar ubicación en devoluciones
4. **Implementar códigos QR** para materiales físicos
5. **Agregar predicciones de IA** para optimizar asignaciones

Este sistema transforma completamente la gestión de materiales, eliminando los descuadres y proporcionando control total sobre el inventario de técnicos.