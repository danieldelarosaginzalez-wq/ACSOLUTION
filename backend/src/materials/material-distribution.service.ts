import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialControl, MaterialControlDocument } from '../schemas/material-control.schema';
import { InventoryTechnician, InventoryTechnicianDocument } from '../schemas/inventory-technician.schema';
import { MovimientoInventario, MovimientoInventarioDocument } from '../schemas/movimiento-inventario.schema';
import { Material, MaterialDocument } from '../schemas/material.schema';
import { Order, OrderDocument } from '../schemas/order.schema';

// Interfaces para tipos populados
interface PopulatedMaterial {
    _id: Types.ObjectId;
    nombre: string;
    unidad_medida: string;
    costo_unitario: number;
}

interface PopulatedUser {
    _id: Types.ObjectId;
    nombre: string;
    email: string;
}

interface PopulatedOrder {
    _id: Types.ObjectId;
    numero: string;
}

interface PopulatedMaterialAsignado {
    material_id: PopulatedMaterial;
    cantidad_asignada: number;
    cantidad_utilizada: number;
    cantidad_devuelta: number;
    cantidad_perdida: number;
    motivo_perdida?: string;
    estado: string;
}

export interface PopulatedMaterialControl {
    _id: Types.ObjectId;
    tecnico_id: PopulatedUser;
    orden_trabajo_id?: PopulatedOrder;
    materiales_asignados: PopulatedMaterialAsignado[];
    fecha_asignacion: Date;
    fecha_inicio_trabajo?: Date;
    fecha_fin_trabajo?: Date;
    fecha_devolucion?: Date;
    estado_general: string;
    bodeguero_asigno: Types.ObjectId;
    analista_supervisa?: Types.ObjectId;
    observaciones_bodeguero?: string;
    observaciones_tecnico?: string;
    observaciones_analista?: string;
    tiene_descuadre: boolean;
    motivo_descuadre?: string;
    valor_descuadre: number;
    descuadre_resuelto: boolean;
    fecha_resolucion_descuadre?: Date;
}
import { InventoryService } from '../inventory/inventory.service';

export interface MaterialAsignacionDto {
    material_id: string;
    cantidad: number;
}

export interface AsignarMaterialesDto {
    tecnico_id: string;
    orden_trabajo_id?: string;
    materiales: MaterialAsignacionDto[];
    observaciones?: string;
}

export interface DevolverMaterialesDto {
    control_id: string;
    materiales_devueltos: {
        material_id: string;
        cantidad_utilizada: number;
        cantidad_devuelta: number;
        cantidad_perdida?: number;
        motivo_perdida?: string;
    }[];
    observaciones_tecnico?: string;
}

@Injectable()
export class MaterialDistributionService {
    constructor(
        @InjectModel(MaterialControl.name) private materialControlModel: Model<MaterialControlDocument>,
        @InjectModel(InventoryTechnician.name) private inventoryTechnicianModel: Model<InventoryTechnicianDocument>,
        @InjectModel(MovimientoInventario.name) private movimientoInventarioModel: Model<MovimientoInventarioDocument>,
        @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private inventoryService: InventoryService,
    ) { }

