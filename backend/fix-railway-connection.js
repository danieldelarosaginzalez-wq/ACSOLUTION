#!/usr/bin/env node

// Script para construir la URL de MongoDB usando variables individuales de Railway
const mongoose = require('mongoose');

function buildMongoUrl() {
    console.log('🔧 Construyendo URL de MongoDB desde variables individuales...\n');

    // Variables que Railway proporciona individualmente
    const mongoUser = process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME || 'mongo';
    const mongoPassword = process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD || 'qAdOhJanqxBedpXUiObHKWkSFoEOCvug';
    const mongoHost = process.env.MONGOHOST || process.env.RAILWAY_PRIVATE_DOMAIN || 'mongodb-8ago.railway.internal';
    const mongoPort = process.env.MONGOPORT || '27017';
    const database = 'acsolution';

    console.log('📍 Variables detectadas:');
    console.log('MONGOUSER:', mongoUser);
    console.log('MONGOPASSWORD:', mongoPassword ? '***' : 'No definida');
    console.log('MONGOHOST:', mongoHost);
    console.log('MONGOPORT:', mongoPort);
    console.log('DATABASE:', database);

    // Construir URL
    const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${database}`;

    console.log('\n🔗 URL construida:');
    console.log('URL:', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    return mongoUrl;
}

async function testConnection() {
    const mongoUrl = buildMongoUrl();

    try {
        console.log('\n🔌 Probando conexión...');

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
        });

        console.log('✅ ¡Conexión exitosa!');
        console.log('📊 Estado:', mongoose.connection.readyState);
        console.log('🏷️ Base de datos:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔌 Puerto:', mongoose.connection.port);

        // Probar operación
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Colecciones:', collections.length);

        await mongoose.connection.close();
        console.log('\n🎉 ¡Conexión exitosa con variables individuales!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Problema de DNS - verificar MONGOHOST');
        } else if (error.message.includes('Authentication failed')) {
            console.error('💡 Problema de credenciales - verificar MONGOUSER/MONGOPASSWORD');
        }

        console.error('\n🔍 Variables de entorno disponibles:');
        console.error('MONGO_URL:', process.env.MONGO_URL ? 'Disponible' : 'No disponible');
        console.error('MONGODB_URI:', process.env.MONGODB_URI ? 'Disponible' : 'No disponible');
        console.error('MONGOUSER:', process.env.MONGOUSER ? 'Disponible' : 'No disponible');
        console.error('MONGOPASSWORD:', process.env.MONGOPASSWORD ? 'Disponible' : 'No disponible');
        console.error('MONGOHOST:', process.env.MONGOHOST ? 'Disponible' : 'No disponible');
        console.error('RAILWAY_PRIVATE_DOMAIN:', process.env.RAILWAY_PRIVATE_DOMAIN ? 'Disponible' : 'No disponible');
    }
}

// Ejecutar test
testConnection();