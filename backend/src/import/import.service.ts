import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ExcelParserService, ParsedRow } from './excel-parser.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

export interface ValidationResult {
    row: ParsedRow;
    polizaExists: boolean;
    polizaActive: boolean;
    technicianExists: boolean;
    technicianSuggestions: string[];
    materialsValidation: Array<{ nombre: string; exists: boolean; suggestions: string[] }>;
    canImport: boolean;
}

export interface ImportResult {
    success: boolean;
    created: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
    createdOrders: string[];
}

@Injectable()
export class ImportService {
    constructor(
        @InjectConnection() private connection: Connection,
        private excelParser: ExcelParserService,
        private ordersService: OrdersService,
        private notificationsService: NotificationsService,
        private auditService: AuditService,
    ) { }

    async parseAndValidate(buffer: Buffer): Promise<{ parseResult: any; validations: ValidationResult[] }> {
        // Parsear Excel
        const parseResult = this.excelParser.parseExcel(buffer);

        // Validar cada fila contra la base de datos
        const validations: ValidationResult[] = [];

        for (const row of parseResult.rows) {
            if (row.errors.length > 0) {
                // Si ya tiene errores de parseo, no validar contra BD
                validations.push({
                    row,
                    polizaExists: false,
                    polizaActive: false,
                    technicianExists: false,
                    technicianSuggestions: [],
                    materialsValidation: [],
                    canImport: false,
                });
                continue;
            }

            const validation = await this.validateRow(row);
            validations.push(validation);
        }

        return { parseResult, validations };
    }

    private async validateRow(row: ParsedRow): Promise<ValidationResult> {
        const { data } = row;

        // Validar póliza
        let polizaExists = false;
        let polizaActive = false;

        if (data.poliza) {
            const poliza = await this.connection.model('Poliza').findOne({
                numero_poliza: data.poliza.toString().trim()
            }).exec();

            polizaExists = !!poliza;
            polizaActive = poliza?.estado === 'activa';

            if (!polizaExists) {
                row.errors.push(`Póliza ${data.poliza} no existe en el sistema`);
            } else if (!polizaActive) {
                row.errors.push(`Póliza ${data.poliza} no está activa`);
            }
        }

        // Validar técnico
        let technicianExists = false;
        const technicianSuggestions: string[] = [];

        if (data.tecnico && data.tecnico.toString().trim() !== '') {
            const tecnico = await this.connection.model('User').findOne({
                nombre: new RegExp(`^${data.tecnico}$`, 'i'),
                rol: 'tecnico',
            }).exec();

            technicianExists = !!tecnico;

            if (!technicianExists) {
                // Buscar técnicos similares (IA simple con fuzzy matching)
                const allTechnicians = await this.connection.model('User').find({ rol: 'tecnico' }).exec();
                const suggestions = this.findSimilarNames(data.tecnico, allTechnicians.map(t => t.nombre));
                technicianSuggestions.push(...suggestions);

                if (suggestions.length > 0) {
                    row.warnings.push(`Técnico "${data.tecnico}" no encontrado`);
                    row.suggestions.push(`¿Quisiste decir: ${suggestions.join(', ')}?`);
                } else {
                    row.warnings.push(`Técnico "${data.tecnico}" no encontrado. Se puede asignar después.`);
                }
            }
        }

        // Validar materiales
        const materialsValidation: Array<{ nombre: string; exists: boolean; suggestions: string[] }> = [];

        if (data.materiales_parsed && data.materiales_parsed.length > 0) {
            for (const material of data.materiales_parsed) {
                const materialDoc = await this.connection.model('Material').findOne({
                    nombre: new RegExp(`^${material.nombre}$`, 'i'),
                }).exec();

                const exists = !!materialDoc;
                const suggestions: string[] = [];

                if (!exists) {
                    // Buscar materiales similares
                    const allMaterials = await this.connection.model('Material').find().limit(100).exec();
                    const similarMaterials = this.findSimilarNames(material.nombre, allMaterials.map(m => m.nombre));
                    suggestions.push(...similarMaterials);

                    if (similarMaterials.length > 0) {
                        row.warnings.push(`Material "${material.nombre}" no encontrado`);
                        row.suggestions.push(`¿Quisiste decir: ${similarMaterials.join(', ')}?`);
                    } else {
                        row.warnings.push(`Material "${material.nombre}" no existe en el catálogo`);
                    }
                }

                materialsValidation.push({
                    nombre: material.nombre,
                    exists,
                    suggestions,
                });
            }
        }

        // Determinar si se puede importar
        const canImport = row.errors.length === 0;

        return {
            row,
            polizaExists,
            polizaActive,
            technicianExists,
            technicianSuggestions,
            materialsValidation,
            canImport,
        };
    }

