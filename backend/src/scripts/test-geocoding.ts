import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GeocodingService } from '../location/geocoding.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';

async function testGeocoding() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const geocodingService = app.get(GeocodingService);

    // Probar direcciones de ejemplo de Cartagena
    const testAddresses = [
        'Calle 30 #45-67',
        'Carrera 5 #10-20 Barrio Manga',
        'Calle 10 #20-30 Bocagrande',
        'Avenida Pedro de Heredia',
        'Calle de la Factoria #36-57 Centro Historico',
        'Carrera 1 #8-50 Bocagrande Cartagena',
    ];

    console.log('🔍 Probando geocodificación de direcciones de Cartagena...\n');

    for (const address of testAddresses) {
        console.log(`\n📍 Probando: "${address}"`);
        const result = await geocodingService.geocodeAddress(address);

        if (result) {
            console.log(`✅ Éxito: ${result.lat}, ${result.lng}`);
            console.log(`   Dirección completa: ${result.direccion_completa}`);
        } else {
            console.log(`❌ No se pudo geocodificar`);
        }

        // Esperar 1 segundo entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await app.close();
}

testGeocoding().catch(console.error);
