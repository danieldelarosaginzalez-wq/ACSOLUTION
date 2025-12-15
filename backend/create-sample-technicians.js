const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

const sampleTechnicians = [
    {
        nombre: 'Carlos Mendoza',
        email: 'carlos.mendoza@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 300 123 4567',
        especialidad: 'Aire Acondicionado',
        ubicacion_actual: {
            lat: 10.4153, // Bocagrande
            lng: -75.5510,
            timestamp: new Date(),
            accuracy: 10
        }
    },
    {
        nombre: 'Ana Rodriguez',
        email: 'ana.rodriguez@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 301 234 5678',
        especialidad: 'Sistemas Eléctricos',
        ubicacion_actual: {
            lat: 10.4120, // Manga
            lng: -75.5386,
            timestamp: new Date(),
            accuracy: 15
        }
    },
    {
        nombre: 'Miguel Santos',
        email: 'miguel.santos@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 302 345 6789',
        especialidad: 'Plomería',
        ubicacion_actual: {
            lat: 10.4236, // Centro Histórico
            lng: -75.5508,
            timestamp: new Date(),
            accuracy: 8
        }
    },
    {
        nombre: 'Laura Gutierrez',
        email: 'laura.gutierrez@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 303 456 7890',
        especialidad: 'Refrigeración',
        ubicacion_actual: {
            lat: 10.4466, // Crespo
            lng: -75.5185,
            timestamp: new Date(),
            accuracy: 12
        }
    },
    {
        nombre: 'Roberto Vargas',
        email: 'roberto.vargas@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 304 567 8901',
        especialidad: 'Mantenimiento General',
        ubicacion_actual: {
            lat: 10.3819, // Pedro de Heredia
            lng: -75.4655,
            timestamp: new Date(),
            accuracy: 20
        }
    }
];

async function main() {
    console.log('👷 Creando técnicos de ejemplo para Cartagena...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const usersCollection = db.collection('users');

        // Verificar si ya existen técnicos
        const existingTechnicians = await usersCollection.countDocuments({ rol: 'tecnico' });
        console.log(`📊 Técnicos existentes: ${existingTechnicians}`);

        if (existingTechnicians > 0) {
            console.log('ℹ️ Ya existen técnicos. Actualizando ubicaciones...\n');

            // Solo actualizar ubicaciones de técnicos existentes
            for (const tech of sampleTechnicians) {
                const result = await usersCollection.updateOne(
                    { email: tech.email },
                    { $set: { ubicacion_actual: tech.ubicacion_actual } }
                );

                if (result.matchedCount > 0) {
                    console.log(`📍 Ubicación actualizada: ${tech.nombre}`);
                    console.log(`   ${tech.ubicacion_actual.lat}, ${tech.ubicacion_actual.lng}\n`);
                }
            }
        } else {
            console.log('👷 Creando nuevos técnicos...\n');

            // Crear nuevos técnicos
            for (const tech of sampleTechnicians) {
                const hashedPassword = await bcrypt.hash(tech.password, 10);

                await usersCollection.insertOne({
                    ...tech,
                    password: hashedPassword,
                    _id: new ObjectId(),
                    fecha_creacion: new Date()
                });

                console.log(`✅ Creado: ${tech.nombre}`);
                console.log(`   📧 ${tech.email}`);
                console.log(`   🔧 ${tech.especialidad}`);
                console.log(`   📍 ${tech.ubicacion_actual.lat}, ${tech.ubicacion_actual.lng}\n`);
            }
        }

        // Resumen final
        const finalTechCount = await usersCollection.countDocuments({ rol: 'tecnico' });
        const techsWithLocation = await usersCollection.countDocuments({
            rol: 'tecnico',
            ubicacion_actual: { $exists: true }
        });

        console.log(`📊 Resumen final:`);
        console.log(`   👷 Total técnicos: ${finalTechCount}`);
        console.log(`   📍 Con ubicación: ${techsWithLocation}`);
        console.log(`   🗺️ Listos para el mapa: ${techsWithLocation}`);

        if (techsWithLocation > 0) {
            console.log('\n🎉 ¡Técnicos listos para aparecer en el mapa de Cartagena!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();