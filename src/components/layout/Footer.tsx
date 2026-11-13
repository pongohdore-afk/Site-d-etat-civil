import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Shield } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/context/AuthContext';

function AdminShieldButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-hidden="true"
      tabIndex={0}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500/40 group"
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden flex">
        <div className="flex-1 bg-primary-600" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-accent-400" />
      </div>
      <div className="absolute inset-0 rounded-lg bg-gray-900/30 group-hover:bg-gray-900/10 transition-colors" />
      <Shield className="relative h-4 w-4 text-white drop-shadow-sm" />
    </button>
  );
}

export function Footer() {
  const { getContent } = useSiteContent();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <footer id="contact" className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                BAB
              </div>
              <div>
                <div className="text-white font-semibold">{getContent('center_name') || 'Centre d\'État Civil'}</div>
                <div className="text-sm text-gray-400">Mairie de Babylone · Cameroun</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              {getContent('homepage_intro')?.substring(0, 180)}...
            </p>
            <div className="h-1 w-20 mt-4 flag-bar rounded-full opacity-80" />
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-400 flex-shrink-0" />
                <span>{getContent('center_address') || 'Babylone, Cameroun'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <span>{getContent('center_phone') || '+237 ...'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <span>{getContent('center_email') || 'contact@babylone.cm'}</span>
              </li>
            </ul>
          </div>

          {/* Hours + Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Horaires & Liens</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <span>Lun - Ven: {getContent('center_hours_weekdays') || '07h30 - 15h30'}</span>
              </li>
              <li className="flex items-center gap-2 pl-6">
                <span>Sam: {getContent('center_hours_saturday') || '08h00 - 12h00'}</span>
              </li>
              <li className="flex items-center gap-2 pl-6">
                <span>Dim: {getContent('center_hours_sunday') || 'Fermé'}</span>
              </li>
            </ul>
            <div className="mt-4">
              <AdminShieldButton onClick={() => navigate(isAdmin ? '/admin-portal' : '/admin-portal/login')} />
            </div>
            <div className="mt-4 space-y-2">
              <Link to="/rendez-vous" className="block text-sm text-primary-400 hover:text-primary-300">
                Prendre rendez-vous
              </Link>
              <Link to="/suivi" className="block text-sm text-primary-400 hover:text-primary-300">
                Suivre mon dossier
              </Link>
              <Link to="/login" className="block text-sm text-primary-400 hover:text-primary-300">
                Espace citoyen
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {getContent('center_name') || 'Centre d\'État Civil de Babylone'}. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-500">République du Cameroun · Devoir · Fidélité · Travail</p>
        </div>
      </div>
    </footer>
  );
}
