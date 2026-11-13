import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  CalendarClock, Mail, MessageSquare, Bell, ChevronRight,
  RefreshCw, Users, Phone, Calendar, Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Appointment, DossierStatus } from '@/types';
import { DOSSIER_STATUS_LABELS, DOSSIER_STATUS_COLORS, DOSSIER_STATUS_ORDER } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Form';

export function AdminUserDatabase() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDossier, setFilterDossier] = useState<string>('all');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifyModal, setNotifyModal] = useState<Appointment | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ apt: Appointment; pickupSlot: string; message: string } | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .neq('dossier_status', 'NON_TRAITE')
      .order('updated_at', { ascending: false });
    if (error) console.error('Error fetching:', error);
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function showMsg(type: 'success' | 'error', text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function updateDossierStatus(id: string, dossierStatus: DossierStatus) {
    const { error } = await supabase.from('appointments').update({ dossier_status: dossierStatus }).eq('id', id);
    if (error) {
      showMsg('error', 'Erreur lors de la mise à jour du statut.');
    } else {
      await fetchAppointments();
      const updated = appointments.find((a) => a.id === id);
      if (updated) setSelectedApt({ ...updated, dossier_status: dossierStatus });
      showMsg('success', `Statut du dossier mis à jour: ${DOSSIER_STATUS_LABELS[dossierStatus]}`);
    }
  }

  async function sendNotification(apt: Appointment, pickupSlot: string, message: string) {
    const { error } = await supabase.from('appointments').update({
      notification_sent_at: new Date().toISOString(),
      notification_type: 'EMAIL_SMS',
      pickup_time_slot: pickupSlot || null,
      admin_message: message || (apt.dossier_status === 'TERMINE'
        ? `Votre document est prêt à être retiré${pickupSlot ? ` (créneau: ${pickupSlot})` : ''}.`
        : apt.dossier_status === 'REPOUSSE'
        ? 'Le traitement de votre dossier a été repoussé. Nous vous tiendrons informé.'
        : 'Mise à jour sur votre dossier.'),
    }).eq('id', apt.id);

    if (error) {
      showMsg('error', 'Erreur lors de l\'envoi de la notification.');
    } else {
      showMsg('success', `Notification Email + SMS envoyée à ${apt.full_name}.`);
      await fetchAppointments();
    }
    setConfirmModal(null);
    setNotifyModal(null);
  }

  const filteredAppointments = useMemo(() => appointments
    .filter((a) => filterDossier === 'all' || a.dossier_status === filterDossier)
    .filter((a) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return a.full_name.toLowerCase().includes(q)
        || a.email.toLowerCase().includes(q)
        || a.phone.toLowerCase().includes(q);
    }), [appointments, searchQuery, filterDossier]);

  const statusCounts = useMemo(() => ({
    total: appointments.length,
    approuve: appointments.filter((a) => a.dossier_status === 'APPROUVE').length,
    enCours: appointments.filter((a) => a.dossier_status === 'EN_COURS').length,
    repousse: appointments.filter((a) => a.dossier_status === 'REPOUSSE').length,
    termine: appointments.filter((a) => a.dossier_status === 'TERMINE').length,
  }), [appointments]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Base de données usagers</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi opérationnel des dossiers et notifications citoyens</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat icon={Users} label="Total dossiers" value={statusCounts.total} color="gray" />
        <MiniStat icon={CheckCircle} label="Approuvés" value={statusCounts.approuve} color="green" />
        <MiniStat icon={Clock} label="En cours" value={statusCounts.enCours} color="blue" />
        <MiniStat icon={AlertCircle} label="Repoussés" value={statusCounts.repousse} color="amber" />
        <MiniStat icon={CheckCircle} label="Terminés" value={statusCounts.termine} color="primary" />
      </div>

      {actionMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border animate-slide-down ${
          actionMsg.type === 'success' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-error-50 text-error-700 border-error-200'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Search bar */}
      <div className="glass rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-11 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <select value={filterDossier} onChange={(e) => setFilterDossier(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-primary-500 focus:outline-none">
          <option value="all">Tous les statuts</option>
          <option value="APPROUVE">Approuvé</option>
          <option value="EN_COURS">En cours</option>
          <option value="REPOUSSE">Repoussé</option>
          <option value="TERMINE">Terminé</option>
        </select>
        <Button size="sm" variant="ghost" onClick={fetchAppointments}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : filteredAppointments.length === 0 ? (
        <div className="glass rounded-xl shadow-sm p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-2">Aucun dossier trouvé</h3>
          <p className="text-sm text-gray-500">Les dossiers acceptés depuis le dashboard apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {filteredAppointments.map((apt) => (
              <button
                key={apt.id}
                onClick={() => setSelectedApt(apt)}
                className={`w-full text-left glass rounded-xl shadow-sm p-4 transition-all hover:shadow-md ${
                  selectedApt?.id === apt.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{apt.full_name}</h3>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">#{apt.id.substring(0, 8).toUpperCase()}</div>
                  </div>
                  <Badge className={DOSSIER_STATUS_COLORS[apt.dossier_status]}>
                    {DOSSIER_STATUS_LABELS[apt.dossier_status]}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> {apt.service_type}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {apt.phone}</div>
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {apt.preferred_date}</div>
                </div>
                {apt.notification_sent_at && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary-600">
                    <Bell className="h-3 w-3" /> Notifié le {new Date(apt.notification_sent_at).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selectedApt ? (
            <div className="glass rounded-2xl shadow-md p-6 lg:sticky lg:top-4 self-start animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedApt.full_name}</h2>
                  <p className="text-xs text-gray-400 font-mono">#{selectedApt.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <Badge className={DOSSIER_STATUS_COLORS[selectedApt.dossier_status]}>
                  {DOSSIER_STATUS_LABELS[selectedApt.dossier_status]}
                </Badge>
              </div>

              {/* Contact info */}
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gray-400" /> {selectedApt.email}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400" /> {selectedApt.phone}</div>
                <div className="flex items-center gap-2 text-gray-600"><FileText className="h-4 w-4 text-gray-400" /> {selectedApt.service_type}</div>
                <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4 text-gray-400" /> {selectedApt.preferred_date} à {selectedApt.preferred_time}</div>
              </div>

              {selectedApt.motif && (
                <div className="text-sm bg-gray-50 rounded-lg px-3 py-2 mb-5 border border-gray-100">
                  <span className="font-medium text-gray-700">Motif: </span><span className="text-gray-600">{selectedApt.motif}</span>
                </div>
              )}

              {/* Status management */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statut du dossier</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DOSSIER_STATUS_ORDER.map((ds) => {
                    const isActive = selectedApt.dossier_status === ds;
                    const iconMap: Record<string, typeof CheckCircle> = {
                      APPROUVE: CheckCircle,
                      EN_COURS: Clock,
                      REPOUSSE: AlertCircle,
                      TERMINE: CheckCircle,
                    };
                    const Icon = iconMap[ds] || AlertCircle;
                    return (
                      <button
                        key={ds}
                        onClick={() => updateDossierStatus(selectedApt.id, ds)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {DOSSIER_STATUS_LABELS[ds]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification info */}
              {selectedApt.notification_sent_at && (
                <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-primary-700 font-medium mb-1">
                    <Bell className="h-4 w-4" /> Dernière notification
                  </div>
                  <p className="text-primary-600 text-xs">
                    Envoyée le {new Date(selectedApt.notification_sent_at).toLocaleString('fr-FR')}
                    {selectedApt.pickup_time_slot && ` · Créneau: ${selectedApt.pickup_time_slot}`}
                  </p>
                  {selectedApt.admin_message && (
                    <p className="text-gray-600 text-xs mt-1">« {selectedApt.admin_message} »</p>
                  )}
                </div>
              )}

              {/* Notify button */}
              <div className="pt-4 border-t border-gray-100">
                <Button
                  className="w-full"
                  onClick={() => setNotifyModal(selectedApt)}
                  disabled={selectedApt.dossier_status === 'APPROUVE'}
                >
                  <Send className="h-4 w-4" /> Notifier le citoyen (Email + SMS)
                </Button>
                {selectedApt.dossier_status === 'APPROUVE' && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Le statut doit être « En cours », « Repoussé » ou « Terminé » pour notifier.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl shadow-sm p-12 text-center self-start">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">Sélectionnez un dossier</h3>
              <p className="text-sm text-gray-500">Cliquez sur un usager pour voir le détail et gérer son dossier.</p>
            </div>
          )}
        </div>
      )}

      {/* Notify Modal */}
      {notifyModal && (
        <NotifyModal
          apt={notifyModal}
          onClose={() => setNotifyModal(null)}
          onConfirm={(pickupSlot, message) => setConfirmModal({ apt: notifyModal, pickupSlot, message })}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          apt={confirmModal.apt}
          pickupSlot={confirmModal.pickupSlot}
          message={confirmModal.message}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => sendNotification(confirmModal.apt, confirmModal.pickupSlot, confirmModal.message)}
        />
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-700 bg-gray-50 border-gray-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    primary: 'text-primary-700 bg-primary-50 border-primary-200',
  };
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

function NotifyModal({ apt, onClose, onConfirm }: {
  apt: Appointment;
  onClose: () => void;
  onConfirm: (pickupSlot: string, message: string) => void;
}) {
  const [pickupSlot, setPickupSlot] = useState('');
  const [message, setMessage] = useState('');
  const isTermine = apt.dossier_status === 'TERMINE';

  return (
    <Modal open={true} onClose={onClose} title="Notifier le citoyen" size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-primary-700 font-medium mb-1">
            <Mail className="h-4 w-4" /> Email + SMS à {apt.full_name}
          </div>
          <p className="text-primary-600 text-xs">
            Destinataire: {apt.email} · {apt.phone}
          </p>
        </div>

        {isTermine && (
          <Input
            label="Créneau de retrait (optionnel)"
            placeholder="Ex: Mardi 14h - 15h30"
            value={pickupSlot}
            onChange={(e) => setPickupSlot(e.target.value)}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message (optionnel)</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isTermine
              ? 'Ex: Votre document est prêt. Merci de venir le retirer avec votre pièce d\'identité.'
              : apt.dossier_status === 'REPOUSSE'
              ? 'Ex: Le traitement de votre dossier a été repoussé. Nous vous tiendrons informé.'
              : 'Message personnalisé au citoyen...'}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onConfirm(pickupSlot, message)}>
            <Send className="h-4 w-4" /> Continuer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ apt, pickupSlot, message, onClose, onConfirm }: {
  apt: Appointment;
  pickupSlot: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={true} onClose={onClose} title="Confirmer l'envoi" size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Êtes-vous sûr de vouloir envoyer cette notification ?</p>
              <p className="text-xs mt-1 text-amber-700">
                Un Email et un SMS seront envoyés à <strong>{apt.full_name}</strong> ({apt.phone}).
              </p>
            </div>
          </div>
        </div>

        {(pickupSlot || message) && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm space-y-1">
            {pickupSlot && <div><span className="font-medium text-gray-700">Créneau: </span><span className="text-gray-600">{pickupSlot}</span></div>}
            {message && <div><span className="font-medium text-gray-700">Message: </span><span className="text-gray-600">{message}</span></div>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onConfirm}>
            <Send className="h-4 w-4" /> Confirmer l'envoi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
