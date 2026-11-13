import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Search, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : error);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-cameroon-gradient">
      {/* Decorative tricolor glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-accent-200/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto shadow-lg shadow-primary-600/20">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 flag-bar rounded-full opacity-80" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 font-serif">Connexion</h1>
          <p className="text-gray-600">Accédez à votre espace citoyen</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl p-6 lg:p-8 space-y-5">
          <Input
            label="Adresse email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre.email@exemple.com"
            icon={<Mail className="h-4 w-4" />}
          />
          <Input
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
          />

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Se connecter <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <Link to="/suivi" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
              <Search className="h-3 w-3" /> Suivre un dossier
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/rendez-vous" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
              <Calendar className="h-3 w-3" /> Prendre RDV
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/admin-portal/login" className="flex items-center gap-1 hover:text-primary-600 transition-colors ml-auto">
              <Shield className="h-3 w-3" /> Admin
            </Link>
          </div>

          <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
