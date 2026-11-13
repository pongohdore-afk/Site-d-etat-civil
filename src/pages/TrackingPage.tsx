import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  CalendarClock, ArrowRight, Download, Calendar, User, Phone, Mail,
  MessageSquare, ChevronRight, Fingerprint,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus, DossierStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, DOSSIER_STATUS_LABELS, DOSSIER_STATUS_COLORS, DOSSIER_STATUS_ORDER } from '@/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

const STATUS_STEPS: { status: AppointmentStatus; label: string; icon: typeof Clock; description: string }[] = [
  { status: 'EN_ATTENTE', label: 'Demande reçue', icon: AlertCircle, description: 'Votre demande a été enregistrée et est en attente de traitement par un agent.' },
  { status: 'NOUVEAU_CRENEAU', label: 'Créneau proposé', icon: CalendarClock, description: 'Un agent a proposé un nouveau créneau. Merci de confirmer.' },
  { status: 'ACCEPTE', label: 'Rendez-vous confirmé', icon: CheckCircle, description: 'Votre rendez-vous a été accepté. Présentez-vous à la date et heure convenues.' },
];

export function TrackingPage() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(trackingId || '');
  const [result, setResult] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(id?: string) {
    const query = (id || searchValue).trim();
    if (!query) {
      setError('Veuillez saisir un numéro de suivi.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);

    const { data, error: queryError } = await supabase
      .from('appointments')
      .select('*')
      .or(`id.eq.${query},phone.eq.${query},email.eq.${query}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } else if (!data) {
      setError('Aucune demande trouvée avec ce numéro de suivi.');
    } else {
      setResult(data as Appointment);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (trackingId) {
      setSearchValue(trackingId);
      handleSearch(trackingId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingId]);

  function downloadRecap(apt: Appointment) {
    const content = `RECAPITULATIF DE DEMARCHE
========================

Centre d'État Civil de Babylone

NOM: ${apt.full_name}
TELEPHONE: ${apt.phone}
EMAIL: ${apt.email}

TYPE DE DEMARCHE: ${apt.service_type}
MOTIF: ${apt.motif}

DATE SOUHAITEE: ${apt.preferred_date}
HEURE SOUHAITEE: ${apt.preferred_time}

STATUT: ${STATUS_LABELS[apt.status as AppointmentStatus]}
STATUT DOSSIER: ${apt.dossier_status !== 'NON_TRAITE' ? DOSSIER_STATUS_LABELS[apt.dossier_status as DossierStatus] : 'Non traité'}
${apt.admin_message ? `MESSAGE: ${apt.admin_message}` : ''}
${apt.proposed_date ? `NOUVEAU CRENEAU PROPOSE: ${apt.proposed_date} à ${apt.proposed_time}` : ''}
${apt.pickup_time_slot ? `CRENEAU DE RETRAIT: ${apt.pickup_time_slot}` : ''}
${apt.notification_sent_at ? `DERNIERE NOTIFICATION: ${new Date(apt.notification_sent_at).toLocaleString('fr-FR')}` : ''}
DELAI DE TRAITEMENT: ${apt.processing_delay_days} jours

Date de la demande: ${new Date(apt.created_at).toLocaleString('fr-FR')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recap-${apt.service_type.replace(/\s+/g, '-')}-${apt.preferred_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentStatus = result?.status as AppointmentStatus | undefined;
  const currentStepIndex = currentStatus
    ? STATUS_STEPS.findIndex((s) => s.status === currentStatus)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-primary text-primary-700 text-xs font-medium mb-4">
          <Fingerprint className="h-3 w-3" /> Suivi de dossier
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 font-serif">Suivre mon dossier</h1>
        <p className="text-gray-600">Saisissez votre numéro de suivi, votre email ou téléphone pour vérifier le statut de votre demande.</p>
      </div>

      {/* Search bar */}
      <div className="glass rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Numéro de suivi, email ou téléphone..."
              className="w-full rounded-lg border border-gray-300 pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <Button size="lg" onClick={() => handleSearch()} loading={loading}>
            <Search className="h-4 w-4" /> Rechercher
          </Button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      )}

      {/* Result */}
      {!loading && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Status timeline */}
          <div className="glass rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" /> Progression du dossier
              </h2>
              <Badge className={STATUS_COLORS[currentStatus!]}>
                {STATUS_LABELS[currentStatus!]}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="relative">
              {currentStatus === 'REFUSE' ? (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-error-50 border border-error-200">
                  <div className="w-12 h-12 rounded-xl bg-error-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-6 w-6 text-error-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-error-800">Demande refusée</h3>
                    <p className="text-sm text-error-600 mt-1">{result.admin_message || 'Votre demande a été refusée. Contactez le centre pour plus d\'informations.'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((s, i) => {
                    const isCompleted = currentStepIndex > i || currentStatus === 'ACCEPTE';
                    const isCurrent = currentStepIndex === i && currentStatus !== 'ACCEPTE';
                    const isLast = i === STATUS_STEPS.length - 1;
                    return (
                      <div key={s.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/20'
                                : isCurrent
                                ? 'bg-accent-400 text-gray-900 shadow-md shadow-accent-400/20 animate-pulse'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                          </div>
                          {!isLast && (
                            <div className={`w-1 h-12 ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <div className={`pt-2 ${isLast ? 'pb-0' : 'pb-6'}`}>
                          <h3 className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s.label}
                          </h3>
                          <p className={`text-xs mt-1 ${isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-400'}`}>
                            {s.description}
                          </p>
                          {isCurrent && result.proposed_date && s.status === 'NOUVEAU_CRENEAU' && (
                            <div className="mt-2 rounded-lg bg-accent-50 border border-accent-200 px-3 py-2 text-xs">
                              <span className="font-medium text-accent-800">Nouveau créneau: </span>
                              <span className="text-accent-700">{result.proposed_date} à {result.proposed_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dossier progress gauge */}
          {result.dossier_status && result.dossier_status !== 'NON_TRAITE' && currentStatus !== 'REFUSE' && (
            <div className="glass rounded-2xl shadow-lg p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-600" /> Progression du dossier administratif
                </h2>
                <Badge className={DOSSIER_STATUS_COLORS[result.dossier_status as DossierStatus]}>
                  {DOSSIER_STATUS_LABELS[result.dossier_status as DossierStatus]}
                </Badge>
              </div>

              {/* Visual progress gauge */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Avancement</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(((DOSSIER_STATUS_ORDER.indexOf(result.dossier_status as DossierStatus) + 1) / DOSSIER_STATUS_ORDER.length) * 100)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-all duration-700"
                    style={{
                      width: `${((DOSSIER_STATUS_ORDER.indexOf(result.dossier_status as DossierStatus) + 1) / DOSSIER_STATUS_ORDER.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dossier steps */}
              <div className="grid grid-cols-4 gap-2">
                {DOSSIER_STATUS_ORDER.map((ds, i) => {
                  const currentIndex = DOSSIER_STATUS_ORDER.indexOf(result.dossier_status as DossierStatus);
                  const isCompleted = i < currentIndex;
                  const isCurrent = i === currentIndex;
                  const iconMap: Record<string, typeof CheckCircle> = {
                    APPROUVE: CheckCircle,
                    EN_COURS: Clock,
                    REPOUSSE: AlertCircle,
                    TERMINE: CheckCircle,
                  };
                  const Icon = iconMap[ds] || AlertCircle;
                  return (
                    <div key={ds} className="flex flex-col items-center text-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-primary-600 text-white'
                            : isCurrent
                            ? 'bg-accent-400 text-gray-900 animate-pulse shadow-md'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-2 font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                        {DOSSIER_STATUS_LABELS[ds]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pickup slot info */}
              {result.pickup_time_slot && result.dossier_status === 'TERMINE' && (
                <div className="mt-5 rounded-lg bg-success-50 border border-success-200 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-success-700 font-medium mb-1">
                    <CheckCircle className="h-4 w-4" /> Document prêt pour retrait
                  </div>
                  <p className="text-success-600 text-xs">
                    Créneau de retrait: <strong>{result.pickup_time_slot}</strong>
                  </p>
                </div>
              )}

              {result.dossier_status === 'REPOUSSE' && (
                <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                    <AlertCircle className="h-4 w-4" /> Dossier repoussé
                  </div>
                  <p className="text-amber-600 text-xs">
                    Le traitement de votre dossier a été repoussé. Nous vous tiendrons informé de l'avancement.
                  </p>
                </div>
              )}

              {result.notification_sent_at && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary-600">
                  <MessageSquare className="h-3 w-3" />
                  Dernière notification reçue le {new Date(result.notification_sent_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          )}

          {/* Details card */}
          <div className="glass rounded-2xl shadow-lg p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" /> Détails de la demande
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Nom:</span>
                <span className="font-medium text-gray-900">{result.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Démarche:</span>
                <span className="font-medium text-gray-900">{result.service_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Téléphone:</span>
                <span className="font-medium text-gray-900">{result.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900 truncate">{result.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Date souhaitée:</span>
                <span className="font-medium text-gray-900">{result.preferred_date} à {result.preferred_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Délai estimé:</span>
                <span className="font-medium text-gray-900">{result.processing_delay_days} jours</span>
              </div>
            </div>

            {result.motif && (
              <div className="mt-4 text-sm bg-gray-50 rounded-lg px-4 py-3">
                <span className="font-medium text-gray-700">Motif: </span>
                <span className="text-gray-600">{result.motif}</span>
              </div>
            )}

            {result.admin_message && (
              <div className={`mt-4 rounded-lg px-4 py-3 text-sm border ${
                currentStatus === 'REFUSE' ? 'bg-error-50 text-error-700 border-error-200' :
                currentStatus === 'ACCEPTE' ? 'bg-success-50 text-success-700 border-success-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Message de l'agent: </span>
                    {result.admin_message}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <Button size="sm" variant="outline" onClick={() => downloadRecap(result)}>
                <Download className="h-3 w-3" /> Télécharger le récapitulatif
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && !searched && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Recherchez votre dossier</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Saisissez le numéro de suivi reçu lors de votre demande, ou votre email/téléphone pour retrouver votre dossier.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Retour à l'accueil <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