    private findSimilarNames(target: string, candidates: string[], threshold = 0.6): string[] {
        const targetLower = target.toLowerCase();
        const similarities: Array<{ name: string; score: number }> = [];

        for (const candidate of candidates) {
            const score = this.calculateSimilarity(targetLower, candidate.toLowerCase());
            if (score >= threshold) {
                similarities.push({ name: candidate, score });
            }
        }

        // Ordenar por similitud descendente
        similarities.sort((a, b) => b.score - a.score);

        // Retornar top 3
        return similarities.slice(0, 3).map(s => s.name);
    }

    private calculateSimilarity(str1: string, str2: string): number {
        // Algoritmo de Levenshtein simplificado
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1,
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    async importOrders(validations: ValidationResult[], userId: string): Promise<ImportResult> {
        const result: ImportResult = {
            success: true,
            created: 0,
            failed: 0,
            errors: [],
            createdOrders: [],
        };

        // Filtrar solo las que se pueden importar
        const importableRows = validations.filter(v => v.canImport);

        for (const validation of importableRows) {
            try {
                const { data } = validation.row;

                // Buscar técnico si existe
                let tecnicoId = null;
                if (data.tecnico && validation.technicianExists) {
                    const tecnico = await this.connection.model('User').findOne({
                        nombre: new RegExp(`^${data.tecnico}$`, 'i'),
                        rol: 'tecnico',
                    }).exec();
                    tecnicoId = tecnico?._id;
                }

                // Crear OT
                const orderData = {
                    poliza_number: data.poliza.toString().trim(),
                    cliente: data.cliente.toString().trim(),
                    direccion: data.direccion.toString().trim(),
                    telefono: data.telefono || '',
                    email: data.email || '',
                    prioridad: data.prioridad || 'media',
                    observaciones: data.observaciones || '',
                    barrio: data.barrio || '',
                    materiales_sugeridos: data.materiales_parsed || [],
                };

                const order = await this.ordersService.create(orderData, userId);
                result.createdOrders.push(order._id.toString());
                result.created++;

                // Si hay técnico, asignar automáticamente
                if (tecnicoId && data.materiales_parsed && data.materiales_parsed.length > 0) {
                    try {
                        // Preparar apartados (solo materiales que existen)
                        const apartados = [];
                        for (const mat of data.materiales_parsed) {
                            const material = await this.connection.model('Material').findOne({
                                nombre: new RegExp(`^${mat.nombre}$`, 'i'),
                            }).exec();

                            if (material) {
                                apartados.push({
                                    material_id: material._id.toString(),
                                    cantidad: mat.cantidad,
                                });
                            }
                        }

                        if (apartados.length > 0) {
                            await this.ordersService.assignOrder(
                                order._id.toString(),
                                {
                                    tecnico_id: tecnicoId.toString(),
                                    apartados,
                                },
                                userId,
                            );
                        }
                    } catch (assignError) {
                        // Si falla la asignación, la OT queda creada pero sin asignar
                        console.error('Error asignando OT:', assignError);
                    }
                }
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: validation.row.rowNumber,
                    error: error.message,
                });
            }
        }

        // Auditoría
        await this.auditService.log({
            usuario_id: userId as any,
            accion: 'IMPORTACION_EXCEL',
            detalle: `Importadas ${result.created} OTs desde Excel`,
            meta: {
                total: importableRows.length,
                created: result.created,
                failed: result.failed,
            },
        });

        // Notificar a analistas
        if (result.created > 0) {
            const analysts = await this.connection.model('User').find({ role: 'analista' }).exec();
            const analystIds = analysts.map(a => a._id.toString()).filter(id => id !== userId);

            if (analystIds.length > 0) {
                await this.notificationsService.createForUsers(analystIds, {
                    type: 'success',
                    title: '📊 Importación Excel Completada',
                    message: `Se han importado ${result.created} órdenes de trabajo desde Excel`,
                    data: { created: result.created, failed: result.failed },
                });
            }
        }

        result.success = result.failed === 0;
        return result;
    }
}
