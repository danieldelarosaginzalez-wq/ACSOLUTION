import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Simple file metadata schema
interface FileMetadata {
    _id?: string;
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
    metadata?: any;
    createdAt?: Date;
}

@Injectable()
export class FilesService {
    private files: Map<string, FileMetadata> = new Map();

    constructor(
        @InjectModel('Order') private orderModel: Model<any>,
    ) { }

    async saveFile(file: Express.Multer.File, metadata: any) {
        const fileData: FileMetadata = {
            _id: Date.now().toString(),
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            metadata,
            createdAt: new Date(),
        };

        this.files.set(fileData._id, fileData);

        return {
            id: fileData._id,
            filename: fileData.filename,
            originalname: fileData.originalname,
            url: `/api/files/${fileData._id}`,
        };
    }

    async savePhotoEvidence(file: Express.Multer.File, orderId: string, stage: string) {
        console.log('savePhotoEvidence called with:', { orderId, stage, filename: file?.filename });

        if (!orderId || orderId === 'undefined') {
            throw new Error('orderId es requerido y no puede ser undefined');
        }

        if (!stage) {
            throw new Error('stage es requerido');
        }

        // Guardar metadata del archivo
        const fileData: FileMetadata = {
            _id: Date.now().toString(),
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            metadata: {
                orderId,
                stage,
                uploadDate: new Date(),
            },
            createdAt: new Date(),
        };

        this.files.set(fileData._id, fileData);

        // Actualizar la orden con la foto
        const updateField = `evidencias.foto_${stage}`;

        try {
            const updatedOrder = await this.orderModel.findByIdAndUpdate(
                orderId,
                {
                    $set: {
                        [updateField]: {
                            file_id: fileData._id,
                            meta: {
                                filename: fileData.filename,
                                originalname: fileData.originalname,
                                uploadDate: new Date(),
                            },
                        },
                    },
                },
                { new: true },
            );

            if (!updatedOrder) {
                throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
            }

            console.log('Orden actualizada exitosamente:', updatedOrder._id);
        } catch (error) {
            console.error('Error actualizando orden:', error);
            throw error;
        }

        return {
            id: fileData._id,
            filename: fileData.filename,
            originalname: fileData.originalname,
            url: `/api/files/${fileData._id}`,
            meta: {
                filename: fileData.filename,
                originalname: fileData.originalname,
                uploadDate: new Date(),
            },
        };
    }

    async getFile(id: string) {
        const file = this.files.get(id);
        if (!file) {
            throw new NotFoundException('Archivo no encontrado');
        }
        return file;
    }
}
