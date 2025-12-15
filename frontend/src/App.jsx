import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import CrearOT from './pages/CrearOT'
import DetalleOT from './pages/DetalleOT'
import AsignarOT from './pages/AsignarOT'
import OTParaTecnico from './pages/OTParaTecnico'
import InventarioPorTecnico from './pages/InventarioPorTecnico'
import PanelAnalistaInventarioOculto from './pages/PanelAnalistaInventarioOculto'
import HistorialConsultas from './pages/HistorialConsultas'
import PolizasPage from './pages/PolizasPage'
import AlertasPage from './pages/AlertasPage'
import ReportesPage from './pages/ReportesPage'
import TecnicosPage from './pages/TecnicosPage'
import MaterialesPage from './pages/MaterialesPage'
import EstadisticasIAPage from './pages/EstadisticasIAPage'
import DashboardAnalistaAvanzado from './pages/DashboardAnalistaAvanzado'
import ImportarExcel from './pages/ImportarExcel'
import MapaOperaciones from './pages/MapaOperaciones'
import TechnicianTracker from './pages/TechnicianTracker'


import Layout from './components/Layout'

function PrivateRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />

        <Route path="/ot/nueva" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><CrearOT /></Layout>
          </PrivateRoute>
        } />

        <Route path="/ot/:id" element={
          <PrivateRoute>
            <Layout><DetalleOT /></Layout>
          </PrivateRoute>
        } />

        <Route path="/ot/:id/asignar" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><AsignarOT /></Layout>
          </PrivateRoute>
        } />

        <Route path="/mi-ot/:id" element={
          <PrivateRoute allowedRoles={['tecnico']}>
            <Layout><OTParaTecnico /></Layout>
          </PrivateRoute>
        } />

        <Route path="/inventario/tecnico/:id" element={
          <PrivateRoute>
            <Layout><InventarioPorTecnico /></Layout>
          </PrivateRoute>
        } />

        <Route path="/secret/inventario" element={
          <PrivateRoute allowedRoles={['analista_inventario_oculto']}>
            <Layout><PanelAnalistaInventarioOculto /></Layout>
          </PrivateRoute>
        } />

        <Route path="/consultas" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><HistorialConsultas /></Layout>
          </PrivateRoute>
        } />

        <Route path="/polizas" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><PolizasPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/alertas" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><AlertasPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/mis-alertas" element={
          <PrivateRoute allowedRoles={['tecnico']}>
            <Layout><AlertasPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/reportes" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <Layout><ReportesPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/tecnicos" element={
          <PrivateRoute allowedRoles={['analista_inventario_oculto']}>
            <Layout><TecnicosPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/materiales" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <Layout><MaterialesPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/estadisticas-ia" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <Layout><EstadisticasIAPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="/dashboard-avanzado" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <Layout><DashboardAnalistaAvanzado /></Layout>
          </PrivateRoute>
        } />

        <Route path="/importar-excel" element={
          <PrivateRoute allowedRoles={['analista']}>
            <Layout><ImportarExcel /></Layout>
          </PrivateRoute>
        } />

        <Route path="/mapa" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <Layout><MapaOperaciones /></Layout>
          </PrivateRoute>
        } />





        <Route path="/tecnico-tracker" element={
          <PrivateRoute allowedRoles={['tecnico']}>
            <TechnicianTracker />
          </PrivateRoute>
        } />

        <Route path="/tecnico-tracker/:technicianId" element={
          <PrivateRoute allowedRoles={['analista', 'analista_inventario_oculto']}>
            <TechnicianTracker />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
