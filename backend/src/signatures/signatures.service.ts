import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

export interface Signature {
    _id?: string;
    orderId: string;
    signatureType: 'client' | 'technician' | 'analyst';
    signatureData: string; // Base64 image
    signerName: string;
    signerDocument?: string;
    signerEmail?: string;
    signerPhone?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    hash: string; // Hash para verificación de integridad
    verified: boolean;
    createdBy: string;
    createdAt: Date;
}

@Injectable()
export class SignaturesService {
    constructor(
        @InjectModel('Signature') private signatureModel: Model<Signature>,
    ) { }

    // Crear firma digital
    async create(signatureDto: Partial<Signature>) {
        // Validar que createdBy esté presente
        if (!signatureDto.createdBy) {
            throw new Error('createdBy is required');
        }

        // Generar hash de la firma para verificación
        const hash = this.generateHash(signatureDto.signatureData);

        const signature = new this.signatureModel({
            ...signatureDto,
            hash,
            verified: false,
            createdAt: new Date(),
        });

        return signature.save();
    }

    // Obtener firmas de una orden
    async findByOrder(orderId: string) {
        return this.signatureModel
            .find({ orderId })
            .sort({ createdAt: -1 })
            .exec();
    }

    // Obtener una firma
    async findOne(id: string) {
        return this.signatureModel.findById(id).exec();
    }

    // Verificar integridad de la firma
    async verify(id: string) {
        const signature = await this.signatureModel.findById(id).exec();
        if (!signature) {
            return { valid: false, message: 'Firma no encontrada' };
        }

        const currentHash = this.generateHash(signature.signatureData);
        const valid = currentHash === signature.hash;

        if (valid && !signature.verified) {
            signature.verified = true;
            await signature.save();
        }

        return {
            valid,
            message: valid ? 'Firma válida' : 'Firma ha sido modificada',
            signature,
        };
    }

    // Generar hash SHA-256
    private generateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Obtener estadísticas de firmas
    async getStats(orderId?: string) {
        const query = orderId ? { orderId } : {};

        const total = await this.signatureModel.countDocuments(query).exec();
        const verified = await this.signatureModel.countDocuments({ ...query, verified: true }).exec();
        const byType = await this.signatureModel.aggregate([
            { $match: query },
            { $group: { _id: '$signatureType', count: { $sum: 1 } } },
        ]).exec();

        return {
            total,
            verified,
            unverified: total - verified,
            byType: byType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    }
}
