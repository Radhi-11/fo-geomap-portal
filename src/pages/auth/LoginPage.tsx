// File: src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cek akun Admin statis
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'Administrator', role: 'admin', mustChangePassword: false }));
      navigate('/');
      return;
    }

    // Cek akun user terdaftar di localStorage
    const registeredUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const foundUser = registeredUsers.find((u: any) => u.email === username && u.password === password);

    if (foundUser) {
      localStorage.setItem('auth_user', JSON.stringify(foundUser));
      if (foundUser.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } else {
      setError('Email atau password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-900 p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Project FO Portal</h2>
          <p className="text-brand-100 text-sm mt-1">Portal Verifikasi Pekerjaan Fiber Optic</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email / Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="admin atau email Anda"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md text-sm">
            Login ke Portal
          </button>

          <div className="text-center pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Belum punya akun mitra? </span>
            <Link to="/register" className="text-sm font-semibold text-brand-600 hover:underline">Daftar disini</Link>
          </div>
        </form>
      </div>
    </div>
  );
}