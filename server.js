const express = require('express');
const path = require('path');
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

// Proxy para API routes al backend
app.use('/api', createProxyMiddleware({
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remover /api del path
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        res.status(503).json({
            message: 'Backend service unavailable',
            status: 'error',
            error: err.message
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
        version: '1.0.0'
    });
});

// Servir la aplicación React para todas las rutas no API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Iniciar el backend en un proceso separado
let backendProcess;

function startBackend() {
    console.log('🚀 Iniciando backend en puerto', BACKEND_PORT);

    // Configurar variables de entorno para el backend
    const backendEnv = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: process.env.NODE_ENV || 'production',
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/acsolution',
        JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret',
        CORS_ORIGIN: `http://localhost:${PORT}`
    };

    backendProcess = spawn('npm', ['run', 'start:prod'], {
        cwd: path.join(__dirname, 'backend'),
        env: backendEnv,
        stdio: ['inherit', 'inherit', 'inherit'],
        shell: true
    });

    backendProcess.on('error', (error) => {
        console.error('❌ Error al iniciar backend:', error);
    });

    backendProcess.on('exit', (code) => {
        console.log(`🔄 Backend terminó con código: ${code}`);
        if (code !== 0 && process.env.NODE_ENV === 'production') {
            console.log('🔄 Reiniciando backend en 5 segundos...');
            setTimeout(startBackend, 5000);
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
app.listen(PORT, () => {
    console.log(`🌟 ACSOLUTION servidor iniciado en puerto ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);

    // Iniciar backend después de un breve delay
    setTimeout(startBackend, 2000);
});