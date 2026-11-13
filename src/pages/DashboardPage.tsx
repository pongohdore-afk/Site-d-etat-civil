import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Calendar, FileText, Clock, Mail, Phone, MapPin, Lock,
  CheckCircle, XCircle, AlertCircle, CalendarClock, Download,
  ChevronRight, Search, TrendingUp, MessageSquare, Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'overview' | 'appointments' | 'tracking' | 'profile';

export function DashboardPage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', address: '' });
  const [smsPrefs, setSmsPrefs] = useState({
    sms_notifications_enabled: true,
    sms_notify_status_changes: true,
    sms_notify_reminders: true,
    sms_notify_document_ready: true,
  });
  const [smsMsg, setSmsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingSms, setSavingSms] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingResult, setTrackingResult] = useState<Appointment | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name, phone: profile.phone, address: profile.address });
      setSmsPrefs({
        sms_notifications_enabled: profile.sms_notifications_enabled,
        sms_notify_status_changes: profile.sms_notify_status_changes,
        sms_notify_reminders: profile.sms_notify_reminders,
        sms_notify_document_ready: profile.sms_notify_document_ready,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    async function fetchAppointments() {
      setAppointmentsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching appointments:', error);
      setAppointments((data as Appointment[]) ?? []);
      setAppointmentsLoading(false);
    }
    fetchAppointments();
  }, [user]);

  async function handleProfileSave() {
    setProfileMsg(null);
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileForm.full_name, phone: profileForm.phone, address: profileForm.address })
      .eq('id', user!.id);
    if (error) {
      setProfileMsg({ type: 'error', text: 'Erreur lors de la mise à jour du profil.' });
    } else {
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
      await refreshProfile();
    }
    setSavingProfile(false);
  }

  async function handleSmsSave() {
    setSmsMsg(null);
    setSavingSms(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        sms_notifications_enabled: smsPrefs.sms_notifications_enabled,
        sms_notify_status_changes: smsPrefs.sms_notify_status_changes,
        sms_notify_reminders: smsPrefs.sms_notify_reminders,
        sms_notify_document_ready: smsPrefs.sms_notify_document_ready,
      })
      .eq('id', user!.id);
    if (error) {
      setSmsMsg({ type: 'error', text: 'Erreur lors de l\'enregistrement des préférences.' });
    } else {
      setSmsMsg({ type: 'success', text: 'Préférences de notification enregistrées.' });
      await refreshProfile();
    }
    setSavingSms(false);
  }

  async function handlePasswordChange() {
    setPasswordMsg(null);
    if (passwordForm.password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setPasswordForm({ password: '', confirmPassword: '' });
    }
    setSavingPassword(false);
  }

  async function handleTrackingSearch() {
    if (!trackingSearch.trim()) return;
    setTrackingLoading(true);
    setTrackingError(null);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`id.eq.${trackingSearch.trim()},phone.eq.${trackingSearch.trim()},email.eq.${trackingSearch.trim()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      setTrackingError('Erreur lors de la recherche.');
    } else if (!data) {
      setTrackingError('Aucune demande trouvée.');
      setTrackingResult(null);
    } else {
      setTrackingResult(data as Appointment);
    }
    setTrackingLoading(false);
  }

  function downloadRecap(apt: Appointment) {
    const content = `RECAPITULATIF DE DEMARCHE\n========================\n\nCentre d'État Civil de Babylone\n\nNOM: ${apt.full_name}\nTELEPHONE: ${apt.phone}\nEMAIL: ${apt.email}\n\nTYPE DE DEMARCHE: ${apt.service_type}\nMOTIF: ${apt.motif}\n\nDATE SOUHAITEE: ${apt.preferred_date}\nHEURE SOUHAITEE: ${apt.preferred_time}\n\nSTATUT: ${STATUS_LABELS[apt.status as AppointmentStatus]}\n${apt.admin_message ? `MESSAGE: ${apt.admin_message}` : ''}\n${apt.proposed_date ? `NOUVEAU CRENEAU: ${apt.proposed_date} à ${apt.proposed_time}` : ''}\nDELAI: ${apt.processing_delay_days} jours\n\nDate: ${new Date(apt.created_at).toLocaleString('fr-FR')}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recap-${apt.service_type.replace(/\s+/g, '-')}-${apt.preferred_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!user) return null;

  const pendingCount = appointments.filter((a) => a.status === 'EN_ATTENTE').length;
  const acceptedCount = appointments.filter((a) => a.status === 'ACCEPTE').length;
  const newSlotCount = appointments.filter((a) => a.status === 'NOUVEAU_CRENEAU').length;

  const tabs: { key: Tab; label: string; icon: typeof User; badge?: number }[] = [
    { key: 'overview', label: 'Aperçu', icon: User },
    { key: 'appointments', label: 'Mes rendez-vous', icon: Calendar, badge: pendingCount + newSlotCount },
    { key: 'tracking', label: 'Suivi dossier', icon: Search },
    { key: 'profile', label: 'Mon profil', icon: Lock },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif">
              {profile?.full_name || 'Mon espace'}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/rendez-vous')}>
          <Calendar className="h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl shadow-sm p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              tab === t.key ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge ? (
              <span className={`ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-bold ${
                tab === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={AlertCircle} label="En attente" value={pendingCount} color="amber" />
            <StatCard icon={CheckCircle} label="Acceptés" value={acceptedCount} color="green" />
            <StatCard icon={CalendarClock} label="Nouveau créneau" value={newSlotCount} color="blue" />
          </div>

          <div className="glass rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" /> Demandes récentes
              </h2>
              {appointments.length > 3 && (
                <button onClick={() => setTab('appointments')} className="text-sm text-primary-600 hover:text-primary-700">
                  Voir tout
                </button>
              )}
            </div>
            {appointmentsLoading ? (
              <Spinner />
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Aucune demande de rendez-vous pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-white/60 hover:bg-white transition-colors border border-gray-100">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{apt.service_type}</span>
                        <Badge className={STATUS_COLORS[apt.status as AppointmentStatus]}>
                          {STATUS_LABELS[apt.status as AppointmentStatus]}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {apt.preferred_date} à {apt.preferred_time}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointments */}
      {tab === 'appointments' && (
        <div className="space-y-4 animate-fade-in">
          {appointmentsLoading ? (
            <Spinner size="lg" />
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl shadow-md">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
              <p className="text-sm text-gray-500 mb-4">Vous n'avez pas encore de demande de rendez-vous.</p>
              <Button onClick={() => navigate('/rendez-vous')}>
                <Calendar className="h-4 w-4" /> Prendre rendez-vous
              </Button>
            </div>
          ) : (
            appointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} onDownload={downloadRecap} />)
          )}
        </div>
      )}

      {/* Tracking */}
      {tab === 'tracking' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary-600" /> Suivre un dossier
            </h2>
            <p className="text-sm text-gray-500 mb-4">Recherchez par numéro de suivi, email ou téléphone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackingSearch()}
                  placeholder="Numéro de suivi, email ou téléphone..."
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <Button onClick={handleTrackingSearch} loading={trackingLoading}>
                <Search className="h-4 w-4" /> Rechercher
              </Button>
            </div>
            {trackingError && (
              <div className="mt-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                {trackingError}
              </div>
            )}
          </div>

          {trackingResult && (
            <div className="glass rounded-2xl shadow-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{trackingResult.service_type}</h3>
                <Badge className={STATUS_COLORS[trackingResult.status as AppointmentStatus]}>
                  {STATUS_LABELS[trackingResult.status as AppointmentStatus]}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /> {trackingResult.preferred_date} à {trackingResult.preferred_time}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> Délai: {trackingResult.processing_delay_days} jours</div>
              </div>
              {trackingResult.admin_message && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 mb-4">
                  <span className="font-medium">Message: </span>{trackingResult.admin_message}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => downloadRecap(trackingResult)}>
                <Download className="h-3 w-3" /> Télécharger
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl shadow-md p-6">
              <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" /> Informations personnelles
              </h2>
              <div className="space-y-4">
                <Input label="Nom et Prénom" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                <Input label="Téléphone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                <Input label="Adresse" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                <Input label="Email (non modifiable)" value={user.email ?? ''} disabled className="bg-gray-50" />
                {profileMsg && (
                  <div className={`rounded-lg px-4 py-3 text-sm ${profileMsg.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-error-50 text-error-700 border border-error-200'}`}>
                    {profileMsg.text}
                  </div>
                )}
                <Button onClick={handleProfileSave} loading={savingProfile}>Enregistrer</Button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass rounded-2xl shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary-600" /> Sécurité du compte
                </h2>
                <div className="space-y-4">
                  <Input label="Nouveau mot de passe" type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} placeholder="••••••••" />
                  <Input label="Confirmer le mot de passe" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="••••••••" />
                  {passwordMsg && (
                    <div className={`rounded-lg px-4 py-3 text-sm ${passwordMsg.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-error-50 text-error-700 border border-error-200'}`}>
                      {passwordMsg.text}
                    </div>
                  )}
                  <Button onClick={handlePasswordChange} loading={savingPassword} variant="outline">Changer le mot de passe</Button>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Notification Preferences */}
          <div className="glass rounded-2xl shadow-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-600" /> Notifications SMS
                </h2>
                <p className="text-sm text-gray-500 mt-1">Recevez des mises à jour par SMS sur votre téléphone.</p>
              </div>
              {/* Master toggle */}
              <ToggleSwitch
