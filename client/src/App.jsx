import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Receptions from './pages/Receptions';
import Temperatures from './pages/Temperatures';
import ServiceChecks from './pages/ServiceChecks';
import Cleaning from './pages/Cleaning';
import NonConformities from './pages/NonConformities';
import Audits from './pages/Audits';
import Documents from './pages/Documents';
import Personnel from './pages/Personnel';
import Sites from './pages/Sites';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="receptions" element={<Receptions />} />
        <Route path="temperatures" element={<Temperatures />} />
        <Route path="service" element={<ServiceChecks />} />
        <Route path="nettoyage" element={<Cleaning />} />
        <Route path="non-conformites" element={<NonConformities />} />
        <Route path="audits" element={<Audits />} />
        <Route path="documents" element={<Documents />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="etablissements" element={<Sites />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
