// Script para crear usuarios de prueba en MongoDB
// Ejecutar con: node create-users.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://localhost:27017/ises_isea?replicaSet=rs0';

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
        await usersCollection.deleteMany({});
        console.log('✓ Usuarios anteriores eliminados');

        // Crear usuarios con contraseñas hasheadas
        for (const user of users) {
            const password_hash = await bcrypt.hash(user.password, 10);

            await usersCollection.insertOne({
                nombre: user.nombre,
                email: user.email,
                password_hash: password_hash,
                rol: user.rol,
                estado: user.estado,
                created_at: new Date()
            });

            console.log(`✓ Usuario creado: ${user.email} (password: ${user.password})`);
        }

        console.log('\n=== USUARIOS CREADOS EXITOSAMENTE ===\n');
        console.log('Credenciales de acceso:\n');

        users.forEach(user => {
            console.log(`${user.rol.toUpperCase()}:`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Password: ${user.password}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

createUsers();