    // Asignar materiales a un técnico (usado por bodeguero)
    async asignarMateriales(asignacionDto: AsignarMaterialesDto, bodeguero_id: string) {
        const { tecnico_id, orden_trabajo_id, materiales, observaciones } = asignacionDto;

        // Verificar que el técnico existe
        const inventarioTecnico = await this.inventoryTechnicianModel.findOne({ tecnico_id: new Types.ObjectId(tecnico_id) });
        if (!inventarioTecnico) {
            throw new NotFoundException('Técnico no encontrado en el inventario');
        }

        // Verificar disponibilidad de materiales
        for (const material of materiales) {
            const materialInfo = inventarioTecnico.materials.find(m => m.material_id.toString() === material.material_id);
            if (!materialInfo || materialInfo.cantidad_disponible < material.cantidad) {
                const materialDoc = await this.materialModel.findById(material.material_id);
                throw new BadRequestException(`Material ${materialDoc?.nombre || material.material_id} no tiene suficiente stock disponible`);
            }
        }

        // Crear el control de materiales
        const materialControl = new this.materialControlModel({
            tecnico_id: new Types.ObjectId(tecnico_id),
            orden_trabajo_id: orden_trabajo_id ? new Types.ObjectId(orden_trabajo_id) : undefined,
            materiales_asignados: materiales.map(m => ({
                material_id: new Types.ObjectId(m.material_id),
                cantidad_asignada: m.cantidad,
                cantidad_utilizada: 0,
                cantidad_devuelta: 0,
                cantidad_perdida: 0,
                estado: 'pendiente'
            })),
            fecha_asignacion: new Date(),
            estado_general: 'asignado',
            bodeguero_asigno: new Types.ObjectId(bodeguero_id),
            observaciones_bodeguero: observaciones
        });

        await materialControl.save();

        // Actualizar inventario del técnico (apartar materiales)
        for (const material of materiales) {
            await this.inventoryTechnicianModel.updateOne(
                {
                    tecnico_id: new Types.ObjectId(tecnico_id),
                    'materials.material_id': new Types.ObjectId(material.material_id)
                },
                {
                    $inc: {
                        'materials.$.cantidad_apartada': material.cantidad,
                        'materials.$.cantidad_disponible': -material.cantidad
                    },
                    $set: {
                        'materials.$.ultimo_movimiento': new Date(),
                        updated_at: new Date()
                    }
                }
            );

            // Registrar movimiento
            await this.movimientoInventarioModel.create({
                tecnico_id: new Types.ObjectId(tecnico_id),
                material_id: new Types.ObjectId(material.material_id),
                tipo: 'apartado',
                cantidad: material.cantidad,
                motivo: `Asignación para ${orden_trabajo_id ? 'OT' : 'trabajo'}: ${orden_trabajo_id || 'Sin OT específica'}`,
                usuario_responsable: new Types.ObjectId(bodeguero_id),
                origen: orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: orden_trabajo_id ? new Types.ObjectId(orden_trabajo_id) : undefined,
                fecha: new Date()
            });
        }

        return materialControl;
    }

    // Iniciar trabajo (técnico confirma que empezó a usar los materiales)
    async iniciarTrabajo(control_id: string, tecnico_id: string) {
        const control = await this.materialControlModel.findById(control_id);
        if (!control) {
            throw new NotFoundException('Control de materiales no encontrado');
        }

        if (control.tecnico_id.toString() !== tecnico_id) {
            throw new BadRequestException('No tienes permisos para este control de materiales');
        }

        if (control.estado_general !== 'asignado') {
            throw new BadRequestException('Los materiales ya fueron iniciados o no están en estado asignado');
        }

        // Actualizar estado
        control.estado_general = 'en_trabajo';
        control.fecha_inicio_trabajo = new Date();

        // Cambiar materiales apartados a en uso
        for (const material of control.materiales_asignados) {
            material.estado = 'en_uso';
        }

        await control.save();

        // Actualizar inventario (mover de apartado a en uso)
        for (const material of control.materiales_asignados) {
            await this.inventoryTechnicianModel.updateOne(
                {
                    tecnico_id: new Types.ObjectId(tecnico_id),
                    'materials.material_id': material.material_id
                },
                {
                    $inc: {
                        'materials.$.cantidad_apartada': -material.cantidad_asignada,
                        'materials.$.cantidad_actual': -material.cantidad_asignada
                    },
                    $set: {
                        'materials.$.ultimo_movimiento': new Date(),
                        updated_at: new Date()
                    }
                }
            );

            // Registrar movimiento
            await this.movimientoInventarioModel.create({
                tecnico_id: new Types.ObjectId(tecnico_id),
                material_id: material.material_id,
                tipo: 'salida',
                cantidad: material.cantidad_asignada,
                motivo: 'Inicio de trabajo - Material en uso',
                usuario_responsable: new Types.ObjectId(tecnico_id),
                origen: control.orden_trabajo_id ? 'OT' : 'Manual',
                referencia_origen_id: control.orden_trabajo_id,
                fecha: new Date()
            });
        }

        return control;
    }

