import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Settings from './pages/Settings';
import VATCapture from './pages/VATCapture';
import VATDashboard from './pages/VATDashboard';
import VATSales from './pages/VATSales';
import VAT201Preview from './pages/VAT201Preview';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="workspace" element={<Workspace />} />
        <Route path="workspace/:domain" element={<Workspace />} />
        <Route path="workspace/:domain/:conversationId" element={<Workspace />} />
        <Route path="vat-dashboard" element={<VATDashboard />} />
        <Route path="vat-capture" element={<VATCapture />} />
        <Route path="vat-sales" element={<VATSales />} />
        <Route path="vat201-preview" element={<VAT201Preview />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
