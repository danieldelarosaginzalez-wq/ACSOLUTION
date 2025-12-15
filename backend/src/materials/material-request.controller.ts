import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MaterialRequestService } from './material-request.service';
import { MaterialLearningService } from '../ai/material-learning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('material-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialRequestController {
    constructor(
        private readonly materialRequestService: MaterialRequestService,
        private readonly materialLearningService: MaterialLearningService,
    ) { }

    @Post()
    @Roles('tecnico', 'bodeguero', 'analista')
    async crearSolicitud(@Request() req, @Body() createRequestDto: {
        materiales: Array<{
            material_id: string;
            cantidad_solicitada: number;
            motivo?: string;
            tipo_trabajo_estimado?: string;
        }>;
    }) {
        return this.materialRequestService.crearSolicitud(
            req.user.userId,
            createRequestDto.materiales
        );
    }

    @Post('generar-inteligente')
    @Roles('tecnico', 'bodeguero', 'analista')
    async generarSolicitudInteligente(@Request() req, @Body() body: {
        tipo_trabajo: string;
        factor_seguridad?: number;
    }) {
        return this.materialRequestService.generarSolicitudInteligente(
            req.user.userId,
            body.tipo_trabajo,
            body.factor_seguridad || 1.2
        );
    }

    @Put(':id/aprobar')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async aprobarSolicitud(@Request() req, @Param('id') id: string, @Body() body: {
        ajustes?: Array<{
            material_id: string;
            cantidad_aprobada: number;
        }>;
    }) {
        return this.materialRequestService.aprobarSolicitud(
            id,
            req.user.userId,
            body.ajustes
        );
    }

    @Put(':id/entregar')
    @Roles('bodeguero', 'analista')
    async marcarComoEntregada(@Param('id') id: string) {
        return this.materialRequestService.marcarComoEntregada(id);
    }

    @Get('pendientes')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async obtenerSolicitudesPendientes() {
        return this.materialRequestService.obtenerSolicitudesPendientes();
    }

    @Get('mis-solicitudes')
    @Roles('tecnico', 'bodeguero', 'analista')
    async obtenerMisSolicitudes(@Request() req, @Query('limite') limite?: string) {
        return this.materialRequestService.obtenerSolicitudesTecnico(
            req.user.userId,
            limite ? parseInt(limite) : 20
        );
    }

    @Get('estadisticas')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async obtenerEstadisticas() {
        return this.materialRequestService.obtenerEstadisticasSolicitudes();
    }

    @Get(':id/comparar-patrones')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async compararConPatrones(@Param('id') id: string) {
        return this.materialRequestService.compararConPatrones(id);
    }

    @Get('sugerencias/:tipoTrabajo')
    @Roles('tecnico', 'bodeguero', 'analista')
    async obtenerSugerencias(
        @Param('tipoTrabajo') tipoTrabajo: string,
        @Query('factor_seguridad') factorSeguridad?: string
    ) {
        return this.materialLearningService.generarSugerenciasMateriales(
            tipoTrabajo,
            factorSeguridad ? parseFloat(factorSeguridad) : 1.2
        );
    }

    @Post('aprender-trabajo')
    @Roles('bodeguero', 'analista', 'analista_inventario_oculto')
    async aprenderDeTrabajoCompletado(@Body() body: {
        orden_id: string;
        tipo_trabajo: string;
    }) {
        return this.materialLearningService.aprenderDeTrabajoCompletado(
            body.orden_id,
            body.tipo_trabajo
        );
    }

    @Get('estadisticas-aprendizaje')
    @Roles('analista', 'analista_inventario_oculto')
    async obtenerEstadisticasAprendizaje() {
        return this.materialLearningService.obtenerEstadisticasAprendizaje();
    }

    @Get('detectar-anomalias/:ordenId/:tipoTrabajo')
    @Roles('analista', 'analista_inventario_oculto')
    async detectarAnomalias(
        @Param('ordenId') ordenId: string,
        @Param('tipoTrabajo') tipoTrabajo: string
    ) {
        return this.materialLearningService.detectarAnomalias(ordenId, tipoTrabajo);
    }
}