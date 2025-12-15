import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { AdvancedAIService } from './advanced-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private aiService: AiService,
        private advancedAI: AdvancedAIService,
    ) { }

    @Post('predict')
    async predict(@Body() body: { order_id: string }, @Request() req) {
        return this.aiService.predict(body.order_id, req.user._id);
    }

    @Post('predict-materials')
    async predictMaterials(@Body() body: { tipo_trabajo: string; cliente?: string }) {
        return this.aiService.predictMaterials(body.tipo_trabajo, body.cliente);
    }

    @Get('stats')
    async getStats() {
        return this.aiService.getAIStats();
    }

    @Get('predictions')
    async findAll(@Query() query: any) {
        const filters: any = {};
        if (query.order_id) filters.order_id = query.order_id;
        if (query.decision) filters.decision = query.decision;
        return this.aiService.findAll(filters);
    }

    @Get('predictions/:id')
    async findOne(@Param('id') id: string) {
        return this.aiService.findById(id);
    }

    @Put('predictions/:id/label')
    async label(@Param('id') id: string, @Body() body: { label_after: string }) {
        return this.aiService.labelPrediction(id, body.label_after);
    }

    // ========== ENDPOINTS DE IA AVANZADA ==========

    @Post('predict-complete')
    async predictComplete(@Body() orderData: any) {
        return this.advancedAI.predictComplete(orderData);
    }

    @Post('predict-materials-advanced')
    async predictMaterialsAdvanced(@Body() orderData: any) {
        return this.advancedAI.predictMaterials(orderData);
    }

    @Post('predict-time')
    async predictTime(@Body() orderData: any) {
        return this.advancedAI.predictTime(orderData);
    }

    @Post('predict-cost')
    async predictCost(@Body() orderData: any) {
        return this.advancedAI.predictCost(orderData);
    }

    @Post('recommend-technician')
    async recommendTechnician(@Body() orderData: any) {
        return this.advancedAI.recommendTechnician(orderData);
    }

    @Get('analyze-patterns')
    async analyzePatterns() {
        return this.advancedAI.analyzePatterns();
    }
}
