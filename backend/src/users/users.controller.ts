import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async findAll(@Query() query: any) {
        const filters: any = {};
        if (query.rol) filters.rol = query.rol;
        if (query.estado) filters.estado = query.estado;
        return this.usersService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Put(':id')
    @Roles('analista', 'analista_inventario_oculto')
    async update(@Param('id') id: string, @Body() updateData: any) {
        return this.usersService.update(id, updateData);
    }

    @Delete(':id')
    @Roles('analista_inventario_oculto')
    async delete(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
