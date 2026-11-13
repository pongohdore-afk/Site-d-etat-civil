import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = 'Le nom est requis';
    if (!form.phone.trim()) errors.phone = 'Le téléphone est requis';
    else if (!/^[+]?[\d\s-]{8,}$/.test(form.phone)) errors.phone = 'Format invalide';
    if (!form.email.trim()) errors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email invalide';
    if (form.password.length < 6) errors.password = '6 caractères minimum';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Ne correspondent pas';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.phone);

    if (error) {
      setError(error === 'User already registered'
        ? 'Un compte existe déjà avec cet email. Connectez-vous.'
        : error);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  };

  const passwordStrength = form.password.length >= 6 ? (form.password.length >= 10 ? 'strong' : 'medium') : 'weak';
  const strengthColor = passwordStrength === 'strong' ? 'bg-primary-600' : passwordStrength === 'medium' ? 'bg-accent-400' : 'bg-gray-200';
  const strengthWidth = passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '60%' : '20%';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-cameroon-gradient">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent-200/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto shadow-lg shadow-primary-600/20">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 flag-bar rounded-full opacity-80" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 font-serif">Créer un compte</h1>
          <p className="text-gray-600">Inscrivez-vous pour suivre vos démarches</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl p-6 lg:p-8 space-y-5">
          {/* Warning note */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              S'il vous plaît, veuillez remplir ce formulaire avec vos véritables informations, car elles nous seront d'une grande utilité pour un meilleur service.
            </p>
          </div>

          <div>
            <Input
              label="Nom et Prénom"
              required
              value={form.fullName}
              onChange={(e) => { setForm({ ...form, fullName: e.target.value }); if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' }); }}
              placeholder="Ex: Jean Pierre Eyenga"
              icon={<User className="h-4 w-4" />}
              error={fieldErrors.fullName}
            />
          </div>
          <div>
            <Input
              label="Numéro de téléphone"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' }); }}
              placeholder="+237 6XX XXX XXX"
              icon={<Phone className="h-4 w-4" />}
              error={fieldErrors.phone}
            />
          </div>
          <div>
            <Input
              label="Adresse email"
              type="email"
              required
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' }); }}
              placeholder="votre.email@exemple.com"
              icon={<Mail className="h-4 w-4" />}
              error={fieldErrors.email}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Mot de passe"
                type="password"
                required
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' }); }}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={fieldErrors.password}
              />
              {form.password.length > 0 && (
                <div className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: strengthWidth }} />
                </div>
              )}
            </div>
            <div>
              <Input
                label="Confirmer"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' }); }}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={fieldErrors.confirmPassword}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Créer mon compte <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Se connecter
            </Link>
          </p>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-3 w-3 text-primary-500" /> Vos données sont protégées et sécurisées
        </div>
      </div>
    </div>
  );
}
