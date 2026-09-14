// File: src/pages/auth/ChangePasswordPage.tsx
import { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok!');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password minimal harus 6 karakter!');
      return;
    }

    // Ambil session user aktif
    const activeUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const allUsers = JSON.parse(localStorage.getItem('app_users') || '[]');

    // Update password user di database lokal dan hilangkan flag mustChangePassword
    const updatedUsers = allUsers.map((u: any) => {
      if (u.email === activeUser.email) {
        return { ...u, password: newPassword, mustChangePassword: false };
      }
      return u;
    });

    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    
    // Update active session
    activeUser.mustChangePassword = false;
    localStorage.setItem('auth_user', JSON.stringify(activeUser));

    alert('Password berhasil diperbarui! Selamat datang di portal.');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-yellow-100">
            <ShieldAlert className="w-7 h-7 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Perbarui Password Anda</h2>
          <p className="text-gray-500 text-sm mt-1">Demi keamanan akun, silakan ganti password sementara Anda dengan password baru.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">
            Simpan & Masuk Portal
          </button>
        </form>
      </div>
    </div>
  );
}