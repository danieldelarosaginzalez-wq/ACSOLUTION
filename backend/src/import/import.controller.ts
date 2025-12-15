import {
    Controller,
    Post,
    Get,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    Request,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ImportService } from './import.service';
import { ExcelParserService } from './excel-parser.service';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
    constructor(
        private importService: ImportService,
        private excelParser: ExcelParserService,
    ) { }

    @Get('template')
    @Roles('analista')
    downloadTemplate(@Res() res: Response) {
        const buffer = this.excelParser.generateTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_ordenes.xlsx');
        res.send(buffer);
    }

    @Post('preview')
    @Roles('analista')
    @UseInterceptors(FileInterceptor('file'))
    async previewImport(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No se ha subido ningún archivo');
        }

        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
            throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('El archivo no debe superar 5MB');
        }

        const result = await this.importService.parseAndValidate(file.buffer);
        return result;
    }

    @Post('execute')
    @Roles('analista')
    async executeImport(
        @Body() body: { validations: any[] },
        @Request() req,
    ) {
        if (!body.validations || body.validations.length === 0) {
            throw new BadRequestException('No hay datos para importar');
        }

        const result = await this.importService.importOrders(body.validations, req.user._id);
        return result;
    }
}
