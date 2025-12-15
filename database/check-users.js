const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ises_isea';

async function checkUsers() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db(dbName);
        const users = await db.collection('users').find({}).toArray();

        console.log(`\n👥 Total usuarios encontrados: ${users.length}`);
        console.log('\n📋 Lista de usuarios:');
        console.log('='.repeat(60));

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.nombre || user.name || 'Sin nombre'}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🎭 Rol: ${user.role}`);
            console.log(`   🆔 ID: ${user._id}`);
            console.log('');
        });

        // Contar por roles
        const roleCount = {};
        users.forEach(user => {
            roleCount[user.role] = (roleCount[user.role] || 0) + 1;
        });

        console.log('📊 Usuarios por rol:');
        console.log('='.repeat(30));
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`${role}: ${count}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

checkUsers();