import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
    constructor(private materialsService: MaterialsService) { }

    @Get()
    async findAll(@Query() query: any) {
        const filters: any = {};
        if (query.categoria) filters.categoria = query.categoria;
        if (query.activo !== undefined) filters.activo = query.activo === 'true';
        return this.materialsService.findAll(filters);
    }

    @Get('categorias')
    async getCategorias() {
        return this.materialsService.getCategorias();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materialsService.findById(id);
    }

    @Post()
    @Roles('analista', 'analista_inventario_oculto')
    async create(@Body() materialData: any) {
        return this.materialsService.create(materialData);
    }

    @Put(':id')
    @Roles('analista', 'analista_inventario_oculto')
    async update(@Param('id') id: string, @Body() updateData: any) {
        return this.materialsService.update(id, updateData);
    }

    @Delete(':id')
    @Roles('analista_inventario_oculto')
    async delete(@Param('id') id: string) {
        return this.materialsService.delete(id);
    }

    @Get('stats/consumption')
    @Roles('analista', 'analista_inventario_oculto')
    async getConsumptionStats(@Query() query: any) {
        return this.materialsService.getConsumptionStats(query);
    }
}
