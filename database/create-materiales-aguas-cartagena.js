const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ises_isea';

// Materiales específicos para Aguas de Cartagena
const materialesAguasCartagena = [
    // ===== TUBERÍAS PRINCIPALES =====
    {
        nombre: 'Tubería PVC Presión 1/2" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 1/2" x 6m, RDE 21, norma NTC 382, para redes de distribución de agua potable',
        unidad_medida: 'unidad',
        costo_unitario: 12800,
        categoria: 'Tuberías PVC',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-050-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A1'
    },
    {
        nombre: 'Tubería PVC Presión 3/4" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 3/4" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 19200,
        categoria: 'Tuberías PVC',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-075-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A1'
    },
    {
        nombre: 'Tubería PVC Presión 1" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 1" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 28500,
        categoria: 'Tuberías PVC',
        stock_minimo: 35,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-100-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A2'
    },
    {
        nombre: 'Tubería PVC Presión 1 1/4" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 1 1/4" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 38900,
        categoria: 'Tuberías PVC',
        stock_minimo: 25,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-125-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A2'
    },
    {
        nombre: 'Tubería PVC Presión 1 1/2" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 1 1/2" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 48700,
        categoria: 'Tuberías PVC',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-150-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A3'
    },
    {
        nombre: 'Tubería PVC Presión 2" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 2" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 67800,
        categoria: 'Tuberías PVC',
        stock_minimo: 15,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-200-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A3'
    },
    {
        nombre: 'Tubería PVC Presión 3" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 3" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 125000,
        categoria: 'Tuberías PVC',
        stock_minimo: 10,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-300-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A4'
    },
    {
        nombre: 'Tubería PVC Presión 4" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 4" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 185000,
        categoria: 'Tuberías PVC',
        stock_minimo: 8,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-400-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Principal - Estante A4'
    },
    {
        nombre: 'Tubería PVC Presión 6" x 6m RDE 21',
        descripcion: 'Tubería PVC presión 6" x 6m, RDE 21, norma NTC 382',
        unidad_medida: 'unidad',
        costo_unitario: 385000,
        categoria: 'Tuberías PVC',
        stock_minimo: 5,
        estado: 'activo',
        codigo_interno: 'TUB-PVC-600-6M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Patio Exterior - Zona A'
    },

    // ===== ACCESORIOS PVC =====
    {
        nombre: 'Codo PVC 90° 1/2" Presión',
        descripcion: 'Codo PVC 90 grados de 1/2" para tubería a presión, norma NTC 1339',
        unidad_medida: 'unidad',
        costo_unitario: 1850,
        categoria: 'Accesorios PVC',
        stock_minimo: 200,
        estado: 'activo',
        codigo_interno: 'COD-PVC-050-90',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B1'
    },
    {
        nombre: 'Codo PVC 90° 3/4" Presión',
        descripcion: 'Codo PVC 90 grados de 3/4" para tubería a presión',
        unidad_medida: 'unidad',
        costo_unitario: 2650,
        categoria: 'Accesorios PVC',
        stock_minimo: 150,
        estado: 'activo',
        codigo_interno: 'COD-PVC-075-90',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B1'
    },
    {
        nombre: 'Codo PVC 90° 1" Presión',
        descripcion: 'Codo PVC 90 grados de 1" para tubería a presión',
        unidad_medida: 'unidad',
        costo_unitario: 3850,
        categoria: 'Accesorios PVC',
        stock_minimo: 120,
        estado: 'activo',
        codigo_interno: 'COD-PVC-100-90',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B2'
    },
    {
        nombre: 'Codo PVC 45° 1/2" Presión',
        descripcion: 'Codo PVC 45 grados de 1/2" para tubería a presión',
        unidad_medida: 'unidad',
        costo_unitario: 1650,
        categoria: 'Accesorios PVC',
        stock_minimo: 100,
        estado: 'activo',
        codigo_interno: 'COD-PVC-050-45',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B3'
    },
    {
        nombre: 'Tee PVC 1/2" Presión',
        descripcion: 'Tee PVC de 1/2" para tubería a presión, derivación igual',
        unidad_medida: 'unidad',
        costo_unitario: 2450,
        categoria: 'Accesorios PVC',
        stock_minimo: 150,
        estado: 'activo',
        codigo_interno: 'TEE-PVC-050',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B4'
    },
    {
        nombre: 'Tee PVC 3/4" Presión',
        descripcion: 'Tee PVC de 3/4" para tubería a presión, derivación igual',
        unidad_medida: 'unidad',
        costo_unitario: 3650,
        categoria: 'Accesorios PVC',
        stock_minimo: 120,
        estado: 'activo',
        codigo_interno: 'TEE-PVC-075',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B4'
    },
    {
        nombre: 'Reducción PVC 3/4" x 1/2"',
        descripcion: 'Reducción PVC de 3/4" a 1/2" para tubería a presión',
        unidad_medida: 'unidad',
        costo_unitario: 2150,
        categoria: 'Accesorios PVC',
        stock_minimo: 100,
        estado: 'activo',
        codigo_interno: 'RED-PVC-075-050',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B5'
    },
    {
        nombre: 'Unión Universal PVC 1/2"',
        descripcion: 'Unión universal PVC de 1/2" con empaque de caucho',
        unidad_medida: 'unidad',
        costo_unitario: 4850,
        categoria: 'Accesorios PVC',
        stock_minimo: 80,
        estado: 'activo',
        codigo_interno: 'UNI-PVC-050',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B6'
    },
    {
        nombre: 'Adaptador PVC Macho 1/2"',
        descripcion: 'Adaptador PVC macho de 1/2" rosca NPT',
        unidad_medida: 'unidad',
        costo_unitario: 1950,
        categoria: 'Accesorios PVC',
        stock_minimo: 150,
        estado: 'activo',
        codigo_interno: 'ADA-PVC-050-M',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B7'
    },
    {
        nombre: 'Adaptador PVC Hembra 1/2"',
        descripcion: 'Adaptador PVC hembra de 1/2" rosca NPT',
        unidad_medida: 'unidad',
        costo_unitario: 2150,
        categoria: 'Accesorios PVC',
        stock_minimo: 150,
        estado: 'activo',
        codigo_interno: 'ADA-PVC-050-H',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B7'
    },

    // ===== VÁLVULAS Y LLAVES =====
    {
        nombre: 'Válvula de Bola Bronce 1/2" Paso Total',
        descripcion: 'Válvula de bola en bronce de 1/2", paso total, rosca NPT, palanca de acero',
        unidad_medida: 'unidad',
        costo_unitario: 18500,
        categoria: 'Válvulas',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'VAL-BOL-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Válvulas - Estante C1'
    },
    {
        nombre: 'Válvula de Bola Bronce 3/4" Paso Total',
        descripcion: 'Válvula de bola en bronce de 3/4", paso total, rosca NPT',
        unidad_medida: 'unidad',
        costo_unitario: 26800,
        categoria: 'Válvulas',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'VAL-BOL-075',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Válvulas - Estante C1'
    },
    {
        nombre: 'Válvula de Bola Bronce 1" Paso Total',
        descripcion: 'Válvula de bola en bronce de 1", paso total, rosca NPT',
        unidad_medida: 'unidad',
        costo_unitario: 42500,
        categoria: 'Válvulas',
        stock_minimo: 30,
        estado: 'activo',
        codigo_interno: 'VAL-BOL-100',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Válvulas - Estante C2'
    },
    {
        nombre: 'Válvula Check Bronce 1/2" Horizontal',
        descripcion: 'Válvula check (anti-retorno) en bronce de 1/2", instalación horizontal',
        unidad_medida: 'unidad',
        costo_unitario: 22500,
        categoria: 'Válvulas',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'VAL-CHE-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Válvulas - Estante C3'
    },
    {
        nombre: 'Válvula de Compuerta Bronce 1/2"',
        descripcion: 'Válvula de compuerta en bronce de 1/2", rosca NPT, volante de hierro',
        unidad_medida: 'unidad',
        costo_unitario: 35000,
        categoria: 'Válvulas',
        stock_minimo: 25,
        estado: 'activo',
        codigo_interno: 'VAL-COM-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Válvulas - Estante C4'
    },
    {
        nombre: 'Llave de Paso Angular 1/2"',
        descripcion: 'Llave de paso angular cromada de 1/2", para instalación bajo lavamanos',
        unidad_medida: 'unidad',
        costo_unitario: 15800,
        categoria: 'Llaves',
        stock_minimo: 60,
        estado: 'activo',
        codigo_interno: 'LLA-PAS-050',
        proveedor: 'Corona S.A.',
        ubicacion_bodega: 'Bodega Grifería - Estante D1'
    },
    {
        nombre: 'Llave de Jardín Bronce 1/2"',
        descripcion: 'Llave de jardín en bronce cromado de 1/2", rosca NPT',
        unidad_medida: 'unidad',
        costo_unitario: 28500,
        categoria: 'Llaves',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'LLA-JAR-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Grifería - Estante D2'
    },

    // ===== MEDIDORES Y ACCESORIOS =====
    {
        nombre: 'Medidor de Agua 1/2" Clase B Residencial',
        descripcion: 'Medidor de agua potable 1/2" clase B, caudal nominal 1.5 m³/h, uso residencial',
        unidad_medida: 'unidad',
        costo_unitario: 95000,
        categoria: 'Medidores',
        stock_minimo: 30,
        estado: 'activo',
        codigo_interno: 'MED-AGU-050-B',
        proveedor: 'Elster Medidores S.A.',
        ubicacion_bodega: 'Bodega Medidores - Estante E1'
    },
    {
        nombre: 'Medidor de Agua 3/4" Clase C Comercial',
        descripcion: 'Medidor de agua potable 3/4" clase C, caudal nominal 2.5 m³/h, uso comercial',
        unidad_medida: 'unidad',
        costo_unitario: 145000,
        categoria: 'Medidores',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'MED-AGU-075-C',
        proveedor: 'Elster Medidores S.A.',
        ubicacion_bodega: 'Bodega Medidores - Estante E1'
    },
    {
        nombre: 'Caja Protectora para Medidor Plástica',
        descripcion: 'Caja protectora para medidor de agua, plástico ABS resistente UV, con tapa y cerradura',
        unidad_medida: 'unidad',
        costo_unitario: 42000,
        categoria: 'Accesorios Medidores',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'CAJ-MED-PLA',
        proveedor: 'Plastigama S.A.',
        ubicacion_bodega: 'Bodega Medidores - Estante E2'
    },
    {
        nombre: 'Caja Protectora para Medidor Concreto',
        descripcion: 'Caja protectora para medidor de agua en concreto prefabricado, con marco y tapa metálica',
        unidad_medida: 'unidad',
        costo_unitario: 85000,
        categoria: 'Accesorios Medidores',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'CAJ-MED-CON',
        proveedor: 'Prefabricados Cartagena',
        ubicacion_bodega: 'Patio Exterior - Zona B'
    },
    {
        nombre: 'Niple Medidor Bronce 1/2" x 15cm',
        descripcion: 'Niple para medidor en bronce de 1/2" x 15cm, roscado en ambos extremos',
        unidad_medida: 'unidad',
        costo_unitario: 12500,
        categoria: 'Accesorios Medidores',
        stock_minimo: 100,
        estado: 'activo',
        codigo_interno: 'NIP-MED-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Medidores - Cajón E3'
    },

    // ===== GRIFERÍA Y SANITARIOS =====
    {
        nombre: 'Llave Lavamanos Monomando Cromada',
        descripcion: 'Llave monomando para lavamanos, acabado cromado, incluye desagüe automático',
        unidad_medida: 'unidad',
        costo_unitario: 78500,
        categoria: 'Grifería',
        stock_minimo: 25,
        estado: 'activo',
        codigo_interno: 'LLA-LAV-MON',
        proveedor: 'Corona S.A.',
        ubicacion_bodega: 'Bodega Grifería - Estante D3'
    },
    {
        nombre: 'Llave Ducha Sencilla Cromada',
        descripcion: 'Llave para ducha sencilla, acabado cromado, incluye regadera plástica',
        unidad_medida: 'unidad',
        costo_unitario: 65000,
        categoria: 'Grifería',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'LLA-DUC-SEN',
        proveedor: 'Corona S.A.',
        ubicacion_bodega: 'Bodega Grifería - Estante D4'
    },
    {
        nombre: 'Llave Fregadero Cuello Móvil',
        descripcion: 'Llave para fregadero con cuello móvil, acabado cromado, aireador incluido',
        unidad_medida: 'unidad',
        costo_unitario: 95000,
        categoria: 'Grifería',
        stock_minimo: 15,
        estado: 'activo',
        codigo_interno: 'LLA-FRE-MOV',
        proveedor: 'Corona S.A.',
        ubicacion_bodega: 'Bodega Grifería - Estante D5'
    },

    // ===== TANQUES Y ALMACENAMIENTO =====
    {
        nombre: 'Tanque de Agua Polietileno 500L',
        descripcion: 'Tanque de almacenamiento de agua en polietileno de alta densidad, 500 litros, color azul',
        unidad_medida: 'unidad',
        costo_unitario: 320000,
        categoria: 'Tanques',
        stock_minimo: 10,
        estado: 'activo',
        codigo_interno: 'TAN-POL-500',
        proveedor: 'Eternit Colombiana S.A.',
        ubicacion_bodega: 'Patio Exterior - Zona C'
    },
    {
        nombre: 'Tanque de Agua Polietileno 1000L',
        descripcion: 'Tanque de almacenamiento de agua en polietileno de alta densidad, 1000 litros, color azul',
        unidad_medida: 'unidad',
        costo_unitario: 485000,
        categoria: 'Tanques',
        stock_minimo: 8,
        estado: 'activo',
        codigo_interno: 'TAN-POL-1000',
        proveedor: 'Eternit Colombiana S.A.',
        ubicacion_bodega: 'Patio Exterior - Zona C'
    },
    {
        nombre: 'Tanque de Agua Polietileno 2000L',
        descripcion: 'Tanque de almacenamiento de agua en polietileno de alta densidad, 2000 litros, color azul',
        unidad_medida: 'unidad',
        costo_unitario: 850000,
        categoria: 'Tanques',
        stock_minimo: 5,
        estado: 'activo',
        codigo_interno: 'TAN-POL-2000',
        proveedor: 'Eternit Colombiana S.A.',
        ubicacion_bodega: 'Patio Exterior - Zona C'
    },
    {
        nombre: 'Flotador Automático para Tanque 1/2"',
        descripcion: 'Flotador automático para tanque de agua, entrada 1/2", caudal regulable',
        unidad_medida: 'unidad',
        costo_unitario: 28500,
        categoria: 'Accesorios Tanques',
        stock_minimo: 30,
        estado: 'activo',
        codigo_interno: 'FLO-TAN-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B8'
    },

    // ===== BOMBAS Y EQUIPOS =====
    {
        nombre: 'Bomba Periférica 1/2 HP Monofásica',
        descripcion: 'Bomba periférica 1/2 HP, monofásica 110V, caudal máximo 35 L/min, altura 40m',
        unidad_medida: 'unidad',
        costo_unitario: 420000,
        categoria: 'Bombas',
        stock_minimo: 8,
        estado: 'activo',
        codigo_interno: 'BOM-PER-050',
        proveedor: 'Pedrollo Colombia',
        ubicacion_bodega: 'Bodega Equipos - Estante F1'
    },
    {
        nombre: 'Bomba Centrífuga 1 HP Monofásica',
        descripcion: 'Bomba centrífuga 1 HP, monofásica 110V, caudal máximo 60 L/min, altura 35m',
        unidad_medida: 'unidad',
        costo_unitario: 580000,
        categoria: 'Bombas',
        stock_minimo: 6,
        estado: 'activo',
        codigo_interno: 'BOM-CEN-100',
        proveedor: 'Pedrollo Colombia',
        ubicacion_bodega: 'Bodega Equipos - Estante F1'
    },
    {
        nombre: 'Bomba Sumergible 1 HP Trifásica',
        descripcion: 'Bomba sumergible 1 HP, trifásica 220V, para pozos profundos, caudal 45 L/min',
        unidad_medida: 'unidad',
        costo_unitario: 950000,
        categoria: 'Bombas',
        stock_minimo: 4,
        estado: 'activo',
        codigo_interno: 'BOM-SUM-100',
        proveedor: 'Pedrollo Colombia',
        ubicacion_bodega: 'Bodega Equipos - Estante F2'
    },
    {
        nombre: 'Presostato para Bomba 20-40 PSI',
        descripcion: 'Presostato automático para bomba, rango 20-40 PSI, con manómetro incluido',
        unidad_medida: 'unidad',
        costo_unitario: 85000,
        categoria: 'Accesorios Bombas',
        stock_minimo: 15,
        estado: 'activo',
        codigo_interno: 'PRE-BOM-2040',
        proveedor: 'Pedrollo Colombia',
        ubicacion_bodega: 'Bodega Equipos - Cajón F3'
    },

    // ===== HERRAMIENTAS Y CONSUMIBLES =====
    {
        nombre: 'Pegante PVC Presión 1/4 Galón',
        descripcion: 'Pegante para tubería PVC a presión, presentación 1/4 galón, secado rápido',
        unidad_medida: 'unidad',
        costo_unitario: 22500,
        categoria: 'Consumibles',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'PEG-PVC-025',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Consumibles - Estante G1'
    },
    {
        nombre: 'Limpiador PVC 1/4 Galón',
        descripcion: 'Limpiador para tubería PVC, remueve grasa y suciedad antes del pegado',
        unidad_medida: 'unidad',
        costo_unitario: 18500,
        categoria: 'Consumibles',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'LIM-PVC-025',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Consumibles - Estante G1'
    },
    {
        nombre: 'Cinta Teflón 12mm x 10m',
        descripcion: 'Cinta teflón para sellado de roscas, ancho 12mm, longitud 10m',
        unidad_medida: 'rollo',
        costo_unitario: 3200,
        categoria: 'Consumibles',
        stock_minimo: 200,
        estado: 'activo',
        codigo_interno: 'TEF-CIN-12',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Consumibles - Cajón G2'
    },
    {
        nombre: 'Silicona Sellante Transparente 300ml',
        descripcion: 'Silicona sellante transparente para uso sanitario, cartucho 300ml',
        unidad_medida: 'unidad',
        costo_unitario: 12500,
        categoria: 'Consumibles',
        stock_minimo: 80,
        estado: 'activo',
        codigo_interno: 'SIL-SEL-300',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Consumibles - Cajón G3'
    },
    {
        nombre: 'Pasta Sellante para Roscas 250g',
        descripcion: 'Pasta sellante para roscas metálicas, resistente a altas presiones, envase 250g',
        unidad_medida: 'unidad',
        costo_unitario: 15800,
        categoria: 'Consumibles',
        stock_minimo: 60,
        estado: 'activo',
        codigo_interno: 'PAS-SEL-250',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Consumibles - Cajón G4'
    },

    // ===== MANGUERAS Y FLEXIBLES =====
    {
        nombre: 'Manguera PVC Cristal 1/2" x 50m',
        descripcion: 'Manguera PVC cristal transparente 1/2", rollo de 50 metros, para agua potable',
        unidad_medida: 'rollo',
        costo_unitario: 125000,
        categoria: 'Mangueras',
        stock_minimo: 15,
        estado: 'activo',
        codigo_interno: 'MAN-CRI-050',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Mangueras - Estante H1'
    },
    {
        nombre: 'Manguera PVC Negra 3/4" x 50m',
        descripcion: 'Manguera PVC negra 3/4", rollo de 50 metros, resistente a rayos UV',
        unidad_medida: 'rollo',
        costo_unitario: 185000,
        categoria: 'Mangueras',
        stock_minimo: 12,
        estado: 'activo',
        codigo_interno: 'MAN-NEG-075',
        proveedor: 'Pavco Colombia S.A.',
        ubicacion_bodega: 'Bodega Mangueras - Estante H1'
    },
    {
        nombre: 'Flexible Acero Inoxidable 1/2" x 30cm',
        descripcion: 'Flexible de acero inoxidable 1/2" x 30cm, para conexión de grifería',
        unidad_medida: 'unidad',
        costo_unitario: 18500,
        categoria: 'Flexibles',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'FLE-ACE-050',
        proveedor: 'Grival S.A.',
        ubicacion_bodega: 'Bodega Grifería - Cajón D6'
    },

    // ===== ACCESORIOS ESPECIALES =====
    {
        nombre: 'Abrazadera Metálica 1/2" con Tornillo',
        descripcion: 'Abrazadera metálica galvanizada para tubería 1/2", incluye tornillo y tuerca',
        unidad_medida: 'unidad',
        costo_unitario: 2800,
        categoria: 'Accesorios Metálicos',
        stock_minimo: 200,
        estado: 'activo',
        codigo_interno: 'ABR-MET-050',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B9'
    },
    {
        nombre: 'Abrazadera Metálica 3/4" con Tornillo',
        descripcion: 'Abrazadera metálica galvanizada para tubería 3/4", incluye tornillo y tuerca',
        unidad_medida: 'unidad',
        costo_unitario: 3500,
        categoria: 'Accesorios Metálicos',
        stock_minimo: 150,
        estado: 'activo',
        codigo_interno: 'ABR-MET-075',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Accesorios - Cajón B9'
    },
    {
        nombre: 'Filtro de Agua 10" Sedimentos',
        descripcion: 'Filtro de agua de 10 pulgadas para sedimentos, cartucho de polipropileno',
        unidad_medida: 'unidad',
        costo_unitario: 28500,
        categoria: 'Filtros',
        stock_minimo: 40,
        estado: 'activo',
        codigo_interno: 'FIL-SED-10',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Filtros - Estante I1'
    },
    {
        nombre: 'Carcasa para Filtro 10" Transparente',
        descripcion: 'Carcasa transparente para filtro de 10 pulgadas, incluye llave de purga',
        unidad_medida: 'unidad',
        costo_unitario: 45000,
        categoria: 'Filtros',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'CAR-FIL-10',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Filtros - Estante I1'
    },

    // ===== MATERIALES PARA REPARACIONES DE EMERGENCIA =====
    {
        nombre: 'Banda Reparadora Universal 4"',
        descripcion: 'Banda reparadora universal para tuberías de 4 pulgadas, acero inoxidable con caucho',
        unidad_medida: 'unidad',
        costo_unitario: 85000,
        categoria: 'Reparaciones',
        stock_minimo: 20,
        estado: 'activo',
        codigo_interno: 'BAN-REP-4',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Emergencias - Estante J1'
    },
    {
        nombre: 'Masilla Epóxica Reparación Tuberías',
        descripcion: 'Masilla epóxica bicomponente para reparación de tuberías bajo presión, 500g',
        unidad_medida: 'unidad',
        costo_unitario: 35000,
        categoria: 'Reparaciones',
        stock_minimo: 30,
        estado: 'activo',
        codigo_interno: 'MAS-EPO-500',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Emergencias - Cajón J2'
    },
    {
        nombre: 'Cinta Autofundente 19mm x 9m',
        descripcion: 'Cinta autofundente para reparación de tuberías, ancho 19mm, longitud 9m',
        unidad_medida: 'rollo',
        costo_unitario: 25000,
        categoria: 'Reparaciones',
        stock_minimo: 50,
        estado: 'activo',
        codigo_interno: 'CIN-AUT-19',
        proveedor: 'Varios Proveedores',
        ubicacion_bodega: 'Bodega Emergencias - Cajón J3'
    }
];

