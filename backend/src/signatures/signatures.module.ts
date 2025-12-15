import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { SignatureSchema } from '../schemas/signature.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Signature', schema: SignatureSchema },
        ]),
    ],
    controllers: [SignaturesController],
    providers: [SignaturesService],
    exports: [SignaturesService],
})
export class SignaturesModule { }
