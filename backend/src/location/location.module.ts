import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';
import { GeocodingService } from './geocoding.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Poliza, PolizaSchema } from '../schemas/poliza.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Poliza.name, schema: PolizaSchema },
        ]),
    ],
    controllers: [LocationController],
    providers: [LocationService, LocationGateway, GeocodingService],
    exports: [LocationService, GeocodingService],
})
export class LocationModule { }