    // Devolver materiales (técnico reporta qué usó y qué devuelve)
    async devolverMateriales(devolucionDto: DevolverMaterialesDto, tecnico_id: string) {
        const { control_id, materiales_devueltos, observaciones_tecnico } = devolucionDto;

        const control = await this.materialControlModel.findById(control_id);
        if (!control) {
            throw new NotFoundException('Control de materiales no encontrado');
        }

        if (control.tecnico_id.toString() !== tecnico_id) {
            throw new BadRequestException('No tienes permisos para este control de materiales');
        }

        if (control.estado_general !== 'en_trabajo' && control.estado_general !== 'trabajo_completado') {
            throw new BadRequestException('No se pueden devolver materiales en el estado actual');
        }

        let tiene_descuadre = false;
        let valor_descuadre = 0;
        let motivos_descuadre = [];

        // Procesar cada material devuelto
        for (const materialDevuelto of materiales_devueltos) {
            const materialAsignado = control.materiales_asignados.find(
                m => m.material_id.toString() === materialDevuelto.material_id
            );

            if (!materialAsignado) {
                throw new BadRequestException(`Material ${materialDevuelto.material_id} no está en esta asignación`);
            }

            // Validar cantidades
            const totalReportado = materialDevuelto.cantidad_utilizada + materialDevuelto.cantidad_devuelta + (materialDevuelto.cantidad_perdida || 0);
            if (totalReportado !== materialAsignado.cantidad_asignada) {
                tiene_descuadre = true;
                const diferencia = materialAsignado.cantidad_asignada - totalReportado;
                motivos_descuadre.push(`Material ${materialDevuelto.material_id}: diferencia de ${diferencia} unidades`);

                // Calcular valor del descuadre
                const materialDoc = await this.materialModel.findById(materialDevuelto.material_id);
                if (materialDoc) {
                    valor_descuadre += Math.abs(diferencia) * materialDoc.costo_unitario;
                }
            }

            // Actualizar el material asignado
            materialAsignado.cantidad_utilizada = materialDevuelto.cantidad_utilizada;
            materialAsignado.cantidad_devuelta = materialDevuelto.cantidad_devuelta;
            materialAsignado.cantidad_perdida = materialDevuelto.cantidad_perdida || 0;
            materialAsignado.motivo_perdida = materialDevuelto.motivo_perdida;
            materialAsignado.estado = materialDevuelto.cantidad_devuelta > 0 ?
                (materialDevuelto.cantidad_devuelta === materialAsignado.cantidad_asignada ? 'devuelto_total' : 'devuelto_parcial') :
                'completado';

            // Devolver material al inventario si hay devolución
            if (materialDevuelto.cantidad_devuelta > 0) {
                await this.inventoryTechnicianModel.updateOne(
                    {
                        tecnico_id: new Types.ObjectId(tecnico_id),
                        'materials.material_id': new Types.ObjectId(materialDevuelto.material_id)
                    },
                    {
                        $inc: {
                            'materials.$.cantidad_actual': materialDevuelto.cantidad_devuelta,
                            'materials.$.cantidad_disponible': materialDevuelto.cantidad_devuelta
                        },
                        $set: {
                            'materials.$.ultimo_movimiento': new Date(),
                            updated_at: new Date()
                        }
                    }
                );

                // Registrar movimiento de devolución
                await this.movimientoInventarioModel.create({
                    tecnico_id: new Types.ObjectId(tecnico_id),
                    material_id: new Types.ObjectId(materialDevuelto.material_id),
                    tipo: 'devolucion',
                    cantidad: materialDevuelto.cantidad_devuelta,
                    motivo: 'Devolución de material no utilizado',
                    usuario_responsable: new Types.ObjectId(tecnico_id),
                    origen: control.orden_trabajo_id ? 'OT' : 'Manual',
                    referencia_origen_id: control.orden_trabajo_id,
                    fecha: new Date()
                });
            }
        }

        // Actualizar control
        control.estado_general = 'devolucion_completada';
        control.fecha_devolucion = new Date();
        control.observaciones_tecnico = observaciones_tecnico;
        control.tiene_descuadre = tiene_descuadre;
        control.motivo_descuadre = motivos_descuadre.join('; ');
        control.valor_descuadre = valor_descuadre;

        if (!control.fecha_fin_trabajo) {
            control.fecha_fin_trabajo = new Date();
        }

        await control.save();

        return {
            control,
            tiene_descuadre,
            valor_descuadre,
            motivos_descuadre
        };
    }

