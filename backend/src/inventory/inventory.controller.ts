import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private inventoryService: InventoryService) { }

    @Get('tecnico/me')
    async getMyInventory(@Request() req) {
        return this.inventoryService.getByTech(req.user._id);
    }

    @Get('tecnico/:techId')
    @Roles('analista', 'analista_inventario_oculto')
    async getByTech(@Param('techId') techId: string) {
        return this.inventoryService.getByTech(techId);
    }

    @Post('tecnico/:techId/init')
    async initInventory(@Param('techId') techId: string) {
        return this.inventoryService.createOrGetInventory(techId);
    }

    @Get('tecnico/:techId/movimientos')
    async getMovimientos(@Param('techId') techId: string, @Query() query: any) {
        const filters: any = {};
        if (query.tipo) filters.tipo = query.tipo;
        if (query.visible_para_analistas !== undefined) {
            filters.visible_para_analistas = query.visible_para_analistas === 'true';
        }
        return this.inventoryService.getMovimientos(techId, filters);
    }

    @Post('ajuste')
    @Roles('analista_inventario_oculto')
    async ajuste(@Body() ajusteData: any) {
        // TODO: Implementar ajustes manuales
        return { message: 'Ajuste pendiente de implementación' };
    }
}
