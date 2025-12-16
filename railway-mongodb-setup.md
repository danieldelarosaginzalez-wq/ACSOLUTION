# Configuración MongoDB en Railway

## Variables de MongoDB Configuradas

Según tu configuración en Railway, tienes las siguientes variables disponibles:

### Variables Individuales
- `MONGOHOST`: `mongodb.railway.internal`
- `MONGOUSER`: `mongo`
- `MONGOPASSWORD`: `JfZyuolAZaYujxmJueFLUeMwzMkJmhpn`
- `MONGOPORT`: `27017`

### Variables de Conexión Completas
- `MONGO_URL`: Cadena de conexión completa interna
- `MONGO_PUBLIC_URL`: `mongodb://mongo:JfZyuolAZaYujxmJueFLUeMwzMkJmhpn@turntable.proxy.rlwy.net:23055`

## Configuración Actual

Tu aplicación está configurada para usar automáticamente la variable `MONGO_URL` que Railway proporciona.

**IMPORTANTE**: Railway automáticamente inyecta la variable `MONGO_URL` cuando conectas un servicio MongoDB. No necesitas configurarla manualmente.

```javascript
// En app.module.ts
MongooseModule.forRoot(
    process.env.MONGO_URL ||           // Railway proporciona esto automáticamente
    process.env.MONGODB_URI ||         // Fallback
    'mongodb://localhost:27017/acsolution'  // Desarrollo local
)
```

## Verificación de Conexión

Para probar la conexión a MongoDB:

```bash
cd backend
npm run test:db
```

## Configuración en Railway

1. **Variables de Entorno**: Las variables ya están configuradas en tu servicio de Railway
2. **Base de Datos**: El nombre de la base de datos es `acsolution`
3. **Conexión Interna**: Usa `mongodb.railway.internal` para conexiones desde tu aplicación
4. **Conexión Externa**: Usa `turntable.proxy.rlwy.net:23055` para conexiones externas

## Troubleshooting

### Error de Conexión
Si tienes problemas de conexión:

1. Verifica que las variables estén configuradas en Railway
2. Asegúrate de que el servicio MongoDB esté ejecutándose
3. Revisa los logs del servicio en Railway

### Variables de Entorno
Las variables se cargan automáticamente en Railway, pero puedes verificarlas:

```bash
echo $MONGODB_URI
echo $MONGOHOST
```

### Logs de Conexión
Para ver logs detallados de la conexión:

```bash
# En el backend
npm run start:dev
```

## Estructura de la Aplicación

```
├── backend/
│   ├── .env                    # Variables locales
│   ├── src/
│   │   ├── app.module.ts      # Configuración MongoDB
│   │   └── main.ts            # Servidor principal
│   └── test-mongodb-connection.js  # Script de prueba
├── railway.toml               # Configuración Railway
└── server.js                  # Servidor de producción
```

## Comandos Útiles

```bash
# Debug configuración Railway
cd backend && npm run debug:railway

# Probar conexión MongoDB
cd backend && npm run test:db

# Construir aplicación
npm run build

# Iniciar en desarrollo
cd backend && npm run start:dev

# Iniciar en producción
npm start
```

## Solución al Error de Autenticación

Si ves el error "Authentication failed", sigue estos pasos:

1. **Verificar variables en Railway**:
   ```bash
   cd backend && npm run debug:railway
   ```

2. **Asegurar que MongoDB esté conectado**:
   - Ve a tu proyecto en Railway
   - Verifica que el servicio MongoDB esté ejecutándose
   - Asegúrate de que esté conectado a tu servicio principal

3. **Verificar que MONGO_URL esté disponible**:
   - Railway debe inyectar automáticamente `MONGO_URL`
   - Si no está disponible, reconecta el servicio MongoDB

4. **Logs de Railway**:
   - Revisa los logs del servicio para ver qué URL se está usando
   - Busca mensajes de conexión MongoDB