import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ExcelParserService } from './excel-parser.service';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [OrdersModule, NotificationsModule, AuditModule],
    controllers: [ImportController],
    providers: [ImportService, ExcelParserService],
    exports: [ImportService, ExcelParserService],
})
export class ImportModule { }