    // Obtener controles pendientes de devolución
    async getControlesPendientes(tecnico_id?: string): Promise<PopulatedMaterialControl[]> {
        const filter: any = {
            estado_general: { $in: ['asignado', 'en_trabajo', 'trabajo_completado', 'devolucion_pendiente'] }
        };

        if (tecnico_id) {
            filter.tecnico_id = new Types.ObjectId(tecnico_id);
        }

        return this.materialControlModel
            .find(filter)
            .populate('tecnico_id', 'nombre email')
            .populate('orden_trabajo_id')
            .populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario')
            .populate('bodeguero_asigno', 'nombre')
            .sort({ fecha_asignacion: -1 }) as any;
    }

    // Obtener descuadres para analistas
    async getDescuadres(resueltos = false): Promise<PopulatedMaterialControl[]> {
        return this.materialControlModel
            .find({
                tiene_descuadre: true,
                descuadre_resuelto: resueltos
            })
            .populate('tecnico_id', 'nombre email')
            .populate('orden_trabajo_id')
            .populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario')
            .populate('bodeguero_asigno', 'nombre')
            .sort({ fecha_devolucion: -1 }) as any;
    }

    // Resolver descuadre (analista)
    async resolverDescuadre(control_id: string, analista_id: string, observaciones: string) {
        const control = await this.materialControlModel.findById(control_id);
        if (!control) {
            throw new NotFoundException('Control no encontrado');
        }

        if (!control.tiene_descuadre) {
            throw new BadRequestException('Este control no tiene descuadres');
        }

        control.descuadre_resuelto = true;
        control.fecha_resolucion_descuadre = new Date();
        control.analista_supervisa = new Types.ObjectId(analista_id);
        control.observaciones_analista = observaciones;
        control.estado_general = 'cerrado';

        await control.save();
        return control;
    }

    // Estadísticas para el dashboard
    async getEstadisticas() {
        const [
            controles_activos,
            descuadres_pendientes,
            valor_total_descuadres,
            materiales_en_uso
        ] = await Promise.all([
            this.materialControlModel.countDocuments({
                estado_general: { $in: ['asignado', 'en_trabajo', 'devolucion_pendiente'] }
            }),
            this.materialControlModel.countDocuments({
                tiene_descuadre: true,
                descuadre_resuelto: false
            }),
            this.materialControlModel.aggregate([
                { $match: { tiene_descuadre: true, descuadre_resuelto: false } },
                { $group: { _id: null, total: { $sum: '$valor_descuadre' } } }
            ]),
            this.materialControlModel.aggregate([
                { $match: { estado_general: 'en_trabajo' } },
                { $unwind: '$materiales_asignados' },
                {
                    $group: {
                        _id: '$materiales_asignados.material_id',
                        cantidad_total: { $sum: '$materiales_asignados.cantidad_asignada' }
                    }
                },
                {
                    $lookup: {
                        from: 'materials',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'material'
                    }
                },
                { $unwind: '$material' },
                {
                    $project: {
                        nombre: '$material.nombre',
                        cantidad_total: 1,
                        valor_total: { $multiply: ['$cantidad_total', '$material.costo_unitario'] }
                    }
                }
            ])
        ]);

        return {
            controles_activos,
            descuadres_pendientes,
            valor_total_descuadres: valor_total_descuadres[0]?.total || 0,
            materiales_en_uso
        };
    }

