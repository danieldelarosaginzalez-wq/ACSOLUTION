const axios = require('axios');

async function testGeocode(direccion) {
    try {
        console.log(`\n🔍 Probando: "${direccion}"`);

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: `${direccion}, Cartagena, Bolivar, Colombia`,
                format: 'json',
                limit: 1,
                countrycodes: 'co',
            },
            headers: {
                'User-Agent': 'ServiceOps-Pro/1.0',
            },
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            console.log(`✅ Éxito: ${result.lat}, ${result.lon}`);
            console.log(`   ${result.display_name}`);
            return { lat: result.lat, lng: result.lon };
        } else {
            console.log(`❌ No encontrado`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🗺️ Probando geocodificación para Cartagena, Colombia\n');

    const testAddresses = [
        'Calle 30 #45-67',
        'Carrera 5 #10-20',
        'Bocagrande',
        'Centro Historico',
        'Manga',
        'Avenida Pedro de Heredia',
    ];

    for (const address of testAddresses) {
        await testGeocode(address);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

main();
