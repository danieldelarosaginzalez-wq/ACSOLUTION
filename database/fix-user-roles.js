const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ises_isea';

async function fixUserRoles() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para arreglar roles');

        const db = client.db(dbName);
        const usersCollection = db.collection('users');

        // Actualizar roles basado en email
        const updates = [
            {
                filter: { email: 'analista@ises.com' },
                update: { $set: { role: 'analista' } }
            },
            {
                filter: { email: 'tecnico@ises.com' },
                update: { $set: { role: 'tecnico' } }
            },
            {
                filter: { email: 'admin@ises.com' },
                update: { $set: { role: 'analista_inventario_oculto' } }
            }
        ];

        for (const { filter, update } of updates) {
            const result = await usersCollection.updateOne(filter, update);
            console.log(`✅ Actualizado usuario ${filter.email}: ${result.modifiedCount} documento(s)`);
        }

        // Crear técnicos adicionales con roles correctos
        const tecnicos = [
            {
                nombre: 'Carlos Mendoza',
                email: 'carlos.mendoza@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', // tecnico123
                role: 'tecnico',
                especialidad: 'Fontanería General',
                telefono: '+57 300 123 4567',
                activo: true,
                ubicacion_actual: {
                    type: 'Point',
                    coordinates: [-75.5148, 10.4236]
                }
            },
            {
                nombre: 'Ana Rodriguez',
                email: 'ana.rodriguez@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'tecnico',
                especialidad: 'Instalaciones Domiciliarias',
                telefono: '+57 300 234 5678',
                activo: true,
                ubicacion_actual: {
                    type: 'Point',
                    coordinates: [-75.5386, 10.4120]
                }
            },
            {
                nombre: 'Miguel Santos',
                email: 'miguel.santos@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'tecnico',
                especialidad: 'Reparaciones de Red',
                telefono: '+57 300 345 6789',
                activo: true,
                ubicacion_actual: {
                    type: 'Point',
                    coordinates: [-75.5508, 10.4236]
                }
            },
            {
                nombre: 'Laura Gutierrez',
                email: 'laura.gutierrez@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'tecnico',
                especialidad: 'Medidores y Acometidas',
                telefono: '+57 300 456 7890',
                activo: true,
                ubicacion_actual: {
                    type: 'Point',
                    coordinates: [-75.5185, 10.4466]
                }
            },
            {
                nombre: 'Roberto Vargas',
                email: 'roberto.vargas@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'tecnico',
                especialidad: 'Mantenimiento Preventivo',
                telefono: '+57 300 567 8901',
                activo: true,
                ubicacion_actual: {
                    type: 'Point',
                    coordinates: [-75.4655, 10.3819]
                }
            },
            {
                nombre: 'Sofia Martinez',
                email: 'sofia.martinez@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'bodeguero',
                especialidad: 'Gestión de Inventarios',
                telefono: '+57 300 678 9012',
                activo: true
            },
            {
                nombre: 'Diego Herrera',
                email: 'diego.herrera@aguascartagena.com',
                password: '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q',
                role: 'analista',
                especialidad: 'Análisis de Operaciones',
                telefono: '+57 300 789 0123',
                activo: true
            }
        ];

        // Insertar técnicos adicionales
        const insertResult = await usersCollection.insertMany(tecnicos);
        console.log(`✅ Insertados ${insertResult.insertedCount} usuarios adicionales`);

        // Verificar resultado final
        const allUsers = await usersCollection.find({}).toArray();
        console.log('\n📊 USUARIOS FINALES:');
        console.log('='.repeat(50));

        const roleCount = {};
        allUsers.forEach(user => {
            roleCount[user.role] = (roleCount[user.role] || 0) + 1;
            console.log(`👤 ${user.nombre} - ${user.role} (${user.email})`);
        });

        console.log('\n📈 RESUMEN POR ROLES:');
        console.log('='.repeat(30));
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`${role}: ${count} usuarios`);
        });

        console.log(`\n✅ Total usuarios: ${allUsers.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

fixUserRoles();