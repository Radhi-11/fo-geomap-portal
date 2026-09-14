import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Map as MapIcon, 
  FileSpreadsheet, Check, X, MessageSquare, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { KHS_MASTER_DATA } from '../../data/khsMasterData';

// Kalkulasi murni dari koordinat rute file KMZ (menghasilkan meter)
const calculateRouteLengthInMeters = (coords: [number, number][]) => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return 1284;
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
  return totalMeters;
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
    length: 1.284,     // Panjang KMZ asli dari file KMZ (dalam KM atau Meter)
    boqLength: 1284,   // Panjang BoQ dari metadata Excel (dalam Meter)
    value: 11784900,
    route: [
      [-2.4789, 121.9344],
      [-2.4797, 121.9348],
      [-2.4800, 121.9349],
      [-2.4875, 121.9383],
      [-2.4882, 121.9386],
      [-2.4893, 121.9391]
    ] as [number, number][],
    boqItems: []
  };

  // 1. PANJANG KMZ MURNI DARI FILE KMZ (Dikonversi ke Meter secara presisi)
  let kmzLengthMeters = 1284;
  if (project.route && project.route.length > 0) {
    kmzLengthMeters = calculateRouteLengthInMeters(project.route);
  } else if (project.length) {
    kmzLengthMeters = Number(project.length) < 50 ? Number(project.length) * 1000 : Number(project.length);
  }

  // 2. PANJANG BOQ MURNI DARI HEADER EXCEL (Dibaca dari boqLength)
  let boqLengthMeters = kmzLengthMeters;
  if (project.boqLength) {
    boqLengthMeters = Number(project.boqLength) < 50 ? Number(project.boqLength) * 1000 : Number(project.boqLength);
  } else if (project.length) {
    // Fallback for legacy projects where BoQ length was saved in project.length
    boqLengthMeters = Number(project.length) < 50 ? Number(project.length) * 1000 : Number(project.length);
  }

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
      errorReason: !isCodeValid ? 'Nomor KHS Tidak Terdaftar' : submittedPrice > standardPrice ? 'Harga Melebihi KHS' : null
    };
  }) : [];

  const totalBoqSum = evaluatedItems.reduce((acc: number, curr: any) => acc + curr.subtotalBoq, 0);
  const hasAnyError = evaluatedItems.some((item: any) => !item.isMatch);

  // Toleransi komparasi panjang jalur dalam meter (selisih max 50 meter)
  const lengthDifference = Math.abs(kmzLengthMeters - boqLengthMeters);
  const isLengthMatch = lengthDifference <= 50;

  // STATE UNTUK MENYIMPAN CATATAN VALIDATOR
  const [validatorNotes, setValidatorNotes] = useState(
    hasAnyError 
      ? "Ditemukan ketidaksesuaian nomor KHS / harga pada BoQ. Mohon vendor melakukan revisi." 
      : "Jalur KMZ dan item BoQ telah diverifikasi dan sesuai."
  );

  const handleUpdateStatus = (newStatus: 'VERIFIED' | 'REVISION' | 'REJECTED') => {
    try {
      const saved = localStorage.getItem('fo_projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const updated = projects.map((p: any) => {
          if (p.name === project.name) {
            // SIMPAN CATATAN (NOTES) BERSAMA STATUS BARU KE LOCAL STORAGE
            return { ...p, status: newStatus, notes: validatorNotes };
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
    <div className="p-8 max-w-[90rem] mx-auto space-y-6">
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
            TERDAPAT MISMATCH
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border bg-green-100 text-green-700 border-green-200">
            <ShieldCheck className="w-4 h-4" />
            BOQ FULLY COMPLIANT (MATCH)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI: PETA GIS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center">
                <MapIcon className="w-5 h-5 text-brand-600 mr-2" />
                <h2 className="font-semibold text-brand-900">Validasi Rute Asli (KMZ Parser)</h2>
              </div>
              <span className="text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-200">
                Panjang Peta: ~{Number(kmzLengthMeters).toFixed(2)} Meter
              </span>
            </div>
            <div className="h-[380px] w-full z-0 relative">
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
                      🛣️ Jalur FO (~{Number(kmzLengthMeters).toFixed(2)} Meter)
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
                <p className="text-lg font-bold text-gray-800">{Number(kmzLengthMeters).toFixed(2)} <span className="text-sm font-normal">Meter</span></p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Panjang BoQ</p>
                <p className="text-lg font-bold text-gray-800">{Number(boqLengthMeters).toFixed(2)} <span className="text-sm font-normal">Meter</span></p>
              </div>
              <div className={`p-4 rounded-lg border flex flex-col justify-center items-center text-center ${isLengthMatch ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <p className="text-xs mb-1">Status Toleransi</p>
                <p className="text-lg font-bold leading-tight">{isLengthMatch ? 'PASS' : 'MISMATCH'}</p>
                <p className="text-xs mt-1 font-medium bg-white/50 px-2 py-0.5 rounded-full border border-current/10">Selisih: {Number(lengthDifference).toFixed(2)} m</p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FINANSIAL & TABEL */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
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
                      <th className="px-4 py-3 border-b w-1/2">Kode & Item KHS</th>
                      <th className="px-4 py-3 border-b text-right whitespace-nowrap">Harga BoQ</th>
                      <th className="px-4 py-3 border-b text-right whitespace-nowrap">Acuan KHS</th>
                      <th className="px-4 py-3 border-b text-center whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedItems.length > 0 ? evaluatedItems.map((item: any, idx: number) => (
                      <tr key={idx} className={`border-b last:border-0 hover:bg-gray-50 ${!item.isMatch ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 break-words">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.qty} {item.unit} • <span className={!item.isMatch ? 'text-red-600 font-bold' : ''}>{item.code}</span></div>
                          {!item.isMatch && (
                            <div className="text-[11px] text-red-600 font-semibold mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1 shrink-0" /> {item.errorReason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">{formatRp(item.submittedPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-600 whitespace-nowrap">{formatRp(item.standardPrice)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
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
            
            {/* TEXTAREA DENGAN ONCHANGE */}
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-4"
              rows={3}
              value={validatorNotes}
              onChange={(e) => setValidatorNotes(e.target.value)}
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