import { Search, Plus, FileSpreadsheet, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import NewProjectModal from '../../components/NewProjectModal';

// Data dummy telah dihapus, sekarang dimulai dengan array kosong
const defaultInitialProjects: any[] = [];

const calculateRouteLength = (coords: [number, number][]) => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) continue;
    const a = 6378137.0; 
    const b = 6356752.314245; 
    const f = 1 / 298.257223563;
    const L = (lon2 - lon1) * Math.PI / 180;
    const U1 = Math.atan((1 - f) * Math.tan(lat1 * Math.PI / 180));
    const U2 = Math.atan((1 - f) * Math.tan(lat2 * Math.PI / 180));
    const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
    let lambda = L, lambdaP = 2 * Math.PI;
    let iterLimit = 100;
    let sinLambda = 0, cosLambda = 0, sinSigma = 0, cosSigma = 0, sigma = 0, sinAlpha = 0;
    let cosSqAlpha = 0, cos2SigmaM = 0;
    while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
      sinLambda = Math.sin(lambda);
      cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + 
                           (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0) break; 
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / (cosSqAlpha || 1);
      const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    if (iterLimit > 0 && sinSigma !== 0) {
      const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
      const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
      const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
      const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - 
                         B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      totalMeters += b * A * (sigma - deltaSigma);
    }
  }
  return totalMeters / 1000;
};

const getStoredProjects = () => {
  const saved = localStorage.getItem('fo_projects');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Gagal memuat localStorage:", e);
    }
  }
  localStorage.setItem('fo_projects', JSON.stringify(defaultInitialProjects));
  return defaultInitialProjects;
};

export default function ProjectListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projects, setProjects] = useState(getStoredProjects());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REVISION': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const handleProjectAdded = (newProject: any) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem('fo_projects', JSON.stringify(updated));
  };

  const handleDeleteProject = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Apakah Anda yakin ingin menghapus project ini?`)) {
      const updated = projects.filter((_: any, i: number) => i !== index);
      setProjects(updated);
      localStorage.setItem('fo_projects', JSON.stringify(updated));
    }
  };

  const handleExportCSV = () => {
    if (projects.length === 0) {
      alert("Tidak ada data project untuk diekspor!");
      return;
    }

    const headers = ["No", "Nama Project", "Provinsi", "Kota", "Panjang (KM)", "Nilai Project (IDR)", "Status", "Tanggal Submit"];
    const rows = projects.map((p: any, idx: number) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.province || '-'}"`,
      `"${p.city || '-'}"`,
      p.route ? calculateRouteLength(p.route) : p.length,
      p.value,
      p.status,
      `"${p.date || '-'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_project_fo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (project.city && project.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">Project Database</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh project penarikan Fiber Optic</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Project atau Lokasi..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'PENDING', 'VERIFIED', 'REVISION', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
            <tr>
              <th className="py-4 px-4 text-center w-16">No.</th>
              <th className="py-4 px-6">Nama Project & Tanggal</th>
              <th className="py-4 px-6">Lokasi</th>
              <th className="py-4 px-6">Panjang (KM)</th>
              <th className="py-4 px-6">Nilai Project</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project: any, index: number) => (
                <tr key={index} className="hover:bg-brand-50 transition-colors group">
                  <td className="py-4 px-4 text-center font-bold text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-brand-900">{project.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">Disubmit: {project.date}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800">{project.city || '-'}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{project.province || '-'}</div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-700">{Number(project.route ? calculateRouteLength(project.route) : project.length).toFixed(2)} KM</td>
                  <td className="py-4 px-6 font-medium text-gray-800">{formatRupiah(project.value)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                    <Link 
                      to={`/projects/proj-${index + 1}`} 
                      state={{ project }}
                      className="p-1.5 text-gray-400 hover:text-brand-600 rounded-md hover:bg-brand-100 transition-colors" 
                      title="View Detail"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={(e) => handleDeleteProject(index, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Hapus Project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-lg font-semibold text-gray-700">Belum ada project</p>
                    <p className="text-sm">Klik tombol "New Project" untuk mengunggah project baru.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleProjectAdded} 
      />
    </div>
  );
}