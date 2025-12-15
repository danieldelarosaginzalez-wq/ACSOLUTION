# 🚀 Configuración de Variables de Entorno para Railway

## Variables Requeridas para ACSOLUTION

Configura estas variables en tu servicio ACSOLUTION en Railway:

### 🔧 Variables de Base de Datos
```env
MONGODB_URI=mongodb://mongo:JfZyuolAZaYujxmJueFLUeMwzMkJmhpn@mongodb.railway.internal:27017/acsolution
```

### 🔐 Variables de Seguridad
```env
JWT_SECRET=acsolution_jwt_secret_2024_super_secure_change_in_production
JWT_EXPIRES_IN=7d
```

### 🌐 Variables de Servidor
```env
NODE_ENV=production
PORT=3000
BACKEND_PORT=4000
```

### 📁 Variables de Archivos
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 🔗 Variables de CORS
```env
CORS_ORIGIN=*
```

## 📝 Pasos para Configurar:

1. **Ve a tu servicio ACSOLUTION en Railway**
2. **Haz clic en "Variables" en el menú lateral**
3. **Agrega cada variable una por una:**
   - Clic en "New Variable"
   - Nombre: `MONGODB_URI`
   - Valor: `mongodb://mongo:JfZyuolAZaYujxmJueFLUeMwzMkJmhpn@mongodb.railway.internal:27017/acsolution`
   - Clic en "Add"
4. **Repite para todas las variables**
5. **Haz clic en "Deploy" para aplicar los cambios**

## ✅ Verificación

Una vez configuradas las variables, tu aplicación debería:
- ✅ Conectarse a MongoDB correctamente
- ✅ Servir el frontend en el puerto 3000
- ✅ Ejecutar el backend en el puerto 4000
- ✅ Proxy las peticiones API correctamente

## 🔍 Troubleshooting

Si hay problemas:
1. Verifica que todas las variables estén configuradas
2. Revisa los logs de despliegue en Railway
3. Asegúrate de que el servicio MongoDB esté corriendo
4. Verifica la conectividad entre servicios