#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
    console.log('🔍 Probando conexión a MongoDB...');

    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    console.log('📍 MONGO_URL:', process.env.MONGO_URL ? 'Configurada ✅' : 'No configurada ❌');
    console.log('📍 MONGODB_URI:', process.env.MONGODB_URI ? 'Configurada ✅' : 'No configurada ❌');

    if (!mongoUrl) {
        console.error('❌ Ni MONGO_URL ni MONGODB_URI están configuradas');
        process.exit(1);
    }

    console.log('🔗 Usando URL:', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    try {
        console.log('🔌 Conectando a MongoDB...');

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 10000, // 10 segundos timeout
            socketTimeoutMS: 45000, // 45 segundos socket timeout
        });

        console.log('✅ Conexión exitosa a MongoDB');
        console.log('📊 Estado de la conexión:', mongoose.connection.readyState);
        console.log('🏷️ Base de datos:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔌 Puerto:', mongoose.connection.port);

        // Probar una operación básica
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Colecciones disponibles:', collections.length);

        if (collections.length > 0) {
            console.log('📋 Nombres de colecciones:');
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }

        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔐 Conexión cerrada correctamente');

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);

        if (error.name === 'MongoServerSelectionError') {
            console.error('💡 Posibles causas:');
            console.error('   - Credenciales incorrectas');
            console.error('   - Servidor MongoDB no disponible');
            console.error('   - Problemas de red/firewall');
            console.error('   - URI de conexión malformada');
        }

        process.exit(1);
    }
}

// Ejecutar test
testMongoConnection();