async function crearMaterialesAguasCartagena() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para Aguas de Cartagena');

        const db = client.db(dbName);
        const materialesCollection = db.collection('materials');

        // Verificar si ya existen materiales
        const existingCount = await materialesCollection.countDocuments();
        console.log(`📊 Materiales existentes en la base de datos: ${existingCount}`);

        if (existingCount > 0) {
            console.log('⚠️  Ya existen materiales. ¿Desea continuar? (Esto agregará más materiales)');
        }

        // Insertar nuevos materiales
        const result = await materialesCollection.insertMany(materialesAguasCartagena);
        console.log(`✅ Insertados ${result.insertedCount} materiales específicos para Aguas de Cartagena`);

        // Generar estadísticas por categoría
        const estadisticasPorCategoria = await materialesCollection.aggregate([
            {
                $group: {
                    _id: '$categoria',
                    cantidad_items: { $sum: 1 },
                    valor_promedio: { $avg: '$costo_unitario' },
                    valor_total_estimado: { $sum: '$costo_unitario' },
                    stock_minimo_total: { $sum: '$stock_minimo' }
                }
            },
            { $sort: { cantidad_items: -1 } }
        ]).toArray();

        console.log('\n📊 ESTADÍSTICAS POR CATEGORÍA - AGUAS DE CARTAGENA:');
        console.log('='.repeat(80));

        let valorTotalInventario = 0;
        let stockMinimoTotal = 0;

        estadisticasPorCategoria.forEach((categoria) => {
            console.log(`📦 ${categoria._id}:`);
            console.log(`   • Items: ${categoria.cantidad_items}`);
            console.log(`   • Valor promedio: $${categoria.valor_promedio.toLocaleString('es-CO')}`);
            console.log(`   • Valor total: $${categoria.valor_total_estimado.toLocaleString('es-CO')}`);
            console.log(`   • Stock mínimo: ${categoria.stock_minimo_total} unidades`);
            console.log('');

            valorTotalInventario += categoria.valor_total_estimado;
            stockMinimoTotal += categoria.stock_minimo_total;
        });

        console.log('='.repeat(80));
        console.log(`💰 VALOR TOTAL DEL INVENTARIO: $${valorTotalInventario.toLocaleString('es-CO')} COP`);
        console.log(`📦 STOCK MÍNIMO TOTAL: ${stockMinimoTotal.toLocaleString('es-CO')} unidades`);
        console.log(`🏢 TOTAL DE CATEGORÍAS: ${estadisticasPorCategoria.length}`);
        console.log(`📋 TOTAL DE MATERIALES: ${result.insertedCount}`);

        // Materiales más costosos
        const materialesCostosos = await materialesCollection.find({})
            .sort({ costo_unitario: -1 })
            .limit(10)
            .toArray();

        console.log('\n💎 TOP 10 MATERIALES MÁS COSTOSOS:');
        console.log('='.repeat(80));
        materialesCostosos.forEach((material, index) => {
            console.log(`${index + 1}. ${material.nombre}`);
            console.log(`   Precio: $${material.costo_unitario.toLocaleString('es-CO')}`);
            console.log(`   Categoría: ${material.categoria}`);
            console.log('');
        });

        // Generar reporte de ubicaciones
        const ubicaciones = await materialesCollection.aggregate([
            {
                $group: {
                    _id: '$ubicacion_bodega',
                    cantidad_materiales: { $sum: 1 },
                    categorias: { $addToSet: '$categoria' }
                }
            },
            { $sort: { cantidad_materiales: -1 } }
        ]).toArray();

        console.log('\n🏪 DISTRIBUCIÓN POR UBICACIONES EN BODEGA:');
        console.log('='.repeat(80));
        ubicaciones.forEach((ubicacion) => {
            console.log(`📍 ${ubicacion._id}:`);
            console.log(`   • Materiales: ${ubicacion.cantidad_materiales}`);
            console.log(`   • Categorías: ${ubicacion.categorias.join(', ')}`);
            console.log('');
        });

        console.log('\n🎉 ¡Materiales de Aguas de Cartagena creados exitosamente!');
        console.log('📋 El inventario está listo para ser utilizado en el sistema de distribución de materiales.');

    } catch (error) {
        console.error('❌ Error creando materiales:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

// Ejecutar el script
crearMaterialesAguasCartagena();