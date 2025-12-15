import { useState } from 'react'
import { reportService } from '../services/reportService'
import { userService } from '../services/userService'

export default function ReportesPage() {
    const [reportType, setReportType] = useState('poliza')
    const [polizaNumber, setPolizaNumber] = useState('')
    const [techId, setTechId] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [technicians, setTechnicians] = useState([])

    useState(() => {
        loadTechnicians()
    }, [])

    const loadTechnicians = async () => {
        try {
            const response = await userService.getTechnicians()
            setTechnicians(response.data)
        } catch (error) {
            console.error('Error cargando técnicos:', error)
        }
    }

    const handleGenerateReport = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setReportData(null)

        try {
            let response
            if (reportType === 'poliza') {
                response = await reportService.polizaReport(polizaNumber)
            } else {
                response = await reportService.techConsumption(techId, dateFrom, dateTo)
            }
            setReportData(response.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Error generando reporte')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Reportes</h1>

            <div className="bg-white rounded shadow p-6 mb-6">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setReportType('poliza')}
                        className={`px-4 py-2 rounded ${reportType === 'poliza' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                    >
                        Reporte por Póliza
                    </button>
                    <button
                        onClick={() => setReportType('tech')}
                        className={`px-4 py-2 rounded ${reportType === 'tech' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                    >
                        Consumo por Técnico
                    </button>
                </div>

                <form onSubmit={handleGenerateReport} className="space-y-4">
                    {reportType === 'poliza' ? (
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Número de Póliza
                            </label>
                            <input
                                type="text"
                                value={polizaNumber}
                                onChange={(e) => setPolizaNumber(e.target.value)}
                                pattern="[0-9]{6}"
                                maxLength="6"
                                required
                                placeholder="Ej: 123456"
                                className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Técnico
                                </label>
                                <select
                                    value={techId}
                                    onChange={(e) => setTechId(e.target.value)}
                                    required
                                    className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar técnico</option>
                                    {technicians.map(tech => (
                                        <option key={tech._id} value={tech._id}>
                                            {tech.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Fecha Desde
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Fecha Hasta
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
            </div>

            {reportData && (
                <div className="bg-white rounded shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Resultados del Reporte</h2>

                    {reportType === 'poliza' ? (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-2">Resumen</h3>
                                <p>Póliza: <span className="font-mono font-bold">{reportData.poliza_number}</span></p>
                                <p>Total OTs: <span className="font-bold">{reportData.total_ots}</span></p>
                            </div>

                            {reportData.total_consumos && reportData.total_consumos.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Consumos Totales</h3>
                                    <table className="w-full border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-2 border text-left">Material</th>
                                                <th className="p-2 border text-right">Cantidad</th>
                                                <th className="p-2 border text-left">Unidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.total_consumos.map((consumo, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2 border">{consumo.material_id}</td>
                                                    <td className="p-2 border text-right font-bold">{consumo.cantidad}</td>
                                                    <td className="p-2 border">{consumo.unidad}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-2">Resumen</h3>
                                <p>Técnico ID: <span className="font-mono">{reportData.tecnico_id}</span></p>
                                <p>Período: {reportData.periodo.from || 'Inicio'} - {reportData.periodo.to || 'Hoy'}</p>
                                <p>Total Movimientos: <span className="font-bold">{reportData.movimientos.length}</span></p>
                            </div>

                            {reportData.resumen && reportData.resumen.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Resumen por Material</h3>
                                    <table className="w-full border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-2 border text-left">Material</th>
                                                <th className="p-2 border text-right">Consumido</th>
                                                <th className="p-2 border text-right">Devuelto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.resumen.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2 border">{item.material_id}</td>
                                                    <td className="p-2 border text-right text-red-600 font-bold">
                                                        {item.total_consumido}
                                                    </td>
                                                    <td className="p-2 border text-right text-green-600 font-bold">
                                                        {item.total_devuelto}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
