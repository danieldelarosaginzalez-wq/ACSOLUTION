import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedRow {
    rowNumber: number;
    data: any;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

export interface ParseResult {
    headers: string[];
    rows: ParsedRow[];
    detectedColumns: Map<string, string>;
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
}

@Injectable()
export class ExcelParserService {
    // Mapeo inteligente de columnas
    private columnMappings = {
        poliza: ['poliza', 'póliza', 'poliza_number', 'num_poliza', 'numero_poliza', 'policy'],
        cliente: ['cliente', 'client', 'customer', 'nombre_cliente', 'nombre', 'name'],
        direccion: ['direccion', 'dirección', 'address', 'ubicacion', 'ubicación', 'location'],
        tecnico: ['tecnico', 'técnico', 'tech', 'technician', 'asignado_a', 'assigned_to'],
        prioridad: ['prioridad', 'priority', 'urgencia', 'urgency'],
        materiales: ['materiales', 'materials', 'items', 'productos', 'products'],
        telefono: ['telefono', 'teléfono', 'phone', 'tel', 'celular', 'mobile'],
        email: ['email', 'correo', 'mail', 'e-mail'],
        observaciones: ['observaciones', 'observations', 'notas', 'notes', 'comentarios', 'comments'],
        fecha: ['fecha', 'date', 'fecha_programada', 'scheduled_date'],
        barrio: ['barrio', 'neighborhood', 'sector', 'zone', 'zona'],
    };

    parseExcel(buffer: Buffer): ParseResult {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir a JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
            throw new Error('El archivo Excel está vacío');
        }

        // Detectar headers
        const headers = Object.keys(jsonData[0]);

        // Auto-mapeo de columnas
        const detectedColumns = this.autoMapColumns(headers);

        // Parsear filas
        const rows: ParsedRow[] = jsonData.map((row, index) => {
            return this.parseRow(row, index + 2, detectedColumns); // +2 porque Excel empieza en 1 y tiene header
        });

        // Calcular estadísticas
        const validRows = rows.filter(r => r.errors.length === 0).length;
        const warningRows = rows.filter(r => r.errors.length === 0 && r.warnings.length > 0).length;
        const errorRows = rows.filter(r => r.errors.length > 0).length;

        return {
            headers,
            rows,
            detectedColumns,
            totalRows: rows.length,
            validRows,
            warningRows,
            errorRows,
        };
    }

    private autoMapColumns(headers: string[]): Map<string, string> {
        const mapped = new Map<string, string>();

        for (const [field, variations] of Object.entries(this.columnMappings)) {
            for (const header of headers) {
                const normalizedHeader = header.toLowerCase().trim();
                if (variations.includes(normalizedHeader)) {
                    mapped.set(field, header);
                    break;
                }
            }
        }

        return mapped;
    }

    private parseRow(row: any, rowNumber: number, columnMap: Map<string, string>): ParsedRow {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        const data: any = {};

        // Extraer datos usando el mapeo
        for (const [field, excelColumn] of columnMap.entries()) {
            data[field] = row[excelColumn];
        }

        // Validaciones básicas
        if (!data.poliza || data.poliza.toString().trim() === '') {
            errors.push('Póliza es obligatoria');
        }

        if (!data.cliente || data.cliente.toString().trim() === '') {
            errors.push('Cliente es obligatorio');
        }

        if (!data.direccion || data.direccion.toString().trim() === '') {
            errors.push('Dirección es obligatoria');
        }

        // Validar formato de póliza (6 dígitos)
        if (data.poliza) {
            const polizaStr = data.poliza.toString().trim();
            if (!/^\d{6}$/.test(polizaStr)) {
                warnings.push('Póliza debe tener 6 dígitos');
                suggestions.push(`Formato esperado: 123456, recibido: ${polizaStr}`);
            }
        }

        // Validar prioridad
        if (data.prioridad) {
            const prioridadNorm = data.prioridad.toString().toLowerCase().trim();
            if (!['alta', 'media', 'baja'].includes(prioridadNorm)) {
                warnings.push('Prioridad debe ser: alta, media o baja');
                suggestions.push(`Se usará 'media' por defecto`);
                data.prioridad = 'media';
            } else {
                data.prioridad = prioridadNorm;
            }
        } else {
            data.prioridad = 'media';
        }

        // Parsear materiales si existen
        if (data.materiales && data.materiales.toString().trim() !== '') {
            try {
                data.materiales_parsed = this.parseMateriales(data.materiales);
            } catch (error) {
                warnings.push(`Error parseando materiales: ${error.message}`);
                data.materiales_parsed = [];
            }
        } else {
            data.materiales_parsed = [];
        }

        // Validar email si existe
        if (data.email && data.email.toString().trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                warnings.push('Email tiene formato inválido');
            }
        }

        // Validar teléfono si existe
        if (data.telefono && data.telefono.toString().trim() !== '') {
            const telefonoStr = data.telefono.toString().replace(/\D/g, '');
            if (telefonoStr.length < 7) {
                warnings.push('Teléfono parece incompleto');
            }
            data.telefono = telefonoStr;
        }

        return {
            rowNumber,
            data,
            errors,
            warnings,
            suggestions,
        };
    }

    private parseMateriales(materialesStr: string): Array<{ nombre: string; cantidad: number }> {
        // Formato esperado: "Tubería:5,Válvula:2,Codo:3"
        // También acepta: "Tubería: 5, Válvula: 2"

        const materiales: Array<{ nombre: string; cantidad: number }> = [];
        const items = materialesStr.split(',');

        for (const item of items) {
            const parts = item.split(':');
            if (parts.length !== 2) {
                throw new Error(`Formato inválido: "${item}". Use "Material:Cantidad"`);
            }

            const nombre = parts[0].trim();
            const cantidad = parseInt(parts[1].trim());

            if (isNaN(cantidad) || cantidad <= 0) {
                throw new Error(`Cantidad inválida para "${nombre}": ${parts[1]}`);
            }

            materiales.push({ nombre, cantidad });
        }

        return materiales;
    }

    generateTemplate(): Buffer {
        // Crear plantilla Excel con ejemplos
        const data = [
            {
                'Póliza': '123456',
                'Cliente': 'Juan Pérez',
                'Dirección': 'Calle 1 #2-3',
                'Técnico': 'Carlos',
                'Prioridad': 'alta',
                'Materiales': 'Tubería:5,Válvula:2',
                'Teléfono': '3001234567',
                'Email': 'juan@example.com',
                'Observaciones': 'Trabajo urgente',
                'Barrio': 'Centro',
            },
            {
                'Póliza': '123457',
                'Cliente': 'Ana García',
                'Dirección': 'Carrera 4 #5-6',
                'Técnico': 'Pedro',
                'Prioridad': 'media',
                'Materiales': 'Codo:3,Llave:1',
                'Teléfono': '3007654321',
                'Email': 'ana@example.com',
                'Observaciones': '',
                'Barrio': 'Norte',
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');

        // Agregar hoja de instrucciones
        const instructions = [
            { Campo: 'Póliza', Descripción: 'Número de póliza (6 dígitos)', Obligatorio: 'SÍ', Ejemplo: '123456' },
            { Campo: 'Cliente', Descripción: 'Nombre del cliente', Obligatorio: 'SÍ', Ejemplo: 'Juan Pérez' },
            { Campo: 'Dirección', Descripción: 'Dirección completa', Obligatorio: 'SÍ', Ejemplo: 'Calle 1 #2-3' },
            { Campo: 'Técnico', Descripción: 'Nombre del técnico', Obligatorio: 'NO', Ejemplo: 'Carlos' },
            { Campo: 'Prioridad', Descripción: 'alta, media o baja', Obligatorio: 'NO', Ejemplo: 'alta' },
            { Campo: 'Materiales', Descripción: 'Material:Cantidad separados por coma', Obligatorio: 'NO', Ejemplo: 'Tubería:5,Válvula:2' },
            { Campo: 'Teléfono', Descripción: 'Teléfono de contacto', Obligatorio: 'NO', Ejemplo: '3001234567' },
            { Campo: 'Email', Descripción: 'Correo electrónico', Obligatorio: 'NO', Ejemplo: 'juan@example.com' },
            { Campo: 'Observaciones', Descripción: 'Notas adicionales', Obligatorio: 'NO', Ejemplo: 'Trabajo urgente' },
            { Campo: 'Barrio', Descripción: 'Barrio o sector', Obligatorio: 'NO', Ejemplo: 'Centro' },
        ];

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
}
