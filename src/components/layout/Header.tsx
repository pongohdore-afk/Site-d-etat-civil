import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, User, LogOut, Calendar, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSiteContent } from '@/hooks/useSiteContent';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { getContent } = useSiteContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const centerName = getContent('center_name') || 'Centre d\'État Civil de Babylone';

  const navLinks = [
    { label: 'Accueil', path: '/' },
    { label: 'Services', path: '/#services' },
    { label: 'Rendez-vous', path: '/rendez-vous' },
    { label: 'Suivi', path: '/suivi' },
    { label: 'Contact', path: '/#contact' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return location.pathname === '/';
    return location.pathname === path;
  };

  function handleNav(path: string) {
    setMobileOpen(false);
    if (path.includes('#')) {
      const [route, hash] = path.split('#');
      navigate(route);
      setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Cameroon flag accent strip */}
      <div className="h-1 flag-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                DLA
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-gray-900 leading-tight">{centerName}</div>
              <div className="text-xs text-gray-500 leading-tight">Mairie de Babylone · Cameroun</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.full_name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-slide-down">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <div className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'Utilisateur'}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/dashboard'); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Tableau de bord
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                      >
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/rendez-vous')}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Calendar className="h-4 w-4" /> Prendre RDV
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path) ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Tableau de bord
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); signOut(); navigate('/'); }}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/login'); }}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/rendez-vous'); }}
                    className="block w-full text-center bg-primary-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Prendre Rendez-vous
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
