import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ImpossibilityForm({ orderId, orderNumber, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        motivo: '',
        descripcion_detallada: '',
        justificacion_sin_foto_predio: '',
    });
    const [fotoTirilla, setFotoTirilla] = useState(null);
    const [fotoPredio, setFotoPredio] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewTirilla, setPreviewTirilla] = useState(null);
    const [previewPredio, setPreviewPredio] = useState(null);

    useEffect(() => {
        // Obtener ubicación
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
    }, []);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'tirilla') {
                setFotoTirilla(file);
                setPreviewTirilla(URL.createObjectURL(file));
            } else {
                setFotoPredio(file);
                setPreviewPredio(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.motivo || !formData.descripcion_detallada) {
            alert('El motivo y la descripción son obligatorios');
            return;
        }

        if (!fotoTirilla) {
            alert('La foto de la tirilla es obligatoria');
            return;
        }

        if (!fotoPredio && !formData.justificacion_sin_foto_predio) {
            alert('Debe subir la foto del predio o justificar por qué no puede tomarla');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('motivo', formData.motivo);
            formDataToSend.append('descripcion_detallada', formData.descripcion_detallada);
            if (formData.justificacion_sin_foto_predio) {
                formDataToSend.append('justificacion_sin_foto_predio', formData.justificacion_sin_foto_predio);
            }
            if (location) {
                formDataToSend.append('ubicacion', JSON.stringify(location));
            }
            formDataToSend.append('foto_tirilla', fotoTirilla);
            if (fotoPredio) {
                formDataToSend.append('foto_predio', fotoPredio);
            }

            await api.post(`/ot/${orderId}/imposibilidad`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            alert('✅ Imposibilidad registrada exitosamente');
            onSuccess();
        } catch (error) {
            console.error('Error registrando imposibilidad:', error);
            alert('Error al registrar la imposibilidad: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const motivos = [
        'Cliente ausente',
        'Predio cerrado',
        'Acceso restringido',
        'Condiciones climáticas adversas',
        'Falta de materiales específicos',
        'Problema de seguridad',
        'Dirección incorrecta',
        'Otro',
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        ⚠️ Registrar Imposibilidad
                    </h2>
                    <p className="text-gray-600 mb-6">
                        OT #{orderNumber} - Complete todos los campos obligatorios
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Motivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo de Imposibilidad *
                            </label>
                            <select
                                value={formData.motivo}
                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Seleccione un motivo</option>
                                {motivos.map((motivo) => (
                                    <option key={motivo} value={motivo}>
                                        {motivo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Descripción Detallada */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción Detallada *
                            </label>
                            <textarea
                                value={formData.descripcion_detallada}
                                onChange={(e) => setFormData({ ...formData, descripcion_detallada: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describa en detalle la situación que impide realizar el trabajo..."
                                required
                            />
                        </div>

                        {/* Foto de Tirilla (OBLIGATORIA) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto de Tirilla de Imposibilidad * (OBLIGATORIA)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFileChange(e, 'tirilla')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {previewTirilla && (
                                <div className="mt-3">
                                    <img
                                        src={previewTirilla}
                                        alt="Preview Tirilla"
                                        className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <p className="text-sm text-green-600 mt-1">✓ Foto de tirilla cargada</p>
                                </div>
                            )}
                        </div>

                        {/* Foto del Predio (OPCIONAL) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto del Predio (Opcional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFileChange(e, 'predio')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {previewPredio && (
                                <div className="mt-3">
                                    <img
                                        src={previewPredio}
                                        alt="Preview Predio"
                                        className="w-full h-48 object-cover rounded-lg border-2 border-blue-500"
                                    />
                                    <p className="text-sm text-blue-600 mt-1">✓ Foto del predio cargada</p>
                                </div>
                            )}
                        </div>

                        {/* Justificación si no hay foto del predio */}
                        {!fotoPredio && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <svg
                                        className="h-5 w-5 text-yellow-400 mt-0.5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                                            Justificación por no poder tomar foto del predio *
                                        </label>
                                        <textarea
                                            value={formData.justificacion_sin_foto_predio}
                                            onChange={(e) =>
                                                setFormData({ ...formData, justificacion_sin_foto_predio: e.target.value })
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                            placeholder="Explique por qué no puede tomar la foto del predio (ej: predio cerrado, acceso restringido, etc.)"
                                            required={!fotoPredio}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ubicación */}
                        {location && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    📍 Ubicación capturada: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Registrando...' : 'Registrar Imposibilidad'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
