import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SignaturesService } from './signatures.service';

@Controller('signatures')
@UseGuards(JwtAuthGuard)
export class SignaturesController {
    constructor(private signaturesService: SignaturesService) { }

    @Post()
    async createSignature(@Body() signatureDto: any, @Request() req) {
        console.log('Creating signature - User:', req.user);
        console.log('Signature data:', signatureDto);

        return this.signaturesService.create({
            ...signatureDto,
            createdBy: req.user?.userId || req.user?.id || req.user?._id || 'unknown',
        });
    }

    @Get('order/:orderId')
    async getOrderSignatures(@Param('orderId') orderId: string) {
        return this.signaturesService.findByOrder(orderId);
    }

    @Get(':id')
    async getSignature(@Param('id') id: string) {
        return this.signaturesService.findOne(id);
    }

    @Post('verify/:id')
    async verifySignature(@Param('id') id: string) {
        return this.signaturesService.verify(id);
    }
}
