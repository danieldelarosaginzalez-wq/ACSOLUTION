import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PolizasModule } from './polizas/polizas.module';
import { OrdersModule } from './orders/orders.module';
import { MaterialsModule } from './materials/materials.module';
import { InventoryModule } from './inventory/inventory.module';
import { FilesModule } from './files/files.module';
import { AiModule } from './ai/ai.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SignaturesModule } from './signatures/signatures.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ImportModule } from './import/import.module';
import { LocationModule } from './location/location.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            useFactory: () => {
                // Función para construir URL de MongoDB
                function getMongoUrl() {
                    // Prioridad: MONGO_URL > MONGODB_URI > Variables individuales > Local
                    if (process.env.MONGO_URL) {
                        return `${process.env.MONGO_URL}/acsolution`;
                    }

                    if (process.env.MONGODB_URI) {
                        return process.env.MONGODB_URI;
                    }

                    // Construir desde variables individuales (Railway)
                    const mongoUser = process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME || 'mongo';
                    const mongoPassword = process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD;
                    const mongoHost = process.env.MONGOHOST || process.env.RAILWAY_PRIVATE_DOMAIN;
                    const mongoPort = process.env.MONGOPORT || '27017';

                    if (mongoPassword && mongoHost) {
                        return `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/acsolution`;
                    }

                    return 'mongodb://localhost:27017/acsolution';
                }

                const mongoUrl = getMongoUrl();

                // Log en producción
                if (process.env.NODE_ENV === 'production') {
                    console.log('🔍 MongoDB Configuration:');
                    console.log('MONGO_URL:', process.env.MONGO_URL ? '✅' : '❌');
                    console.log('MONGOUSER:', process.env.MONGOUSER ? '✅' : '❌');
                    console.log('MONGOHOST:', process.env.MONGOHOST ? '✅' : '❌');
                    console.log('URL:', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
                }

                return {
                    uri: mongoUrl,
                    retryAttempts: 5,
                    retryDelay: 3000,
                };
            },
        }),
        AuthModule,
        UsersModule,
        PolizasModule,
        OrdersModule,
        MaterialsModule,
        InventoryModule,
        FilesModule,
        AiModule,
        AlertsModule,
        ReportsModule,
        AuditModule,
        NotificationsModule,
        SignaturesModule,
        DashboardModule,
        ImportModule,
        LocationModule,
    ],
})
export class AppModule { }