    // MÉTODOS DE INTEGRACIÓN CON SISTEMA EXISTENTE

    // Obtener vista consolidada de materiales por técnico (inventario + asignaciones)
    async getVistaConsolidadaTecnico(tecnico_id: string) {
        const [inventario, controlesActivos, historialMovimientos] = await Promise.all([
            this.inventoryService.getByTech(tecnico_id),
            this.materialControlModel.find({
                tecnico_id: new Types.ObjectId(tecnico_id),
                estado_general: { $in: ['asignado', 'en_trabajo', 'devolucion_pendiente'] }
            }).populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario'),
            this.movimientoInventarioModel.find({
                tecnico_id: new Types.ObjectId(tecnico_id)
            }).populate('material_id', 'nombre unidad_medida').sort({ fecha: -1 }).limit(50)
        ]);

        // Consolidar información
        const materialesConsolidados = new Map();

        // Agregar materiales del inventario normal
        inventario.materials.forEach(material => {
            const materialId = material.material_id.toString();
            materialesConsolidados.set(materialId, {
                material_id: material.material_id,
                inventario_normal: {
                    cantidad_actual: material.cantidad_actual,
                    cantidad_apartada: material.cantidad_apartada,
                    cantidad_disponible: material.cantidad_disponible,
                    ultimo_movimiento: material.ultimo_movimiento
                },
                asignaciones_activas: [],
                total_asignado_pendiente: 0,
                total_en_uso: 0
            });
        });

        // Agregar materiales de asignaciones activas
        controlesActivos.forEach(control => {
            control.materiales_asignados.forEach(materialAsignado => {
                const materialId = materialAsignado.material_id._id.toString();

                if (!materialesConsolidados.has(materialId)) {
                    materialesConsolidados.set(materialId, {
                        material_id: materialAsignado.material_id,
                        inventario_normal: {
                            cantidad_actual: 0,
                            cantidad_apartada: 0,
                            cantidad_disponible: 0,
                            ultimo_movimiento: null
                        },
                        asignaciones_activas: [],
                        total_asignado_pendiente: 0,
                        total_en_uso: 0
                    });
                }

                const materialConsolidado = materialesConsolidados.get(materialId);
                materialConsolidado.asignaciones_activas.push({
                    control_id: control._id,
                    orden_trabajo_id: control.orden_trabajo_id,
                    cantidad_asignada: materialAsignado.cantidad_asignada,
                    cantidad_utilizada: materialAsignado.cantidad_utilizada,
                    cantidad_devuelta: materialAsignado.cantidad_devuelta,
                    estado: materialAsignado.estado,
                    fecha_asignacion: control.fecha_asignacion,
                    estado_control: control.estado_general
                });

                if (control.estado_general === 'asignado') {
                    materialConsolidado.total_asignado_pendiente += materialAsignado.cantidad_asignada;
                } else if (control.estado_general === 'en_trabajo') {
                    materialConsolidado.total_en_uso += materialAsignado.cantidad_asignada;
                }
            });
        });

        return {
            tecnico_id,
            materiales_consolidados: Array.from(materialesConsolidados.values()),
            resumen: {
                total_materiales_diferentes: materialesConsolidados.size,
                total_en_inventario_normal: inventario.materials.reduce((sum, m) => sum + m.cantidad_actual, 0),
                total_asignado_pendiente: Array.from(materialesConsolidados.values()).reduce((sum, m) => sum + m.total_asignado_pendiente, 0),
                total_en_uso: Array.from(materialesConsolidados.values()).reduce((sum, m) => sum + m.total_en_uso, 0),
                controles_activos: controlesActivos.length
            },
            movimientos_recientes: historialMovimientos
        };
    }

