const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// API routes - proxy al backend
app.use('/api', (req, res) => {
    // En producción, el backend debería estar corriendo en un puerto diferente
    // Por ahora, redirigimos todas las peticiones API
    res.status(503).json({
        message: 'Backend service starting...',
        status: 'initializing'
    });
});

// Servir la aplicación React para todas las rutas no API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Iniciar el backend en un proceso separado
let backendProcess;

function startBackend() {
    console.log('🚀 Iniciando backend...');

    backendProcess = spawn('npm', ['run', 'start:prod'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
        shell: true
    });

    backendProcess.on('error', (error) => {
        console.error('❌ Error al iniciar backend:', error);
    });

    backendProcess.on('exit', (code) => {
        console.log(`🔄 Backend terminó con código: ${code}`);
        if (code !== 0) {
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