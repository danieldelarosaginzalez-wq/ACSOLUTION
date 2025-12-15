import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { GeocodingService } from './geocoding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
    constructor(
        private readonly locationService: LocationService,
        private readonly geocodingService: GeocodingService,
    ) { }

    /**
     * Actualiza ubicación de técnico (desde app móvil)
     */
    @Post('technician/:id')
    @Roles('tecnico')
    async updateTechnicianLocation(
        @Param('id') tecnicoId: string,
        @Body() body: { lat: number; lng: number; accuracy?: number },
    ) {
        return this.locationService.updateTechnicianLocation(
            tecnicoId,
            body.lat,
            body.lng,
            body.accuracy,
        );
    }

    /**
     * Obtiene ubicación de un técnico
     */
    @Get('technician/:id')
    @Roles('analista', 'analista_inventario_oculto')
    async getTechnicianLocation(@Param('id') tecnicoId: string) {
        return this.locationService.getTechnicianLocation(tecnicoId);
    }

    /**
     * Obtiene ubicaciones de todos los técnicos
     */
    @Get('technicians')
    @Roles('analista', 'analista_inventario_oculto')
    async getAllTechniciansLocations() {
        return this.locationService.getAllTechniciansLocations();
    }

    /**
     * Obtiene todas las órdenes con ubicación
     */
    @Get('orders')
    @Roles('analista', 'analista_inventario_oculto')
    async getOrdersWithLocation(@Query('estado') estado?: string) {
        return this.locationService.getOrdersWithLocation(estado);
    }

    /**
     * Encuentra técnicos cercanos a una ubicación
     */
    @Post('nearby-technicians')
    @Roles('analista', 'analista_inventario_oculto')
    async findNearbyTechnicians(
        @Body() body: { lat: number; lng: number; maxDistance?: number },
    ) {
        return this.locationService.findNearbyTechnicians(
            body.lat,
            body.lng,
            body.maxDistance,
        );
    }

    /**
     * Sugiere el mejor técnico para una OT
     */
    @Get('suggest-technician/:orderId')
    @Roles('analista', 'analista_inventario_oculto')
    async suggestBestTechnician(@Param('orderId') orderId: string) {
        return this.locationService.suggestBestTechnician(orderId);
    }

    /**
     * Obtiene datos completos para el mapa
     */
    @Get('map-data')
    @Roles('analista', 'analista_inventario_oculto')
    async getMapData(@Query('estado') estado?: string) {
        return this.locationService.getMapData(estado);
    }

    /**
     * Geocodifica una dirección
     */
    @Post('geocode')
    @Roles('analista', 'analista_inventario_oculto')
    async geocodeAddress(@Body() body: { direccion: string }) {
        return this.geocodingService.geocodeAddress(body.direccion);
    }

    /**
     * Reverse geocoding (coordenadas a dirección)
     */
    @Post('reverse-geocode')
    @Roles('analista', 'analista_inventario_oculto')
    async reverseGeocode(@Body() body: { lat: number; lng: number }) {
        const direccion = await this.geocodingService.reverseGeocode(body.lat, body.lng);
        return { direccion };
    }

    /**
     * Geocodifica automáticamente órdenes sin ubicación
     */
    @Post('geocode-orders')
    @Roles('analista', 'analista_inventario_oculto')
    async geocodeOrdersWithoutLocation(@Body() body: { limit?: number }) {
        return this.locationService.geocodeOrdersWithoutLocation(body.limit || 10);
    }

    /**
     * Obtiene estadísticas de tracking en tiempo real
     */
    @Get('tracking-stats')
    @Roles('analista', 'analista_inventario_oculto')
    async getTrackingStats() {
        return this.locationService.getTrackingStats();
    }

    /**
     * Obtiene historial de ubicaciones de un técnico
     */
    @Get('technician/:id/history')
    @Roles('analista', 'analista_inventario_oculto', 'tecnico')
    async getTechnicianHistory(
        @Param('id') tecnicoId: string,
        @Query('hours') hours?: string
    ) {
        const hoursNumber = hours ? parseInt(hours) : 24;
        return this.locationService.getTechnicianLocationHistory(tecnicoId, hoursNumber);
    }

    /**
     * Encuentra técnicos en un área específica
     */
    @Post('technicians-in-area')
    @Roles('analista', 'analista_inventario_oculto')
    async getTechniciansInArea(@Body() body: {
        lat: number;
        lng: number;
        radius?: number
    }) {
        return this.locationService.getTechniciansInArea(
            body.lat,
            body.lng,
            body.radius || 10
        );
    }
}
