const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ises_isea';

// Distribución típica de materiales por técnico para Aguas de Cartagena
const distribucionMaterialesPorTecnico = {
    // Materiales básicos que todo técnico debe tener
    basicos: [
        { codigo: 'TUB-PVC-050-6M', cantidad_base: 10, variacion: 5 },
        { codigo: 'TUB-PVC-075-6M', cantidad_base: 8, variacion: 4 },
        { codigo: 'TUB-PVC-100-6M', cantidad_base: 6, variacion: 3 },
        { codigo: 'COD-PVC-050-90', cantidad_base: 20, variacion: 10 },
        { codigo: 'COD-PVC-075-90', cantidad_base: 15, variacion: 8 },
        { codigo: 'COD-PVC-100-90', cantidad_base: 12, variacion: 6 },
        { codigo: 'TEE-PVC-050', cantidad_base: 15, variacion: 7 },
        { codigo: 'TEE-PVC-075', cantidad_base: 12, variacion: 6 },
        { codigo: 'UNI-PVC-050', cantidad_base: 8, variacion: 4 },
        { codigo: 'ADA-PVC-050-M', cantidad_base: 15, variacion: 8 },
        { codigo: 'ADA-PVC-050-H', cantidad_base: 15, variacion: 8 },
        { codigo: 'TEF-CIN-12', cantidad_base: 10, variacion: 5 },
        { codigo: 'PEG-PVC-025', cantidad_base: 2, variacion: 1 },
        { codigo: 'LIM-PVC-025', cantidad_base: 2, variacion: 1 },
        { codigo: 'ABR-MET-050', cantidad_base: 25, variacion: 10 },
        { codigo: 'ABR-MET-075', cantidad_base: 20, variacion: 8 }
    ],

    // Materiales para técnicos especializados en instalaciones
    instalaciones: [
        { codigo: 'MED-AGU-050-B', cantidad_base: 5, variacion: 2 },
        { codigo: 'CAJ-MED-PLA', cantidad_base: 5, variacion: 2 },
        { codigo: 'NIP-MED-050', cantidad_base: 10, variacion: 5 },
        { codigo: 'VAL-BOL-050', cantidad_base: 6, variacion: 3 },
        { codigo: 'VAL-BOL-075', cantidad_base: 4, variacion: 2 },
        { codigo: 'LLA-PAS-050', cantidad_base: 8, variacion: 4 },
        { codigo: 'FLE-ACE-050', cantidad_base: 10, variacion: 5 }
    ],

    // Materiales para técnicos de mantenimiento
    mantenimiento: [
        { codigo: 'VAL-CHE-050', cantidad_base: 4, variacion: 2 },
        { codigo: 'VAL-COM-050', cantidad_base: 3, variacion: 1 },
        { codigo: 'BAN-REP-4', cantidad_base: 2, variacion: 1 },
        { codigo: 'MAS-EPO-500', cantidad_base: 3, variacion: 1 },
        { codigo: 'CIN-AUT-19', cantidad_base: 5, variacion: 2 },
        { codigo: 'SIL-SEL-300', cantidad_base: 4, variacion: 2 },
        { codigo: 'PAS-SEL-250', cantidad_base: 3, variacion: 1 }
    ],

    // Materiales para técnicos de reparaciones mayores
    reparaciones: [
        { codigo: 'TUB-PVC-125-6M', cantidad_base: 4, variacion: 2 },
        { codigo: 'TUB-PVC-150-6M', cantidad_base: 3, variacion: 1 },
        { codigo: 'TUB-PVC-200-6M', cantidad_base: 2, variacion: 1 },
        { codigo: 'VAL-BOL-100', cantidad_base: 3, variacion: 1 },
        { codigo: 'RED-PVC-075-050', cantidad_base: 8, variacion: 4 },
        { codigo: 'MAN-CRI-050', cantidad_base: 1, variacion: 0 },
        { codigo: 'FIL-SED-10', cantidad_base: 3, variacion: 1 }
    ]
};

