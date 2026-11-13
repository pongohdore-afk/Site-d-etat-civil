import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUserDatabase } from '@/pages/admin/AdminUserDatabase';
import { Spinner } from '@/components/ui/Spinner';

type AdminSection = 'dashboard' | 'database';

export function AdminPortalPage() {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const navItems: { key: AdminSection; label: string; icon: typeof Shield; description: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Statistiques & décisions initiales' },
    { key: 'database', label: 'Base usagers', icon: Database, description: 'Suivi opérationnel des dossiers' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-gray-900 text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Flag accent */}
        <div className="h-1 flag-bar" />

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">Portail Administrateur</div>
              <div className="text-xs text-gray-400">État Civil · Babylone</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs uppercase tracking-wider text-gray-500 px-3 mb-3">Menu principal</div>
          {navItems.map((item) => {
            const isActive = section === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-600/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.label}</div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-gray-500'}`}>{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{profile?.full_name || 'Admin'}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="h-0.5 w-full absolute top-0 left-0 flag-bar" />
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium">Portail Admin</span>
          <div className="w-9" />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden">
          {section === 'dashboard' && <AdminDashboard />}
          {section === 'database' && <AdminUserDatabase />}
        </main>
      </div>
    </div>
  );
}
