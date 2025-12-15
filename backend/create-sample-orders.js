const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceops';

const sampleOrders = [
    {
        codigo: 'OT-2024-001',
        cliente: 'Hotel Caribe',
        direccion: 'Carrera 1 #2-87 Bocagrande',
        poliza_number: 'POL-001-2024',
        tipo_trabajo: 'instalacion',
        descripcion: 'Instalación de sistema de aire acondicionado en suite presidencial',
        estado: 'creada',
        fecha_creacion: new Date(),
        prioridad: 'alta'
    },
    {
        codigo: 'OT-2024-002',
        cliente: 'Restaurante La Mulata',
        direccion: 'Calle de la Factoria #36-57 Centro Historico',
        poliza_number: 'POL-002-2024',
        tipo_trabajo: 'mantenimiento',
        descripcion: 'Mantenimiento preventivo de sistema de refrigeración',
        estado: 'asignada',
        fecha_creacion: new Date(),
        prioridad: 'media'
    },
    {
        codigo: 'OT-2024-003',
        cliente: 'Edificio Manga Plaza',
        direccion: 'Calle 25 #15-30 Manga',
        poliza_number: 'POL-003-2024',
        tipo_trabajo: 'reparacion',
        descripcion: 'Reparación de bomba de agua en el piso 8',
        estado: 'en_proceso',
        fecha_creacion: new Date(),
        prioridad: 'alta'
    },
    {
        codigo: 'OT-2024-004',
        cliente: 'Centro Comercial La Serrezuela',
        direccion: 'Avenida Pedro de Heredia #31-50',
        poliza_number: 'POL-004-2024',
        tipo_trabajo: 'instalacion',
        descripcion: 'Instalación de sistema de ventilación en food court',
        estado: 'creada',
        fecha_creacion: new Date(),
        prioridad: 'media'
    },
    {
        codigo: 'OT-2024-005',
        cliente: 'Residencias Crespo',
        direccion: 'Carrera 5 #18-45 Crespo',
        poliza_number: 'POL-005-2024',
        tipo_trabajo: 'mantenimiento',
        descripcion: 'Mantenimiento de sistema eléctrico en lobby',
        estado: 'creada',
        fecha_creacion: new Date(),
        prioridad: 'baja'
    },
    {
        codigo: 'OT-2024-006',
        cliente: 'Hotel Santa Clara',
        direccion: 'Calle del Torno #39-29 Centro Historico',
        poliza_number: 'POL-006-2024',
        tipo_trabajo: 'reparacion',
        descripcion: 'Reparación urgente de ascensor principal',
        estado: 'asignada',
        fecha_creacion: new Date(),
        prioridad: 'alta'
    },
    {
        codigo: 'OT-2024-007',
        cliente: 'Universidad Tecnológica de Bolívar',
        direccion: 'Km 1 Via Turbaco',
        poliza_number: 'POL-007-2024',
        tipo_trabajo: 'instalacion',
        descripcion: 'Instalación de laboratorio de cómputo',
        estado: 'creada',
        fecha_creacion: new Date(),
        prioridad: 'media'
    },
    {
        codigo: 'OT-2024-008',
        cliente: 'Clínica Madre Bernarda',
        direccion: 'Calle 50 #23-45 Pie de la Popa',
        poliza_number: 'POL-008-2024',
        tipo_trabajo: 'mantenimiento',
        descripcion: 'Mantenimiento de equipos médicos en UCI',
        estado: 'finalizada',
        fecha_creacion: new Date(),
        prioridad: 'alta'
    }
];

async function main() {
    console.log('🏗️ Creando órdenes de ejemplo para Cartagena...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db();
        const ordersCollection = db.collection('orders');

        // Limpiar órdenes existentes (opcional)
        const existingCount = await ordersCollection.countDocuments();
        if (existingCount > 0) {
            console.log(`🗑️ Eliminando ${existingCount} órdenes existentes...`);
            await ordersCollection.deleteMany({});
        }

        // Insertar órdenes de ejemplo
        console.log('📝 Insertando órdenes de ejemplo...\n');

        for (const order of sampleOrders) {
            await ordersCollection.insertOne({
                ...order,
                _id: new ObjectId()
            });

            console.log(`✅ Creada: ${order.codigo} - ${order.cliente}`);
            console.log(`   📍 ${order.direccion}`);
            console.log(`   🏷️ ${order.estado} | ${order.prioridad}\n`);
        }

        console.log(`🎉 ${sampleOrders.length} órdenes creadas exitosamente!`);
        console.log('\n📋 Resumen por estado:');

        const estados = ['creada', 'asignada', 'en_proceso', 'finalizada'];
        for (const estado of estados) {
            const count = sampleOrders.filter(o => o.estado === estado).length;
            if (count > 0) {
                console.log(`   ${estado}: ${count} órdenes`);
            }
        }

        console.log('\n💡 Ahora ejecuta el script de geocodificación para ubicar estas órdenes en el mapa.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();