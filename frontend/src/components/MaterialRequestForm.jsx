import React, { useState, useEffect } from 'react';
import { materialDistributionService } from '../services/materialDistributionService';
import { materialService } from '../services/materialService';

const MaterialRequestForm = ({ onRequestCreated }) => {
    const [tipoTrabajo, setTipoTrabajo] = useState('');
    const [materiales, setMateriales] = useState([]);
    const [materialesDisponibles, setMaterialesDisponibles] = useState([]);
    const [sugerenciasIA, setSugerenciasIA] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modoInteligente, setModoInteligente] = useState(false);

    const tiposTrabajoComunes = [
        'instalacion_medidor',
        'reparacion_tuberia',
        'mantenimiento_red',
        'conexion_nueva',
        'reparacion_fuga',
        'cambio_valvula',
        'limpieza_alcantarilla',
        'inspeccion_general'
    ];

    useEffect(() => {
        cargarMateriales();
    }, []);

    const cargarMateriales = async () => {
        try {
            const response = await materialService.getMaterials();
            setMaterialesDisponibles(response.data || []);
        } catch (error) {
            console.error('Error cargando materiales:', error);
        }
    };

    const obtenerSugerenciasIA = async () => {
        if (!tipoTrabajo) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/material-requests/sugerencias/${tipoTrabajo}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSugerenciasIA(data);

                // Aplicar sugerencias automáticamente
                const materialesSugeridos = data.sugerencias.map(s => ({
                    material_id: s.material.id,
                    nombre: s.material.nombre,
                    cantidad_solicitada: s.cantidad_sugerida,
                    motivo: `Sugerencia IA (${s.total_trabajos} trabajos similares)`,
                    tipo_trabajo_estimado: tipoTrabajo,
                    confianza: s.confianza,
                    disponible: s.disponible
                }));

                setMateriales(materialesSugeridos);
            }
        } catch (error) {
            console.error('Error obteniendo sugerencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarSolicitudInteligente = async () => {
        if (!tipoTrabajo) return;

        setLoading(true);
        try {
            const response = await fetch('/api/material-requests/generar-inteligente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    tipo_trabajo: tipoTrabajo,
                    factor_seguridad: 1.2
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('Solicitud inteligente creada exitosamente');
                    onRequestCreated && onRequestCreated();
                } else {
                    alert(data.message || 'No se pudo generar la solicitud');
                }
            }
        } catch (error) {
            console.error('Error generando solicitud inteligente:', error);
            alert('Error generando solicitud inteligente');
        } finally {
            setLoading(false);
        }
    };

    const agregarMaterial = () => {
        setMateriales([...materiales, {
            material_id: '',
            nombre: '',
            cantidad_solicitada: 1,
            motivo: '',
            tipo_trabajo_estimado: tipoTrabajo
        }]);
    };

    const actualizarMaterial = (index, campo, valor) => {
        const nuevos = [...materiales];
        nuevos[index][campo] = valor;

        if (campo === 'material_id') {
            const material = materialesDisponibles.find(m => m._id === valor);
            if (material) {
                nuevos[index].nombre = material.nombre;
            }
        }

        setMateriales(nuevos);
    };

    const eliminarMaterial = (index) => {
        setMateriales(materiales.filter((_, i) => i !== index));
    };

    const enviarSolicitud = async () => {
        if (materiales.length === 0) {
            alert('Debe agregar al menos un material');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/material-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    materiales: materiales.map(m => ({
                        material_id: m.material_id,
                        cantidad_solicitada: m.cantidad_solicitada,
                        motivo: m.motivo,
                        tipo_trabajo_estimado: m.tipo_trabajo_estimado
                    }))
                })
            });

            if (response.ok) {
                alert('Solicitud creada exitosamente');
                setMateriales([]);
                setTipoTrabajo('');
                setSugerenciasIA(null);
                onRequestCreated && onRequestCreated();
            }
        } catch (error) {
            console.error('Error enviando solicitud:', error);
            alert('Error enviando solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Solicitar Materiales</h2>
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Modo Inteligente</label>
                    <input
                        type="checkbox"
                        checked={modoInteligente}
                        onChange={(e) => setModoInteligente(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Selector de tipo de trabajo */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Trabajo
                </label>
                <select
                    value={tipoTrabajo}
                    onChange={(e) => setTipoTrabajo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Seleccionar tipo de trabajo</option>
                    {tiposTrabajoComunes.map(tipo => (
                        <option key={tipo} value={tipo}>
                            {tipo.replace(/_/g, ' ').toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Botones de IA */}
            {modoInteligente && tipoTrabajo && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Asistente Inteligente</h3>
                    <div className="flex space-x-3">
                        <button
                            onClick={obtenerSugerenciasIA}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Cargando...' : 'Ver Sugerencias IA'}
                        </button>
                        <button
                            onClick={generarSolicitudInteligente}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Generando...' : 'Generar Solicitud Automática'}
                        </button>
                    </div>
                </div>
            )}

            {/* Información de sugerencias IA */}
            {sugerenciasIA && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Sugerencias basadas en {sugerenciasIA.total_patrones} patrones
                    </h3>
                    <p className="text-sm text-green-700">
                        Confianza promedio: {(sugerenciasIA.confianza_promedio * 100).toFixed(1)}%
                    </p>
                </div>
            )}

            {/* Lista de materiales */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Materiales Solicitados</h3>
                    <button
                        onClick={agregarMaterial}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Agregar Material
                    </button>
                </div>

                {materiales.map((material, index) => (
                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Material
                                </label>
                                <select
                                    value={material.material_id}
                                    onChange={(e) => actualizarMaterial(index, 'material_id', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar material</option>
                                    {materialesDisponibles.map(mat => (
                                        <option key={mat._id} value={mat._id}>
                                            {mat.nombre} (Stock: {mat.stock_actual})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={material.cantidad_solicitada}
                                    onChange={(e) => actualizarMaterial(index, 'cantidad_solicitada', parseInt(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                {material.confianza && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Confianza IA: {(material.confianza * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Motivo
                                </label>
                                <input
                                    type="text"
                                    value={material.motivo}
                                    onChange={(e) => actualizarMaterial(index, 'motivo', e.target.value)}
                                    placeholder="¿Para qué necesita este material?"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => eliminarMaterial(index)}
                                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>

                        {material.disponible === false && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-700">⚠️ Material no disponible en stock suficiente</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Botón enviar */}
            <div className="flex justify-end">
                <button
                    onClick={enviarSolicitud}
                    disabled={loading || materiales.length === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
            </div>
        </div>
    );
};

export default MaterialRequestForm;