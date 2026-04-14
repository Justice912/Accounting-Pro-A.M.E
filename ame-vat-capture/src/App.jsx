import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import MagicLinkCallback from './pages/MagicLinkCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Receipts from './pages/Receipts.jsx';
import VatSchedules from './pages/VatSchedules.jsx';
import Reconciliation from './pages/Reconciliation.jsx';
import Capture from './pages/Capture.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/magic-link-callback" element={<MagicLinkCallback />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/vat" element={<VatSchedules />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
      </Route>

      <Route
        path="/capture"
        element={
          <ProtectedRoute>
            <Capture />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
