const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

// Direcciones mejoradas para las órdenes que fallaron
const fixedAddresses = {
    'OT-2024-002': {
        direccion: 'Plaza de los Coches, Centro Historico, Cartagena',
        ubicacion: {
            lat: 10.4236,
            lng: -75.5508,
            direccion_completa: 'Plaza de los Coches, Centro Histórico, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    'OT-2024-006': {
        direccion: 'Calle del Torno, Centro Historico, Cartagena',
        ubicacion: {
            lat: 10.4242,
            lng: -75.5512,
            direccion_completa: 'Calle del Torno, Centro Histórico, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    'OT-2024-008': {
        direccion: 'Cerro de la Popa, Cartagena',
        ubicacion: {
            lat: 10.4089,
            lng: -75.5267,
            direccion_completa: 'Cerro de la Popa, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    }
};

async function main() {
    console.log('🔧 Corrigiendo órdenes que fallaron en geocodificación...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const ordersCollection = db.collection('orders');

        for (const [codigo, data] of Object.entries(fixedAddresses)) {
            console.log(`🔧 Corrigiendo orden: ${codigo}`);
            console.log(`   Nueva dirección: ${data.direccion}`);
            console.log(`   Ubicación: ${data.ubicacion.lat}, ${data.ubicacion.lng}`);

            await ordersCollection.updateOne(
                { codigo },
                {
                    $set: {
                        direccion: data.direccion,
                        ubicacion: data.ubicacion
                    }
                }
            );

            console.log(`   ✅ Actualizada\n`);
        }

        // Verificar el resultado final
        const totalOrders = await ordersCollection.countDocuments();
        const ordersWithLocation = await ordersCollection.countDocuments({
            ubicacion: { $exists: true, $ne: null }
        });

        console.log(`📊 Resultado final:`);
        console.log(`   📍 Total de órdenes: ${totalOrders}`);
        console.log(`   🗺️ Órdenes con ubicación: ${ordersWithLocation}`);
        console.log(`   ✅ Porcentaje geocodificado: ${Math.round((ordersWithLocation / totalOrders) * 100)}%`);

        if (ordersWithLocation === totalOrders) {
            console.log('\n🎉 ¡Todas las órdenes están geocodificadas!');
            console.log('   El mapa debería mostrar todas las ubicaciones en Cartagena.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();