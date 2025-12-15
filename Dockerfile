# Multi-stage build para optimizar el tamaño
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Instalar dependencias del frontend
WORKDIR /app/frontend
RUN npm ci --only=production

# Copiar código del frontend y construir
COPY frontend/ ./
RUN npm run build

# Instalar dependencias del backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copiar código del backend y construir
COPY backend/ ./
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar package.json principal
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar servidor principal
COPY server.js ./

# Copiar builds del frontend y backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]