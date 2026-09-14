import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UserDashboardPage from './pages/user/UserDashboardPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import VerificationDetailPage from './pages/verification/VerificationDetailPage';
import KhsMasterPage from './pages/khs/KhsMasterPage';
import GeomapPage from './pages/geomap/GeomapPage';
import ReportPage from './pages/report/ReportPage'; 

const PrivateRoute = ({ children, allowedRoles }: { children: any, allowedRoles: string[] }) => {
  const saved = localStorage.getItem('auth_user');
  if (!saved) return <Navigate to="/login" replace />;
  const user = JSON.parse(saved);

  // Jika user wajib ganti password, paksa arahkan ke halaman change-password
  if (user.mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />; 
  return children;
};

const RoleBasedIndex = () => {
  const saved = localStorage.getItem('auth_user');
  if (!saved) return <Navigate to="/login" replace />;
  const user = JSON.parse(saved);
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return user.role === 'admin' ? <DashboardPage /> : <UserDashboardPage />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        <Route element={<PrivateRoute allowedRoles={['admin', 'user']}><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<RoleBasedIndex />} />
          <Route path="/projects" element={<PrivateRoute allowedRoles={['admin']}><ProjectListPage /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute allowedRoles={['admin']}><VerificationDetailPage /></PrivateRoute>} />
          <Route path="/geomap" element={<PrivateRoute allowedRoles={['admin']}><GeomapPage /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute allowedRoles={['admin']}><ReportPage /></PrivateRoute>} />
          <Route path="/khs" element={<PrivateRoute allowedRoles={['admin']}><KhsMasterPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;