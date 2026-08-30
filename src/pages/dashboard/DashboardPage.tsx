import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });

  useEffect(() => {
    // Membaca data project dari localStorage secara dinamis
    const savedProjects = localStorage.getItem('fo_projects');
    if (savedProjects) {
      try {
        const projects = JSON.parse(savedProjects);
        
        // Melakukan kalkulasi status project secara real-time
        const total = projects.length;
        const verified = projects.filter((p: any) => p.status === 'VERIFIED').length;
        const pending = projects.filter((p: any) => p.status === 'PENDING').length;
        
        setStats({ total, verified, pending });
      } catch (e) {
        console.error("Gagal membaca data project dari local storage:", e);
      }
    }
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-900">Dashboard Overview</h2>
      </div>

      {/* Grid Cards (Diubah menjadi 3 kolom karena Total FO Length dihapus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: Total Project */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-3">Total Project</p>
          <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
        </div>

        {/* Card: Verified */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-3">Verified</p>
          <p className="text-4xl font-bold text-blue-600">{stats.verified}</p>
        </div>

        {/* Card: Pending */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-3">Pending</p>
          <p className="text-4xl font-bold text-blue-600">{stats.pending}</p>
        </div>

      </div>
    </div>
  );
}