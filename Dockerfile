# Usar Node.js 18 LTS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json principal
COPY package*.json ./

# Instalar dependencias principales
RUN npm install

# Copiar código fuente
COPY . .

# Instalar dependencias del frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Construir frontend
RUN npm run build

# Instalar dependencias del backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# Construir backend
RUN npm run build

# Volver al directorio principal
WORKDIR /app

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]