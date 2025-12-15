import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AdvancedAIService } from './advanced-ai.service';
import { AiController } from './ai.controller';
import { AiPrediction, AiPredictionSchema } from '../schemas/ai-prediction.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Material, MaterialSchema } from '../schemas/material.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AiPrediction.name, schema: AiPredictionSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Material.name, schema: MaterialSchema },
        ]),
    ],
    controllers: [AiController],
    providers: [AiService, AdvancedAIService],
    exports: [AiService, AdvancedAIService],
})
export class AiModule { }
