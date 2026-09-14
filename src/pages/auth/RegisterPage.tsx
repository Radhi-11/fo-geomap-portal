// File: src/pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, User, Building } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Generate password sementara secara otomatis (misal 6 digit random)
    const tempPassword = Math.random().toString(36).slice(-8);

    // 2. Ambil data user yang sudah terdaftar di localStorage (atau buat array baru)
    const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');

    // Cek apakah email sudah terdaftar
    if (existingUsers.some((u: any) => u.email === email)) {
      alert('Alamat email sudah terdaftar!');
      return;
    }

    // 3. Simpan data user baru dengan status mustChangePassword = true
    const newUser = {
      fullName,
      email,
      companyName,
      username: email, // Email digunakan sebagai username untuk login
      password: tempPassword,
      role: 'user',
      mustChangePassword: true, // Flag agar wajib ganti password setelah login
    };

    existingUsers.push(newUser);
    localStorage.setItem('app_users', JSON.stringify(existingUsers));

    // 4. Simulasi pengiriman password via email (Dalam production, bagian ini memanggil API Backend)
    setSuccessMsg(`Registrasi berhasil! Password sementara telah dikirim ke email: ${email} (Simulasi: Password Anda adalah "${tempPassword}")`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-7 h-7 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900">Pendaftaran Akun Mitra</h2>
          <p className="text-gray-500 text-sm mt-1">Daftarkan perusahaan Anda untuk mengakses Portal FO</p>
        </div>

        {successMsg ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 text-green-800 text-sm rounded-lg border border-green-200 leading-relaxed">
              {successMsg}
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              Lanjut ke Halaman Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="nama@perusahaan.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Mitra / Perusahaan</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="PT / CV Mitra Telekomunikasi"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400">Password sementara akan dikirimkan otomatis ke alamat email yang Anda daftarkan.</p>

            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">
              Daftar Sekarang
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">Sudah punya akun? </span>
              <Link to="/login" className="text-sm font-semibold text-brand-600 hover:underline">Login disini</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}