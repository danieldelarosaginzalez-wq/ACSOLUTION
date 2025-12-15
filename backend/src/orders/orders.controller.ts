import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('ot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Post()
    @Roles('analista')
    async create(@Body() orderData: any, @Request() req) {
        return this.ordersService.create(orderData, req.user._id);
    }

    @Get()
    async findAll(@Query() query: any) {
        const filters: any = {};
        if (query.estado) filters.estado = query.estado;
        if (query.tecnico_id) filters.tecnico_id = query.tecnico_id;
        if (query.poliza_number) filters.poliza_number = query.poliza_number;
        return this.ordersService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ordersService.findById(id);
    }

    @Put(':id/asignar')
    @Roles('analista')
    async assign(@Param('id') id: string, @Body() assignData: any, @Request() req) {
        return this.ordersService.assignOrder(id, assignData, req.user._id);
    }

    @Post(':id/consumption')
    @Roles('tecnico')
    @UseInterceptors(
        AnyFilesInterceptor({
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async registerConsumption(
        @Param('id') id: string,
        @Body() consumptionData: any,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Request() req,
    ) {
        // Parse consumos if it's a string (from FormData)
        if (typeof consumptionData.consumos === 'string') {
            consumptionData.consumos = JSON.parse(consumptionData.consumos);
        }

        // Procesar archivos subidos
        const uploadedFiles = {};
        if (files && files.length > 0) {
            files.forEach(file => {
                // El nombre del campo viene como foto_inicial, foto_durante, etc.
                const fieldName = file.fieldname.replace('foto_', '');
                uploadedFiles[fieldName] = {
                    filename: file.filename,
                    originalname: file.originalname,
                    path: file.path,
                    mimetype: file.mimetype,
                    size: file.size,
                };
            });
        }

        return this.ordersService.registerConsumption(id, consumptionData, req.user._id, uploadedFiles);
    }

    @Put(':id/complete')
    @Roles('tecnico')
    async complete(@Param('id') id: string, @Request() req) {
        return this.ordersService.completeOrder(id, req.user._id);
    }

    @Put(':id/materials/:materialIndex')
    @Roles('analista')
    async updateMaterial(
        @Param('id') id: string,
        @Param('materialIndex') materialIndex: number,
        @Body() updateData: { cantidad: number; observacion?: string },
        @Request() req,
    ) {
        return this.ordersService.updateMaterialUtilizado(id, materialIndex, updateData, req.user._id);
    }

    @Delete(':id/materials/:materialIndex')
    @Roles('analista')
    async deleteMaterial(
        @Param('id') id: string,
        @Param('materialIndex') materialIndex: number,
        @Request() req,
    ) {
        return this.ordersService.deleteMaterialUtilizado(id, materialIndex, req.user._id);
    }

    @Post(':id/request-correction')
    @Roles('analista')
    async requestCorrection(
        @Param('id') id: string,
        @Body() correctionData: { motivo: string; detalles: string },
        @Request() req,
    ) {
        return this.ordersService.requestCorrection(id, correctionData, req.user._id);
    }

    @Put(':id/close')
    @Roles('analista')
    async close(@Param('id') id: string, @Request() req) {
        return this.ordersService.closeOrder(id, req.user._id);
    }

    // ========================================
    // ENDPOINTS DE IMPOSIBILIDAD
    // ========================================

    @Post(':id/imposibilidad')
    @Roles('tecnico')
    @UseInterceptors(AnyFilesInterceptor({
        storage: diskStorage({
            destination: './uploads/imposibilidad',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `imposibilidad-${uniqueSuffix}${extname(file.originalname)}`);
            }
        })
    }))
    async markAsImpossible(
        @Param('id') id: string,
        @Body() imposibilidadData: any,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req
    ) {
        return this.ordersService.markAsImpossible(id, imposibilidadData, files, req.user._id);
    }

    @Post(':id/finalizar-tecnico')
    @Roles('tecnico')
    async finalizarPorTecnico(@Param('id') id: string, @Request() req) {
        return this.ordersService.finalizarPorTecnico(id, req.user._id);
    }

    @Post(':id/finalizar-con-aprendizaje')
    @Roles('tecnico', 'analista', 'bodeguero')
    async finalizarConAprendizaje(
        @Param('id') id: string,
        @Body() datosFinalizacion: {
            tipo_trabajo?: string;
            observaciones?: string;
            materiales_utilizados?: any[];
            tiempo_total?: number;
        },
        @Request() req
    ) {
        return this.ordersService.finalizarConAprendizaje(id, req.user._id, datosFinalizacion);
    }

    @Post(':id/aprobar-analista')
    @Roles('analista')
    async aprobarPorAnalista(
        @Param('id') id: string,
        @Body() data: { observaciones?: string },
        @Request() req
    ) {
        return this.ordersService.aprobarPorAnalista(id, data.observaciones, req.user._id);
    }

    @Post(':id/rechazar-analista')
    @Roles('analista')
    async rechazarPorAnalista(
        @Param('id') id: string,
        @Body() data: { motivo: string; observaciones: string },
        @Request() req
    ) {
        return this.ordersService.rechazarPorAnalista(id, data.motivo, data.observaciones, req.user._id);
    }

    @Post(':id/devolver-materiales')
    @Roles('tecnico', 'analista')
    async devolverMateriales(
        @Param('id') id: string,
        @Body() data: { devoluciones: Array<{ material_id: string; cantidad: number; motivo?: string }> },
        @Request() req
    ) {
        return this.ordersService.devolverMateriales(id, data.devoluciones, req.user._id);
    }
}
