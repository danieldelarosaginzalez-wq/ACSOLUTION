import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        // Validar que los parámetros no sean nulos o undefined
        if (!email || !password) {
            return null;
        }

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return null;
        }

        // Verificar que el usuario tenga contraseña
        const userPassword = user.password_hash;
        if (!userPassword) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, userPassword);
        if (!isPasswordValid) {
            return null;
        }

        // Remover la contraseña del resultado
        const userObj = user.toObject();
        const { password_hash, ...result } = userObj;
        return result;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user._id,
            rol: user.rol
        };

        return {
            user: {
                _id: user._id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                estado: user.estado,
            },
            token: this.jwtService.sign(payload),
        };
    }

    async register(userData: any) {
        if (userData.role && !userData.rol) {
            userData.rol = userData.role;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await this.usersService.create({
            ...userData,
            password_hash: hashedPassword,
        });

        const { password_hash, ...result } = user.toObject();
        return result;
    }

    async validateToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }
}
