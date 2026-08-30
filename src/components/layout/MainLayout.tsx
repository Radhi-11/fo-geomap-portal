import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, MapIcon, BookOpen } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  // Menambahkan Portal Geomap ke dalam daftar menu
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Portal Geomap', path: '/geomap', icon: MapIcon },
    { name: 'KHS Master', path: '/khs', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - Tema Biru */}
      <aside className="w-64 bg-brand-900 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-brand-800">
          <span className="text-xl font-bold text-white tracking-wide">Project FO Portal</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-500 text-white font-semibold shadow-md' 
                        : 'text-brand-100 hover:bg-brand-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-brand-100'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area - Tema Putih */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header - Putih Bersih */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">
            {navItems.find(i => i.path === location.pathname)?.name || 'Portal'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Admin User</span>
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:bg-brand-600 transition-colors">
              A
            </div>
          </div>
        </header>

        {/* Page Content - Background Putih keabuan sedikit agar konten pop-up */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}