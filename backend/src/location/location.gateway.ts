import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LocationService } from './location.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/location',
})
export class LocationGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LocationGateway.name);

    constructor(private readonly locationService: LocationService) { }

    /**
     * Cliente se conecta al WebSocket
     */
    handleConnection(client: Socket) {
        this.logger.log(`Cliente conectado: ${client.id}`);
    }

    /**
     * Cliente se desconecta
     */
    handleDisconnect(client: Socket) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }

    /**
     * Técnico actualiza su ubicación
     */
    @SubscribeMessage('updateLocation')
    async handleUpdateLocation(
        @MessageBody() data: { tecnicoId: string; lat: number; lng: number; accuracy?: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const result = await this.locationService.updateTechnicianLocation(
                data.tecnicoId,
                data.lat,
                data.lng,
                data.accuracy,
            );

            // Broadcast a todos los analistas conectados
            this.server.emit('technicianLocationUpdated', {
                tecnicoId: data.tecnicoId,
                ubicacion: result.ubicacion,
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Error updating location:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Solicita datos del mapa
     */
    @SubscribeMessage('requestMapData')
    async handleRequestMapData(
        @MessageBody() data: { estado?: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const mapData = await this.locationService.getMapData(data.estado);
            client.emit('mapData', mapData);
            return { success: true };
        } catch (error) {
            this.logger.error('Error getting map data:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Broadcast manual de actualización de mapa (útil para testing)
     */
    broadcastMapUpdate() {
        this.server.emit('mapUpdateRequired', {
            timestamp: new Date(),
        });
    }
}
