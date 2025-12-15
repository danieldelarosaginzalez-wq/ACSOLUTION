import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
    constructor(private seedService: SeedService) { }

    @Post()
    async seed() {
        await this.seedService.seedAll();
        return {
            message: 'Base de datos inicializada con datos de prueba',
            users: [
                { email: 'analista@ises.com', password: 'analista123', rol: 'analista' },
                { email: 'tecnico@ises.com', password: 'tecnico123', rol: 'tecnico' },
                { email: 'admin@ises.com', password: 'admin123', rol: 'analista_inventario_oculto' },
            ],
        };
    }
}
