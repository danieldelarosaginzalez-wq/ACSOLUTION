#!/usr/bin/env node

// Test rápido con las nuevas credenciales de Railway
const mongoose = require('mongoose');

async function testNewCredentials() {
    console.log('🔍 Probando nuevas credenciales de Railway...\n');

    // Simular las variables que Railway proporciona
    const testVars = {
        MONGO_URL: 'mongodb://mongo:qAdOhJanqxBedpXUiObHKWkSFoEOCvug@mongodb-8ago.railway.internal:27017',
        MONGO_PUBLIC_URL: 'mongodb://mongo:qAdOhJanqxBedpXUiObHKWkSFoEOCvug@centerbeam.proxy.rlwy.net:32583'
    };

    console.log('📍 Variables de Railway detectadas:');
    console.log('MONGO_URL:', testVars.MONGO_URL ? '✅ Disponible' : '❌ No disponible');
    console.log('MONGO_PUBLIC_URL:', testVars.MONGO_PUBLIC_URL ? '✅ Disponible' : '❌ No disponible');

    // Construir URL igual que en app.module.ts
    const mongoUrl = `${testVars.MONGO_URL}/acsolution`;
    console.log('\n🔗 URL final que se usará:');
    console.log('URL:', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    try {
        console.log('\n🔌 Intentando conectar...');

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ ¡Conexión exitosa con nuevas credenciales!');
        console.log('📊 Estado:', mongoose.connection.readyState);
        console.log('🏷️ Base de datos:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);

        // Probar operación básica
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Colecciones:', collections.length);

        await mongoose.connection.close();
        console.log('\n🎉 ¡Todo funciona perfectamente con las nuevas credenciales!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('Authentication failed')) {
            console.error('💡 Las credenciales pueden haber cambiado en Railway');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Problema de DNS - normal en desarrollo local');
        }
    }
}

// Solo ejecutar si las variables están disponibles
if (process.env.MONGO_URL || process.argv.includes('--force')) {
    testNewCredentials();
} else {
    console.log('ℹ️ Este script se ejecutará automáticamente en Railway');
    console.log('💡 Para probar localmente: node test-new-credentials.js --force');
}