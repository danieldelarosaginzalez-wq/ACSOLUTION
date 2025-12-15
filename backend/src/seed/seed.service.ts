import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { Material, MaterialDocument } from '../schemas/material.schema';
import { Poliza, PolizaDocument } from '../schemas/poliza.schema';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
        @InjectModel(Poliza.name) private polizaModel: Model<PolizaDocument>,
    ) { }

    async onModuleInit() {
        // Crear usuarios por defecto si no existen
        await this.createDefaultUsers();
    }

    async createDefaultUsers() {
        try {
            const userCount = await this.userModel.countDocuments();

            if (userCount === 0) {
                console.log('📝 Creando usuarios por defecto...');

                const users = [
                    {
                        nombre: 'Juan Analista',
                        email: 'analista@ises.com',
                        password: 'analista123',
                        rol: 'analista',
                        estado: 'activo',
                    },
                    {
                        nombre: 'Pedro Técnico',
                        email: 'tecnico@ises.com',
                        password: 'tecnico123',
                        rol: 'tecnico',
                        estado: 'activo',
                    },
                    {
                        nombre: 'Admin Inventario',
                        email: 'admin@ises.com',
                        password: 'admin123',
                        rol: 'analista_inventario_oculto',
                        estado: 'activo',
                    },
                ];

                for (const userData of users) {
                    const password_hash = await bcrypt.hash(userData.password, 10);

                    await this.userModel.create({
                        nombre: userData.nombre,
                        email: userData.email,
                        password_hash,
                        rol: userData.rol,
                        estado: userData.estado,
                        created_at: new Date(),
                    });

                    console.log(`✅ Usuario creado: ${userData.email} (password: ${userData.password})`);
                }

                console.log('\n✅ Usuarios por defecto creados exitosamente\n');
                console.log('Credenciales de acceso:');
                console.log('━'.repeat(50));
                users.forEach(user => {
                    console.log(`\n${user.rol.toUpperCase()}:`);
                    console.log(`  📧 Email:    ${user.email}`);
                    console.log(`  🔑 Password: ${user.password}`);
                });
                console.log('\n' + '━'.repeat(50) + '\n');
            }
        } catch (error) {
            console.error('Error creando usuarios por defecto:', error.message);
        }
    }

    async seedAll() {
        console.log('🌱 Iniciando seed completo...\n');

        // Limpiar datos existentes
        await this.userModel.deleteMany({});
        await this.materialModel.deleteMany({});
        await this.polizaModel.deleteMany({});

        // Crear usuarios
        await this.createDefaultUsers();

        // Crear materiales de prueba
        await this.createMaterials();

        // Crear pólizas de prueba
        await this.createPolizas();

        console.log('\n✅ Seed completo finalizado\n');
    }

    private async createMaterials() {
        console.log('📦 Creando materiales de prueba...');

        const materials = [
            {
                nombre: 'Cable calibre 12',
                descripcion: 'Cable eléctrico calibre 12 AWG',
                unidad_medida: 'metros',
                costo_unitario: 15.50,
                categoria: 'cables',
                stock_minimo: 100,
                estado: 'activo',
            },
            {
                nombre: 'Interruptor termomagnético 20A',
                descripcion: 'Interruptor termomagnético 20 amperes',
                unidad_medida: 'pza',
                costo_unitario: 85.00,
                categoria: 'protecciones',
                stock_minimo: 10,
                estado: 'activo',
            },
            {
                nombre: 'Cinta aislante',
                descripcion: 'Cinta aislante 3M negra',
                unidad_medida: 'pza',
                costo_unitario: 25.00,
                categoria: 'consumibles',
                stock_minimo: 20,
                estado: 'activo',
            },
            {
                nombre: 'Contacto doble',
                descripcion: 'Contacto doble polarizado',
                unidad_medida: 'pza',
                costo_unitario: 35.00,
                categoria: 'accesorios',
                stock_minimo: 15,
                estado: 'activo',
            },
        ];

        for (const material of materials) {
            await this.materialModel.create({
                ...material,
                created_at: new Date(),
            });
            console.log(`  ✓ Material: ${material.nombre}`);
        }
    }

    private async createPolizas() {
        console.log('📋 Creando pólizas de prueba...');

        const polizas = [
            {
                poliza_number: '600637',
                descripcion: 'Póliza de mantenimiento preventivo CFE',
                metadata: {
                    max_cost: 50000,
                    entidades: ['CFE'],
                },
                estado: 'activo',
            },
            {
                poliza_number: '600638',
                descripcion: 'Póliza de instalación eléctrica PEMEX',
                metadata: {
                    max_cost: 100000,
                    entidades: ['PEMEX'],
                },
                estado: 'activo',
            },
            {
                poliza_number: '600639',
                descripcion: 'Póliza de reparación urgente',
                metadata: {},
                estado: 'activo',
            },
        ];

        for (const poliza of polizas) {
            await this.polizaModel.create({
                ...poliza,
                created_at: new Date(),
                autorizaciones: [],
            });
            console.log(`  ✓ Póliza: ${poliza.poliza_number}`);
        }
    }
}
