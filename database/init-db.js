// Script de inicialización de MongoDB para ISES-ISEA
// Ejecutar con: mongosh < init-db.js

use ises_isea;

// Crear colecciones con validación
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "email", "password_hash", "rol", "estado"],
            properties: {
                nombre: { bsonType: "string" },
                email: { bsonType: "string" },
                password_hash: { bsonType: "string" },
                rol: { enum: ["analista", "tecnico", "analista_inventario_oculto"] },
                estado: { enum: ["activo", "inactivo"] },
                created_at: { bsonType: "date" }
            }
        }
    }
});

db.createCollection("polizas", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["poliza_number", "estado"],
            properties: {
                poliza_number: {
                    bsonType: "string",
                    pattern: "^[0-9]{6}$"
                },
                descripcion: { bsonType: "string" },
                estado: { enum: ["activo", "anulada"] }
            }
        }
    }
});

db.createCollection("materials");
db.createCollection("inventory_technician");
db.createCollection("movimientos_inventario");
db.createCollection("orders");
db.createCollection("ai_predictions");
db.createCollection("audit_logs");
db.createCollection("alerts");

// Crear índices
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ rol: 1 });

db.polizas.createIndex({ poliza_number: 1 }, { unique: true });
db.polizas.createIndex({ estado: 1 });

db.orders.createIndex({ codigo: 1 }, { unique: true });
db.orders.createIndex({ poliza_number: 1 });
db.orders.createIndex({ tecnico_id: 1 });
db.orders.createIndex({ estado: 1 });

db.inventory_technician.createIndex({ tecnico_id: 1 }, { unique: true });

db.movimientos_inventario.createIndex({ tecnico_id: 1, fecha: -1 });
db.movimientos_inventario.createIndex({ material_id: 1 });
db.movimientos_inventario.createIndex({ visible_para_analistas: 1 });

db.alerts.createIndex({ tipo: 1, resolved: 1 });
db.alerts.createIndex({ order_id: 1 });
db.alerts.createIndex({ created_at: -1 });

db.ai_predictions.createIndex({ order_id: 1 });
db.ai_predictions.createIndex({ timestamp: -1 });

print("✓ Base de datos inicializada correctamente");
print("✓ Colecciones creadas con validación");
print("✓ Índices creados");
print("\nNOTA: Recuerda que necesitas MongoDB con Replica Set para transacciones");
