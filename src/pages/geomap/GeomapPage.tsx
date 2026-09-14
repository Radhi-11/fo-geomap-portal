import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from 'react-leaflet';
import { Map as MapIcon, MapPin, Activity, Navigation } from 'lucide-react';

const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const getRouteCenter = (coords: [number, number][]): [number, number] => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [-2.4893, 121.9391];
  const midIndex = Math.floor(coords.length / 2);
  return coords[midIndex] || coords[0];
};

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

// [BARU] Komponen pengontrol kamera Leaflet agar peta bisa bergerak secara halus
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function GeomapPage() {
  const [verifiedProjects, setVerifiedProjects] = useState<any[]>([]);
  const [locationStats, setLocationStats] = useState<any>({});
  const [totalInvestasi, setTotalInvestasi] = useState(0);

  // [BARU] State untuk menyimpan posisi tengah dan zoom peta
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5, 118.0]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  useEffect(() => {
    const saved = localStorage.getItem('fo_projects');
    if (saved) {
      const allProjects = JSON.parse(saved);
      const verified = allProjects.filter((p: any) => p.status === 'VERIFIED');
      setVerifiedProjects(verified);

      let grandTotal = 0;
      const stats = verified.reduce((acc: any, curr: any) => {
        const city = curr.city || 'Lokasi Belum Ditentukan';
        if (!acc[city]) acc[city] = { totalValue: 0, count: 0, projects: [] };
        acc[city].totalValue += curr.value;
        acc[city].count += 1;
        acc[city].projects.push(curr);
        grandTotal += curr.value;
        return acc;
      }, {});

      setLocationStats(stats);
      setTotalInvestasi(grandTotal);
    }
  }, []);

  // [BARU] Fungsi ketika sebuah project di-klik
  const handleSelectProject = (project: any) => {
    if (project.route && project.route.length > 0) {
      const center = getRouteCenter(project.route);
      setMapCenter(center);
      setMapZoom(15); // Tingkat zoom lebih dekat ke rute project
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 flex items-center">
            <MapIcon className="w-6 h-6 mr-2 text-brand-600" />
            Portal Geomap Terpusat
          </h2>
          <p className="text-sm text-gray-500 mt-1">Pemetaan sebaran Fiber Optic dan kalkulasi nilai aset per lokasi</p>
        </div>
        <div className="bg-green-50 border border-green-200 px-5 py-2.5 rounded-xl text-right">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Total Aset Verified</p>
          <p className="text-xl font-black text-green-800">{formatRp(totalInvestasi)}</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* KOLOM KIRI: REKAPITULASI LOKASI */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-brand-600" />
              Nilai Project Per Lokasi
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.keys(locationStats).length > 0 ? (
              Object.keys(locationStats).map((city) => (
                <div key={city} className="p-4 rounded-lg border border-gray-100 group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-800 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-red-500" /> {city}
                    </h4>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {locationStats[city].count} FO
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Total Nilai Infrastruktur:</p>
                  <p className="text-lg font-black text-brand-700 mb-3">{formatRp(locationStats[city].totalValue)}</p>

                  {/* [BARU] Daftar project yang bisa diklik untuk memicu Zoom */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    {locationStats[city].projects.map((proj: any, pIdx: number) => (
                      <div 
                        key={pIdx}
                        onClick={() => handleSelectProject(proj)}
                        className="flex items-center justify-between p-2 text-xs rounded bg-gray-50 hover:bg-brand-50 text-gray-700 hover:text-brand-700 cursor-pointer transition-colors border border-transparent hover:border-brand-200"
                        title="Klik untuk melihat lokasi di peta"
                      >
                        <span className="truncate pr-2 font-medium">{proj.name}</span>
                        <Navigation className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 mt-10">
                Belum ada project yang berstatus VERIFIED.
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: MASTER MAP */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
          <MapContainer 
            center={[-2.5, 118.0]} // Initial render fallback
            zoom={5} 
            className="w-full h-full absolute inset-0 z-0"
          >
            {/* [BARU] Komponen injeksi untuk menggerakkan peta */}
            <MapController center={mapCenter} zoom={mapZoom} />

            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution="&copy; OpenStreetMap contributors"
            />
            
            {verifiedProjects.map((project, idx) => {
              if (!project.route || project.route.length === 0) return null;
              const center = getRouteCenter(project.route);

              return (
                <div key={idx}>
                  {/* [DIPERBARUI] Garis Rute kini bisa di-klik untuk zoom otomatis */}
                  <Polyline 
                    positions={project.route} 
                    color="#2563eb" 
                    weight={6} 
                    opacity={0.8} 
                    eventHandlers={{ click: () => handleSelectProject(project) }}
                  />
                  
                  {/* Titik Penanda di Tengah Rute */}
                  <Marker 
                    position={center} 
                    eventHandlers={{ click: () => handleSelectProject(project) }}
                  >
                    <Popup className="geomap-popup">
                      <div className="p-1 min-w-[200px]">
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full mb-2">VERIFIED</span>
                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{project.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{project.city}, {project.province}</p>
                        
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">Panjang: {Number(project.route ? calculateRouteLength(project.route) : project.length).toFixed(2)} KM</span>
                          <span className="text-sm font-bold text-brand-700">{formatRp(project.value)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}