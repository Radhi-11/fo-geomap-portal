// File: src/pages/user/UserDashboardPage.tsx
import { useState, useEffect } from 'react';
import { Plus, FileSpreadsheet, MessageSquare, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import NewProjectModal from '../../components/NewProjectModal';

export default function UserDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fo_projects');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const handleProjectAdded = (newProject: any) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem('fo_projects', JSON.stringify(updated));
  };

  const showNotes = (project: any) => {
    alert(`Catatan Validator:\n\n${project.notes || 'Silakan periksa kembali file KMZ dan BoQ Anda dengan standar KHS.'}`);
  };

  const getStatusUI = (status: string, project: any) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="flex items-center text-green-600 font-semibold text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Disetujui</span>;
      case 'PENDING':
        return <span className="flex items-center text-yellow-600 font-semibold text-sm"><Clock className="w-4 h-4 mr-1"/> Menunggu Verifikasi</span>;
      default: // REVISION / REJECTED
        return (
          <button onClick={() => showNotes(project)} className="flex items-center text-red-600 hover:text-red-800 font-semibold text-sm underline underline-offset-2">
            <AlertTriangle className="w-4 h-4 mr-1"/> {status === 'REVISION' ? 'Butuh Revisi' : 'Ditolak'} (Lihat Catatan)
          </button>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">Dashboard Pengajuan Project</h2>
          <p className="text-sm text-gray-500 mt-1">Unggah file KMZ & BoQ, lalu pantau status verifikasinya disini.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" /> Ajukan Project Baru
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-4 px-6">Nama Project & Tanggal Pengajuan</th>
              <th className="py-4 px-6">Lokasi</th>
              <th className="py-4 px-6">Status Terkini</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length > 0 ? projects.map((project, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-4 px-6">
                  <div className="font-bold text-gray-800">{project.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Tgl: {project.date}</div>
                </td>
                <td className="py-4 px-6 text-gray-700">{project.city || '-'}, {project.province || '-'}</td>
                <td className="py-4 px-6">{getStatusUI(project.status, project)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="py-12 text-center text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700">Belum ada pengajuan project.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleProjectAdded} />
    </div>
  );
}