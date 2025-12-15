# MongoDB Database Schema - ISES-ISEA

## Configuración Requerida

**IMPORTANTE:** Este sistema requiere MongoDB con Replica Set para soportar transacciones.

### Iniciar MongoDB con Replica Set (Local)

```bash
# Iniciar MongoDB con replica set
mongod --replSet rs0 --port 27017 --dbpath /data/db

# En otra terminal, inicializar el replica set
mongosh
> rs.initiate()
```

### Connection String

```
mongodb://localhost:27017/ises_isea?replicaSet=rs0
```

## Colecciones

### 1. users
Usuarios del sistema (analistas, técnicos, analista_inventario_oculto)

### 2. polizas
Pólizas de 6 dígitos que deben estar vinculadas a cada OT

### 3. materials
Catálogo maestro de materiales

### 4. inventory_technician
Inventario por técnico con cantidades actual, apartada y disponible

### 5. movimientos_inventario
Registro de todos los movimientos (entrada, salida, apartado, ajuste, devolución)

### 6. orders
Órdenes de trabajo con toda la información de cliente, póliza, materiales y evidencias

### 7. ai_predictions
Predicciones de la IA para permisos

### 8. audit_logs
Auditoría de todas las acciones críticas

### 9. alerts
Alertas del sistema (stock crítico, consumo sospechoso, fotos manipuladas, etc.)

## Índices Importantes

Ver archivos individuales de cada colección para índices específicos.

## Reglas de Negocio en BD

1. **Transacciones obligatorias** para:
   - Apartado de materiales
   - Registro de consumo
   - Ajustes de inventario

2. **Validaciones**:
   - poliza_number debe ser string numérico de 6 dígitos
   - No permitir apartado > cantidad_disponible
   - Validar orden de fotos (inicial → durante → materiales → final)

3. **Auditoría**:
   - Todo movimiento crítico genera entrada en audit_logs
   - Alertas ocultas para analista_inventario_oculto
