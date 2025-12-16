# Configuración completa para Render

## Environment Variables (copiar y pegar):

```
NODE_ENV=production
PORT=3000
JWT_SECRET=acsolution_jwt_secret_2024_super_secure_change_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://acsolution:TU_PASSWORD@cluster0.xxxxx.mongodb.net/acsolution?retryWrites=true&w=majority
```

## Build Settings:
- Build Command: `npm run build`
- Start Command: `npm start`
- Node Version: 18

## Health Check:
- Path: `/health`
- Timeout: 30 seconds

## Auto Deploy:
- ✅ Enabled
- Trigger: On Commit

## Dockerfile Path:
- `./Dockerfile` (ya está configurado)

## Pre-Deploy Command:
- (dejar vacío)

## Docker Command:
- (dejar vacío, usa el CMD del Dockerfile)