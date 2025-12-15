import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Poliza, PolizaDocument } from '../schemas/poliza.schema';
import { GeocodingService } from '../location/geocoding.service';

@Injectable()
export class PolizasService {
    constructor(
        @InjectModel(Poliza.name) private polizaModel: Model<PolizaDocument>,
        @Inject(forwardRef(() => GeocodingService))
        private geocodingService: GeocodingService,
    ) { }

    async create(polizaData: Partial<Poliza>): Promise<PolizaDocument> {
        // Validar formato de póliza
        if (!/^[0-9]{6}$/.test(polizaData.poliza_number)) {
            throw new BadRequestException('La póliza debe ser un número de 6 dígitos');
        }

        // Verificar que no exista
        const existing = await this.polizaModel.findOne({
            poliza_number: polizaData.poliza_number
        });

        if (existing) {
            throw new BadRequestException('La póliza ya existe');
        }

        // 🆕 GEOCODING AUTOMÁTICO
        if (polizaData.direccion) {
            try {
                const geocoded = await this.geocodingService.geocodeAddress(polizaData.direccion);
                if (geocoded) {
                    polizaData.ubicacion = geocoded;
                }
            } catch (error) {
                console.warn('Error geocoding address:', error.message);
                // No fallar si el geocoding falla, solo continuar sin ubicación
            }
        }

        const poliza = new this.polizaModel({
            ...polizaData,
            estado: 'activo',
            created_at: new Date(),
        });

        return poliza.save();
    }

    async findByNumber(polizaNumber: string): Promise<PolizaDocument> {
        const poliza = await this.polizaModel.findOne({ poliza_number: polizaNumber });
        if (!poliza) {
            throw new NotFoundException('Póliza no encontrada');
        }
        return poliza;
    }

    async validate(polizaNumber: string): Promise<boolean> {
        if (!/^[0-9]{6}$/.test(polizaNumber)) {
            return false;
        }

        const poliza = await this.polizaModel.findOne({
            poliza_number: polizaNumber,
            estado: 'activo'
        });

        return !!poliza;
    }

    async findAll(filters: any = {}): Promise<PolizaDocument[]> {
        try {
            return await this.polizaModel.find(filters).exec();
        } catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }

    async update(polizaNumber: string, updateData: Partial<Poliza>): Promise<PolizaDocument> {
        // 🆕 Si se actualiza la dirección, re-geocodificar
        if (updateData.direccion) {
            try {
                const geocoded = await this.geocodingService.geocodeAddress(updateData.direccion);
                if (geocoded) {
                    updateData.ubicacion = geocoded;
                }
            } catch (error) {
                console.warn('Error geocoding address:', error.message);
            }
        }

        return this.polizaModel
            .findOneAndUpdate({ poliza_number: polizaNumber }, updateData, { new: true })
            .exec();
    }

    // 🗺️ Métodos de ubicación
    async updateLocation(polizaId: string, locationData: any): Promise<PolizaDocument> {
        const poliza = await this.polizaModel.findById(polizaId);
        if (!poliza) {
            throw new NotFoundException('Póliza no encontrada');
        }

        return this.polizaModel
            .findByIdAndUpdate(polizaId, {
                ubicacion: {
                    lat: locationData.lat,
                    lng: locationData.lng
                },
                direccion: locationData.direccion || poliza.direccion,
                barrio: locationData.barrio,
                ciudad: locationData.ciudad,
                departamento: locationData.departamento,
                updated_at: new Date()
            }, { new: true })
            .exec();
    }

    async geocodePolizas(): Promise<{ success: number; failed: number; processed: number }> {
        const polizasSinUbicacion = await this.polizaModel.find({
            $or: [
                { ubicacion: { $exists: false } },
                { ubicacion: null }
            ],
            direccion: { $exists: true, $nin: [null, ''] }
        }).limit(50); // Procesar máximo 50 a la vez

        let success = 0;
        let failed = 0;

        for (const poliza of polizasSinUbicacion) {
            try {
                const geocoded = await this.geocodingService.geocodeAddress(poliza.direccion);
                if (geocoded) {
                    await this.polizaModel.findByIdAndUpdate(poliza._id, {
                        ubicacion: geocoded,
                        updated_at: new Date()
                    });
                    success++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`Error geocoding poliza ${poliza.poliza_number}:`, error.message);
                failed++;
            }

            // Pequeña pausa para no sobrecargar el servicio de geocoding
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            success,
            failed,
            processed: polizasSinUbicacion.length
        };
    }

    async getLocationStats(): Promise<any> {
        const total = await this.polizaModel.countDocuments();
        const ubicadas = await this.polizaModel.countDocuments({
            ubicacion: { $exists: true, $ne: null }
        });
        const sinUbicar = total - ubicadas;
        const porcentaje = total > 0 ? Math.round((ubicadas / total) * 100) : 0;

        return {
            total,
            ubicadas,
            sinUbicar,
            porcentaje
        };
    }
}
