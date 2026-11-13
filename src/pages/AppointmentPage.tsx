import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle, User, Phone, Mail, FileText, Clock,
  ArrowRight, ArrowLeft, Baby, Heart, Cross, Stamp, AlertCircle,
  Sparkles, MapPin, ChevronDown, MessageSquare,
} from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';

const iconMap: Record<string, typeof FileText> = {
  Baby, Heart, Cross, Stamp, FileText,
};

type Step = 1 | 2 | 3 | 4;

interface FormData {
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  motif: string;
  preferred_date: string;
  preferred_time: string;
}

export function AppointmentPage() {
  const { services, loading } = useServices();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    service_type: '',
    motif: '',
    preferred_date: '',
    preferred_time: '',
  });

  const today = new Date().toISOString().split('T')[0];

  function validateStep(currentStep: Step): boolean {
    const errors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.full_name.trim()) errors.full_name = 'Le nom est requis';
      if (!form.phone.trim()) errors.phone = 'Le téléphone est requis';
      else if (!/^[+]?[\d\s-]{8,}$/.test(form.phone)) errors.phone = 'Format invalide';
      if (!form.email.trim()) errors.email = 'L\'email est requis';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email invalide';
    }
    if (currentStep === 2) {
      if (!form.service_type) errors.service_type = 'Veuillez sélectionner une démarche';
      if (!form.motif.trim()) errors.motif = 'Le motif est requis';
    }
    if (currentStep === 3) {
      if (!form.preferred_date) errors.preferred_date = 'La date est requise';
      if (!form.preferred_time) errors.preferred_time = 'L\'heure est requise';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep(step) && step < 4) {
      setStep((step + 1) as Step);
    }
  }

  function prevStep() {
    if (step > 1) setStep((step - 1) as Step);
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm({ ...form, [key]: value });
    if (fieldErrors[key]) {
      const next = { ...fieldErrors };
      delete next[key];
      setFieldErrors(next);
    }
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setError(null);

    const insertData = { ...form, user_id: user?.id ?? null };
    const { error: insertError } = await supabase.from('appointments').insert(insertData);

    if (insertError) {
      setError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setStep(4);
  }

  const steps = [
    { num: 1, label: 'Informations', icon: User },
    { num: 2, label: 'Démarche', icon: FileText },
    { num: 3, label: 'Créneau', icon: Calendar },
    { num: 4, label: 'Confirmation', icon: CheckCircle },
  ];

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 lg:py-24">
        <div className="glass rounded-3xl shadow-xl p-8 lg:p-12 text-center animate-scale-in">
          <div className="relative mx-auto mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4 text-gray-900" />
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 font-serif">
            Demande envoyée avec succès !
          </h1>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Votre demande de rendez-vous a été enregistrée avec le statut{' '}
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-sm">En attente</span>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {user
              ? 'Vous pouvez suivre l\'évolution de votre demande depuis votre tableau de bord.'
              : 'Connectez-vous à votre espace citoyen pour suivre l\'évolution de votre demande.'}
          </p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" /> Récapitulatif
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Nom: </span><span className="font-medium text-gray-900">{form.full_name}</span></div>
              <div><span className="text-gray-500">Démarche: </span><span className="font-medium text-gray-900">{form.service_type}</span></div>
              <div><span className="text-gray-500">Date: </span><span className="font-medium text-gray-900">{form.preferred_date}</span></div>
              <div><span className="text-gray-500">Heure: </span><span className="font-medium text-gray-900">{form.preferred_time}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {user ? (
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Suivre ma demande <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate('/login')}>
                Se connecter pour suivre <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => { setSuccess(false); setStep(1); setForm({ ...form, motif: '', service_type: '', preferred_date: '', preferred_time: '' }); }}>
              Nouvelle demande
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-primary text-primary-700 text-xs font-medium mb-4">
          <Calendar className="h-3 w-3" /> Prise de rendez-vous
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 font-serif">Demander un rendez-vous</h1>
        <p className="text-gray-600">Remplissez le formulaire étape par étape. Un agent traitera votre demande.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${step >= s.num ? 'text-primary-700' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
                    style={{ width: step > s.num ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content card */}
      <div className="glass rounded-2xl shadow-lg p-6 lg:p-8 min-h-[400px]">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-6 animate-step-in">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" /> Vos informations
              </h2>
              <p className="text-sm text-gray-500 mb-4">Renseignez vos coordonnées pour que nous puissions vous contacter.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nom et Prénom *"
                  required
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  placeholder="Ex: Jean Pierre Eyenga"
                  error={fieldErrors.full_name}
                  icon={<User className="h-4 w-4" />}
                />
              </div>
              <div>
                <Input
                  label="Numéro de téléphone *"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  error={fieldErrors.phone}
                  icon={<Phone className="h-4 w-4" />}
                />
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-primary-600">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>Ce numéro sera utilisé pour vous envoyer les notifications SMS concernant votre rendez-vous et le suivi de votre dossier.</span>
                </p>
              </div>
            </div>
            <Input
              label="Adresse email *"
              required
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="votre.email@exemple.com"
              error={fieldErrors.email}
              icon={<Mail className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Step 2: Service selection */}
        {step === 2 && (
          <div className="space-y-6 animate-step-in">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" /> Détails de la démarche
              </h2>
              <p className="text-sm text-gray-500 mb-4">Sélectionnez le type d'acte et décrivez l'objet de votre visite.</p>
            </div>

            {/* Visual service cards */}
            <div className="grid sm:grid-cols-2 gap-3 mb-2">
              {!loading && services.map((s) => {
                const Icon = iconMap[s.icon] || FileText;
                const isSelected = form.service_type === s.title;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateField('service_type', s.title)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.short_description}</div>
                      </div>
                      {isSelected && <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => updateField('service_type', 'Autre')}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  form.service_type === 'Autre'
                    ? 'border-primary-600 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    form.service_type === 'Autre' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Autre démarche</div>
                    <div className="text-xs text-gray-500 mt-0.5">Une demande non listée</div>
                  </div>
                </div>
              </button>
            </div>
            {fieldErrors.service_type && (
              <p className="text-sm text-error-600">{fieldErrors.service_type}</p>
            )}

            <Textarea
              label="Motif détaillé de votre venue *"
              required
              rows={4}
              value={form.motif}
              onChange={(e) => updateField('motif', e.target.value)}
              placeholder="Décrivez brièvement l'objet de votre rendez-vous..."
              error={fieldErrors.motif}
            />
          </div>
        )}

        {/* Step 3: Date & time */}
        {step === 3 && (
          <div className="space-y-6 animate-step-in">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" /> Date et heure souhaitées
              </h2>
              <p className="text-sm text-gray-500 mb-4">Choisissez un créneau. L'agent pourra proposer une alternative si nécessaire.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Date souhaitée *"
                  required
                  type="date"
                  min={today}
                  value={form.preferred_date}
                  onChange={(e) => updateField('preferred_date', e.target.value)}
                  error={fieldErrors.preferred_date}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
              <div>
                <Input
                  label="Heure souhaitée *"
                  required
                  type="time"
                  value={form.preferred_time}
                  onChange={(e) => updateField('preferred_time', e.target.value)}
                  error={fieldErrors.preferred_time}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Summary preview */}
            <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50/30 border border-primary-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" /> Récapitulatif de votre demande
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-gray-400" /> <span className="text-gray-500">Nom:</span> <span className="font-medium text-gray-900">{form.full_name || '—'}</span></div>
                <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-gray-400" /> <span className="text-gray-500">Démarche:</span> <span className="font-medium text-gray-900">{form.service_type || '—'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-gray-400" /> <span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{form.preferred_date || '—'}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gray-400" /> <span className="text-gray-500">Heure:</span> <span className="font-medium text-gray-900">{form.preferred_time || '—'}</span></div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-500 bg-amber-50/50 rounded-lg px-3 py-2.5 border border-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>L'heure proposée est indicative. L'agent peut proposer un autre créneau si nécessaire.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-wrap gap-3 justify-between pt-6 mt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 1 ? navigate(-1) : prevStep())}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Continuer <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} loading={submitting}>
              Envoyer ma demande <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
