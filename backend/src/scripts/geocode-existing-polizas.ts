/**
 * Script para geocodificar pólizas existentes
 * Ejecutar con: npx ts-node src/scripts/geocode-existing-polizas.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GeocodingService } from '../location/geocoding.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Poliza, PolizaDocument } from '../schemas/poliza.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const geocodingService = app.get(GeocodingService);
    const polizaModel = app.get<Model<PolizaDocument>>('PolizaModel');

    console.log('🗺️ Iniciando geocodificación de pólizas existentes...\n');

    // Obtener pólizas sin ubicación
    const polizas = await polizaModel.find({
        direccion: { $exists: true, $ne: '' },
        ubicacion: { $exists: false },
    });

    console.log(`📍 Encontradas ${polizas.length} pólizas para geocodificar\n`);

    let success = 0;
    let failed = 0;

    for (const poliza of polizas) {
        try {
            console.log(`Geocodificando: ${poliza.poliza_number} - ${poliza.direccion}`);

            const geocoded = await geocodingService.geocodeAddress(poliza.direccion);

            if (geocoded) {
                poliza.ubicacion = geocoded;
                await poliza.save();
                console.log(`✅ Éxito: ${geocoded.lat}, ${geocoded.lng}\n`);
                success++;
            } else {
                console.log(`❌ No se pudo geocodificar\n`);
                failed++;
            }

            // Esperar 1 segundo entre requests (respeto a Nominatim)
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
            failed++;
        }
    }

    console.log('\n📊 Resumen:');
    console.log(`✅ Exitosas: ${success}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📍 Total: ${polizas.length}`);

    await app.close();
}

bootstrap();
