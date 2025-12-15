# Usar Node.js 18 LTS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Copiar todo el código fuente
COPY . .

# Instalar dependencias principales
RUN npm install --production

# Construir el proyecto
RUN npm run build

# Limpiar archivos innecesarios
RUN rm -rf frontend/src backend/src frontend/node_modules/.cache

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S acsolution -u 1001 -G nodejs

# Cambiar permisos
RUN chown -R acsolution:nodejs /app

# Cambiar a usuario no-root
USER acsolution

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]