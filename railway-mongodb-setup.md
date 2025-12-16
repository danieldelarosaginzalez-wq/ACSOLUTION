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

Tu aplicación está configurada para usar:
```
MONGODB_URI=mongodb://mongo:JfZyuolAZaYujxmJueFLUeMwzMkJmhpn@mongodb.railway.internal:27017/acsolution
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
# Probar conexión MongoDB
cd backend && npm run test:db

# Construir aplicación
npm run build

# Iniciar en desarrollo
cd backend && npm run start:dev

# Iniciar en producción
npm start
```