n                checked={smsPrefs.sms_notifications_enabled}
                onChange={(checked) => setSmsPrefs({ ...smsPrefs, sms_notifications_enabled: checked })}
              />
            </div>

            {/* Phone preview */}
            <div className="flex items-center gap-2 rounded-lg bg-primary-50/60 border border-primary-100 px-4 py-3 mb-5">
              <Phone className="h-4 w-4 text-primary-600" />
              <span className="text-sm text-gray-600">SMS envoyés au :</span>
              <span className="text-sm font-medium text-gray-900">{profileForm.phone || 'Non renseigné'}</span>
              {!profileForm.phone && (
                <span className="text-xs text-error-600 ml-auto">Renseignez votre téléphone</span>
              )}
            </div>

            {/* Individual preferences */}
            <div className={`space-y-3 transition-opacity duration-200 ${smsPrefs.sms_notifications_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <PrefRow
                icon={Bell}
                title="Changement de statut"
                description="Acceptation, refus ou proposition d'un nouveau créneau"
                checked={smsPrefs.sms_notify_status_changes}
                onChange={(checked) => setSmsPrefs({ ...smsPrefs, sms_notify_status_changes: checked })}
              />
              <PrefRow
                icon={CalendarClock}
                title="Rappel de rendez-vous"
                description="Rappel avant la date de votre rendez-vous"
                checked={smsPrefs.sms_notify_reminders}
                onChange={(checked) => setSmsPrefs({ ...smsPrefs, sms_notify_reminders: checked })}
              />
              <PrefRow
                icon={CheckCircle}
                title="Documents prêts"
                description="Notification quand vos documents sont à retirer"
                checked={smsPrefs.sms_notify_document_ready}
                onChange={(checked) => setSmsPrefs({ ...smsPrefs, sms_notify_document_ready: checked })}
              />
            </div>

            {smsMsg && (
              <div className={`mt-4 rounded-lg px-4 py-3 text-sm animate-slide-down ${smsMsg.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-error-50 text-error-700 border border-error-200'}`}>
                {smsMsg.text}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <Button onClick={handleSmsSave} loading={savingSms}>
                Enregistrer les préférences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
        checked ? 'bg-primary-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function PrefRow({ icon: Icon, title, description, checked, onChange }: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-100 transition-colors hover:bg-white">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof User; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'from-amber-50 to-amber-100/50 text-amber-700 border-amber-200',
    green: 'from-green-50 to-green-100/50 text-green-700 border-green-200',
    blue: 'from-blue-50 to-blue-100/50 text-blue-700 border-blue-200',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorMap[color]} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-6 w-6" />
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}

