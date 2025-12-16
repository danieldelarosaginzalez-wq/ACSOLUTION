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
        MongooseModule.forRoot(
            process.env.MONGO_URL ||
            process.env.MONGODB_URI ||
            'mongodb://localhost:27017/acsolution'
        ),
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
