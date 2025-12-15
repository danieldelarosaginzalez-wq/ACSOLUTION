import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function ImportarExcel() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Results
    const [file, setFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [validations, setValidations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [filter, setFilter] = useState('all'); // all, valid, warnings, errors
    const [editingRow, setEditingRow] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await api.post('/import/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setParseResult(response.data.parseResult);
            setValidations(response.data.validations);
            setStep(2);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al procesar el archivo');
        } finally {
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    const downloadTemplate = async () => {
        try {
            const response = await api.get('/import/template', {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_ordenes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Error al descargar la plantilla');
        }
    };

    const handleImport = async () => {
        const importableValidations = validations.filter(v => v.canImport);

        if (importableValidations.length === 0) {
            alert('No hay registros válidos para importar');
            return;
        }

        if (!confirm(`¿Importar ${importableValidations.length} órdenes de trabajo?`)) {
            return;
        }

        setImporting(true);

        try {
            const response = await api.post('/import/execute', {
                validations: importableValidations,
            });

            setImportResult(response.data);
            setStep(3);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al importar');
        } finally {
            setImporting(false);
        }
    };

    const getFilteredValidations = () => {
        if (filter === 'all') return validations;
        if (filter === 'valid') return validations.filter(v => v.canImport && v.row.warnings.length === 0);
        if (filter === 'warnings') return validations.filter(v => v.canImport && v.row.warnings.length > 0);
        if (filter === 'errors') return validations.filter(v => !v.canImport);
        return validations;
    };

    const getStatusBadge = (validation) => {
        if (!validation.canImport) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">❌ Error</span>;
        }
        if (validation.row.warnings.length > 0) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">⚠️ Advertencia</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✅ Válido</span>;
    };

    const reset = () => {
        setStep(1);
        setFile(null);
        setParseResult(null);
        setValidations([]);
        setImportResult(null);
        setFilter('all');
    };

    // STEP 1: Upload
    if (step === 1) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">📊 Importar Órdenes desde Excel</h1>
                    <p className="text-gray-600 mt-2">
                        Carga masiva de órdenes de trabajo desde un archivo Excel
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="text-6xl mb-4">📁</div>
                        {isDragActive ? (
                            <p className="text-xl font-semibold text-blue-600">Suelta el archivo aquí...</p>
                        ) : (
                            <>
                                <p className="text-xl font-semibold text-gray-700 mb-2">
                                    Arrastra tu archivo Excel aquí
                                </p>
                                <p className="text-gray-500 mb-4">o haz click para seleccionar</p>
                                <p className="text-sm text-gray-400">
                                    Formatos aceptados: .xlsx, .xls (máx. 5MB)
                                </p>
                            </>
                        )}
                    </div>

                    {loading && (
                        <div className="mt-6 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-2 text-gray-600">Procesando archivo...</p>
                        </div>
                    )}

                    {/* Plantilla */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📋</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">
                                    ¿Primera vez importando?
                                </h3>
                                <p className="text-gray-700 mb-3">
                                    Descarga nuestra plantilla Excel con ejemplos e instrucciones detalladas.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                                >
                                    <span>⬇️</span>
                                    Descargar Plantilla
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instrucciones */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">📝 Formato del Excel:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• <strong>Póliza:</strong> Número de 6 dígitos (obligatorio)</li>
                            <li>• <strong>Cliente:</strong> Nombre completo (obligatorio)</li>
                            <li>• <strong>Dirección:</strong> Dirección completa (obligatorio)</li>
                            <li>• <strong>Técnico:</strong> Nombre del técnico (opcional)</li>
                            <li>• <strong>Prioridad:</strong> alta, media o baja (opcional)</li>
                            <li>• <strong>Materiales:</strong> Formato "Material:Cantidad,Material2:Cantidad2" (opcional)</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2: Preview
    if (step === 2) {
        const filteredValidations = getFilteredValidations();
        const validCount = validations.filter(v => v.canImport && v.row.warnings.length === 0).length;
        const warningCount = validations.filter(v => v.canImport && v.row.warnings.length > 0).length;
        const errorCount = validations.filter(v => !v.canImport).length;

        return (
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📊 Preview de Importación</h1>
                        <p className="text-gray-600 mt-1">
                            Archivo: <span className="font-semibold">{file?.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        ← Volver
                    </button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
                        <div className="text-3xl font-bold text-gray-700">{parseResult.totalRows}</div>
                        <div className="text-sm text-gray-600">Total Registros</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="text-3xl font-bold text-green-600">{validCount}</div>
                        <div className="text-sm text-gray-600">✅ Válidos</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
                        <div className="text-sm text-gray-600">⚠️ Advertencias</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                        <div className="text-3xl font-bold text-red-600">{errorCount}</div>
                        <div className="text-sm text-gray-600">❌ Errores</div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({validations.length})
                        </button>
                        <button
                            onClick={() => setFilter('valid')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'valid'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ✅ Válidos ({validCount})
                        </button>
                        <button
                            onClick={() => setFilter('warnings')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'warnings'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ⚠️ Advertencias ({warningCount})
                        </button>
                        <button
                            onClick={() => setFilter('errors')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'errors'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ❌ Errores ({errorCount})
                        </button>
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={importing || validCount + warningCount === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {importing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Importando...
                            </>
                        ) : (
                            <>
                                <span>✓</span>
                                Importar {validCount + warningCount} OTs
                            </>
                        )}
                    </button>
                </div>

                {/* Tabla de Preview */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fila</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Póliza</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Técnico</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Problemas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredValidations.map((validation, idx) => (
                                    <tr
                                        key={idx}
                                        className={`hover:bg-gray-50 ${!validation.canImport ? 'bg-red-50' : validation.row.warnings.length > 0 ? 'bg-yellow-50' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-sm font-mono">{validation.row.rowNumber}</td>
                                        <td className="px-4 py-3">{getStatusBadge(validation)}</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{validation.row.data.poliza}</td>
                                        <td className="px-4 py-3 text-sm">{validation.row.data.cliente}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{validation.row.data.direccion}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {validation.row.data.tecnico || <span className="text-gray-400">-</span>}
                                            {!validation.technicianExists && validation.row.data.tecnico && (
                                                <span className="ml-2 text-xs text-orange-600">⚠️</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {validation.row.errors.length > 0 && (
                                                <div className="text-xs text-red-600 space-y-1">
                                                    {validation.row.errors.map((err, i) => (
                                                        <div key={i}>• {err}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {validation.row.warnings.length > 0 && (
                                                <div className="text-xs text-yellow-700 space-y-1">
                                                    {validation.row.warnings.map((warn, i) => (
                                                        <div key={i}>• {warn}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {validation.row.suggestions.length > 0 && (
                                                <div className="text-xs text-blue-600 space-y-1 mt-1">
                                                    {validation.row.suggestions.map((sug, i) => (
                                                        <div key={i}>💡 {sug}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 3: Results
    if (step === 3 && importResult) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">
                            {importResult.success ? '🎉' : '⚠️'}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {importResult.success ? '¡Importación Completada!' : 'Importación Parcial'}
                        </h1>
                        <p className="text-gray-600">
                            {importResult.success
                                ? 'Todas las órdenes se importaron correctamente'
                                : 'Algunas órdenes no pudieron importarse'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                            <div className="text-4xl font-bold text-green-600 mb-2">{importResult.created}</div>
                            <div className="text-green-700 font-semibold">✅ Órdenes Creadas</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                            <div className="text-4xl font-bold text-red-600 mb-2">{importResult.failed}</div>
                            <div className="text-red-700 font-semibold">❌ Errores</div>
                        </div>
                    </div>

                    {importResult.errors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                            <h3 className="font-bold text-red-800 mb-2">Errores encontrados:</h3>
                            <div className="space-y-1 text-sm text-red-700">
                                {importResult.errors.map((err, idx) => (
                                    <div key={idx}>
                                        • Fila {err.row}: {err.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={reset}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Importar Más Órdenes
                        </button>
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                        >
                            Ir al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
