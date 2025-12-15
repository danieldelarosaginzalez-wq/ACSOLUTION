const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// URI correcta de tu aplicación
const MONGODB_URI = 'mongodb://localhost:27017/ises_isea';

const sampleOrders = [
    {
        codigo: 'OT-2024-001',
        cliente: 'Hotel Caribe',
        direccion: 'Carrera 1 #2-87 Bocagrande',
        poliza_number: '123456',
        tipo_trabajo: 'instalacion',
        descripcion: 'Instalación de sistema de aire acondicionado en suite presidencial',
        estado: 'creada',
        fecha_creacion: new Date(),
        ubicacion: {
            lat: 10.4153147,
            lng: -75.5509712,
            direccion_completa: 'Carrera 1, Bocagrande, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    {
        codigo: 'OT-2024-002',
        cliente: 'Restaurante La Mulata',
        direccion: 'Plaza de los Coches, Centro Historico',
        poliza_number: '123457',
        tipo_trabajo: 'mantenimiento',
        descripcion: 'Mantenimiento preventivo de sistema de refrigeración',
        estado: 'asignada',
        fecha_creacion: new Date(),
        ubicacion: {
            lat: 10.4236,
            lng: -75.5508,
            direccion_completa: 'Plaza de los Coches, Centro Histórico, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    {
        codigo: 'OT-2024-003',
        cliente: 'Edificio Manga Plaza',
        direccion: 'Calle 25 #15-30 Manga',
        poliza_number: '123458',
        tipo_trabajo: 'reparacion',
        descripcion: 'Reparación de bomba de agua en el piso 8',
        estado: 'en_proceso',
        fecha_creacion: new Date(),
        ubicacion: {
            lat: 10.4119972,
            lng: -75.5386341,
            direccion_completa: 'Calle 25, Manga, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    {
        codigo: 'OT-2024-004',
        cliente: 'Centro Comercial La Serrezuela',
        direccion: 'Avenida Pedro de Heredia #31-50',
        poliza_number: '123459',
        tipo_trabajo: 'instalacion',
        descripcion: 'Instalación de sistema de ventilación en food court',
        estado: 'creada',
        fecha_creacion: new Date(),
        ubicacion: {
            lat: 10.3818755,
            lng: -75.4655424,
            direccion_completa: 'Avenida Pedro de Heredia, San Fernando, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    },
    {
        codigo: 'OT-2024-005',
        cliente: 'Residencias Crespo',
        direccion: 'Carrera 5 #18-45 Crespo',
        poliza_number: '123460',
        tipo_trabajo: 'mantenimiento',
        descripcion: 'Mantenimiento de sistema eléctrico en lobby',
        estado: 'creada',
        fecha_creacion: new Date(),
        ubicacion: {
            lat: 10.44655,
            lng: -75.5185115,
            direccion_completa: 'Carrera 5, Crespo, Cartagena de Indias, Bolívar, Colombia',
            geocoded: true,
            geocoded_at: new Date()
        }
    }
];

const sampleTechnicians = [
    {
        nombre: 'Carlos Mendoza',
        email: 'carlos.mendoza@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 300 123 4567',
        ubicacion_actual: {
            lat: 10.4153,
            lng: -75.5510,
            timestamp: new Date(),
            accuracy: 10
        }
    },
    {
        nombre: 'Ana Rodriguez',
        email: 'ana.rodriguez@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 301 234 5678',
        ubicacion_actual: {
            lat: 10.4120,
            lng: -75.5386,
            timestamp: new Date(),
            accuracy: 15
        }
    },
    {
        nombre: 'Miguel Santos',
        email: 'miguel.santos@serviceops.com',
        password: 'tecnico123',
        rol: 'tecnico',
        estado: 'activo',
        telefono: '+57 302 345 6789',
        ubicacion_actual: {
            lat: 10.4236,
            lng: -75.5508,
            timestamp: new Date(),
            accuracy: 8
        }
    }
];

async function main() {
    console.log('🗺️ Configurando datos de Cartagena en la base de datos correcta...\n');
    console.log(`📍 Base de datos: ${MONGODB_URI}\n`);

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB (ises_isea)\n');

        const db = client.db();

        // 1. Crear un usuario analista si no existe
        const usersCollection = db.collection('users');
        const existingAnalyst = await usersCollection.findOne({ email: 'analista@serviceops.com' });

        if (!existingAnalyst) {
            const hashedPassword = await bcrypt.hash('analista123', 10);
            const analystId = new ObjectId();

            await usersCollection.insertOne({
                _id: analystId,
                nombre: 'Analista Principal',
                email: 'analista@serviceops.com',
                password_hash: hashedPassword,
                rol: 'analista',
                estado: 'activo',
                fecha_creacion: new Date()
            });

            console.log('✅ Usuario analista creado: analista@serviceops.com / analista123');
        } else {
            console.log('ℹ️ Usuario analista ya existe');
        }

        // 2. Obtener el ID del analista
        const analyst = await usersCollection.findOne({ email: 'analista@serviceops.com' });
        const analystId = analyst._id;

        // 3. Crear técnicos
        console.log('\n👷 Creando técnicos...');
        for (const tech of sampleTechnicians) {
            const existing = await usersCollection.findOne({ email: tech.email });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(tech.password, 10);
                const { password, ...techData } = tech;
                await usersCollection.insertOne({
                    ...techData,
                    _id: new ObjectId(),
                    password_hash: hashedPassword,
                    fecha_creacion: new Date()
                });
                console.log(`✅ Técnico creado: ${tech.nombre}`);
            } else {
                // Actualizar ubicación
                await usersCollection.updateOne(
                    { email: tech.email },
                    { $set: { ubicacion_actual: tech.ubicacion_actual } }
                );
                console.log(`📍 Ubicación actualizada: ${tech.nombre}`);
            }
        }

        // 4. Crear órdenes
        console.log('\n📋 Creando órdenes...');
        const ordersCollection = db.collection('orders');

        for (const order of sampleOrders) {
            const existing = await ordersCollection.findOne({ codigo: order.codigo });
            if (!existing) {
                await ordersCollection.insertOne({
                    ...order,
                    _id: new ObjectId(),
                    analista_id: analystId
                });
                console.log(`✅ Orden creada: ${order.codigo} - ${order.cliente}`);
                console.log(`   📍 ${order.ubicacion.lat}, ${order.ubicacion.lng}`);
            } else {
                // Actualizar ubicación si no la tiene
                if (!existing.ubicacion) {
                    await ordersCollection.updateOne(
                        { codigo: order.codigo },
                        { $set: { ubicacion: order.ubicacion } }
                    );
                    console.log(`📍 Ubicación agregada: ${order.codigo}`);
                } else {
                    console.log(`ℹ️ Orden ya existe: ${order.codigo}`);
                }
            }
        }

        // 5. Resumen final
        const totalOrders = await ordersCollection.countDocuments();
        const ordersWithLocation = await ordersCollection.countDocuments({
            ubicacion: { $exists: true, $ne: null }
        });
        const totalTechs = await usersCollection.countDocuments({ rol: 'tecnico' });
        const techsWithLocation = await usersCollection.countDocuments({
            rol: 'tecnico',
            ubicacion_actual: { $exists: true }
        });

        console.log('\n📊 Resumen Final:');
        console.log(`   📋 Órdenes totales: ${totalOrders}`);
        console.log(`   🗺️ Órdenes con ubicación: ${ordersWithLocation}`);
        console.log(`   👷 Técnicos totales: ${totalTechs}`);
        console.log(`   📍 Técnicos con ubicación: ${techsWithLocation}`);

        if (ordersWithLocation > 0 && techsWithLocation > 0) {
            console.log('\n🎉 ¡Datos de Cartagena configurados exitosamente!');
            console.log('   El mapa debería mostrar las órdenes y técnicos en Cartagena.');
            console.log('\n🔑 Credenciales de acceso:');
            console.log('   📧 Email: analista@serviceops.com');
            console.log('   🔒 Password: analista123');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

main();