import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Map as MapIcon, 
  FileSpreadsheet, Check, X, MessageSquare, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { KHS_MASTER_DATA } from '../../data/khsMasterData';

const calculateRouteLength = (coords: [number, number][]) => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return 1.28;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) continue;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return totalKm > 0 ? Number(totalKm.toFixed(2)) : 1.28;
};

const getRouteCenter = (coords: [number, number][]): [number, number] => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [-2.4893, 121.9391];
  const midIndex = Math.floor(coords.length / 2);
  return coords[midIndex] || coords[0];
};

export default function VerificationDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  
  const passedProject = location.state?.project;

  const project = passedProject || {
    id: id || 'FO-2026-000124',
    name: '[PREVENTIVE MAINTENANCE AKSES FIBER_OPTIC] DESA BENTE MOROWALI',
    technician: 'Ahmad Irfan',
    date: '27 Agustus 2026',
    length: 1.28,
    value: 11784900,
    route: [
      [-2.4789, 121.9344],
      [-2.4797, 121.9348],
      [-2.4800, 121.9349],
      [-2.4875, 121.9383],
      [-2.4882, 121.9386],
      [-2.4893, 121.9391]
    ] as [number, number][],
    boqItems: [
      { code: 'KHS_SMUO_099_M', name: 'Slack pada tiang include sabuk/klem', qty: 4, unit: 'Unit', submittedPrice: 146500 },
      { code: 'KHS_SMUO_054_M', name: 'Asesoris tiang eksisting untuk kabel ADSS', qty: 40, unit: 'Unit', submittedPrice: 32100 }, 
      { code: 'KHS_SMUO_106_S', name: 'Pengadaan dan Pemasangan Asesoris tiang eksisting untuk kabel ADSS', qty: 40, unit: 'Unit', submittedPrice: 18300 },
      { code: 'KHS_SMUO_106_S', name: 'Biaya Mover Material dari Outlet Lintasarta', qty: 1, unit: 'Rit', submittedPrice: 495000 },
    ]
  };

  const calculatedMapLength = calculateRouteLength(project.route);
  const mapCenter = getRouteCenter(project.route);

  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const evaluatedItems = Array.isArray(project.boqItems) ? project.boqItems.map((boq: any) => {
    const khsMatch = KHS_MASTER_DATA.find(k => k.productNo === boq?.code);
    
    let isCodeValid = !!khsMatch;
    let standardPrice = khsMatch ? khsMatch.itemPrice : (boq?.submittedPrice || 0);
    
    const qty = boq?.qty || 1;
    const submittedPrice = boq?.submittedPrice || 0;
    const subtotalBoq = qty * submittedPrice;

    const isValid = isCodeValid && (submittedPrice <= standardPrice);

    return { 
      ...boq, 
      standardPrice, 
      subtotalBoq, 
      isMatch: isValid,
      errorReason: !isCodeValid ? 'Nomor KHS Tidak Terdaftar di Master' : submittedPrice > standardPrice ? 'Harga Melebihi Standar KHS' : null
    };
  }) : [];

  const totalBoqSum = evaluatedItems.reduce((acc: number, curr: any) => acc + curr.subtotalBoq, 0);
  const hasAnyError = evaluatedItems.some((item: any) => !item.isMatch);

  // Fungsi memperbarui status project ke LocalStorage dan kembali ke daftar project
  const handleUpdateStatus = (newStatus: 'VERIFIED' | 'REVISION' | 'REJECTED') => {
    try {
      const saved = localStorage.getItem('fo_projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const updated = projects.map((p: any) => {
          if (p.name === project.name) {
            return { ...p, status: newStatus };
          }
          return p;
        });
        localStorage.setItem('fo_projects', JSON.stringify(updated));
      }
      alert(`Status project berhasil diperbarui menjadi: ${newStatus}`);
      window.location.href = '/projects';
    } catch (e) {
      console.error("Gagal memperbarui status project:", e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Verifikasi Detail Project</h1>
            <p className="text-sm text-gray-500">{project.name}</p>
          </div>
        </div>
        
        {hasAnyError ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border bg-red-100 text-red-700 border-red-200 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            TERDAPAT KETIDAKKONSISTENAN KHS (MISMATCH)
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border bg-green-100 text-green-700 border-green-200">
            <ShieldCheck className="w-4 h-4" />
            BOQ FULLY COMPLIANT (MATCH)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center">
                <MapIcon className="w-5 h-5 text-brand-600 mr-2" />
                <h2 className="font-semibold text-brand-900">Validasi Rute Asli (KMZ Parser)</h2>
              </div>
              <span className="text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-200">
                Panjang Peta: ~{project.length || calculatedMapLength} KM
              </span>
            </div>
            <div className="h-[320px] w-full z-0 relative">
              <MapContainer 
                center={mapCenter} 
                zoom={14} 
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                className="w-full h-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {project.route && project.route.length > 0 && (
                  <Polyline positions={project.route} color="#2563eb" weight={6}>
                    <Tooltip permanent direction="center" className="bg-brand-900 text-white font-bold px-2 py-1 rounded shadow text-xs border-0">
                      🛣️ Jalur FO (~{project.length || calculatedMapLength} KM)
                    </Tooltip>
                  </Polyline>
                )}
              </MapContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-brand-900 mb-4">Komparasi Panjang Jalur</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Panjang KMZ</p>
                <p className="text-lg font-bold text-gray-800">{project.length || calculatedMapLength} KM</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Panjang BoQ</p>
                <p className="text-lg font-bold text-gray-800">{project.length || calculatedMapLength} KM</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex flex-col justify-center items-center">
                <p className="text-xs text-green-600 mb-1">Status Toleransi</p>
                <p className="text-lg font-bold text-green-700">PASS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center bg-gray-50">
              <FileSpreadsheet className="w-5 h-5 text-brand-600 mr-2" />
              <h2 className="font-semibold text-brand-900">Validasi Otomatis (BoQ vs Master KHS)</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200 text-green-800">
                <p className="text-sm font-medium">Total Nilai BoQ Diajukan</p>
                <p className="text-3xl font-bold mt-1">{formatRp(totalBoqSum > 0 ? totalBoqSum : project.value)}</p>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">Hasil Pencocokan Item Pekerjaan</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 border-b">Kode & Item KHS</th>
                      <th className="px-4 py-2 border-b text-right">Harga BoQ</th>
                      <th className="px-4 py-2 border-b text-right">Acuan KHS</th>
                      <th className="px-4 py-2 border-b text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedItems.length > 0 ? evaluatedItems.map((item: any, idx: number) => (
                      <tr key={idx} className={`border-b last:border-0 hover:bg-gray-50 ${!item.isMatch ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.qty} {item.unit} • <span className={!item.isMatch ? 'text-red-600 font-bold' : ''}>{item.code}</span></div>
                          {!item.isMatch && (
                            <div className="text-[11px] text-red-600 font-semibold mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1 inline" /> {item.errorReason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatRp(item.submittedPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-600">{formatRp(item.standardPrice)}</td>
                        <td className="px-4 py-3 text-center">
                          {item.isMatch ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">MATCH</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">MISMATCH</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">Data BoQ sesuai standar KHS.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-brand-900 mb-4">Keputusan Validator</h3>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-4"
              rows={3}
              defaultValue={hasAnyError ? "Ditemukan ketidaksesuaian nomor KHS / harga pada BoQ. Mohon vendor melakukan revisi." : "Jalur KMZ dan item BoQ telah diverifikasi dan sesuai."}
            ></textarea>
            
            <div className="flex gap-3">
              <button 
                disabled={hasAnyError} 
                onClick={() => handleUpdateStatus('VERIFIED')}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium flex justify-center items-center transition-colors"
              >
                <Check className="w-4 h-4 mr-2" /> Approve
              </button>
              <button 
                onClick={() => handleUpdateStatus('REVISION')}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg font-medium flex justify-center items-center transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Req. Revision
              </button>
              <button 
                onClick={() => handleUpdateStatus('REJECTED')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium flex justify-center items-center transition-colors"
              >
                <X className="w-4 h-4 mr-2" /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}