const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ises_isea';

async function createSampleMaterialControls() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para crear controles de materiales de ejemplo');

        const db = client.db(dbName);
        const usuariosCollection = db.collection('users');
        const materialesCollection = db.collection('materials');
        const ordenesCollection = db.collection('orders');
        const controlCollection = db.collection('materialcontrols');
        const inventarioCollection = db.collection('inventory_technicians');
        const movimientosCollection = db.collection('movimiento_inventarios');

        // Obtener usuarios
        const tecnicos = await usuariosCollection.find({ role: 'tecnico' }).limit(5).toArray();
        const bodegueros = await usuariosCollection.find({ role: 'bodeguero' }).toArray();
        const analistas = await usuariosCollection.find({ role: 'analista' }).toArray();

        if (tecnicos.length === 0 || bodegueros.length === 0) {
            console.log('❌ No se encontraron técnicos o bodegueros suficientes');
            return;
        }

        // Obtener algunos materiales comunes
        const materiales = await materialesCollection.find({
            codigo_interno: {
                $in: [
                    'TUB-PVC-050-6M', 'TUB-PVC-075-6M', 'COD-PVC-050-90',
                    'TEE-PVC-050', 'VAL-BOL-050', 'PEG-PVC-025', 'TEF-CIN-12'
                ]
            }
        }).toArray();

        // Obtener algunas órdenes de trabajo
        const ordenes = await ordenesCollection.find({ estado: 'asignada' }).limit(3).toArray();

        console.log(`👷 Técnicos disponibles: ${tecnicos.length}`);
        console.log(`📦 Materiales disponibles: ${materiales.length}`);
        console.log(`📋 Órdenes disponibles: ${ordenes.length}`);

        // Limpiar controles existentes
        await controlCollection.deleteMany({});
        console.log('🗑️  Controles existentes eliminados');

        const controlesMuestra = [];
        const fechaBase = new Date();

        // Control 1: Asignación reciente (estado: asignado)
        const control1 = {
            tecnico_id: new ObjectId(tecnicos[0]._id),
            orden_trabajo_id: ordenes.length > 0 ? new ObjectId(ordenes[0]._id) : null,
            materiales_asignados: [
                {
                    material_id: new ObjectId(materiales[0]._id),
                    cantidad_asignada: 5,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'pendiente'
                },
                {
                    material_id: new ObjectId(materiales[1]._id),
                    cantidad_asignada: 3,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'pendiente'
                },
                {
                    material_id: new ObjectId(materiales[2]._id),
                    cantidad_asignada: 10,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'pendiente'
                }
            ],
            fecha_asignacion: new Date(fechaBase.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
            estado_general: 'asignado',
            bodeguero_asigno: new ObjectId(bodegueros[0]._id),
            observaciones_bodeguero: 'Materiales para reparación de tubería principal en el sector La Esperanza',
            tiene_descuadre: false,
            valor_descuadre: 0,
            descuadre_resuelto: false
        };

        // Control 2: En trabajo (estado: en_trabajo)
        const control2 = {
            tecnico_id: new ObjectId(tecnicos[1]._id),
            orden_trabajo_id: ordenes.length > 1 ? new ObjectId(ordenes[1]._id) : null,
            materiales_asignados: [
                {
                    material_id: new ObjectId(materiales[0]._id),
                    cantidad_asignada: 8,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'en_uso'
                },
                {
                    material_id: new ObjectId(materiales[3]._id),
                    cantidad_asignada: 6,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'en_uso'
                },
                {
                    material_id: new ObjectId(materiales[4]._id),
                    cantidad_asignada: 2,
                    cantidad_utilizada: 0,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'en_uso'
                }
            ],
            fecha_asignacion: new Date(fechaBase.getTime() - 6 * 60 * 60 * 1000), // Hace 6 horas
            fecha_inicio_trabajo: new Date(fechaBase.getTime() - 4 * 60 * 60 * 1000), // Hace 4 horas
            estado_general: 'en_trabajo',
            bodeguero_asigno: new ObjectId(bodegueros[0]._id),
            observaciones_bodeguero: 'Instalación de nueva acometida en edificio residencial',
            tiene_descuadre: false,
            valor_descuadre: 0,
            descuadre_resuelto: false
        };

        // Control 3: Con descuadre (estado: devolucion_completada)
        const control3 = {
            tecnico_id: new ObjectId(tecnicos[2]._id),
            orden_trabajo_id: ordenes.length > 2 ? new ObjectId(ordenes[2]._id) : null,
            materiales_asignados: [
                {
                    material_id: new ObjectId(materiales[0]._id),
                    cantidad_asignada: 10,
                    cantidad_utilizada: 7,
                    cantidad_devuelta: 2,
                    cantidad_perdida: 1,
                    motivo_perdida: 'Tubería dañada durante la instalación',
                    estado: 'devuelto_parcial'
                },
                {
                    material_id: new ObjectId(materiales[2]._id),
                    cantidad_asignada: 15,
                    cantidad_utilizada: 12,
                    cantidad_devuelta: 2,
                    cantidad_perdida: 0,
                    estado: 'devuelto_parcial'
                },
                {
                    material_id: new ObjectId(materiales[5]._id),
                    cantidad_asignada: 1,
                    cantidad_utilizada: 1,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'completado'
                }
            ],
            fecha_asignacion: new Date(fechaBase.getTime() - 24 * 60 * 60 * 1000), // Hace 1 día
            fecha_inicio_trabajo: new Date(fechaBase.getTime() - 22 * 60 * 60 * 1000), // Hace 22 horas
            fecha_fin_trabajo: new Date(fechaBase.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
            fecha_devolucion: new Date(fechaBase.getTime() - 1 * 60 * 60 * 1000), // Hace 1 hora
            estado_general: 'devolucion_completada',
            bodeguero_asigno: new ObjectId(bodegueros[0]._id),
            observaciones_bodeguero: 'Reparación de fuga en tubería matriz',
            observaciones_tecnico: 'Se presentaron complicaciones durante la excavación, se dañó una tubería adicional',
            tiene_descuadre: true,
            motivo_descuadre: 'Material TUB-PVC-050-6M: diferencia de 1 unidades',
            valor_descuadre: materiales[0].costo_unitario * 1, // Valor de 1 tubería perdida
            descuadre_resuelto: false
        };

        // Control 4: Completado sin descuadres (estado: cerrado)
        const control4 = {
            tecnico_id: new ObjectId(tecnicos[3]._id),
            materiales_asignados: [
                {
                    material_id: new ObjectId(materiales[1]._id),
                    cantidad_asignada: 4,
                    cantidad_utilizada: 3,
                    cantidad_devuelta: 1,
                    cantidad_perdida: 0,
                    estado: 'devuelto_parcial'
                },
                {
                    material_id: new ObjectId(materiales[6]._id),
                    cantidad_asignada: 5,
                    cantidad_utilizada: 5,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'completado'
                }
            ],
            fecha_asignacion: new Date(fechaBase.getTime() - 48 * 60 * 60 * 1000), // Hace 2 días
            fecha_inicio_trabajo: new Date(fechaBase.getTime() - 46 * 60 * 60 * 1000), // Hace 46 horas
            fecha_fin_trabajo: new Date(fechaBase.getTime() - 24 * 60 * 60 * 1000), // Hace 1 día
            fecha_devolucion: new Date(fechaBase.getTime() - 23 * 60 * 60 * 1000), // Hace 23 horas
            estado_general: 'cerrado',
            bodeguero_asigno: new ObjectId(bodegueros[0]._id),
            analista_supervisa: analistas.length > 0 ? new ObjectId(analistas[0]._id) : null,
            observaciones_bodeguero: 'Mantenimiento preventivo de válvulas',
            observaciones_tecnico: 'Trabajo completado sin inconvenientes',
            observaciones_analista: 'Control revisado y aprobado',
            tiene_descuadre: false,
            valor_descuadre: 0,
            descuadre_resuelto: true
        };

        // Control 5: Descuadre resuelto (estado: cerrado)
        const control5 = {
            tecnico_id: new ObjectId(tecnicos[4]._id),
            materiales_asignados: [
                {
                    material_id: new ObjectId(materiales[0]._id),
                    cantidad_asignada: 6,
                    cantidad_utilizada: 5,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 1,
                    motivo_perdida: 'Material defectuoso, se rompió al instalarlo',
                    estado: 'completado'
                },
                {
                    material_id: new ObjectId(materiales[4]._id),
                    cantidad_asignada: 1,
                    cantidad_utilizada: 1,
                    cantidad_devuelta: 0,
                    cantidad_perdida: 0,
                    estado: 'completado'
                }
            ],
            fecha_asignacion: new Date(fechaBase.getTime() - 72 * 60 * 60 * 1000), // Hace 3 días
            fecha_inicio_trabajo: new Date(fechaBase.getTime() - 70 * 60 * 60 * 1000), // Hace 70 horas
            fecha_fin_trabajo: new Date(fechaBase.getTime() - 48 * 60 * 60 * 1000), // Hace 2 días
            fecha_devolucion: new Date(fechaBase.getTime() - 47 * 60 * 60 * 1000), // Hace 47 horas
            fecha_resolucion_descuadre: new Date(fechaBase.getTime() - 12 * 60 * 60 * 1000), // Hace 12 horas
            estado_general: 'cerrado',
            bodeguero_asigno: new ObjectId(bodegueros[0]._id),
            analista_supervisa: analistas.length > 0 ? new ObjectId(analistas[0]._id) : null,
            observaciones_bodeguero: 'Reparación de acometida domiciliaria',
            observaciones_tecnico: 'Material defectuoso se rompió durante la instalación',
            observaciones_analista: 'Descuadre justificado por material defectuoso. Se contactará al proveedor.',
            tiene_descuadre: true,
            motivo_descuadre: 'Material TUB-PVC-050-6M: diferencia de 1 unidades',
            valor_descuadre: materiales[0].costo_unitario * 1,
            descuadre_resuelto: true
        };

        controlesMuestra.push(control1, control2, control3, control4, control5);

        // Insertar controles
        const result = await controlCollection.insertMany(controlesMuestra);
        console.log(`✅ Insertados ${result.insertedCount} controles de materiales de ejemplo`);

        // Generar algunos movimientos de inventario relacionados
        const movimientosEjemplo = [];

        // Movimientos para control1 (apartado)
        for (const material of control1.materiales_asignados) {
            movimientosEjemplo.push({
                tecnico_id: control1.tecnico_id,
                material_id: material.material_id,
                tipo: 'apartado',
                cantidad: material.cantidad_asignada,
                motivo: `Asignación para OT: ${control1.orden_trabajo_id || 'Sin OT específica'}`,
                visible_para_analistas: true,
                usuario_responsable: control1.bodeguero_asigno,
                origen: control1.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control1.orden_trabajo_id,
                fecha: control1.fecha_asignacion
            });
        }

        // Movimientos para control2 (apartado + salida)
        for (const material of control2.materiales_asignados) {
            // Apartado
            movimientosEjemplo.push({
                tecnico_id: control2.tecnico_id,
                material_id: material.material_id,
                tipo: 'apartado',
                cantidad: material.cantidad_asignada,
                motivo: `Asignación para OT: ${control2.orden_trabajo_id || 'Sin OT específica'}`,
                visible_para_analistas: true,
                usuario_responsable: control2.bodeguero_asigno,
                origen: control2.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control2.orden_trabajo_id,
                fecha: control2.fecha_asignacion
            });

            // Salida (inicio de trabajo)
            movimientosEjemplo.push({
                tecnico_id: control2.tecnico_id,
                material_id: material.material_id,
                tipo: 'salida',
                cantidad: material.cantidad_asignada,
                motivo: 'Inicio de trabajo - Material en uso',
                visible_para_analistas: true,
                usuario_responsable: control2.tecnico_id,
                origen: control2.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control2.orden_trabajo_id,
                fecha: control2.fecha_inicio_trabajo
            });
        }

        // Movimientos para control3 (apartado + salida + devolución)
        for (const material of control3.materiales_asignados) {
            // Apartado
            movimientosEjemplo.push({
                tecnico_id: control3.tecnico_id,
                material_id: material.material_id,
                tipo: 'apartado',
                cantidad: material.cantidad_asignada,
                motivo: `Asignación para OT: ${control3.orden_trabajo_id || 'Sin OT específica'}`,
                visible_para_analistas: true,
                usuario_responsable: control3.bodeguero_asigno,
                origen: control3.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control3.orden_trabajo_id,
                fecha: control3.fecha_asignacion
            });

            // Salida
            movimientosEjemplo.push({
                tecnico_id: control3.tecnico_id,
                material_id: material.material_id,
                tipo: 'salida',
                cantidad: material.cantidad_asignada,
                motivo: 'Inicio de trabajo - Material en uso',
                visible_para_analistas: true,
                usuario_responsable: control3.tecnico_id,
                origen: control3.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control3.orden_trabajo_id,
                fecha: control3.fecha_inicio_trabajo
            });

            // Devolución (si hay cantidad devuelta)
            if (material.cantidad_devuelta > 0) {
                movimientosEjemplo.push({
                    tecnico_id: control3.tecnico_id,
                    material_id: material.material_id,
                    tipo: 'devolucion',
                    cantidad: material.cantidad_devuelta,
                    motivo: 'Devolución de material no utilizado',
                    visible_para_analistas: true,
                    usuario_responsable: control3.tecnico_id,
                    origen: control3.orden_trabajo_id ? 'OT' : 'Manual',
                    referencia_origen_id: control3.orden_trabajo_id,
                    fecha: control3.fecha_devolucion
                });
            }
        }

        // Insertar movimientos
        if (movimientosEjemplo.length > 0) {
            await movimientosCollection.insertMany(movimientosEjemplo);
            console.log(`✅ Insertados ${movimientosEjemplo.length} movimientos de inventario de ejemplo`);
        }

        // Mostrar resumen
        console.log('\n📊 RESUMEN DE CONTROLES CREADOS:');
        console.log('='.repeat(60));

        const estadisticas = await controlCollection.aggregate([
            {
                $group: {
                    _id: '$estado_general',
                    cantidad: { $sum: 1 },
                    valor_descuadres: { $sum: '$valor_descuadre' }
                }
            },
            { $sort: { cantidad: -1 } }
        ]).toArray();

        estadisticas.forEach(stat => {
            console.log(`📋 Estado "${stat._id}": ${stat.cantidad} controles`);
            if (stat.valor_descuadres > 0) {
                console.log(`   💰 Valor descuadres: $${stat.valor_descuadres.toLocaleString('es-CO')}`);
            }
        });

        const totalDescuadres = await controlCollection.countDocuments({ tiene_descuadre: true });
        const descuadresResueltos = await controlCollection.countDocuments({
            tiene_descuadre: true,
            descuadre_resuelto: true
        });

        console.log('\n📈 ESTADÍSTICAS DE DESCUADRES:');
        console.log(`⚠️  Total descuadres: ${totalDescuadres}`);
        console.log(`✅ Descuadres resueltos: ${descuadresResueltos}`);
        console.log(`🔄 Descuadres pendientes: ${totalDescuadres - descuadresResueltos}`);

        console.log('\n🎉 ¡Controles de materiales de ejemplo creados exitosamente!');
        console.log('📋 Ahora puede probar el sistema de distribución de materiales.');

    } catch (error) {
        console.error('❌ Error creando controles de ejemplo:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

// Ejecutar el script
createSampleMaterialControls();