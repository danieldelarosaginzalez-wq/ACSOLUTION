import { Controller, Get, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
    constructor(private alertsService: AlertsService) { }

    @Get()
    async findAll(@Query() query: any) {
        const filters: any = {};
        if (query.tipo) filters.tipo = query.tipo;
        if (query.order_id) filters.order_id = query.order_id;
        if (query.tecnico_id) filters.tecnico_id = query.tecnico_id;
        if (query.resolved !== undefined) filters.resolved = query.resolved === 'true';
        if (query.visible !== undefined) {
            filters.visible_para_analistas = query.visible === 'true';
        }
        return this.alertsService.findAll(filters);
    }

    @Put(':id/resolve')
    async resolve(@Param('id') id: string, @Request() req) {
        return this.alertsService.resolve(id, req.user._id);
    }
}
