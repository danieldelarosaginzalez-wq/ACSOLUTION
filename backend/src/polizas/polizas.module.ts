import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolizasService } from './polizas.service';
import { PolizasController } from './polizas.controller';
import { Poliza, PolizaSchema } from '../schemas/poliza.schema';
import { OrdersModule } from '../orders/orders.module';
import { LocationModule } from '../location/location.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Poliza.name, schema: PolizaSchema }]),
        forwardRef(() => OrdersModule),
        forwardRef(() => LocationModule),
    ],
    controllers: [PolizasController],
    providers: [PolizasService],
    exports: [PolizasService],
})
export class PolizasModule { }
