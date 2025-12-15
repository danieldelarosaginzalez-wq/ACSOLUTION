import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(userId) {
        if (this.socket?.connected) {
            return;
        }

        // Remover /api del URL para WebSocket
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const BACKEND_URL = apiUrl.replace('/api', '');

        this.socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket conectado:', this.socket.id);
            if (userId) {
                this.socket.emit('register', { userId });
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket desconectado');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (!this.socket) return;

        this.socket.on(event, callback);

        // Guardar referencia para poder remover después
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.socket) return;

        this.socket.off(event, callback);

        // Remover de la lista de listeners
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
