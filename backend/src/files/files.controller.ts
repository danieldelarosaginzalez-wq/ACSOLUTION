import { Controller, Get, Post, Param, UseGuards, UseInterceptors, UploadedFile, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('files')
export class FilesController {
    constructor(private filesService: FilesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async upload(@UploadedFile() file: Express.Multer.File, @Body('metadata') metadata: string) {
        const parsedMetadata = metadata ? JSON.parse(metadata) : {};
        return this.filesService.saveFile(file, parsedMetadata);
    }

    @Post('upload-photo')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Solo permitir imágenes
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                    return cb(new Error('Solo se permiten archivos de imagen'), false);
                }
                cb(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadPhoto(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        const orderId = body.order_id;
        const stage = body.stage;

        if (!orderId || !stage) {
            throw new Error('order_id y stage son requeridos');
        }

        return this.filesService.savePhotoEvidence(file, orderId, stage);
    }

    @Get(':id')
    async getFile(@Param('id') id: string, @Res() res: Response) {
        try {
            const file = await this.filesService.getFile(id);
            return res.sendFile(file.path, { root: '.' });
        } catch (error) {
            // Si no está en el servicio, intentar buscar directamente en uploads
            const path = require('path');
            const fs = require('fs');
            const filePath = path.join(process.cwd(), 'uploads', id);

            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }

            return res.status(404).json({ message: 'Archivo no encontrado' });
        }
    }
}
