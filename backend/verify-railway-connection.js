#!/usr/bin/env node

// Script específico para verificar conexión MongoDB en Railway
const mongoose = require('mongoose');

async function verifyRailwayConnection() {
    console.log('🚀 Verificando conexión MongoDB en Railway...\n');

    // Mostrar variables disponibles
    console.log('📍 Variables de entorno disponibles:');
    console.log('MONGO_URL:', process.env.MONGO_URL ? '✅ Disponible' : '❌ No disponible');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Disponible' : '❌ No disponible');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'No definido');

    // Construir URL de conexión (igual que en app.module.ts)
    const mongoUrl = (process.env.MONGO_URL ? `${process.env.MONGO_URL}/acsolution` : null) ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/acsolution';

    console.log('\n🔗 URL de conexión construida:');
    const safeUrl = mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('URL:', safeUrl);

    if (process.env.MONGO_URL) {
        console.log('✅ Usando MONGO_URL de Railway + base de datos acsolution');
    } else if (process.env.MONGODB_URI) {
        console.log('⚠️ Usando MONGODB_URI como fallback');
    } else {
        console.log('🔧 Usando URL de desarrollo local');
    }

    try {
        console.log('\n🔌 Intentando conectar...');

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 15000, // 15 segundos
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
        });

        console.log('✅ ¡Conexión exitosa!');
        console.log('📊 Estado:', mongoose.connection.readyState);
        console.log('🏷️ Base de datos:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔌 Puerto:', mongoose.connection.port);

        // Probar operación básica
        console.log('\n📋 Probando operaciones básicas...');
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();
        console.log('✅ Servidor MongoDB versión:', serverStatus.version);

        // Listar colecciones
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Colecciones encontradas:', collections.length);

        if (collections.length > 0) {
            console.log('📋 Colecciones:');
            collections.forEach(col => console.log(`   - ${col.name}`));
        } else {
            console.log('ℹ️ No hay colecciones (base de datos nueva)');
        }

        await mongoose.connection.close();
        console.log('\n🔐 Conexión cerrada correctamente');
        console.log('🎉 ¡Todo funciona perfectamente!');

    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message);

        if (error.name === 'MongoServerSelectionError') {
            console.error('\n💡 Posibles soluciones:');
            console.error('1. Verificar que el servicio MongoDB esté ejecutándose en Railway');
            console.error('2. Verificar que las variables MONGO_URL estén configuradas');
            console.error('3. Verificar que el servicio esté conectado correctamente');
            console.error('4. Revisar los logs del servicio MongoDB en Railway');
        } else if (error.name === 'MongoServerError' && error.message.includes('Authentication failed')) {
            console.error('\n💡 Error de autenticación:');
            console.error('1. Verificar credenciales en Railway');
            console.error('2. Regenerar las variables de conexión');
            console.error('3. Verificar que MONGO_URL tenga las credenciales correctas');
        }

        process.exit(1);
    }
}

// Ejecutar verificación
verifyRailwayConnection();