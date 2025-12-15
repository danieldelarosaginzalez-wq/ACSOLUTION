const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://localhost:27017/ises_isea';

async function main() {
    console.log('🔧 Corrigiendo contraseñas en la base de datos...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const usersCollection = db.collection('users');

        // Buscar usuarios que tengan 'password' en lugar de 'password_hash'
        const usersWithOldPassword = await usersCollection.find({
            password: { $exists: true },
            password_hash: { $exists: false }
        }).toArray();

        console.log(`🔍 Encontrados ${usersWithOldPassword.length} usuarios con contraseñas a corregir\n`);

        for (const user of usersWithOldPassword) {
            console.log(`🔧 Corrigiendo usuario: ${user.email}`);

            // Si la contraseña ya está hasheada (empieza con $2b$), solo cambiar el campo
            if (user.password && user.password.startsWith('$2b$')) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { password_hash: user.password },
                        $unset: { password: "" }
                    }
                );
                console.log(`   ✅ Movido hash existente`);
            } else {
                // Si no está hasheada, hashearla
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { password_hash: hashedPassword },
                        $unset: { password: "" }
                    }
                );
                console.log(`   ✅ Contraseña hasheada y actualizada`);
            }
        }

        // Verificar resultado
        const totalUsers = await usersCollection.countDocuments();
        const usersWithHash = await usersCollection.countDocuments({
            password_hash: { $exists: true }
        });

        console.log(`\n📊 Resultado:`);
        console.log(`   👥 Total usuarios: ${totalUsers}`);
        console.log(`   🔒 Con password_hash: ${usersWithHash}`);

        if (usersWithHash === totalUsers) {
            console.log('\n🎉 ¡Todas las contraseñas están corregidas!');
            console.log('   Ahora el login debería funcionar correctamente.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();