import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS - Permitir frontend en puerto 5173 (Vite)
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.CORS_ORIGIN || 'http://localhost:5173'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 4000;
    await app.listen(port);

    console.log(`🚀 Backend ServiceOps Pro running on: http://localhost:${port}/api`);
}
bootstrap();
