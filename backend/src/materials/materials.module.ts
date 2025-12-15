import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialsController } from './materials.controller';
import { MaterialDistributionController } from './material-distribution.controller';
import { MaterialRequestController } from './material-request.controller';
import { MaterialsService } from './materials.service';
import { MaterialDistributionService } from './material-distribution.service';
import { MaterialRequestService } from './material-request.service';
import { MaterialLearningService } from '../ai/material-learning.service';
import { Material, MaterialSchema } from '../schemas/material.schema';
import { MaterialControl, MaterialControlSchema } from '../schemas/material-control.schema';
import { MaterialRequest, MaterialRequestSchema } from '../schemas/material-request.schema';
import { MaterialConsumptionPattern, MaterialConsumptionPatternSchema } from '../schemas/material-consumption-pattern.schema';
import { InventoryTechnician, InventoryTechnicianSchema } from '../schemas/inventory-technician.schema';
import { MovimientoInventario, MovimientoInventarioSchema } from '../schemas/movimiento-inventario.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Material.name, schema: MaterialSchema },
            { name: MaterialControl.name, schema: MaterialControlSchema },
            { name: MaterialRequest.name, schema: MaterialRequestSchema },
            { name: MaterialConsumptionPattern.name, schema: MaterialConsumptionPatternSchema },
            { name: InventoryTechnician.name, schema: InventoryTechnicianSchema },
            { name: MovimientoInventario.name, schema: MovimientoInventarioSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
        InventoryModule,
    ],
    controllers: [MaterialsController, MaterialDistributionController, MaterialRequestController],
    providers: [MaterialsService, MaterialDistributionService, MaterialRequestService, MaterialLearningService],
    exports: [MaterialsService, MaterialDistributionService, MaterialRequestService, MaterialLearningService],
})
export class MaterialsModule { }
