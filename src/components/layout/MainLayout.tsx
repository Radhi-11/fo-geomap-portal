import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, MapIcon, BookOpen, BarChart3, LogOut, User, KeyRound, ShieldCheck, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { getCurrentUser, getAdminUser } from '../../utils/authService';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const authUser = getCurrentUser();
  const adminUser = authUser?.role === 'admin' ? getAdminUser() : null;
  const isAdmin = authUser?.role === 'admin';
  const displayUser = isAdmin ? adminUser : authUser;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  const handleManageUsers = () => {
    navigate('/users');
    setDropdownOpen(false);
  };

  const handleChangeCredentials = () => {
    navigate('/change-credentials');
    setDropdownOpen(false);
  };

  const navItems = isAdmin ? [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Portal Geomap', path: '/geomap', icon: MapIcon },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'KHS Master', path: '/khs', icon: BookOpen },
  ] : [
    { name: 'My Dashboard', path: '/', icon: FolderKanban },
  ];

  if (!authUser) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-64 bg-brand-900 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-brand-800 shrink-0">
          <span className="text-xl font-bold text-white">Project FO Portal</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (location.pathname.startsWith('/projects') && item.path === '/projects');
              return (
                <li key={item.name}>
                  <Link to={item.path} className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-brand-500 text-white font-semibold' : 'text-brand-100 hover:bg-brand-800 hover:text-white'}`}>
                    <Icon className="w-5 h-5 mr-3" /> {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">{navItems.find(i => i.path === location.pathname)?.name || 'Portal'}</h1>
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-right focus:outline-none"
              >
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800">{displayUser?.fullName || displayUser?.username || 'Guest'}</div>
                  <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {displayUser?.role || 'user'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                  {isAdmin && (
                    <button
                      onClick={handleManageUsers}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <User className="w-4 h-4" />
                      Kelola Pengguna
                    </button>
                  )}
                  <button
                    onClick={handleChangeCredentials}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <KeyRound className="w-4 h-4" />
                    Ubah Kredensial
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold">
              {(displayUser?.fullName || displayUser?.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}