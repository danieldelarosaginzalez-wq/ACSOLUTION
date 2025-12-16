const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Estado del backend
let backendReady = false;

// Proxy para API routes al backend (solo si está listo)
app.use('/api', (req, res, next) => {
    if (!backendReady) {
        return res.status(503).json({
            message: 'Backend service is starting...',
            status: 'initializing',
            timestamp: new Date().toISOString()
        });
    }
    next();
}, createProxyMiddleware({
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remover /api del path
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        backendReady = false; // Marcar backend como no disponible
        res.status(503).json({
            message: 'Backend service unavailable',
            status: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ACSOLUTION',
        version: '1.0.0',
        backend: backendReady ? 'ready' : 'starting',
        uptime: process.uptime()
    });
});

// Root endpoint para healthcheck básico
app.get('/', (req, res) => {
    // Si existe el archivo index.html del frontend, servirlo
    const indexPath = path.join(__dirname, 'frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Si no existe, mostrar página de estado
        res.json({
            message: 'ACSOLUTION is running',
            status: 'ok',
            timestamp: new Date().toISOString(),
            backend: backendReady ? 'ready' : 'starting'
        });
    }
});

// Servir la aplicación React para todas las rutas no API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Iniciar el backend en un proceso separado
let backendProcess;

function startBackend() {
    console.log('🚀 Iniciando backend en puerto', BACKEND_PORT);

    // Verificar si el backend está construido
    const backendDistPath = path.join(__dirname, 'backend/dist');
    if (!fs.existsSync(backendDistPath)) {
        console.log('⚠️ Backend no construido, saltando inicio del backend');
        return;
    }

    // Configurar variables de entorno para el backend
    const backendEnv = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: process.env.NODE_ENV || 'production',
        MONGODB_URI: process.env.MONGO_URL ? `${process.env.MONGO_URL}/acsolution` :
            process.env.MONGODB_URI ||
            `mongodb://${process.env.MONGOUSER || 'mongo'}:${process.env.MONGOPASSWORD || 'qAdOhJanqxBedpXUiObHKWkSFoEOCvug'}@${process.env.MONGOHOST || 'mongodb-8ago.railway.internal'}:${process.env.MONGOPORT || '27017'}/acsolution`,
        MONGO_URL: process.env.MONGO_URL,
        MONGOUSER: process.env.MONGOUSER,
        MONGOPASSWORD: process.env.MONGOPASSWORD,
        MONGOHOST: process.env.MONGOHOST,
        MONGOPORT: process.env.MONGOPORT,
        JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret',
        CORS_ORIGIN: `http://localhost:${PORT}`
    };

    backendProcess = spawn('npm', ['run', 'start:prod'], {
        cwd: path.join(__dirname, 'backend'),
        env: backendEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
    });

    backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output}`);

        // Detectar cuando el backend está listo
        if (output.includes('listening on port') || output.includes('Application is running')) {
            backendReady = true;
            console.log('✅ Backend está listo');
        }
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('error', (error) => {
        console.error('❌ Error al iniciar backend:', error);
        backendReady = false;
    });

    backendProcess.on('exit', (code) => {
        console.log(`🔄 Backend terminó con código: ${code}`);
        backendReady = false;

        if (code !== 0 && process.env.NODE_ENV === 'production') {
            console.log('🔄 Reiniciando backend en 10 segundos...');
            setTimeout(startBackend, 10000);
        }
    });
}

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    if (backendProcess) {
        backendProcess.kill('SIGINT');
    }
    process.exit(0);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌟 ACSOLUTION servidor iniciado en puerto ${PORT}`);
    console.log(`📱 Frontend: http://0.0.0.0:${PORT}`);
    console.log(`🔧 API: http://0.0.0.0:${PORT}/api`);
    console.log(`❤️ Health: http://0.0.0.0:${PORT}/health`);

    // Iniciar backend después de un breve delay
    setTimeout(startBackend, 3000);
}).on('error', (err) => {
    console.error('❌ Error al iniciar servidor:', err);
    process.exit(1);
});