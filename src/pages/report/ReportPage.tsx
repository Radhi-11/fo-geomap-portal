import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, MapPin, Activity } from 'lucide-react';

const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportPage() {
  const [projects, setProjects] = useState<any[]>([]);
  
  // State untuk Filter
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [filterProvince, setFilterProvince] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('fo_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Gagal memuat data", e);
      }
    }
  }, []);

  // Ekstraksi opsi filter dinamis dari data yang ada
  const uniqueYears = useMemo(() => {
    const years = new Set(projects.map(p => p.date?.split(' ')[2]).filter(Boolean));
    return Array.from(years).sort();
  }, [projects]);

  const uniqueProvinces = useMemo(() => {
    const provs = new Set(projects.map(p => p.province).filter(Boolean));
    return Array.from(provs).sort();
  }, [projects]);

  const uniqueCities = useMemo(() => {
    let filteredForCity = projects;
    if (filterProvince !== 'ALL') {
      filteredForCity = projects.filter(p => p.province === filterProvince);
    }
    const cities = new Set(filteredForCity.map(p => p.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [projects, filterProvince]);

  // Terapkan Filter pada Data
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (!p.date) return false;
      const [, month, year] = p.date.split(' ');

      const matchMonth = filterMonth === 'ALL' || month === filterMonth;
      const matchYear = filterYear === 'ALL' || year === filterYear;
      const matchProvince = filterProvince === 'ALL' || p.province === filterProvince;
      const matchCity = filterCity === 'ALL' || p.city === filterCity;

      return matchMonth && matchYear && matchProvince && matchCity;
    });
  }, [projects, filterMonth, filterYear, filterProvince, filterCity]);

  // Kalkulasi Metrik (KPI)
  const totalProjects = filteredProjects.length;
  const totalValue = filteredProjects.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalLength = filteredProjects.reduce((acc, curr) => acc + (curr.length || 0), 0);
  
  const statusCounts = filteredProjects.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-brand-600" />
            Dashboard Report
          </h2>
          <p className="text-sm text-gray-500 mt-1">Laporan rekapitulasi project Fiber Optic</p>
        </div>
      </div>

      {/* Panel Filter */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center text-xs font-semibold text-gray-600 mb-1.5"><Calendar className="w-3.5 h-3.5 mr-1"/> Tahun</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="ALL">Semua Tahun</option>
            {uniqueYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center text-xs font-semibold text-gray-600 mb-1.5"><Calendar className="w-3.5 h-3.5 mr-1"/> Bulan</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="ALL">Semua Bulan</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center text-xs font-semibold text-gray-600 mb-1.5"><MapPin className="w-3.5 h-3.5 mr-1"/> Provinsi</label>
          <select value={filterProvince} onChange={e => { setFilterProvince(e.target.value); setFilterCity('ALL'); }} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="ALL">Semua Provinsi</option>
            {uniqueProvinces.map((p: any) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center text-xs font-semibold text-gray-600 mb-1.5"><MapPin className="w-3.5 h-3.5 mr-1"/> Kota/Kabupaten</label>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" disabled={filterProvince === 'ALL' && uniqueCities.length === 0}>
            <option value="ALL">Semua Kota</option>
            {uniqueCities.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Key Performance Indicators (KPI) Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Project</p>
          <p className="text-4xl font-black text-brand-700">{totalProjects}</p>
          <p className="text-xs text-gray-400 mt-2">Berdasarkan filter aktif</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50"></div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Nilai Investasi</p>
          <p className="text-3xl font-black text-green-600">{formatRp(totalValue)}</p>
          <p className="text-xs text-gray-400 mt-2">Akumulasi nilai BoQ</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full opacity-50"></div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Panjang Jalur</p>
          <p className="text-4xl font-black text-orange-600">{totalLength.toFixed(2)} <span className="text-xl">KM</span></p>
          <p className="text-xs text-gray-400 mt-2">Akumulasi jarak tarikan kabel</p>
        </div>
      </div>

      {/* Breakdown Status Area */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-brand-500" />
          Breakdown Status Project
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Verified</span>
            <span className="text-xl font-bold text-green-600">{statusCounts['VERIFIED'] || 0}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <span className="text-xl font-bold text-yellow-600">{statusCounts['PENDING'] || 0}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Revision</span>
            <span className="text-xl font-bold text-orange-600">{statusCounts['REVISION'] || 0}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Rejected / Error</span>
            <span className="text-xl font-bold text-red-600">{(statusCounts['REJECTED'] || 0) + (statusCounts['ERROR'] || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}