function generarCantidadAleatoria(base, variacion) {
    const min = Math.max(0, base - variacion);
    const max = base + variacion;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function asignarEspecializacion() {
    const especializaciones = ['basico', 'instalaciones', 'mantenimiento', 'reparaciones'];
    const pesos = [0.4, 0.25, 0.25, 0.1]; // 40% básico, 25% instalaciones, 25% mantenimiento, 10% reparaciones

    const random = Math.random();
    let acumulado = 0;

    for (let i = 0; i < especializaciones.length; i++) {
        acumulado += pesos[i];
        if (random <= acumulado) {
            return especializaciones[i];
        }
    }

    return 'basico';
}

async function crearInventarioTecnicosCartagena() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para crear inventario de técnicos');

        const db = client.db(dbName);
        const usuariosCollection = db.collection('users');
        const materialesCollection = db.collection('materials');
        const inventarioCollection = db.collection('inventory_technicians');
        const movimientosCollection = db.collection('movimiento_inventarios');

        // Obtener todos los técnicos
        const tecnicos = await usuariosCollection.find({ role: 'tecnico' }).toArray();
        console.log(`👷 Encontrados ${tecnicos.length} técnicos`);

        if (tecnicos.length === 0) {
            console.log('❌ No se encontraron técnicos. Ejecute primero el script de creación de usuarios.');
            return;
        }

        // Obtener todos los materiales con sus códigos internos
        const materiales = await materialesCollection.find({}).toArray();
        const materialesPorCodigo = {};
        materiales.forEach(material => {
            if (material.codigo_interno) {
                materialesPorCodigo[material.codigo_interno] = material;
            }
        });

        console.log(`📦 Encontrados ${materiales.length} materiales disponibles`);

        // Limpiar inventarios existentes
        await inventarioCollection.deleteMany({});
        console.log('🗑️  Inventarios existentes eliminados');

        let inventariosCreados = 0;
        let movimientosCreados = 0;

        for (const tecnico of tecnicos) {
            console.log(`\n👤 Procesando técnico: ${tecnico.nombre}`);

            // Asignar especialización aleatoria
            const especializacion = asignarEspecializacion();
            console.log(`   🎯 Especialización: ${especializacion}`);

            const materialesInventario = [];
            const movimientosTecnico = [];

            // Agregar materiales básicos (todos los técnicos)
            for (const materialConfig of distribucionMaterialesPorTecnico.basicos) {
                const material = materialesPorCodigo[materialConfig.codigo];
                if (material) {
                    const cantidad = generarCantidadAleatoria(materialConfig.cantidad_base, materialConfig.variacion);

                    if (cantidad > 0) {
                        materialesInventario.push({
                            material_id: material._id,
                            cantidad_actual: cantidad,
                            cantidad_apartada: 0,
                            cantidad_disponible: cantidad,
                            ultimo_movimiento: new Date()
                        });

                        // Crear movimiento inicial
                        movimientosTecnico.push({
                            tecnico_id: tecnico._id,
                            material_id: material._id,
                            tipo: 'entrada',
                            cantidad: cantidad,
                            motivo: 'Inventario inicial - Asignación básica',
                            visible_para_analistas: true,
                            usuario_responsable: tecnico._id,
                            origen: 'Manual',
                            fecha: new Date()
                        });
                    }
                }
            }

            // Agregar materiales según especialización
            if (especializacion !== 'basico' && distribucionMaterialesPorTecnico[especializacion]) {
                for (const materialConfig of distribucionMaterialesPorTecnico[especializacion]) {
                    const material = materialesPorCodigo[materialConfig.codigo];
                    if (material) {
                        const cantidad = generarCantidadAleatoria(materialConfig.cantidad_base, materialConfig.variacion);

                        if (cantidad > 0) {
                            // Verificar si ya existe en el inventario básico
                            const existente = materialesInventario.find(m => m.material_id.toString() === material._id.toString());

                            if (existente) {
                                // Sumar a la cantidad existente
                                existente.cantidad_actual += cantidad;
                                existente.cantidad_disponible += cantidad;
                            } else {
                                // Agregar nuevo material
                                materialesInventario.push({
                                    material_id: material._id,
                                    cantidad_actual: cantidad,
                                    cantidad_apartada: 0,
                                    cantidad_disponible: cantidad,
                                    ultimo_movimiento: new Date()
                                });
                            }

                            // Crear movimiento
                            movimientosTecnico.push({
                                tecnico_id: tecnico._id,
                                material_id: material._id,
                                tipo: 'entrada',
                                cantidad: cantidad,
                                motivo: `Inventario inicial - Especialización ${especializacion}`,
                                visible_para_analistas: true,
                                usuario_responsable: tecnico._id,
                                origen: 'Manual',
                                fecha: new Date()
                            });
                        }
                    }
                }
            }

            // Crear inventario del técnico
            const inventarioTecnico = {
                tecnico_id: tecnico._id,
                materials: materialesInventario,
                updated_at: new Date()
            };

            await inventarioCollection.insertOne(inventarioTecnico);
            inventariosCreados++;

            // Insertar movimientos
            if (movimientosTecnico.length > 0) {
                await movimientosCollection.insertMany(movimientosTecnico);
                movimientosCreados += movimientosTecnico.length;
            }

            console.log(`   ✅ Inventario creado con ${materialesInventario.length} materiales diferentes`);

            // Calcular valor total del inventario del técnico
            let valorTotal = 0;
            for (const materialInv of materialesInventario) {
                const material = materiales.find(m => m._id.toString() === materialInv.material_id.toString());
                if (material) {
                    valorTotal += material.costo_unitario * materialInv.cantidad_actual;
                }
            }
            console.log(`   💰 Valor total del inventario: $${valorTotal.toLocaleString('es-CO')}`);
        }

        // Generar estadísticas finales
        console.log('\n📊 ESTADÍSTICAS FINALES:');
        console.log('='.repeat(60));
        console.log(`👷 Técnicos procesados: ${tecnicos.length}`);
        console.log(`📦 Inventarios creados: ${inventariosCreados}`);
        console.log(`📝 Movimientos registrados: ${movimientosCreados}`);

        // Estadísticas por especialización
        const estadisticasEspecializacion = await inventarioCollection.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'tecnico_id',
                    foreignField: '_id',
                    as: 'tecnico'
                }
            },
            {
                $unwind: '$tecnico'
            },
            {
                $unwind: '$materials'
            },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'materials.material_id',
                    foreignField: '_id',
                    as: 'material_info'
                }
            },
            {
                $unwind: '$material_info'
            },
            {
                $group: {
                    _id: '$material_info.categoria',
                    total_cantidad: { $sum: '$materials.cantidad_actual' },
                    total_tecnicos: { $addToSet: '$tecnico_id' },
                    valor_total: { $sum: { $multiply: ['$materials.cantidad_actual', '$material_info.costo_unitario'] } }
                }
            },
            {
                $project: {
                    categoria: '$_id',
                    total_cantidad: 1,
                    total_tecnicos: { $size: '$total_tecnicos' },
                    valor_total: 1
                }
            },
            { $sort: { valor_total: -1 } }
        ]).toArray();

        console.log('\n📈 DISTRIBUCIÓN POR CATEGORÍA:');
        console.log('='.repeat(60));
        let valorTotalGeneral = 0;

        estadisticasEspecializacion.forEach(stat => {
            console.log(`📦 ${stat.categoria}:`);
            console.log(`   • Cantidad total: ${stat.total_cantidad.toLocaleString('es-CO')} unidades`);
            console.log(`   • Técnicos con este material: ${stat.total_tecnicos}`);
            console.log(`   • Valor total: $${stat.valor_total.toLocaleString('es-CO')}`);
            console.log('');
            valorTotalGeneral += stat.valor_total;
        });

        console.log('='.repeat(60));
        console.log(`💰 VALOR TOTAL DE INVENTARIOS: $${valorTotalGeneral.toLocaleString('es-CO')} COP`);
        console.log(`📊 PROMEDIO POR TÉCNICO: $${(valorTotalGeneral / tecnicos.length).toLocaleString('es-CO')} COP`);

        // Top 5 técnicos con mayor valor de inventario
        const topTecnicos = await inventarioCollection.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'tecnico_id',
                    foreignField: '_id',
                    as: 'tecnico'
                }
            },
            {
                $unwind: '$tecnico'
            },
            {
                $unwind: '$materials'
            },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'materials.material_id',
                    foreignField: '_id',
                    as: 'material_info'
                }
            },
            {
                $unwind: '$material_info'
            },
            {
                $group: {
                    _id: '$tecnico_id',
                    nombre_tecnico: { $first: '$tecnico.nombre' },
                    email_tecnico: { $first: '$tecnico.email' },
                    total_materiales: { $sum: 1 },
                    total_cantidad: { $sum: '$materials.cantidad_actual' },
                    valor_total: { $sum: { $multiply: ['$materials.cantidad_actual', '$material_info.costo_unitario'] } }
                }
            },
            { $sort: { valor_total: -1 } },
            { $limit: 5 }
        ]).toArray();

        console.log('\n🏆 TOP 5 TÉCNICOS CON MAYOR VALOR DE INVENTARIO:');
        console.log('='.repeat(60));
        topTecnicos.forEach((tecnico, index) => {
            console.log(`${index + 1}. ${tecnico.nombre_tecnico} (${tecnico.email_tecnico})`);
            console.log(`   • Tipos de materiales: ${tecnico.total_materiales}`);
            console.log(`   • Cantidad total: ${tecnico.total_cantidad.toLocaleString('es-CO')} unidades`);
            console.log(`   • Valor total: $${tecnico.valor_total.toLocaleString('es-CO')}`);
            console.log('');
        });

        console.log('\n🎉 ¡Inventarios de técnicos creados exitosamente!');
        console.log('📋 Los técnicos ya tienen materiales asignados y pueden comenzar a trabajar.');

    } catch (error) {
        console.error('❌ Error creando inventarios:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

// Ejecutar el script
crearInventarioTecnicosCartagena();