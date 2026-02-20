import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import DashboardPresupuesto from './pages/DashboardPresupuesto';
import DashboardAdquisiciones from './pages/DashboardAdquisiciones';
import DashboardContratosMenores from './pages/DashboardContratosMenores';
import DashboardActividadesOperativas from './pages/DashboardActividadesOperativas';
import Importacion from './pages/Importacion';
import Alertas from './pages/Alertas';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard/presupuesto" replace />} />
          <Route path="dashboard/presupuesto" element={<DashboardPresupuesto />} />
          <Route path="dashboard/adquisiciones" element={<DashboardAdquisiciones />} />
          <Route path="dashboard/contratos-menores" element={<DashboardContratosMenores />} />
          <Route path="dashboard/actividades-operativas" element={<DashboardActividadesOperativas />} />
          <Route path="importacion" element={<Importacion />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
