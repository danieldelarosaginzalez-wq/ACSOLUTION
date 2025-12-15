const axios = require('axios');

async function testPolizaEndpoints() {
    const baseURL = 'http://localhost:3000/api';

    console.log('=== PRUEBA COMPLETA DE ENDPOINTS DE PÓLIZAS ===\n');

    try {
        // 1. Crear una póliza de prueba
        console.log('1. Creando póliza de prueba...');
        const createResponse = await axios.post(baseURL + '/polizas', {
            poliza_number: '600641',
            estado: 'activa',
            cliente: 'Cliente endpoint test',
            direccion: 'Calle de prueba 123'
        }, {
            headers: {
                'Authorization': 'Bearer test-token' // Esto fallará pero veremos el error
            }
        });
        console.log('✅ Póliza creada:', createResponse.data.poliza_number);

    } catch (error) {
        console.log('❌ Error creando póliza:', error.response?.status, error.response?.data?.message || error.message);
    }

    try {
        // 2. Obtener todas las pólizas
        console.log('\n2. Obteniendo todas las pólizas...');
        const allResponse = await axios.get(baseURL + '/polizas/all', {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        console.log('✅ Pólizas encontradas:', allResponse.data.length);

    } catch (error) {
        console.log('❌ Error obteniendo pólizas:', error.response?.status, error.response?.data?.message || error.message);
    }

    try {
        // 3. Obtener póliza específica
        console.log('\n3. Obteniendo póliza específica (600640)...');
        const specificResponse = await axios.get(baseURL + '/polizas/600640');
        console.log('✅ Póliza encontrada:', specificResponse.data.poliza_number);

    } catch (error) {
        console.log('❌ Error obteniendo póliza específica:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n=== VERIFICACIÓN DIRECTA EN BASE DE DATOS ===');

    // Verificar directamente en la base de datos
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('ises_isea');

    const polizas = await db.collection('polizas').find({}).toArray();
    console.log('Pólizas en BD:', polizas.length);
    polizas.forEach(p => {
        console.log(`- ${p.poliza_number}: ${p.cliente} (${p.estado})`);
    });

    await client.close();
}

testPolizaEndpoints().catch(console.error);