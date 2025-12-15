import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PolizasService } from './polizas.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('polizas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PolizasController {
    constructor(
        private polizasService: PolizasService,
        private ordersService: OrdersService,
    ) { }

    @Post()
    @Roles('analista', 'analista_inventario_oculto')
    async create(@Body() polizaData: any) {
        return this.polizasService.create(polizaData);
    }

    // 🗺️ Métodos de ubicación (ANTES de los endpoints con parámetros)
    @Get('all')
    @Roles('analista', 'analista_inventario_oculto')
    async findAll(@Query() query: any) {
        return this.polizasService.findAll(query);
    }

    @Post('geocode')
    @Roles('analista', 'analista_inventario_oculto')
    async geocodePolizas() {
        return this.polizasService.geocodePolizas();
    }

    @Get('stats/location')
    @Roles('analista', 'analista_inventario_oculto')
    async getLocationStats() {
        return this.polizasService.getLocationStats();
    }

    @Get(':polizaNumber')
    async findOne(@Param('polizaNumber') polizaNumber: string) {
        return this.polizasService.findByNumber(polizaNumber);
    }

    @Get(':polizaNumber/validate')
    async validate(@Param('polizaNumber') polizaNumber: string) {
        const isValid = await this.polizasService.validate(polizaNumber);
        return { valid: isValid };
    }

    @Get(':polizaNumber/ots')
    async getOTs(@Param('polizaNumber') polizaNumber: string) {
        return this.ordersService.findByPoliza(polizaNumber);
    }

    @Put(':polizaNumber')
    @Roles('analista', 'analista_inventario_oculto')
    async update(@Param('polizaNumber') polizaNumber: string, @Body() updateData: any) {
        return this.polizasService.update(polizaNumber, updateData);
    }

    @Put(':polizaId/location')
    @Roles('analista', 'analista_inventario_oculto')
    async updateLocation(@Param('polizaId') polizaId: string, @Body() locationData: any) {
        return this.polizasService.updateLocation(polizaId, locationData);
    }
}
