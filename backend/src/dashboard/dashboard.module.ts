import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrderSchema } from '../schemas/order.schema';
import { MaterialSchema } from '../schemas/material.schema';
import { UserSchema } from '../schemas/user.schema';
import { AlertSchema } from '../schemas/alert.schema';
import { AiPredictionSchema } from '../schemas/ai-prediction.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Order', schema: OrderSchema },
            { name: 'Material', schema: MaterialSchema },
            { name: 'User', schema: UserSchema },
            { name: 'Alert', schema: AlertSchema },
            { name: 'AiPrediction', schema: AiPredictionSchema },
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }
