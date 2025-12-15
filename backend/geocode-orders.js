const { MongoClient } = require('mongodb');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

async function geocodeAddress(direccion) {
    try {
        // Construir múltiples queries para Cartagena
        const queries = [
            `${direccion}, Cartagena, Bolivar, Colombia`,
            `${direccion}, Cartagena de Indias, Colombia`,
            `${direccion}, Cartagena, Colombia`,
        ];

        for (const query of queries) {
            console.log(`   🔍 Intentando: "${query}"`);

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

            // Esperar entre intentos
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return null;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🗺️ Geocodificando todas las órdenes de trabajo para Cartagena...\n');

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

        if (ordersWithoutLocation.length === 0) {
            console.log('ℹ️ No hay órdenes para geocodificar');
            return;
        }

        let success = 0;
        let failed = 0;

        for (const order of ordersWithoutLocation) {
            console.log(`\n📋 Orden: ${order.codigo}`);
            console.log(`   Cliente: ${order.cliente}`);
            console.log(`   Dirección: ${order.direccion}`);

            const ubicacion = await geocodeAddress(order.direccion);

            if (ubicacion) {
                await ordersCollection.updateOne(
                    { _id: order._id },
                    { $set: { ubicacion } }
                );

                console.log(`   ✅ Geocodificada: ${ubicacion.lat}, ${ubicacion.lng}`);
                console.log(`   📍 ${ubicacion.direccion_completa}`);
                success++;
            } else {
                console.log(`   ❌ No se pudo geocodificar`);
                failed++;
            }

            // Esperar 2 segundos entre requests (respeto a Nominatim)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n\n📊 Resumen Final:`);
        console.log(`   ✅ Exitosas: ${success}`);
        console.log(`   ❌ Fallidas: ${failed}`);
        console.log(`   📍 Total procesadas: ${ordersWithoutLocation.length}`);

        if (success > 0) {
            console.log(`\n🎉 ¡${success} órdenes geocodificadas exitosamente!`);
            console.log(`   Ahora deberían aparecer en el mapa de Cartagena.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();