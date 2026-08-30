import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import { Map as MapIcon, MapPin, Activity } from 'lucide-react';

const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const getRouteCenter = (coords: [number, number][]): [number, number] => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [-2.4893, 121.9391];
  const midIndex = Math.floor(coords.length / 2);
  return coords[midIndex] || coords[0];
};

export default function GeomapPage() {
  const [verifiedProjects, setVerifiedProjects] = useState<any[]>([]);
  const [locationStats, setLocationStats] = useState<any>({});
  const [totalInvestasi, setTotalInvestasi] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('fo_projects');
    if (saved) {
      const allProjects = JSON.parse(saved);
      // HANYA AMBIL YANG SUDAH VERIFIED
      const verified = allProjects.filter((p: any) => p.status === 'VERIFIED');
      setVerifiedProjects(verified);

      // Kelompokkan Nilai Project Berdasarkan Lokasi (Kota)
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

  // Set default center ke tengah Indonesia
  const mapCenter: [number, number] = [-2.5, 118.0];

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
                <div key={city} className="p-4 rounded-lg border border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-800 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-red-500" /> {city}
                    </h4>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold group-hover:bg-brand-200 group-hover:text-brand-700">
                      {locationStats[city].count} FO
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Total Nilai Infrastruktur:</p>
                  <p className="text-lg font-black text-brand-700">{formatRp(locationStats[city].totalValue)}</p>
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
            center={mapCenter} 
            zoom={5} 
            className="w-full h-full absolute inset-0 z-0"
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution="&copy; OpenStreetMap contributors"
            />
            
            {verifiedProjects.map((project, idx) => {
              if (!project.route || project.route.length === 0) return null;
              const center = getRouteCenter(project.route);

              return (
                <div key={idx}>
                  {/* Garis Rute Asli */}
                  <Polyline positions={project.route} color="#2563eb" weight={5} opacity={0.8} />
                  
                  {/* Titik Penanda di Tengah Rute */}
                  <Marker position={center}>
                    <Popup className="geomap-popup">
                      <div className="p-1 min-w-[200px]">
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full mb-2">VERIFIED</span>
                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{project.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{project.city}, {project.province}</p>
                        
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">Panjang: {project.length} KM</span>
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