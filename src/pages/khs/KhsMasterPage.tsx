import { useState } from 'react';
import { Search, ShieldCheck, Filter, Plus, Trash2, Upload, X } from 'lucide-react';
import { KHS_MASTER_DATA, type KhsItem } from '../../data/khsMasterData';
import * as XLSX from 'xlsx';

export default function KhsMasterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [khsList, setKhsList] = useState<KhsItem[]>(KHS_MASTER_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk form input item satuan baru
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('MATERIAL');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // 1. Handle Tambah Item Satuan
  const handleAddKhs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDesc || !newPrice) return;

    const newItem: KhsItem = {
      productNo: newCode,
      itemCategory: newCategory,
      productDesc: newDesc,
      itemPrice: Number(newPrice)
    };

    setKhsList([newItem, ...khsList]);
    setIsModalOpen(false);
    setNewCode('');
    setNewDesc('');
    setNewPrice('');
  };

  // 2. Handle Hapus Item KHS berdasarkan ProductNo
  const handleDeleteItem = (productNo: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus item ${productNo} dari master KHS?`)) {
      const updatedList = khsList.filter(item => item.productNo !== productNo);
      setKhsList(updatedList);
    }
  };

  // 3. Handle Import Excel KHS secara massal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Konversi sheet Excel ke JSON
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

        // Petakan ke struktur KhsItem yang sesuai
        const importedItems: KhsItem[] = rawData.map((row) => ({
          itemCategory: String(row.ItemCategory || row.Kategori || 'MATERIAL').toUpperCase(),
          productNo: String(row.ProductNo || row.Kode || `KHS_IMP_${Math.floor(Math.random() * 1000)}`),
          productDesc: String(row.ProductDesc || row.Deskripsi || 'Item Impor Excel'),
          itemPrice: Number(row.ItemPrice || row.Harga || 0)
        }));

        setKhsList([...importedItems, ...khsList]);
        alert(`Berhasil mengimpor ${importedItems.length} item KHS dari file Excel!`);
      } catch (error) {
        console.error("Gagal membaca file Excel:", error);
        alert("Gagal membaca file Excel. Pastikan format kolom sesuai.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filter pencarian dan kategori
  const filteredItems = khsList.filter((item: KhsItem) => {
    const matchesSearch = item.productNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.productDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.itemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">Master KHS (Harga Acuan Resmi)</h2>
          <p className="text-sm text-gray-500 mt-1">Sumber acuan harga barang & jasa BoQ project Fiber Optic (Total: {khsList.length} Item)</p>
        </div>
        <div className="flex gap-3">
          {/* Tombol Import Excel Tersembunyi di balik Label */}
          <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium cursor-pointer">
            <Upload className="w-4 h-4 mr-2 text-green-600" />
            Import Excel KHS
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Item KHS
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari Kode Produk atau Deskripsi Pekerjaan..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">Kategori:</span>
          <select 
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori</option>
            <option value="MATERIAL">Material</option>
            <option value="SERVICE">Service (Jasa)</option>
            <option value="PERIZINAN">Perizinan / Lainnya</option>
          </select>
        </div>
      </div>

      {/* Table Data KHS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="py-4 px-6">Product No (Kode KHS)</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Deskripsi Produk / Pekerjaan</th>
                <th className="py-4 px-6 text-right">Harga Acuan (IDR)</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item: KhsItem, idx: number) => (
                  <tr key={idx} className="hover:bg-brand-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-brand-900 whitespace-nowrap">
                      {item.productNo}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.itemCategory === 'MATERIAL' ? 'bg-blue-100 text-blue-700' :
                        item.itemCategory === 'SERVICE' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.itemCategory}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 max-w-md">
                      {item.productDesc}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-brand-600 whitespace-nowrap">
                      {formatRp(item.itemPrice)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-200 rounded-full">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Active
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => handleDeleteItem(item.productNo)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Tidak ada item KHS yang sesuai dengan kata kunci pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Item KHS Satuan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-brand-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Tambah Item KHS Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-brand-100 hover:text-white rounded-lg hover:bg-brand-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKhs} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kode Produk (Product No)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: KHS_SMUO_124_M"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="SERVICE">SERVICE</option>
                  <option value="PERIZINAN">PERIZINAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Produk / Pekerjaan</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Contoh: Pengadaan dan pemasangan material tambahan..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Acuan (IDR)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Contoh: 150000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Simpan Item KHS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}