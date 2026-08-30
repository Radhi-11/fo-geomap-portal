import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectListPage from './pages/projects/ProjectListPage'; // Import halaman baru
import VerificationDetailPage from './pages/verification/VerificationDetailPage';
import KhsMasterPage from './pages/khs/KhsMasterPage';
import GeomapPage from './pages/geomap/GeomapPage'; // atau sesuaikan path-nya

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectListPage />} /> {/* Pasang di rute /projects */}
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="geomap" element={<GeomapPage />} />
          <Route path="/projects/:id" element={<VerificationDetailPage />} />
          <Route path="/khs" element={<KhsMasterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;