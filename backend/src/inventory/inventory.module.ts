import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTechnician, InventoryTechnicianSchema } from '../schemas/inventory-technician.schema';
import { MovimientoInventario, MovimientoInventarioSchema } from '../schemas/movimiento-inventario.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: InventoryTechnician.name, schema: InventoryTechnicianSchema },
            { name: MovimientoInventario.name, schema: MovimientoInventarioSchema },
        ]),
    ],
    controllers: [InventoryController],
    providers: [InventoryService],
    exports: [InventoryService],
})
export class InventoryModule { }