    // Obtener reporte de ubicación de materiales (para analistas)
    async getReporteUbicacionMateriales(material_id?: string, fecha_desde?: Date, fecha_hasta?: Date) {
        const filtros: any = {};

        if (material_id) {
            filtros['materiales_asignados.material_id'] = new Types.ObjectId(material_id);
        }

        if (fecha_desde || fecha_hasta) {
            filtros.fecha_asignacion = {};
            if (fecha_desde) filtros.fecha_asignacion.$gte = fecha_desde;
            if (fecha_hasta) filtros.fecha_asignacion.$lte = fecha_hasta;
        }

        const controles = await this.materialControlModel
            .find(filtros)
            .populate('tecnico_id', 'nombre email')
            .populate('orden_trabajo_id', 'numero')
            .populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario')
            .sort({ fecha_asignacion: -1 });

        // Agrupar por material
        const reportePorMaterial = new Map();

        controles.forEach((control: any) => {
            control.materiales_asignados.forEach((materialAsignado: any) => {
                const materialId = materialAsignado.material_id._id.toString();
                const materialNombre = materialAsignado.material_id.nombre;

                if (!reportePorMaterial.has(materialId)) {
                    reportePorMaterial.set(materialId, {
                        material_id: materialId,
                        material_nombre: materialNombre,
                        unidad_medida: materialAsignado.material_id.unidad_medida,
                        costo_unitario: materialAsignado.material_id.costo_unitario,
                        ubicaciones: [],
                        totales: {
                            cantidad_total_asignada: 0,
                            cantidad_total_utilizada: 0,
                            cantidad_total_devuelta: 0,
                            cantidad_total_perdida: 0,
                            valor_total_asignado: 0,
                            tecnicos_diferentes: new Set()
                        }
                    });
                }

                const reporte = reportePorMaterial.get(materialId);

                reporte.ubicaciones.push({
                    tecnico: {
                        id: (control as any).tecnico_id._id,
                        nombre: (control as any).tecnico_id.nombre,
                        email: (control as any).tecnico_id.email
                    },
                    orden_trabajo: control.orden_trabajo_id ? {
                        id: control.orden_trabajo_id._id,
                        numero: control.orden_trabajo_id.numero
                    } : null,
                    cantidad_asignada: materialAsignado.cantidad_asignada,
                    cantidad_utilizada: materialAsignado.cantidad_utilizada || 0,
                    cantidad_devuelta: materialAsignado.cantidad_devuelta || 0,
                    cantidad_perdida: materialAsignado.cantidad_perdida || 0,
                    estado_material: materialAsignado.estado,
                    estado_control: control.estado_general,
                    fecha_asignacion: control.fecha_asignacion,
                    fecha_inicio_trabajo: control.fecha_inicio_trabajo,
                    fecha_devolucion: control.fecha_devolucion,
                    tiene_descuadre: control.tiene_descuadre,
                    valor_descuadre: control.valor_descuadre || 0
                });

                // Actualizar totales
                reporte.totales.cantidad_total_asignada += materialAsignado.cantidad_asignada;
                reporte.totales.cantidad_total_utilizada += materialAsignado.cantidad_utilizada || 0;
                reporte.totales.cantidad_total_devuelta += materialAsignado.cantidad_devuelta || 0;
                reporte.totales.cantidad_total_perdida += materialAsignado.cantidad_perdida || 0;
                // @ts-ignore
                reporte.totales.valor_total_asignado += materialAsignado.cantidad_asignada * materialAsignado.material_id.costo_unitario;
                reporte.totales.tecnicos_diferentes.add(control.tecnico_id._id.toString());
            });
        });

        // Convertir Set a número
        const reporteFinal = Array.from(reportePorMaterial.values()).map(reporte => ({
            ...reporte,
            totales: {
                ...reporte.totales,
                tecnicos_diferentes: reporte.totales.tecnicos_diferentes.size
            }
        }));

        return {
            reporte_por_material: reporteFinal,
            resumen_general: {
                materiales_diferentes: reporteFinal.length,
                total_controles: controles.length,
                valor_total_en_campo: reporteFinal.reduce((sum, r) => sum + r.totales.valor_total_asignado, 0),
                tecnicos_con_asignaciones: new Set(controles.map(c => c.tecnico_id._id.toString())).size
            }
        };
    }

