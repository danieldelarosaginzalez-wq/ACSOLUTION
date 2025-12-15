# Multi-stage build optimizado
FROM node:18-alpine AS builder

# Instalar dependencias del sistema para build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Instalar todas las dependencias (incluyendo dev)
RUN npm install
WORKDIR /app/frontend
RUN npm install
WORKDIR /app/backend  
RUN npm install --legacy-peer-deps

# Copiar código fuente
WORKDIR /app
COPY . .

# Construir el proyecto
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar solo los archivos necesarios para producción
COPY package*.json ./
COPY server.js ./

# Instalar solo dependencias de producción
RUN npm install --production

# Copiar builds desde la etapa anterior
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Instalar dependencias de producción del backend
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm install --production --legacy-peer-deps

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S acsolution -u 1001 -G nodejs && \
    chown -R acsolution:nodejs /app

USER acsolution

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]