function AppointmentCard({ apt, onDownload }: { apt: Appointment; onDownload: (a: Appointment) => void }) {
  const status = apt.status as AppointmentStatus;
  const iconMap: Record<string, typeof CheckCircle> = {
    EN_ATTENTE: AlertCircle,
    ACCEPTE: CheckCircle,
    REFUSE: XCircle,
    NOUVEAU_CRENEAU: CalendarClock,
  };
  const Icon = iconMap[status] || AlertCircle;

  return (
    <div className="glass rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{apt.service_type}</h3>
            <p className="text-xs text-gray-500">{new Date(apt.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <Badge className={STATUS_COLORS[status]}>
          <Icon className="h-3 w-3" /> {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Souhaité: {apt.preferred_date} à {apt.preferred_time}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>Délai: {apt.processing_delay_days} jours</span>
        </div>
      </div>

      {apt.motif && (
        <p className="text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2 mb-3 border border-gray-100">
          <span className="font-medium">Motif: </span>{apt.motif}
        </p>
      )}

      {apt.admin_message && (
        <div className={`rounded-lg px-4 py-3 text-sm mb-3 ${
          status === 'REFUSE' ? 'bg-error-50 text-error-700 border border-error-200' :
          status === 'ACCEPTE' ? 'bg-success-50 text-success-700 border border-success-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <span className="font-medium">Message de l'agent: </span>{apt.admin_message}
        </div>
      )}

      {apt.proposed_date && (
        <div className="rounded-lg bg-accent-50 border border-accent-200 px-4 py-3 text-sm mb-3">
          <div className="flex items-center gap-2 font-medium text-accent-800 mb-1">
            <CalendarClock className="h-4 w-4" /> Nouveau créneau proposé
          </div>
          <p className="text-accent-700">Date: {apt.proposed_date} à {apt.proposed_time}</p>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Button size="sm" variant="ghost" onClick={() => onDownload(apt)}>
          <Download className="h-3 w-3" /> Télécharger le récapitulatif
        </Button>
      </div>
    </div>
  );
}
