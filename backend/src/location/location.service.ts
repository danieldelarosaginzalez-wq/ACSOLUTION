import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Poliza, PolizaDocument } from '../schemas/poliza.schema';
import { GeocodingService } from './geocoding.service';

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Poliza.name) private polizaModel: Model<PolizaDocument>,
        private geocodingService: GeocodingService,
    ) { }

    /**
     * Actualiza la ubicación de un técnico
     */
    async updateTechnicianLocation(
        tecnicoId: string,
        lat: number,
        lng: number,
        accuracy?: number,
    ) {
        const user = await this.userModel.findById(tecnicoId);

        if (!user) {
            throw new NotFoundException('Técnico no encontrado');
        }

        if (user.rol !== 'tecnico') {
            throw new Error('Solo los técnicos pueden actualizar su ubicación');
        }

        user.ubicacion_actual = {
            lat,
            lng,
            timestamp: new Date(),
            accuracy,
        };

        await user.save();
        this.logger.log(`Ubicación actualizada para técnico ${user.nombre}: ${lat}, ${lng}`);

        return {
            success: true,
            ubicacion: user.ubicacion_actual,
        };
    }

    /**
     * Obtiene la ubicación actual de un técnico
     */
    async getTechnicianLocation(tecnicoId: string) {
        const user = await this.userModel.findById(tecnicoId);

        if (!user) {
            throw new NotFoundException('Técnico no encontrado');
        }

        return {
            tecnico_id: user._id,
            nombre: user.nombre,
            ubicacion: user.ubicacion_actual || null,
        };
    }

    /**
     * Obtiene ubicaciones de todos los técnicos activos
     */
    async getAllTechniciansLocations() {
        const tecnicos = await this.userModel.find({
            rol: 'tecnico',
            estado: 'activo',
        });

        return tecnicos.map(tecnico => ({
            tecnico_id: tecnico._id,
            nombre: tecnico.nombre,
            email: tecnico.email,
            especialidad: (tecnico as any).especialidad,
            telefono: (tecnico as any).telefono,
            ubicacion_actual: tecnico.ubicacion_actual || null,
        }));
    }

    /**
     * Obtiene estadísticas de tracking en tiempo real
     */
    async getTrackingStats() {
        const totalTecnicos = await this.userModel.countDocuments({
            rol: 'tecnico',
            estado: 'activo',
        });

        const tecnicosConUbicacion = await this.userModel.countDocuments({
            rol: 'tecnico',
            estado: 'activo',
            ubicacion_actual: { $exists: true },
        });

        // Técnicos activos (actualizados en los últimos 15 minutos)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const tecnicosActivos = await this.userModel.countDocuments({
            rol: 'tecnico',
            estado: 'activo',
            'ubicacion_actual.timestamp': { $gte: fifteenMinutesAgo },
        });

        // Técnicos por especialidad
        const especialidadStats = await this.userModel.aggregate([
            {
                $match: {
                    rol: 'tecnico',
                    estado: 'activo',
                    ubicacion_actual: { $exists: true },
                }
            },
            {
                $group: {
                    _id: '$especialidad',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalTecnicos,
            tecnicosConUbicacion,
            tecnicosActivos,
            cobertura: totalTecnicos > 0 ? Math.round((tecnicosConUbicacion / totalTecnicos) * 100) : 0,
            actividad: tecnicosConUbicacion > 0 ? Math.round((tecnicosActivos / tecnicosConUbicacion) * 100) : 0,
            especialidadStats,
            timestamp: new Date(),
        };
    }

    /**
     * Obtiene historial de ubicaciones de un técnico
     */
    async getTechnicianLocationHistory(tecnicoId: string, hours: number = 24) {
        const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

        // En una implementación real, tendrías una colección separada para el historial
        // Por ahora, devolvemos la ubicación actual
        const tecnico = await this.userModel.findById(tecnicoId);

        if (!tecnico || !tecnico.ubicacion_actual) {
            return [];
        }

        return [{
            timestamp: tecnico.ubicacion_actual.timestamp,
            lat: tecnico.ubicacion_actual.lat,
            lng: tecnico.ubicacion_actual.lng,
            accuracy: tecnico.ubicacion_actual.accuracy,
        }];
    }

    /**
     * Encuentra técnicos en un área específica
     */
    async getTechniciansInArea(centerLat: number, centerLng: number, radiusKm: number = 10) {
        const tecnicos = await this.getAllTechniciansLocations();

        return tecnicos
            .filter(tecnico => tecnico.ubicacion_actual)
            .map(tecnico => {
                const distance = this.geocodingService.calculateDistance(
                    centerLat,
                    centerLng,
                    tecnico.ubicacion_actual.lat,
                    tecnico.ubicacion_actual.lng
                );

                return {
                    ...tecnico,
                    distancia_km: distance,
                };
            })
            .filter(tecnico => tecnico.distancia_km <= radiusKm)
            .sort((a, b) => a.distancia_km - b.distancia_km);
    }

    /**
     * Obtiene todas las pólizas con ubicación
     */
    async getPolizasWithLocation() {
        const polizas = await this.polizaModel.find({
            estado: 'activo',
            ubicacion: { $exists: true },
        });

        return polizas.map(poliza => ({
            poliza_id: poliza._id,
            poliza_number: poliza.poliza_number,
            cliente: poliza.cliente,
            direccion: poliza.direccion,
            ubicacion: poliza.ubicacion,
        }));
    }

    /**
     * Obtiene todas las OTs con ubicación
     */
    async getOrdersWithLocation(estado?: string) {
        const filter: any = {
            ubicacion: { $exists: true },
        };

        if (estado) {
            filter.estado = estado;
        }

        const orders = await this.orderModel
            .find(filter)
            .populate('tecnico_id', 'nombre email')
            .populate('analista_id', 'nombre email');

        return orders.map(order => ({
            order_id: order._id,
            codigo: order.codigo,
            poliza_number: order.poliza_number,
            cliente: order.cliente,
            direccion: order.direccion,
            tipo_trabajo: order.tipo_trabajo,
            estado: order.estado,
            ubicacion: order.ubicacion,
            tecnico: order.tecnico_id ? {
                id: (order.tecnico_id as any)._id,
                nombre: (order.tecnico_id as any).nombre,
            } : null,
        }));
    }

    /**
     * Encuentra técnicos cercanos a una ubicación
     */
    async findNearbyTechnicians(lat: number, lng: number, maxDistance: number = 50) {
        const tecnicos = await this.getAllTechniciansLocations();

        const tecnicosConDistancia = tecnicos
            .filter(t => t.ubicacion_actual) // Solo técnicos con ubicación
            .map(tecnico => {
                const distance = this.geocodingService.calculateDistance(
                    lat,
                    lng,
                    tecnico.ubicacion_actual.lat,
                    tecnico.ubicacion_actual.lng,
                );

                return {
                    ...tecnico,
                    distancia_km: distance,
                };
            })
            .filter(t => t.distancia_km <= maxDistance) // Filtrar por distancia máxima
            .sort((a, b) => a.distancia_km - b.distancia_km); // Ordenar por cercanía

        return tecnicosConDistancia;
    }

    /**
     * Sugiere el mejor técnico para una OT basado en ubicación
     */
    async suggestBestTechnician(orderId: string) {
        const order = await this.orderModel.findById(orderId);

        if (!order) {
            throw new NotFoundException('Orden no encontrada');
        }

        if (!order.ubicacion) {
            throw new Error('La orden no tiene ubicación definida');
        }

        const tecnicosCercanos = await this.findNearbyTechnicians(
            order.ubicacion.lat,
            order.ubicacion.lng,
        );

        if (tecnicosCercanos.length === 0) {
            return {
                success: false,
                message: 'No hay técnicos disponibles con ubicación cercana',
            };
        }

        return {
            success: true,
            orden: {
                codigo: order.codigo,
                ubicacion: order.ubicacion,
            },
            tecnicos_sugeridos: tecnicosCercanos.slice(0, 5), // Top 5 más cercanos
        };
    }

    /**
     * Geocodifica automáticamente órdenes sin ubicación
     */
    async geocodeOrdersWithoutLocation(limit: number = 10): Promise<{
        processed: number;
        success: number;
        failed: number;
        details: any[];
    }> {
        this.logger.log('🔍 Iniciando geocodificación automática de órdenes...');

        // Buscar órdenes sin ubicación
        const ordersWithoutLocation = await this.orderModel
            .find({
                $or: [
                    { ubicacion: { $exists: false } },
                    { ubicacion: null }
                ],
                direccion: { $exists: true, $ne: '' }
            })
            .limit(limit);

        this.logger.log(`📍 Encontradas ${ordersWithoutLocation.length} órdenes sin ubicación`);

        const results = {
            processed: 0,
            success: 0,
            failed: 0,
            details: []
        };

        for (const order of ordersWithoutLocation) {
            results.processed++;

            try {
                const geocoded = await this.geocodingService.geocodeAddress(order.direccion);

                if (geocoded) {
                    order.ubicacion = {
                        lat: geocoded.lat,
                        lng: geocoded.lng,
                        direccion_completa: geocoded.direccion_completa,
                        geocoded: true,
                        geocoded_at: new Date()
                    };

                    await order.save();
                    results.success++;

                    results.details.push({
                        order_id: order._id,
                        codigo: order.codigo,
                        direccion: order.direccion,
                        status: 'success',
                        ubicacion: order.ubicacion
                    });

                    this.logger.log(`✅ Geocodificada orden ${order.codigo}: ${geocoded.lat}, ${geocoded.lng}`);
                } else {
                    results.failed++;
                    results.details.push({
                        order_id: order._id,
                        codigo: order.codigo,
                        direccion: order.direccion,
                        status: 'failed',
                        error: 'No se pudo geocodificar'
                    });

                    this.logger.warn(`❌ No se pudo geocodificar orden ${order.codigo}: ${order.direccion}`);
                }

                // Esperar 1 segundo entre geocodificaciones
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                results.failed++;
                results.details.push({
                    order_id: order._id,
                    codigo: order.codigo,
                    direccion: order.direccion,
                    status: 'error',
                    error: error.message
                });

                this.logger.error(`❌ Error geocodificando orden ${order.codigo}:`, error.message);
            }
        }

        this.logger.log(`✅ Geocodificación completada: ${results.success} exitosas, ${results.failed} fallidas`);

        return results;
    }

    /**
     * Obtiene datos para el mapa (técnicos + órdenes)
     * MEJORADO: Geocodifica automáticamente órdenes sin ubicación
     */
    async getMapData(estado?: string) {
        // Geocodificar automáticamente órdenes sin ubicación (máximo 5 por request)
        this.geocodeOrdersWithoutLocation(5).catch(err => {
            this.logger.error('Error en geocodificación automática:', err);
        });

        const [tecnicos, orders] = await Promise.all([
            this.getAllTechniciansLocations(),
            this.getOrdersWithLocation(estado),
        ]);

        return {
            tecnicos: tecnicos.filter(t => t.ubicacion_actual), // Solo con ubicación
            ordenes: orders,
            timestamp: new Date(),
        };
    }
}
