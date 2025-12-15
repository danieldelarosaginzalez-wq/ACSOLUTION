import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @Roles('analista', 'analista_inventario_oculto')
    async getStats() {
        return this.dashboardService.getStats();
    }

    @Get('analyst')
    @Roles('analista', 'analista_inventario_oculto')
    async getAnalystDashboard() {
        return this.dashboardService.getAnalystDashboard();
    }
}
