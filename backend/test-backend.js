const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testBackend() {
    console.log('🧪 Probando Backend ServiceOps Pro...\n');

    try {
        // Test 1: Health check básico
        console.log('1. 🏥 Health Check...');
        try {
            const response = await axios.get(`${BASE_URL}/auth/me`, {
                timeout: 5000,
                validateStatus: () => true // Aceptar cualquier status
            });
            console.log(`   Status: ${response.status} - ${response.status === 401 ? '✅ Auth requerida (correcto)' : '❓ Respuesta inesperada'}`);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('   ❌ Backend no está corriendo en puerto 4000');
                return;
            }
            console.log('   ✅ Backend respondiendo');
        }

        // Test 2: Login con credenciales de prueba
        console.log('\n2. 🔐 Test de Login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'analista@serviceops.com',
                password: 'analista123'
            });

            if (loginResponse.status === 200) {
                console.log('   ✅ Login exitoso');
                const token = loginResponse.data.access_token;

                // Test 3: Dashboard del analista
                console.log('\n3. 📊 Test Dashboard Analista...');
                try {
                    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/analyst`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('   ✅ Dashboard analista funcionando');
                    console.log(`   📈 Total órdenes: ${dashboardResponse.data.stats.total}`);
                } catch (error) {
                    console.log(`   ❌ Error dashboard: ${error.response?.status} - ${error.message}`);
                }

                // Test 4: Datos del mapa
                console.log('\n4. 🗺️ Test Datos del Mapa...');
                try {
                    const mapResponse = await axios.get(`${BASE_URL}/location/map-data`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('   ✅ Datos del mapa funcionando');
                    console.log(`   📍 Órdenes con ubicación: ${mapResponse.data.ordenes.length}`);
                    console.log(`   👷 Técnicos: ${mapResponse.data.tecnicos.length}`);
                } catch (error) {
                    console.log(`   ❌ Error mapa: ${error.response?.status} - ${error.message}`);
                }

                // Test 5: Geocodificación
                console.log('\n5. 🔍 Test Geocodificación...');
                try {
                    const geocodeResponse = await axios.post(`${BASE_URL}/location/geocode`, {
                        direccion: 'Calle 45 #23-67 Bocagrande, Cartagena'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('   ✅ Geocodificación funcionando');
                    if (geocodeResponse.data.lat && geocodeResponse.data.lng) {
                        console.log(`   📍 Coordenadas: ${geocodeResponse.data.lat}, ${geocodeResponse.data.lng}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error geocodificación: ${error.response?.status} - ${error.message}`);
                }

            } else {
                console.log(`   ❌ Login falló: ${loginResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Error login: ${error.response?.status} - ${error.message}`);
        }

    } catch (error) {
        console.log(`❌ Error general: ${error.message}`);
    }

    console.log('\n🏁 Test completado');
}

testBackend();