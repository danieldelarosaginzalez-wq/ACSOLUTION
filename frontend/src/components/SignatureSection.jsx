import { useState, useEffect } from 'react';
import SignaturePad from './SignaturePad';
import { signatureService } from '../services/signatureService';
import { useAuthStore } from '../store/authStore';

export default function SignatureSection({ orderId, orderData }) {
    const [signatures, setSignatures] = useState([]);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signatureType, setSignatureType] = useState('client');
    const [loading, setLoading] = useState(false);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        loadSignatures();
    }, [orderId]);

    const loadSignatures = async () => {
        try {
            const data = await signatureService.getOrderSignatures(orderId);
            setSignatures(data);
        } catch (error) {
            console.error('Error cargando firmas:', error);
        }
    };

    const handleSaveSignature = async (signatureInfo) => {
        try {
            setLoading(true);
            await signatureService.createSignature(orderId, {
                ...signatureInfo,
                signatureType,
            });
            await loadSignatures();
            setShowSignaturePad(false);
            alert('Firma guardada exitosamente');
        } catch (error) {
            console.error('Error guardando firma:', error);
            alert('Error al guardar la firma');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySignature = async (signatureId) => {
        try {
            const result = await signatureService.verifySignature(signatureId);
            alert(result.message);
        } catch (error) {
            console.error('Error verificando firma:', error);
            alert('Error al verificar la firma');
        }
    };

    const getSignatureTypeLabel = (type) => {
        const labels = {
            client: 'Cliente',
            technician: 'Técnico',
            analyst: 'Analista',
        };
        return labels[type] || type;
    };

    const canAddSignature = (type) => {
        if (type === 'client') return true;
        if (type === 'technician' && user?.rol === 'tecnico') return true;
        if (type === 'analyst' && user?.rol === 'analista') return true;
        return false;
    };

    return (
        <div className="space-y-6">
            {/* Botones para agregar firmas */}
            <div className="flex flex-wrap gap-4">
                {['client', 'technician', 'analyst'].map((type) => {
                    const hasSignature = signatures.some((s) => s.signatureType === type);
                    const canAdd = canAddSignature(type);

                    return (
                        <button
                            key={type}
                            onClick={() => {
                                setSignatureType(type);
                                setShowSignaturePad(true);
                            }}
                            disabled={hasSignature || !canAdd}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${hasSignature
                                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                : canAdd
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {hasSignature ? '✓ ' : '+ '}
                            Firma {getSignatureTypeLabel(type)}
                        </button>
                    );
                })}
            </div>

            {/* Lista de firmas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signatures.map((signature) => (
                    <div
                        key={signature._id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                                {getSignatureTypeLabel(signature.signatureType)}
                            </h4>
                            {signature.verified ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Verificada
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pendiente
                                </span>
                            )}
                        </div>

                        {/* Imagen de la firma */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3">
                            <img
                                src={signature.signatureData}
                                alt="Firma"
                                className="w-full h-32 object-contain"
                            />
                        </div>

                        {/* Información del firmante */}
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Nombre:</span>
                                <p className="text-gray-900">{signature.signerName}</p>
                            </div>
                            {signature.signerDocument && (
                                <div>
                                    <span className="font-medium text-gray-700">Documento:</span>
                                    <p className="text-gray-900">{signature.signerDocument}</p>
                                </div>
                            )}
                            {signature.signerEmail && (
                                <div>
                                    <span className="font-medium text-gray-700">Email:</span>
                                    <p className="text-gray-900 text-xs">{signature.signerEmail}</p>
                                </div>
                            )}
                            {signature.signerPhone && (
                                <div>
                                    <span className="font-medium text-gray-700">Teléfono:</span>
                                    <p className="text-gray-900">{signature.signerPhone}</p>
                                </div>
                            )}
                            <div>
                                <span className="font-medium text-gray-700">Fecha:</span>
                                <p className="text-gray-900">
                                    {new Date(signature.createdAt).toLocaleString('es-ES')}
                                </p>
                            </div>
                            {signature.location && (
                                <div>
                                    <span className="font-medium text-gray-700">Ubicación:</span>
                                    <p className="text-gray-900 text-xs">
                                        {signature.location.latitude.toFixed(4)},{' '}
                                        {signature.location.longitude.toFixed(4)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Botón de verificación */}
                        <button
                            onClick={() => handleVerifySignature(signature._id)}
                            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            Verificar Integridad
                        </button>
                    </div>
                ))}
            </div>

            {/* Sin firmas */}
            {signatures.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        No hay firmas registradas para esta orden
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Haz clic en los botones de arriba para agregar firmas
                    </p>
                </div>
            )}

            {/* Modal de firma */}
            {showSignaturePad && (
                <SignaturePad
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignaturePad(false)}
                    signerInfo={{
                        name: signatureType === 'client' ? orderData?.cliente : user?.nombre,
                        email: signatureType === 'client' ? '' : user?.email,
                    }}
                />
            )}
        </div>
    );
}
