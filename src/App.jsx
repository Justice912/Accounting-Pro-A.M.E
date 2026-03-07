import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="workspace" element={<Workspace />} />
        <Route path="workspace/:domain" element={<Workspace />} />
        <Route path="workspace/:domain/:conversationId" element={<Workspace />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
