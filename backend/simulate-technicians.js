const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Coordenadas de Cartagena para simular movimiento
const CARTAGENA_BOUNDS = {
    north: 10.4500,
    south: 10.3500,
    east: -75.4500,
    west: -75.5500
};

// Técnicos simulados (usar IDs reales de tu base de datos)
const TECHNICIANS = [
    {
        id: '6938bb76fcb387b06ebd4fa4', // Reemplaza con IDs reales
        name: 'Carlos Mendoza',
        specialty: 'Aire Acondicionado',
        baseLocation: { lat: 10.3910, lng: -75.4794 } // Centro de Cartagena
    },
    {
        id: '6938bb76fcb387b06ebd4fa5', // Reemplaza con IDs reales
        name: 'Ana García',
        specialty: 'Plomería',
        baseLocation: { lat: 10.4050, lng: -75.4850 } // Bocagrande
    },
    {
        id: '6938bb76fcb387b06ebd4fa6', // Reemplaza con IDs reales
        name: 'Luis Rodríguez',
        specialty: 'Sistemas Eléctricos',
        baseLocation: { lat: 10.3800, lng: -75.4700 } // Getsemaní
    }
];

class TechnicianSimulator {
    constructor() {
        this.isRunning = false;
        this.intervals = [];
        this.technicianPositions = new Map();

        // Inicializar posiciones
        TECHNICIANS.forEach(tech => {
            this.technicianPositions.set(tech.id, {
                ...tech.baseLocation,
                direction: Math.random() * 360, // Dirección inicial aleatoria
                speed: 0.0001 + Math.random() * 0.0002 // Velocidad aleatoria
            });
        });
    }

    // Generar movimiento realista
    generateMovement(techId) {
        const position = this.technicianPositions.get(techId);
        if (!position) return null;

        // Cambiar dirección ocasionalmente (simula giros)
        if (Math.random() < 0.1) {
            position.direction += (Math.random() - 0.5) * 60; // Giro de hasta 30 grados
        }

        // Cambiar velocidad ocasionalmente (simula paradas/aceleración)
        if (Math.random() < 0.05) {
            position.speed = 0.0001 + Math.random() * 0.0003;
        }

        // Calcular nueva posición
        const radians = position.direction * Math.PI / 180;
        let newLat = position.lat + Math.cos(radians) * position.speed;
        let newLng = position.lng + Math.sin(radians) * position.speed;

        // Mantener dentro de los límites de Cartagena
        if (newLat > CARTAGENA_BOUNDS.north || newLat < CARTAGENA_BOUNDS.south) {
            position.direction = 180 - position.direction; // Rebotar verticalmente
            newLat = position.lat;
        }
        if (newLng > CARTAGENA_BOUNDS.east || newLng < CARTAGENA_BOUNDS.west) {
            position.direction = -position.direction; // Rebotar horizontalmente
            newLng = position.lng;
        }

        // Actualizar posición
        position.lat = newLat;
        position.lng = newLng;

        return {
            lat: newLat,
            lng: newLng,
            accuracy: 5 + Math.random() * 15 // Precisión GPS simulada (5-20m)
        };
    }

    // Enviar ubicación al backend
    async sendLocation(techId, location) {
        try {
            const response = await axios.post(`${BASE_URL}/location/technician/${techId}`, {
                lat: location.lat,
                lng: location.lng,
                accuracy: location.accuracy
            }, {
                headers: {
                    'Authorization': 'Bearer YOUR_TOKEN_HERE' // Reemplaza con token real
                },
                timeout: 5000
            });

            const tech = TECHNICIANS.find(t => t.id === techId);
            console.log(`✅ ${tech?.name || techId}: Ubicación enviada (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})`);

        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`🔐 ${techId}: Token requerido - usando modo simulación`);
            } else {
                console.log(`❌ ${techId}: Error enviando ubicación - ${error.message}`);
            }
        }
    }

    // Iniciar simulación
    start() {
        if (this.isRunning) {
            console.log('⚠️ La simulación ya está corriendo');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Iniciando simulación de técnicos...\n');

        TECHNICIANS.forEach(tech => {
            console.log(`👷 ${tech.name} (${tech.specialty}) - Base: ${tech.baseLocation.lat}, ${tech.baseLocation.lng}`);

            // Crear intervalo para cada técnico
            const interval = setInterval(() => {
                const newLocation = this.generateMovement(tech.id);
                if (newLocation) {
                    this.sendLocation(tech.id, newLocation);
                }
            }, 10000 + Math.random() * 20000); // Entre 10-30 segundos

            this.intervals.push(interval);
        });

        console.log('\n📡 Simulación activa - Los técnicos están enviando ubicaciones cada 10-30 segundos');
        console.log('💡 Presiona Ctrl+C para detener la simulación\n');
    }

    // Detener simulación
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ La simulación no está corriendo');
            return;
        }

        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        this.isRunning = false;

        console.log('🛑 Simulación detenida');
    }

    // Mostrar estado actual
    status() {
        console.log('\n📊 Estado de la simulación:');
        console.log(`Estado: ${this.isRunning ? '🟢 Activa' : '🔴 Detenida'}`);
        console.log(`Técnicos: ${TECHNICIANS.length}`);

        if (this.isRunning) {
            console.log('\n📍 Posiciones actuales:');
            TECHNICIANS.forEach(tech => {
                const pos = this.technicianPositions.get(tech.id);
                console.log(`  ${tech.name}: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
            });
        }
        console.log('');
    }
}

// Crear instancia del simulador
const simulator = new TechnicianSimulator();

// Manejar argumentos de línea de comandos
const command = process.argv[2];

switch (command) {
    case 'start':
        simulator.start();
        break;
    case 'stop':
        simulator.stop();
        process.exit(0);
        break;
    case 'status':
        simulator.status();
        process.exit(0);
        break;
    default:
        console.log(`
🧪 SIMULADOR DE TÉCNICOS - ServiceOps Pro

Uso:
  node simulate-technicians.js start   - Iniciar simulación
  node simulate-technicians.js stop    - Detener simulación  
  node simulate-technicians.js status  - Ver estado

Características:
  • Simula ${TECHNICIANS.length} técnicos moviéndose por Cartagena
  • Envía ubicaciones cada 10-30 segundos
  • Movimiento realista con giros y paradas
  • Precisión GPS simulada (5-20m)
  • Mantiene técnicos dentro de los límites de la ciudad

Configuración:
  1. Reemplaza los IDs de técnicos con IDs reales de tu base de datos
  2. Obtén un token de autenticación válido
  3. Asegúrate de que el backend esté corriendo en puerto 4000

¡Perfecto para probar el sistema de tracking en tiempo real! 🚀
        `);
        process.exit(0);
}

// Manejar Ctrl+C para detener la simulación
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo simulación...');
    simulator.stop();
    process.exit(0);
});

// Mantener el proceso vivo si está corriendo
if (command === 'start') {
    setInterval(() => {
        // Mostrar estado cada 5 minutos
        if (Date.now() % 300000 < 1000) {
            simulator.status();
        }
    }, 1000);
}