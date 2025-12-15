const { MongoClient } = require('mongodb');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

async function geocodeAddress(direccion) {
    try {
        // Construir query mejorado para Cartagena
        const query = `${direccion}, Cartagena, Bolivar, Colombia`;

        console.log(`   🔍 Buscando: "${query}"`);

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                limit: 1,
                countrycodes: 'co',
                addressdetails: 1,
            },
            headers: {
                'User-Agent': 'ServiceOps-Pro/1.0',
            },
            timeout: 5000,
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                direccion_completa: result.display_name,
                geocoded: true,
                geocoded_at: new Date()
            };
        }

        return null;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🗺️ Geocodificando todas las órdenes de trabajo...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const ordersCollection = db.collection('orders');

        // Buscar órdenes sin ubicación
        const ordersWithoutLocation = await ordersCollection.find({
            $or: [
                { ubicacion: { $exists: false } },
                { ubicacion: null }
            ],
            direccion: { $exists: true, $ne: '' }
        }).toArray();

        console.log(`📍 Encontradas ${ordersWithoutLocation.length} órdenes sin ubicación\n`);

        let success = 0;
        let failed = 0;

        for (const order of ordersWithoutLocation) {
            console.log(`\n📋 Orden: ${order.codigo}`);
            console.log(`   Dirección: ${order.direccion}`);

            const ubicacion = await geocodeAddress(order.direccion);

            if (ubicacion) {
                await ordersCollection.updateOne(
                    { _id: order._id },
                    { $set: { ubicacion } }
                );

                console.log(`   ✅ Geocodificada: ${ubicacion.lat}, ${ubicacion.lng}`);
                success++;
            } else {
                console.log(`   ❌ No se pudo geocodificar`);
                failed++;
            }

            // Esperar 1.5 segundos entre requests (respeto a Nominatim)
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log(`\n\n📊 Resumen:`);
        console.log(`   ✅ Exitosas: ${success}`);
        console.log(`   ❌ Fallidas: ${failed}`);
        console.log(`   📍 Total procesadas: ${ordersWithoutLocation.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();
