import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Get('poliza/:polizaNumber')
    async polizaReport(@Param('polizaNumber') polizaNumber: string) {
        return this.reportsService.getPolizaReport(polizaNumber);
    }

    @Get('tech/:techId')
    async techConsumption(
        @Param('techId') techId: string,
        @Query('from') from: string,
        @Query('to') to: string,
    ) {
        return this.reportsService.getTechConsumption(techId, from, to);
    }

    @Get('poliza/:polizaNumber/download')
    async downloadPolizaReport(@Param('polizaNumber') polizaNumber: string) {
        // TODO: Implementar descarga de reporte
        return { message: 'Descarga de reporte pendiente de implementación' };
    }
}
