import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MaterialDistributionService, AsignarMaterialesDto, DevolverMaterialesDto } from './material-distribution.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('material-distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialDistributionController {
    constructor(private materialDistributionService: MaterialDistributionService) { }

    // ENDPOINTS PARA BODEGUERO
    @Post('asignar')
    @Roles('bodeguero', 'analista_inventario_oculto')
    async asignarMateriales(@Body() asignacionDto: AsignarMaterialesDto, @Request() req) {
        return this.materialDistributionService.asignarMateriales(asignacionDto, req.user.userId);
    }

    @Get('controles-pendientes')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async getControlesPendientes(@Query('tecnico_id') tecnico_id?: string) {
        return this.materialDistributionService.getControlesPendientes(tecnico_id);
    }

    // ENDPOINTS PARA TÉCNICO
    @Post('iniciar-trabajo/:control_id')
    @Roles('tecnico')
    async iniciarTrabajo(@Param('control_id') control_id: string, @Request() req) {
        return this.materialDistributionService.iniciarTrabajo(control_id, req.user.userId);
    }

    @Post('devolver')
    @Roles('tecnico')
    async devolverMateriales(@Body() devolucionDto: DevolverMaterialesDto, @Request() req) {
        return this.materialDistributionService.devolverMateriales(devolucionDto, req.user.userId);
    }

    @Get('mis-asignaciones')
    @Roles('tecnico')
    async getMisAsignaciones(@Request() req) {
        return this.materialDistributionService.getControlesPendientes(req.user.userId);
    }

    // ENDPOINTS PARA ANALISTA
    @Get('descuadres')
    @Roles('analista', 'analista_inventario_oculto')
    async getDescuadres(@Query('resueltos') resueltos?: string) {
        const resueltosBool = resueltos === 'true';
        return this.materialDistributionService.getDescuadres(resueltosBool);
    }

    @Put('resolver-descuadre/:control_id')
    @Roles('analista', 'analista_inventario_oculto')
    async resolverDescuadre(
        @Param('control_id') control_id: string,
        @Body('observaciones') observaciones: string,
        @Request() req
    ) {
        return this.materialDistributionService.resolverDescuadre(control_id, req.user.userId, observaciones);
    }

    @Get('estadisticas')
    @Roles('analista', 'analista_inventario_oculto', 'bodeguero')
    async getEstadisticas() {
        return this.materialDistributionService.getEstadisticas();
    }

    // ENDPOINTS GENERALES
    @Get('control/:id')
    async getControlById(@Param('id') id: string) {
        return this.materialDistributionService.getControlesPendientes().then(controles =>
            controles.find(c => c._id.toString() === id)
        );
    }

    @Get('historial/:tecnico_id')
    @Roles('analista', 'analista_inventario_oculto', 'bodeguero')
    async getHistorialTecnico(@Param('tecnico_id') tecnico_id: string) {
        // Obtener todos los controles del técnico (incluyendo cerrados)
        return this.materialDistributionService['materialControlModel']
            .find({ tecnico_id })
            .populate('orden_trabajo_id')
            .populate('materiales_asignados.material_id', 'nombre unidad_medida costo_unitario')
            .populate('bodeguero_asigno', 'nombre')
            .populate('analista_supervisa', 'nombre')
            .sort({ fecha_asignacion: -1 });
    }

    // NUEVOS ENDPOINTS DE INTEGRACIÓN

    @Get('vista-consolidada/:tecnico_id')
    @Roles('analista', 'analista_inventario_oculto', 'bodeguero')
    async getVistaConsolidadaTecnico(@Param('tecnico_id') tecnico_id: string) {
        return this.materialDistributionService.getVistaConsolidadaTecnico(tecnico_id);
    }

    @Get('reporte-ubicacion')
    @Roles('analista', 'analista_inventario_oculto')
    async getReporteUbicacionMateriales(
        @Query('material_id') material_id?: string,
        @Query('fecha_desde') fecha_desde?: string,
        @Query('fecha_hasta') fecha_hasta?: string
    ) {
        const fechaDesde = fecha_desde ? new Date(fecha_desde) : undefined;
        const fechaHasta = fecha_hasta ? new Date(fecha_hasta) : undefined;

        return this.materialDistributionService.getReporteUbicacionMateriales(
            material_id,
            fechaDesde,
            fechaHasta
        );
    }

    @Get('materiales-en-campo')
    @Roles('analista', 'analista_inventario_oculto', 'bodeguero')
    async getMaterialesEnCampo() {
        return this.materialDistributionService.getMaterialesEnCampo();
    }

    @Get('sincronizar-inventario/:tecnico_id')
    @Roles('analista', 'analista_inventario_oculto')
    async sincronizarConInventarioExistente(@Param('tecnico_id') tecnico_id: string) {
        return this.materialDistributionService.sincronizarConInventarioExistente(tecnico_id);
    }
}