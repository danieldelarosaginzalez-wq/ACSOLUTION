import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePad({ onSave, onCancel, signerInfo = {} }) {
    const sigPadRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [signerName, setSignerName] = useState(signerInfo.name || '');
    const [signerDocument, setSignerDocument] = useState(signerInfo.document || '');
    const [signerEmail, setSignerEmail] = useState(signerInfo.email || '');
    const [signerPhone, setSignerPhone] = useState(signerInfo.phone || '');
    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Solicitar ubicación
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.log('No se pudo obtener la ubicación:', error);
                }
            );
        }

        // Solicitar permiso para notificaciones
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleClear = () => {
        sigPadRef.current?.clear();
        setIsEmpty(true);
    };

    const handleEnd = () => {
        setIsEmpty(sigPadRef.current?.isEmpty());
    };

    const handleSave = () => {
        if (isEmpty || !signerName.trim()) {
            alert('Por favor complete el nombre y la firma');
            return;
        }

        const signatureData = sigPadRef.current?.toDataURL('image/png');

        const signatureInfo = {
            signatureData,
            signerName: signerName.trim(),
            signerDocument: signerDocument.trim(),
            signerEmail: signerEmail.trim(),
            signerPhone: signerPhone.trim(),
            location,
            ipAddress: null, // Se capturará en el backend
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        };

        onSave(signatureInfo);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Firma Digital
                    </h2>

                    {/* Información del firmante */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ingrese su nombre completo"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Documento de Identidad
                                </label>
                                <input
                                    type="text"
                                    value={signerDocument}
                                    onChange={(e) => setSignerDocument(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="DNI/RUC"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={signerPhone}
                                    onChange={(e) => setSignerPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="999 999 999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={signerEmail}
                                onChange={(e) => setSignerEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                    </div>

                    {/* Canvas de firma */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Firma aquí *
                        </label>
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                            <SignatureCanvas
                                ref={sigPadRef}
                                canvasProps={{
                                    className: 'w-full h-64 cursor-crosshair',
                                }}
                                onEnd={handleEnd}
                                backgroundColor="rgb(255, 255, 255)"
                                penColor="rgb(0, 0, 0)"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Firme dentro del recuadro usando su mouse o pantalla táctil
                        </p>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-5 h-5 text-blue-600 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-blue-900 mb-1">
                                    Información de Seguridad
                                </h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Su firma será encriptada y almacenada de forma segura</li>
                                    <li>• Se registrará la fecha, hora y ubicación de la firma</li>
                                    <li>• La firma tiene validez legal según normativa vigente</li>
                                    {location && (
                                        <li>• Ubicación capturada: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-between space-x-4">
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Limpiar Firma
                        </button>
                        <div className="flex space-x-4">
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isEmpty || !signerName.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Guardar Firma
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
