import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, LogOut, Shield, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUserDatabase } from '@/pages/admin/AdminUserDatabase';

type AdminSection = 'dashboard' | 'database';

export function AdminPortalPage() {
  const auth = useAuth() || {};
  const { user, profile, loading = false, isAdmin = false, signOut } = auth;
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Si la session est en cours de chargement, afficher un indicateur propre au lieu de planter
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-gray-600 font-medium text-sm">Chargement du portail administrateur...</p>
        </div>
      </div>
    );
  }

  // Vérification de l'autorisation admin (compte admin@douala.cm ou rôle admin)
  const isAuthorized = user && (isAdmin || user.email === 'admin@douala.cm' || profile?.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6 text-sm">
            {user ? `Connecté en tant que ${user.email}, mais droits administrateur requis.` : "Vous devez vous connecter en tant qu'administrateur pour accéder à ce portail."}
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/admin-portal/login')} 
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Se connecter en admin
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
    navigate('/admin-portal/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="font-bold text-lg">Portail Admin</h1>
            <p className="text-xs text-slate-400">Centre d'État Civil</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => { setSection('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${section === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Tableau de bord
          </button>
          <button
            onClick={() => { setSection('database'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${section === 'database' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Database className="w-5 h-5" />
            Base des usagers
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="mb-3 px-3 py-2 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400">Connecté en tant que</p>
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {section === 'dashboard' ? 'Tableau de bord général' : 'Gestion des actes et usagers'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
              Administrateur
            </span>
          </div>
        </header>

        <div className="p-8 flex-1">
          {section === 'dashboard' ? <AdminDashboard /> : <AdminUserDatabase />}
        </div>
      </main>
    </div>
  );
}