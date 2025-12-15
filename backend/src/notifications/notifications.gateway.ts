import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('NotificationsGateway');
    private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

    handleConnection(client: Socket) {
        this.logger.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
        // Limpiar el socket del mapa de usuarios
        for (const [userId, sockets] of this.userSockets.entries()) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        const { userId } = data;
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(client.id);
        this.logger.log(`Usuario ${userId} registrado con socket ${client.id}`);
        return { success: true };
    }

    // Notificar a un usuario específico
    notifyUser(userId: string, event: string, data: any) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.forEach(socketId => {
                this.server.to(socketId).emit(event, data);
            });
            this.logger.log(`Notificación enviada a usuario ${userId}: ${event}`);
        }
    }

    // Notificar a múltiples usuarios
    notifyUsers(userIds: string[], event: string, data: any) {
        userIds.forEach(userId => this.notifyUser(userId, event, data));
    }

    // Broadcast a todos los usuarios conectados
    broadcast(event: string, data: any) {
        this.server.emit(event, data);
        this.logger.log(`Broadcast enviado: ${event}`);
    }

    // Notificar por rol
    notifyByRole(role: string, event: string, data: any) {
        this.server.emit(`role:${role}`, { event, data });
        this.logger.log(`Notificación enviada a rol ${role}: ${event}`);
    }
}
