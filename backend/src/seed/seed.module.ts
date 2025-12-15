import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Material, MaterialSchema } from '../schemas/material.schema';
import { Poliza, PolizaSchema } from '../schemas/poliza.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Material.name, schema: MaterialSchema },
            { name: Poliza.name, schema: PolizaSchema },
        ]),
    ],
    controllers: [SeedController],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }
