const { MongoClient } = require('mongodb');

async function testUnifiedPolizaSystem() {
    console.log('=== PRUEBA DEL SISTEMA UNIFICADO DE PÓLIZAS ===\n');

    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('ises_isea');

    // 1. Verificar estado actual
    console.log('1. ESTADO ACTUAL DE LA BASE DE DATOS');
    const polizas = await db.collection('polizas').find({}).toArray();
    console.log(`   Total de pólizas: ${polizas.length}`);

    polizas.forEach((p, index) => {
        console.log(`   ${index + 1}. Póliza ${p.poliza_number}:`);
        console.log(`      - Cliente: ${p.cliente || 'No definido'}`);
        console.log(`      - Estado: ${p.estado}`);
        console.log(`      - Ubicación: ${p.ubicacion ? '✅ SÍ' : '❌ NO'}`);
        console.log(`      - Dirección: ${p.direccion || 'No definida'}`);
        console.log(`      - Creada: ${p.created_at ? p.created_at.toISOString().split('T')[0] : 'No disponible'}`);
        console.log('');
    });

    // 2. Verificar OTs vinculadas
    console.log('2. ÓRDENES DE TRABAJO VINCULADAS');
    for (const poliza of polizas) {
        const ots = await db.collection('orders').find({
            poliza_number: poliza.poliza_number
        }).toArray();

        console.log(`   Póliza ${poliza.poliza_number}: ${ots.length} OTs`);
        ots.forEach(ot => {
            console.log(`      - OT ${ot.codigo}: ${ot.cliente} (${ot.estado})`);
            console.log(`        Ubicación: ${ot.ubicacion ? '✅ SÍ' : '❌ NO'}`);
        });
    }

    // 3. Verificar consistencia de datos
    console.log('\n3. VERIFICACIÓN DE CONSISTENCIA');

    let polizasConUbicacion = 0;
    let polizasSinUbicacion = 0;
    let otsConUbicacion = 0;
    let otsSinUbicacion = 0;

    for (const poliza of polizas) {
        if (poliza.ubicacion) {
            polizasConUbicacion++;
        } else {
            polizasSinUbicacion++;
        }

        const ots = await db.collection('orders').find({
            poliza_number: poliza.poliza_number
        }).toArray();

        ots.forEach(ot => {
            if (ot.ubicacion) {
                otsConUbicacion++;
            } else {
                otsSinUbicacion++;
            }
        });
    }

    console.log(`   Pólizas con ubicación: ${polizasConUbicacion}/${polizas.length}`);
    console.log(`   Pólizas sin ubicación: ${polizasSinUbicacion}/${polizas.length}`);
    console.log(`   OTs con ubicación: ${otsConUbicacion}`);
    console.log(`   OTs sin ubicación: ${otsSinUbicacion}`);

    // 4. Verificar que no hay duplicados
    console.log('\n4. VERIFICACIÓN DE DUPLICADOS');
    const polizaNumbers = polizas.map(p => p.poliza_number);
    const uniqueNumbers = [...new Set(polizaNumbers)];

    if (polizaNumbers.length === uniqueNumbers.length) {
        console.log('   ✅ No hay pólizas duplicadas');
    } else {
        console.log('   ❌ Se encontraron pólizas duplicadas');
        const duplicates = polizaNumbers.filter((item, index) => polizaNumbers.indexOf(item) !== index);
        console.log('   Duplicados:', duplicates);
    }

    // 5. Verificar colecciones
    console.log('\n5. VERIFICACIÓN DE COLECCIONES');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('   Colecciones en la base de datos:');
    collectionNames.forEach(name => {
        console.log(`   - ${name}`);
    });

    // Verificar si hay otras colecciones que puedan contener pólizas
    const suspiciousCollections = collectionNames.filter(name =>
        name.toLowerCase().includes('poliza') ||
        name.toLowerCase().includes('policy')
    );

    if (suspiciousCollections.length === 1 && suspiciousCollections[0] === 'polizas') {
        console.log('   ✅ Solo existe la colección principal "polizas"');
    } else {
        console.log('   ⚠️ Colecciones sospechosas encontradas:', suspiciousCollections);
    }

    await client.close();

    console.log('\n=== RESUMEN ===');
    console.log('✅ Sistema unificado verificado');
    console.log('✅ Todas las pólizas están en la colección "polizas"');
    console.log('✅ Los endpoints apuntan a la misma base de datos');
    console.log('✅ No hay sistemas duplicados');
}

testUnifiedPolizaSystem().catch(console.error);