    // Obtener materiales actualmente en campo (dónde están)
    async getMaterialesEnCampo() {
        const controlesActivos = await this.materialControlModel
            .find({
                estado_general: { $in: ['asignado', 'en_trabajo', 'devolucion_pendiente'] }
            })
            .populate('tecnico_id', 'nombre email')
            .populate('orden_trabajo_id', 'numero')
            .populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario')
            .sort({ fecha_asignacion: -1 });

        const materialesEnCampo = [];

        controlesActivos.forEach(control => {
            const populatedControl = control.toObject() as any; // Convert to plain object for populated fields
            populatedControl.materiales_asignados.forEach(materialAsignado => {
                const material = materialAsignado.material_id as any;
                const tecnico = populatedControl.tecnico_id as any;
                const ordenTrabajo = populatedControl.orden_trabajo_id as any;

                materialesEnCampo.push({
                    control_id: populatedControl._id,
                    material: {
                        id: material._id,
                        nombre: material.nombre,
                        unidad_medida: material.unidad_medida,
                        costo_unitario: material.costo_unitario
                    },
                    tecnico: {
                        id: tecnico._id,
                        nombre: tecnico.nombre,
                        email: tecnico.email
                    },
                    orden_trabajo: ordenTrabajo ? {
                        id: ordenTrabajo._id,
                        numero: ordenTrabajo.numero
                    } : null,
                    cantidad_asignada: materialAsignado.cantidad_asignada,
                    cantidad_utilizada: materialAsignado.cantidad_utilizada || 0,
                    cantidad_pendiente: materialAsignado.cantidad_asignada - (materialAsignado.cantidad_utilizada || 0) - (materialAsignado.cantidad_devuelta || 0),
                    estado_material: materialAsignado.estado,
                    estado_control: populatedControl.estado_general,
                    fecha_asignacion: populatedControl.fecha_asignacion,
                    dias_en_campo: Math.floor((new Date().getTime() - new Date(populatedControl.fecha_asignacion).getTime()) / (1000 * 60 * 60 * 24)),
                    valor_total: materialAsignado.cantidad_asignada * material.costo_unitario
                });
            });
        });

        return {
            materiales_en_campo: materialesEnCampo,
            resumen: {
                total_items: materialesEnCampo.length,
                valor_total_en_campo: materialesEnCampo.reduce((sum, item) => sum + item.valor_total, 0),
                tecnicos_con_materiales: new Set(materialesEnCampo.map(item => item.tecnico.id.toString())).size,
                materiales_diferentes: new Set(materialesEnCampo.map(item => item.material.id.toString())).size
            }
        };
    }

    // Sincronizar con movimientos de inventario existentes
    async sincronizarConInventarioExistente(tecnico_id: string) {
        // Obtener movimientos recientes del técnico que no estén asociados a controles
        const movimientosSinControl = await this.movimientoInventarioModel
            .find({
                tecnico_id: new Types.ObjectId(tecnico_id),
                origen: { $ne: 'MaterialControl' },
                fecha: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 días
            })
            .populate('material_id', 'nombre unidad_medida costo_unitario')
            .sort({ fecha: -1 });

        return {
            movimientos_sin_control: movimientosSinControl,
            sugerencias_integracion: movimientosSinControl.map(mov => ({
                movimiento_id: mov._id,
                material: mov.material_id,
                tipo: mov.tipo,
                cantidad: mov.cantidad,
                fecha: mov.fecha,
                sugerencia: this.generarSugerenciaIntegracion(mov)
            }))
        };
    }

    private generarSugerenciaIntegracion(movimiento: any): string {
        switch (movimiento.tipo) {
            case 'entrada':
                return 'Considerar crear control de materiales para futuros ingresos';
            case 'salida':
                return 'Material consumido sin control - revisar si debería tener asignación';
            case 'apartado':
                return 'Material apartado - considerar crear control formal';
            case 'devolucion':
                return 'Devolución sin control - verificar origen';
            default:
                return 'Revisar integración con sistema de control';
        }
    }
}