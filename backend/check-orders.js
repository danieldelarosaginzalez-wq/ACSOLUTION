const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

async function main() {
    console.log('🔍 Verificando órdenes en la base de datos...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const ordersCollection = db.collection('orders');

        // Contar todas las órdenes
        const totalOrders = await ordersCollection.countDocuments();
        console.log(`📊 Total de órdenes: ${totalOrders}`);

        if (totalOrders === 0) {
            console.log('❌ No hay órdenes en la base de datos');
            console.log('💡 Necesitas crear algunas órdenes primero');
            return;
        }

        // Contar órdenes con ubicación
        const ordersWithLocation = await ordersCollection.countDocuments({
            ubicacion: { $exists: true, $ne: null }
        });

        // Contar órdenes sin ubicación
        const ordersWithoutLocation = await ordersCollection.countDocuments({
            $or: [
                { ubicacion: { $exists: false } },
                { ubicacion: null }
            ]
        });

        console.log(`📍 Órdenes con ubicación: ${ordersWithLocation}`);
        console.log(`❓ Órdenes sin ubicación: ${ordersWithoutLocation}`);

        // Mostrar algunas órdenes de ejemplo
        console.log('\n📋 Primeras 5 órdenes:');
        const sampleOrders = await ordersCollection.find({}).limit(5).toArray();

        sampleOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. ${order.codigo}`);
            console.log(`   Cliente: ${order.cliente}`);
            console.log(`   Dirección: ${order.direccion || 'Sin dirección'}`);
            console.log(`   Ubicación: ${order.ubicacion ? `${order.ubicacion.lat}, ${order.ubicacion.lng}` : 'Sin ubicación'}`);
            console.log(`   Estado: ${order.estado}`);
        });

        // Verificar si hay órdenes con dirección pero sin ubicación
        const ordersWithAddressNoLocation = await ordersCollection.find({
            direccion: { $exists: true, $ne: '' },
            $or: [
                { ubicacion: { $exists: false } },
                { ubicacion: null }
            ]
        }).toArray();

        if (ordersWithAddressNoLocation.length > 0) {
            console.log(`\n🔧 ${ordersWithAddressNoLocation.length} órdenes tienen dirección pero no ubicación:`);
            ordersWithAddressNoLocation.forEach(order => {
                console.log(`   - ${order.codigo}: "${order.direccion}"`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();