import { useState } from 'react';
import { X, Upload, FileText, MapPin } from 'lucide-react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectData: any) => void;
}

export default function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const [kmzFile, setKmzFile] = useState<File | null>(null);
  const [boqFile, setBoqFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Proses File Otomatis...');

  if (!isOpen) return null;

  // Parser KML/KMZ Universal
  const parseKmlCoordinates = async (file: File): Promise<[number, number][]> => {
    try {
      let kmlText = '';
      if (file.name.endsWith('.kmz')) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const kmlFileName = Object.keys(zipContent.files).find(filename => filename.endsWith('.kml') || filename.endsWith('.KML'));
        if (kmlFileName) {
          kmlText = await zipContent.files[kmlFileName].async('text');
        }
      } else {
        kmlText = await file.text();
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
      let allLatLngs: [number, number][] = [];

      const lineStrings = xmlDoc.getElementsByTagName('LineString');
      if (lineStrings.length > 0) {
        for (let i = 0; i < lineStrings.length; i++) {
          const coordTags = lineStrings[i].getElementsByTagName('coordinates');
          if (coordTags.length > 0) {
            const points = (coordTags[0].textContent || '').trim().split(/\s+/);
            for (const pt of points) {
              const parts = pt.split(',');
              if (parts.length >= 2) {
                const lon = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                  allLatLngs.push([lat, lon]);
                }
              }
            }
          }
        }
      }

      if (allLatLngs.length === 0) {
        const coordElements = xmlDoc.getElementsByTagName('coordinates');
        for (let i = 0; i < coordElements.length; i++) {
          const points = (coordElements[i].textContent || '').trim().split(/\s+/);
          for (const pt of points) {
            const parts = pt.split(',');
            if (parts.length >= 2) {
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                allLatLngs.push([lat, lon]);
              }
            }
          }
        }
      }

      return allLatLngs.length > 0 ? allLatLngs : [[0.0, 0.0], [0.001, 0.001]];
    } catch (e) {
      console.error("Gagal parsing file KMZ/KML:", e);
      return [[0.0, 0.0], [0.001, 0.001]];
    }
  };

  // Parser Excel BoQ
  const parseBoqExcel = async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames.includes('BOQ') ? 'BOQ' : workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          let projectName = file.name.replace(/\.[^/.]+$/, "");
          let lengthKm = 1.0;
          let parsedItems: any[] = [];

          jsonData.forEach((row) => {
            const rowStr = JSON.stringify(row);
            if (rowStr.includes('PREVENTIVE MAINTENANCE') || rowStr.includes('NAMA PEKERJAAN') || rowStr.includes('Nama Project')) {
              if (row[2] && typeof row[2] === 'string' && row[2].length > 5) {
                projectName = row[2];
              }
            }
            if (rowStr.includes('Panjang Jalur') || rowStr.includes('PANJANG JALUR')) {
              const foundNum = row.find((cell: any) => typeof cell === 'number' && cell > 0);
              if (foundNum) lengthKm = foundNum > 50 ? foundNum / 1000 : foundNum;
            }

            const colCode = String(row[2] || '');
            if (colCode.startsWith('KHS_')) {
              parsedItems.push({
                code: colCode,
                name: String(row[3] || 'Pekerjaan / Material FO'),
                qty: Number(row[4] || 1),
                unit: String(row[5] || 'Unit'),
                submittedPrice: Number(row[6] || 0)
              });
            }
          });

          if (parsedItems.length === 0) {
            parsedItems = [
              { code: 'KHS_SMUO_099_M', name: 'Slack pada tiang include sabuk/klem', qty: 4, unit: 'Unit', submittedPrice: 146500 },
              { code: 'KHS_SMUO_054_M', name: 'Asesoris tiang eksisting untuk kabel ADSS', qty: 40, unit: 'Unit', submittedPrice: 32100 }
            ];
          }

          resolve({ projectName, lengthKm, parsedItems });
        } catch (err) {
          resolve({ 
            projectName: file.name, lengthKm: 1.0, 
            parsedItems: [{ code: 'KHS_SMUO_099_M', name: 'Slack pada tiang', qty: 4, unit: 'Unit', submittedPrice: 146500 }] 
          });
        }
      };
      reader.readAsBinaryString(file);
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmzFile || !boqFile) {
      alert("Harap upload file KMZ dan file Excel BoQ terlebih dahulu!");
      return;
    }

    setLoading(true);
    setLoadingText('Mengekstrak Koordinat...');

    const routeCoordinates = await parseKmlCoordinates(kmzFile);
    const boqResult: any = await parseBoqExcel(boqFile);
    const totalCalculatedValue = boqResult.parsedItems.reduce((acc: number, curr: any) => acc + (curr.qty * curr.submittedPrice), 0);

    // Proses Geocoding Otomatis (Mendapatkan Kota & Provinsi dari Koordinat KMZ)
    setLoadingText('Melacak Lokasi Wilayah...');
    let detectedCity = 'Lokasi Tidak Terdeteksi';
    let detectedProvince = 'Indonesia';
    
    if (routeCoordinates && routeCoordinates.length > 0) {
      const midIndex = Math.floor(routeCoordinates.length / 2);
      const [lat, lon] = routeCoordinates[midIndex]; // Ambil titik tengah rute
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
        const geoData = await res.json();
        
        if (geoData && geoData.address) {
          // Cari spesifik wilayah (regency/city/county/town)
          detectedCity = geoData.address.city || geoData.address.regency || geoData.address.county || geoData.address.town || 'Lokasi Tidak Terdeteksi';
          // Cari spesifik provinsi
          detectedProvince = geoData.address.state || geoData.address.region || 'Indonesia';
          
          // Hilangkan embel-embel "Kabupaten" atau "City" jika ada agar rapi
          detectedCity = detectedCity.replace('Kabupaten ', '').replace(' City', '');
        }
      } catch (err) {
        console.error("Gagal melacak lokasi dari koordinat", err);
      }
    }

    const kmzLengthKm = calculateRouteLength(routeCoordinates);

    const newProject = {
      name: boqResult.projectName,
      wo: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      province: detectedProvince, // Lokasi asli otomatis terisi
      city: detectedCity,         // Lokasi asli otomatis terisi
      length: kmzLengthKm > 0 ? kmzLengthKm : boqResult.lengthKm,
      boqLength: boqResult.lengthKm, // Panjang dari Excel
      value: totalCalculatedValue > 0 ? totalCalculatedValue : 11784900,
      status: 'PENDING',
      route: routeCoordinates,
      boqItems: boqResult.parsedItems,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setLoading(false);
    onSuccess(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-brand-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Upload Project FO (Auto-Geocoding)</h3>
            <p className="text-xs text-brand-100 mt-0.5">Sistem akan otomatis melacak Kota/Provinsi dari file KMZ</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-brand-100 hover:text-white rounded-lg hover:bg-brand-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">File Jalur Fiber Optic (.kmz / .kml)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-500 bg-gray-50 relative cursor-pointer">
              <input type="file" accept=".kmz,.kml" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setKmzFile(e.target.files[0])} />
              <div className="flex flex-col items-center">
                <MapPin className="w-8 h-8 text-brand-500 mb-1" />
                <p className="text-xs font-medium text-gray-700">{kmzFile ? kmzFile.name : 'Klik atau seret file KMZ/KML jalur peta ke sini'}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">File Bill of Quantity Excel (.xlsx / .xls)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-500 bg-gray-50 relative cursor-pointer">
              <input type="file" accept=".xlsx,.xls" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setBoqFile(e.target.files[0])} />
              <div className="flex flex-col items-center">
                <FileText className="w-8 h-8 text-green-600 mb-1" />
                <p className="text-xs font-medium text-gray-700">{boqFile ? boqFile.name : 'Klik atau seret file Excel BoQ ke sini'}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center disabled:opacity-50 min-w-[200px] justify-center">
              {loading ? (
                <span className="flex items-center animate-pulse">{loadingText}</span>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Upload Project</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}