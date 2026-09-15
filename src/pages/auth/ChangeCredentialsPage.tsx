import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  getCurrentUser,
  setCurrentUser,
  updateAdminCredentials,
  updateRegularUserCredentials,
  checkUsernameTaken,
} from '../../utils/authService';

export default function ChangeCredentialsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!currentUser) {
    window.location.href = '/login';
    return null;
  }

  const { role } = currentUser;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Username tidak boleh kosong!');
      return;
    }

    if (checkUsernameTaken(username, currentUser.username)) {
      setError('Username sudah digunakan oleh akun lain!');
      return;
    }

    if (password && password.length < 6) {
      setError('Password minimal harus 6 karakter!');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok!');
      return;
    }

    let updatedUser;
    if (role === 'admin') {
      updatedUser = updateAdminCredentials(username, fullName || 'Administrator', password);
    } else {
      updatedUser = updateRegularUserCredentials(currentUser.username, username, fullName || username, password);
    }

    if (updatedUser) {
      setCurrentUser(updatedUser);
      setSuccess('Kredensial berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-900 p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Ubah Kredensial Akun</h2>
          <p className="text-brand-100 text-sm mt-1">Perbarui username dan password Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 text-sm rounded-lg border border-green-100">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold text-gray-800 capitalize">{role}</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Username login saat ini:</span>
              <span className="font-semibold text-gray-800">{currentUser.username}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username Baru</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Masukkan username baru"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Kosongkan jika tidak ingin mengganti password"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimal 6 karakter. Kosongkan untuk mempertahankan password saat ini.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Konfirmasi password baru"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md text-sm">
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
