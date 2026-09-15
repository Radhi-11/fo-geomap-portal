import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, AlertCircle, ShieldCheck, Trash2 } from 'lucide-react';
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  checkUsernameTaken,
  generateTempPassword,
} from '../../utils/authService';
import type { AuthUser } from '../../utils/authService';

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<AuthUser[]>([]);

  useEffect(() => {
    setUsers(getRegisteredUsers());
  }, []);

  const currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');

  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '/login';
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !fullName.trim() || !email.trim()) {
      setError('Semua field harus diisi!');
      return;
    }

    if (checkUsernameTaken(username) || checkUsernameTaken(email)) {
      setError('Username atau email sudah digunakan!');
      return;
    }

    const tempPassword = generateTempPassword();
    const newUser: AuthUser = {
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      companyName: '',
      password: tempPassword,
      role: 'user',
      mustChangePassword: true,
    };

    const updated = [...users, newUser];
    saveRegisteredUsers(updated);
    setUsers(updated);
    setSuccess(`Pengguna berhasil dibuat! Password sementara: ${tempPassword}`);
    setUsername('');
    setFullName('');
    setEmail('');
  };

  const handleDeleteUser = (index: number) => {
    const user = users[index];
    if (user.username === 'admin') return;
    if (!window.confirm(`Hapus pengguna "${user.username}"?`)) return;
    const updated = users.filter((_, i) => i !== index);
    saveRegisteredUsers(updated);
    setUsers(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Pengguna</h1>
          <p className="text-gray-600">Buat akun pengguna baru yang dapat login ke sistem.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-brand-900 p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Buat Pengguna Baru</h2>
            <p className="text-brand-100 text-sm mt-1">Admin dapat membuat akun pengguna baru</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    placeholder="Masukkan username"
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Masukkan email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md text-sm flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Buat Pengguna
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Daftar Pengguna ({users.length})</h3>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Belum ada pengguna terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Nama Lengkap</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 text-sm text-gray-800">{user.username}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{user.fullName || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{user.email || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(index)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Hapus pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
