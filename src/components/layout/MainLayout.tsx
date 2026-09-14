import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, MapIcon, BookOpen, BarChart3, LogOut } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  // Cek otentikasi
  const authUserString = localStorage.getItem('auth_user');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const isAdmin = authUser?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  // MENU DINAMIS
  const navItems = isAdmin ? [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Portal Geomap', path: '/geomap', icon: MapIcon },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'KHS Master', path: '/khs', icon: BookOpen },
  ] : [
    // Menu khusus User (Hanya 1 dashboard)
    { name: 'My Dashboard', path: '/', icon: FolderKanban },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-64 bg-brand-900 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-brand-800 shrink-0">
          <span className="text-xl font-bold text-white tracking-wide">Project FO Portal</span>
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
        <div className="p-4 border-t border-brand-800 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2.5 bg-brand-800 hover:bg-red-500 text-brand-100 hover:text-white rounded-lg transition-colors text-sm shadow-sm group">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">{navItems.find(i => i.path === location.pathname)?.name || 'Portal'}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{authUser?.username || 'Guest'}</div>
              <div className="text-xs text-gray-500 capitalize">{authUser?.role || 'user'}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold">
              {authUser?.username?.charAt(0).toUpperCase() || 'U'}
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