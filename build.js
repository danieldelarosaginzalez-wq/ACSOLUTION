#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando proceso de build para ACSOLUTION...');

function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Ejecutando: ${command} ${args.join(' ')} en ${cwd}`);

        const process = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Comando falló con código: ${code}`));
            }
        });

        process.on('error', (error) => {
            reject(error);
        });
    });
}

async function buildProject() {
    try {
        const rootDir = process.cwd();
        const frontendDir = path.join(rootDir, 'frontend');
        const backendDir = path.join(rootDir, 'backend');

        // Verificar que las carpetas existen
        if (!fs.existsSync(frontendDir)) {
            throw new Error('❌ Carpeta frontend no encontrada');
        }
        if (!fs.existsSync(backendDir)) {
            throw new Error('❌ Carpeta backend no encontrada');
        }

        console.log('✅ Carpetas frontend y backend encontradas');

        // Build frontend
        console.log('🎨 Construyendo frontend...');
        await runCommand('npm', ['install'], frontendDir);
        await runCommand('npm', ['run', 'build'], frontendDir);
        console.log('✅ Frontend construido exitosamente');

        // Build backend
        console.log('⚙️ Construyendo backend...');
        await runCommand('npm', ['install', '--legacy-peer-deps'], backendDir);
        await runCommand('npm', ['run', 'build'], backendDir);
        console.log('✅ Backend construido exitosamente');

        console.log('🎉 Build completado exitosamente!');

    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        process.exit(1);
    }
}

buildProject();