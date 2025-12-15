import { useState } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';

export default function TestNotifications() {
    const [status, setStatus] = useState('');
    const [socketStatus, setSocketStatus] = useState('Desconectado');

    const checkSocketStatus = () => {
        const isConnected = socketService.isConnected();
        setSocketStatus(isConnected ? '✅ Conectado' : '❌ Desconectado');
        setStatus(`Socket: ${isConnected ? 'Conectado' : 'Desconectado'}`);
    };

    const sendTestNotification = async () => {
        try {
            setStatus('Enviando notificación de prueba...');
            const response = await api.post('/notifications/test');
            setStatus('✅ Notificación enviada: ' + JSON.stringify(response.data));
        } catch (error) {
            setStatus('❌ Error: ' + error.message);
            console.error('Error:', error);
        }
    };

    const testSocketConnection = () => {
        setStatus('Probando conexión socket...');
        socketService.emit('test', { message: 'Hola desde el cliente' });
        setStatus('✅ Mensaje enviado al socket');
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 z-50">
            <h3 className="font-bold text-lg mb-3">🧪 Test Notificaciones</h3>

            <div className="space-y-2 mb-3">
                <div className="text-sm">
                    <strong>Estado Socket:</strong> {socketStatus}
                </div>
                {status && (
                    <div className="text-xs bg-gray-100 p-2 rounded max-w-xs overflow-auto">
                        {status}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <button
                    onClick={checkSocketStatus}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Verificar Socket
                </button>

                <button
                    onClick={sendTestNotification}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                    Enviar Notificación
                </button>

                <button
                    onClick={testSocketConnection}
                    className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                >
                    Test Socket
                </button>
            </div>
        </div>
    );
}
