// Script para crear usuarios de prueba en MongoDB (sin replica set)
// Ejecutar con: node create-users-simple.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Intentar conectar sin replica set primero
const MONGODB_URI = 'mongodb://localhost:27017/ises_isea';

// Usuarios de prueba
const users = [
    {
        nombre: 'Juan Analista',
        email: 'analista@ises.com',
        password: 'analista123',
        rol: 'analista',
        estado: 'activo'
    },
    {
        nombre: 'Pedro Técnico',
        email: 'tecnico@ises.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo'
    },
    {
        nombre: 'Admin Inventario',
        email: 'admin@ises.com',
        password: 'admin123',
        rol: 'analista_inventario_oculto',
        estado: 'activo'
    }
];

async function createUsers() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✓ Conectado a MongoDB');

        const db = client.db('ises_isea');
        const usersCollection = db.collection('users');

        // Limpiar usuarios existentes (opcional)
        const deleteResult = await usersCollection.deleteMany({});
        console.log(`✓ ${deleteResult.deletedCount} usuarios anteriores eliminados`);

        // Crear usuarios con contraseñas hasheadas
        console.log('\nCreando usuarios...\n');

        for (const user of users) {
            const password_hash = await bcrypt.hash(user.password, 10);

            const result = await usersCollection.insertOne({
                nombre: user.nombre,
                email: user.email,
                password_hash: password_hash,
                rol: user.rol,
                estado: user.estado,
                created_at: new Date()
            });

            console.log(`✓ Usuario creado: ${user.email}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('USUARIOS CREADOS EXITOSAMENTE');
        console.log('='.repeat(50) + '\n');

        console.log('Credenciales de acceso:\n');

        users.forEach(user => {
            console.log(`${user.rol.toUpperCase()}:`);
            console.log(`  Email:    ${user.email}`);
            console.log(`  Password: ${user.password}`);
            console.log('');
        });

        console.log('='.repeat(50));
        console.log('Ahora puedes iniciar el backend y frontend');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nAsegúrate de que MongoDB esté corriendo:');
        console.error('  mongod --port 27017\n');
    } finally {
        await client.close();
    }
}

createUsers();
