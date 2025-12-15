// Script para poblar la base de datos con datos de prueba
// Ejecutar con: mongosh < seed-data.js

use ises_isea;

// Limpiar datos existentes (CUIDADO en producción)
db.users.deleteMany({});
db.polizas.deleteMany({});
db.materials.deleteMany({});
db.orders.deleteMany({});

// Insertar usuarios de prueba
// Nota: En producción, usar bcrypt para hashear contraseñas
const users = db.users.insertMany([
    {
        nombre: "Juan Analista",
        email: "analista@ises.com",
        password_hash: "$2b$10$YourHashedPasswordHere",
        rol: "analista",
        estado: "activo",
        created_at: new Date()
    },
    {
        nombre: "Pedro Técnico",
        email: "tecnico@ises.com",
        password_hash: "$2b$10$YourHashedPasswordHere",
        rol: "tecnico",
        estado: "activo",
        created_at: new Date()
    },
    {
        nombre: "Admin Inventario",
        email: "admin@ises.com",
        password_hash: "$2b$10$YourHashedPasswordHere",
        rol: "analista_inventario_oculto",
        estado: "activo",
        created_at: new Date()
    }
]);

print("✓ Usuarios creados:", users.insertedIds);

// Insertar pólizas de prueba
const polizas = db.polizas.insertMany([
    {
        poliza_number: "600637",
        descripcion: "Póliza de mantenimiento preventivo CFE",
        metadata: {
            max_cost: 50000,
            entidades: ["CFE"]
        },
        autorizaciones: [],
        created_at: new Date(),
        estado: "activo"
    },
    {
        poliza_number: "600638",
        descripcion: "Póliza de instalación eléctrica PEMEX",
        metadata: {
            max_cost: 100000,
            entidades: ["PEMEX"]
        },
        autorizaciones: [],
        created_at: new Date(),
        estado: "activo"
    },
    {
        poliza_number: "600639",
        descripcion: "Póliza de reparación urgente",
        metadata: {},
        autorizaciones: [],
        created_at: new Date(),
        estado: "activo"
    }
]);

print("✓ Pólizas creadas:", polizas.insertedIds);

// Insertar materiales de prueba
const materials = db.materials.insertMany([
    {
        nombre: "Cable calibre 12",
        descripcion: "Cable eléctrico calibre 12 AWG",
        unidad_medida: "metros",
        costo_unitario: 15.50,
        categoria: "cables",
        stock_minimo: 100,
        created_at: new Date(),
        estado: "activo"
    },
    {
        nombre: "Interruptor termomagnético 20A",
        descripcion: "Interruptor termomagnético 20 amperes",
        unidad_medida: "pza",
        costo_unitario: 85.00,
        categoria: "protecciones",
        stock_minimo: 10,
        created_at: new Date(),
        estado: "activo"
    },
    {
        nombre: "Cinta aislante",
        descripcion: "Cinta aislante 3M negra",
        unidad_medida: "pza",
        costo_unitario: 25.00,
        categoria: "consumibles",
        stock_minimo: 20,
        created_at: new Date(),
        estado: "activo"
    },
    {
        nombre: "Contacto doble",
        descripcion: "Contacto doble polarizado",
        unidad_medida: "pza",
        costo_unitario: 35.00,
        categoria: "accesorios",
        stock_minimo: 15,
        created_at: new Date(),
        estado: "activo"
    }
]);

print("✓ Materiales creados:", materials.insertedIds);

// Crear inventario inicial para el técnico
const tecnicoId = Object.values(users.insertedIds)[1]; // Pedro Técnico
const materialIds = Object.values(materials.insertedIds);

db.inventory_technician.insertOne({
    tecnico_id: tecnicoId,
    materials: [
        {
            material_id: materialIds[0],
            cantidad_actual: 500,
            cantidad_apartada: 0,
            cantidad_disponible: 500,
            ultimo_movimiento: new Date()
        },
        {
            material_id: materialIds[1],
            cantidad_actual: 25,
            cantidad_apartada: 0,
            cantidad_disponible: 25,
            ultimo_movimiento: new Date()
        },
        {
            material_id: materialIds[2],
            cantidad_actual: 50,
            cantidad_apartada: 0,
            cantidad_disponible: 50,
            ultimo_movimiento: new Date()
        },
        {
            material_id: materialIds[3],
            cantidad_actual: 30,
            cantidad_apartada: 0,
            cantidad_disponible: 30,
            ultimo_movimiento: new Date()
        }
    ],
    updated_at: new Date()
});

print("✓ Inventario inicial creado para técnico");

// Crear una OT de ejemplo
const analistaId = Object.values(users.insertedIds)[0]; // Juan Analista

db.orders.insertOne({
    codigo: "OT-2024-001",
    poliza_number: "600637",
    cliente: "CFE Zona Norte",
    direccion: "Av. Principal #123, Col. Centro",
    tipo_trabajo: "mantenimiento",
    analista_id: analistaId,
    tecnico_id: null,
    estado: "creada",
    materiales_sugeridos: [
        {
            material_id: materialIds[0],
            cantidad: 50,
            unidad: "metros"
        },
        {
            material_id: materialIds[1],
            cantidad: 2,
            unidad: "pza"
        }
    ],
    materiales_apartados: [],
    materiales_utilizados: [],
    evidencias: {
        foto_inicial: null,
        foto_durante: null,
        foto_materiales: null,
        foto_final: null,
        otros: []
    },
    ia_prediction_id: null,
    fecha_creacion: new Date(),
    fecha_cierre: null,
    audit_trail: [
        {
            actor: analistaId,
            action: "OT_CREADA",
            detail: "Orden de trabajo creada",
            timestamp: new Date()
        }
    ]
});

print("✓ OT de ejemplo creada");
print("\n=== Datos de prueba insertados correctamente ===");
print("Usuarios: 3 (analista, tecnico, admin)");
print("Pólizas: 3");
print("Materiales: 4");
print("OTs: 1");
print("\nCredenciales de prueba:");
print("- analista@ises.com");
print("- tecnico@ises.com");
print("- admin@ises.com");
print("(Contraseña: implementar en backend)");
