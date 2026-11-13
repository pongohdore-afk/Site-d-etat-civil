import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarClock,
  Download, Search, RefreshCw, Settings, FileText, Save, TrendingUp,
  Users, BarChart3, Mail, MessageSquare, ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus, DossierStatus, SiteContent, Service } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, DOSSIER_STATUS_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { useRefuseModal, useProposeModal, useDelayModal } from '@/pages/admin/modals';

const todayStr = () => new Date().toISOString().split('T')[0];

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // CMS
  const [siteContents, setSiteContents] = useState<SiteContent[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [editingServices, setEditingServices] = useState<Record<string, Partial<Service>>>({});

  // Sub-tab
  const [subTab, setSubTab] = useState<'rdv' | 'cms' | 'services'>('rdv');

  // Citizens (registered users)
  const [citizenCount, setCitizenCount] = useState(0);
  const [citizenRegistrations, setCitizenRegistrations] = useState<{ created_at: string }[]>([]);

  // Modals
  const refuseModal = useRefuseModal();
  const proposeModal = useProposeModal();
  const delayModal = useDelayModal();

  const today = todayStr();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching appointments:', error);
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, []);

  const fetchSiteContent = useCallback(async () => {
    setContentLoading(true);
    const { data, error } = await supabase.from('site_content').select('*').order('category, label');
    if (error) console.error('Error fetching site content:', error);
    setSiteContents((data as SiteContent[]) ?? []);
    setContentLoading(false);
  }, []);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('sort_order');
    if (error) console.error('Error fetching services:', error);
    setServices((data as Service[]) ?? []);
    setServicesLoading(false);
  }, []);

  const fetchCitizens = useCallback(async () => {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false);
    if (countError) console.error('Error counting citizens:', countError);
    setCitizenCount(count ?? 0);

    const { data: regs, error: regError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .limit(500);
    if (regError) console.error('Error fetching registrations:', regError);
    setCitizenRegistrations((regs as { created_at: string }[]) ?? []);
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchSiteContent();
    fetchServices();
    fetchCitizens();
  }, [fetchAppointments, fetchSiteContent, fetchServices, fetchCitizens]);

  function showMsg(type: 'success' | 'error', text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function updateAppointment(id: string, updates: Partial<Appointment>) {
    const { error } = await supabase.from('appointments').update(updates).eq('id', id);
    if (error) {
      showMsg('error', 'Erreur lors de la mise à jour.');
    } else {
      await fetchAppointments();
    }
  }

  async function handleAccept(apt: Appointment) {
    await updateAppointment(apt.id, {
      status: 'ACCEPTE',
      dossier_status: 'APPROUVE',
      admin_message: 'Votre rendez-vous a été accepté. Présentez-vous à la date et heure convenues.',
    });
    showMsg('success', 'Rendez-vous accepté. Le citoyen a été notifié.');
  }

  async function handleRefuse(reason: string) {
    if (!refuseModal.apt) return;
    await updateAppointment(refuseModal.apt.id, {
      status: 'REFUSE',
      admin_message: reason,
    });
    showMsg('success', 'Demande refusée. Le motif a été transmis au citoyen.');
    refuseModal.close();
  }

  async function handleProposeSlot(date: string, time: string, message: string) {
    if (!proposeModal.apt) return;
    await updateAppointment(proposeModal.apt.id, {
      status: 'NOUVEAU_CRENEAU',
      proposed_date: date,
      proposed_time: time,
      admin_message: message || `Un nouveau créneau vous est proposé: ${date} à ${time}. Merci de confirmer.`,
    });
    showMsg('success', 'Nouveau créneau proposé au citoyen.');
    proposeModal.close();
  }

  async function handleDelayChange(days: number) {
    if (!delayModal.apt) return;
    await updateAppointment(delayModal.apt.id, { processing_delay_days: days });
    showMsg('success', `Délai de traitement mis à jour: ${days} jours.`);
    delayModal.close();
  }

  async function saveContent() {
    const updates = Object.entries(editingContent);
    for (const [key, value] of updates) {
      const { error } = await supabase.from('site_content').update({ value }).eq('key', key);
      if (error) {
        showMsg('error', `Erreur lors de la sauvegarde de "${key}".`);
        return;
      }
    }
    setEditingContent({});
    showMsg('success', 'Contenu du site mis à jour avec succès.');
    await fetchSiteContent();
  }

  async function saveService(id: string) {
    const changes = editingServices[id];
    if (!changes) return;
    const { error } = await supabase.from('services').update(changes).eq('id', id);
    if (error) {
      showMsg('error', 'Erreur lors de la sauvegarde du service.');
      return;
    }
    setEditingServices((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showMsg('success', 'Service mis à jour avec succès.');
    await fetchServices();
  }

  function exportAppointments(format: 'pdf' | 'word') {
    const validated = appointments.filter((a) => a.status === 'ACCEPTE');
    if (validated.length === 0) {
      showMsg('error', 'Aucun rendez-vous validé à exporter.');
      return;
    }

    const sorted = [...validated].sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      return a.preferred_date.localeCompare(b.preferred_date);
    });

    const todayLabel = new Date().toLocaleDateString('fr-FR');
    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Liste des rendez-vous validés - ${todayLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #007A5E; font-size: 20px; text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
          .date { text-align: center; font-size: 11px; color: #999; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f0fdf4; color: #007A5E; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Centre d'État Civil de Babylone</h1>
        <div class="subtitle">Liste des rendez-vous validés</div>
        <div class="date">Date d'édition: ${todayLabel}</div>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Référence</th>
              <th>Nom et Prénom</th>
              <th>Type</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Motif</th>
              <th>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((apt, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${apt.id.substring(0, 8).toUpperCase()}</td>
                <td>${apt.full_name}</td>
                <td>${apt.service_type}</td>
                <td>${apt.preferred_date}</td>
                <td>${apt.preferred_time}</td>
                <td>${apt.motif}</td>
                <td>${apt.phone}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Document généré automatiquement · Centre d'État Civil de Babylone</div>
      </body>
      </html>
    `;

    if (format === 'pdf') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } else {
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rendez-vous-valides-${todayLabel.replace(/\//g, '-')}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Daily KPIs - computed from today's appointments
  const todayAppointments = useMemo(() =>
    appointments.filter((a) => a.preferred_date === today),
    [appointments, today],
  );

  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'EN_ATTENTE').length,
    accepted: appointments.filter((a) => a.status === 'ACCEPTE').length,
    refused: appointments.filter((a) => a.status === 'REFUSE').length,
    newSlot: appointments.filter((a) => a.status === 'NOUVEAU_CRENEAU').length,
    todayRdv: todayAppointments.length,
    todayAccepted: todayAppointments.filter((a) => a.status === 'ACCEPTE').length,
  }), [appointments, todayAppointments]);

  // Hourly distribution chart data
  const hourlyData = useMemo(() => {
    const hours: Record<string, number> = {};
    for (let h = 7; h <= 16; h++) {
      hours[`${h}h`] = 0;
    }
    appointments.forEach((a) => {
      const hour = parseInt(a.preferred_time.split(':')[0]);
      if (hour >= 7 && hour <= 16) {
        hours[`${hour}h`] = (hours[`${hour}h`] || 0) + 1;
      }
    });
    return hours;
  }, [appointments]);

  const maxHourly = Math.max(...Object.values(hourlyData), 1);

  // Last 7 days volume
  const weeklyData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const count = appointments.filter((a) => a.created_at.startsWith(dateStr)).length;
      days.push({ label, count });
    }
    return days;
  }, [appointments]);

  const maxWeekly = Math.max(...weeklyData.map((d) => d.count), 1);

  // Weekly new citizen registrations
  const weeklyRegistrations = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const count = citizenRegistrations.filter((r) => r.created_at.startsWith(dateStr)).length;
      days.push({ label, count });
    }
    return days;
  }, [citizenRegistrations]);

  const maxRegistrations = Math.max(...weeklyRegistrations.map((d) => d.count), 1);

  const filteredAppointments = appointments
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.service_type.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      const dateCompare = a.preferred_date.localeCompare(b.preferred_date);
      if (dateCompare !== 0) return dateCompare;
      return a.preferred_time.localeCompare(b.preferred_time);
    });

  const contentByCategory = siteContents.reduce<Record<string, SiteContent[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    general: 'Informations générales',
    hours: 'Horaires du centre',
    homepage: 'Page d\'accueil',
    notifications: 'Notifications',
  };

  const subTabs: { key: typeof subTab; label: string; icon: typeof Calendar; badge?: number }[] = [
    { key: 'rdv', label: 'Rendez-vous', icon: Calendar, badge: stats.pending },
    { key: 'services', label: 'Services', icon: FileText },
    { key: 'cms', label: 'Contenu du site', icon: Settings },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble et traitement initial des demandes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard icon={BarChart3} label="Total" value={stats.total} color="gray" />
        <KpiCard icon={AlertCircle} label="En attente" value={stats.pending} color="amber" />
        <KpiCard icon={CheckCircle} label="Approuvés" value={stats.accepted} color="green" />
        <KpiCard icon={XCircle} label="Rejetés" value={stats.refused} color="red" />
        <KpiCard icon={Calendar} label="RDV aujourd'hui" value={stats.todayRdv} color="blue" />
        <KpiCard icon={CalendarClock} label="Acceptés (jour)" value={stats.todayAccepted} color="primary" />
        <KpiCard icon={Users} label="Citoyens inscrits" value={citizenCount} color="green" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="glass rounded-2xl shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-600" /> Volume de demandes (7 jours)
          </h3>
          <p className="text-xs text-gray-500 mb-4">Mise à jour automatique quotidienne</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 hover:from-primary-700 hover:to-primary-500"
                  style={{ height: `${(d.count / maxWeekly) * 100}%`, minHeight: '4px' }}
                  title={`${d.count} demandes`}
                />
                <span className="text-xs text-gray-500 capitalize">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly distribution */}
        <div className="glass rounded-2xl shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" /> Affluence par heure
          </h3>
          <p className="text-xs text-gray-500 mb-4">Heures d'affluence des rendez-vous</p>
          <div className="flex items-end justify-between gap-1 h-32">
            {Object.entries(hourlyData).map(([hour, count]) => (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-700">{count}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent-500 to-accent-300 transition-all duration-500"
                  style={{ height: `${(count / maxHourly) * 80}%`, minHeight: '2px' }}
                />
                <span className="text-xs text-gray-400">{hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New citizen registrations */}
        <div className="glass rounded-2xl shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-600" /> Nouvelles inscriptions (7 jours)
          </h3>
          <p className="text-xs text-gray-500 mb-4">Citoyens inscrits sur la plateforme</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyRegistrations.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500 hover:from-green-700 hover:to-green-500"
                  style={{ height: `${(d.count / maxRegistrations) * 100}%`, minHeight: '4px' }}
                  title={`${d.count} inscriptions`}
                />
                <span className="text-xs text-gray-500 capitalize">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Total inscrits</span>
            <span className="font-bold text-primary-700">{citizenCount}</span>
          </div>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border animate-slide-down ${
          actionMsg.type === 'success' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-error-50 text-error-700 border-error-200'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 glass rounded-xl shadow-sm p-1 overflow-x-auto">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              subTab === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge ? (
              <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-bold ${
                subTab === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* RDV tab */}
      {subTab === 'rdv' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters + export */}
          <div className="glass rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-primary-500 focus:outline-none">
              <option value="all">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACCEPTE">Accepté</option>
              <option value="REFUSE">Refusé</option>
              <option value="NOUVEAU_CRENEAU">Nouveau créneau</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-primary-500 focus:outline-none">
              <option value="date">Trier par date</option>
              <option value="name">Trier par nom</option>
            </select>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportAppointments('pdf')}>
                <Download className="h-3 w-3" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportAppointments('word')}>
                <Download className="h-3 w-3" /> Word
              </Button>
              <Button size="sm" variant="ghost" onClick={fetchAppointments}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Appointment list */}
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
          ) : filteredAppointments.length === 0 ? (
            <div className="glass rounded-xl shadow-sm p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
              <p className="text-sm text-gray-500">Les nouvelles demandes apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <AdminAppointmentCard
                  key={apt.id}
                  apt={apt}
                  onAccept={() => handleAccept(apt)}
                  onRefuse={() => refuseModal.open(apt)}
                  onPropose={() => proposeModal.open(apt)}
                  onDelay={() => delayModal.open(apt)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services tab */}
      {subTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          {servicesLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            services.map((service) => {
              const edits = editingServices[service.id] || {};
              const hasEdits = Object.keys(edits).length > 0;
              return (
                <div key={service.id} className="glass rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      {edits.title ?? service.title}
                    </h3>
                    {hasEdits && (
                      <Button size="sm" onClick={() => saveService(service.id)}>
                        <Save className="h-3 w-3" /> Sauvegarder
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Titre" value={edits.title ?? service.title}
                      onChange={(e) => setEditingServices({ ...editingServices, [service.id]: { ...edits, title: e.target.value } })} />
                    <Input label="Icône (Baby, Heart, Cross, Stamp, FileText)" value={edits.icon ?? service.icon}
                      onChange={(e) => setEditingServices({ ...editingServices, [service.id]: { ...edits, icon: e.target.value } })} />
                  </div>
                  <div className="mt-4">
                    <Textarea label="Description courte" rows={2} value={edits.short_description ?? service.short_description}
                      onChange={(e) => setEditingServices({ ...editingServices, [service.id]: { ...edits, short_description: e.target.value } })} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <Textarea label="Frais" rows={3} value={edits.fees ?? service.fees}
                      onChange={(e) => setEditingServices({ ...editingServices, [service.id]: { ...edits, fees: e.target.value } })} />
                    <Textarea label="Délais" rows={3} value={edits.processing_delay ?? service.processing_delay}
                      onChange={(e) => setEditingServices({ ...editingServices, [service.id]: { ...edits, processing_delay: e.target.value } })} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CMS tab */}
      {subTab === 'cms' && (
        <div className="space-y-4 animate-fade-in">
          {contentLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <>
              {Object.entries(contentByCategory).map(([category, items]) => (
                <div key={category} className="glass rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary-600" />
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{item.label}</label>
                        {item.value.length > 80 ? (
                          <Textarea rows={3} value={editingContent[item.key] ?? item.value}
                            onChange={(e) => setEditingContent({ ...editingContent, [item.key]: e.target.value })} />
                        ) : (
                          <Input value={editingContent[item.key] ?? item.value}
                            onChange={(e) => setEditingContent({ ...editingContent, [item.key]: e.target.value })} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(editingContent).length > 0 && (
                <div className="sticky bottom-4 flex justify-center">
                  <Button size="lg" onClick={saveContent} className="shadow-xl">
                    <Save className="h-5 w-5" /> Sauvegarder les modifications
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {refuseModal.apt && (
        <RefuseModalContent apt={refuseModal.apt} onClose={refuseModal.close} onConfirm={handleRefuse} />
      )}
      {proposeModal.apt && (
        <ProposeSlotModalContent apt={proposeModal.apt} onClose={proposeModal.close} onConfirm={handleProposeSlot} />
      )}
      {delayModal.apt && (
        <DelayModalContent apt={delayModal.apt} onClose={delayModal.close} onConfirm={handleDelayChange} />
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Calendar; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-700 bg-gray-50 border-gray-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    primary: 'text-primary-700 bg-primary-50 border-primary-200',
  };
  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-md ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="h-5 w-5" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

function AdminAppointmentCard({ apt, onAccept, onRefuse, onPropose, onDelay }: {
  apt: Appointment;
  onAccept: () => void;
  onRefuse: () => void;
  onPropose: () => void;
  onDelay: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = apt.status as AppointmentStatus;
  const statusIconMap: Record<string, typeof CheckCircle> = {
    EN_ATTENTE: AlertCircle,
    ACCEPTE: CheckCircle,
    REFUSE: XCircle,
    NOUVEAU_CRENEAU: CalendarClock,
  };
  const StatusIcon = statusIconMap[status] || AlertCircle;

  return (
    <div className="glass rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          status === 'ACCEPTE' ? 'bg-green-100' :
          status === 'REFUSE' ? 'bg-red-100' :
          status === 'NOUVEAU_CRENEAU' ? 'bg-blue-100' : 'bg-amber-100'
        }`}>
          <StatusIcon className={`h-5 w-5 ${
            status === 'ACCEPTE' ? 'text-green-600' :
            status === 'REFUSE' ? 'text-red-600' :
            status === 'NOUVEAU_CRENEAU' ? 'text-blue-600' : 'text-amber-600'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{apt.full_name}</h3>
            <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
            {apt.dossier_status !== 'NON_TRAITE' && (
              <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                {DOSSIER_STATUS_LABELS[apt.dossier_status]}
              </Badge>
            )}
            <span className="text-xs text-gray-400 font-mono">#{apt.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {apt.preferred_date} à {apt.preferred_time}</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {apt.service_type}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Délai: {apt.processing_delay_days}j</span>
          </div>
        </div>

        {status === 'EN_ATTENTE' && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> Accepter
            </Button>
            <Button size="sm" variant="danger" onClick={onRefuse}>
              <XCircle className="h-4 w-4" /> Refuser
            </Button>
            <Button size="sm" variant="warning" onClick={onPropose} className="bg-accent-400 hover:bg-accent-500 text-gray-900">
              <CalendarClock className="h-4 w-4" /> Autre créneau
            </Button>
          </div>
        )}
        {status !== 'EN_ATTENTE' && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>

      {(expanded || status === 'EN_ATTENTE') && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-2">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium text-gray-700">Téléphone: </span><span className="text-gray-600">{apt.phone}</span></div>
            <div><span className="font-medium text-gray-700">Email: </span><span className="text-gray-600">{apt.email}</span></div>
          </div>
          {apt.motif && (
            <div className="text-sm"><span className="font-medium text-gray-700">Motif: </span><span className="text-gray-600">{apt.motif}</span></div>
          )}
          {apt.admin_message && (
            <div className="text-sm rounded-lg bg-white px-3 py-2 border border-gray-200">
              <span className="font-medium text-gray-700">Message: </span><span className="text-gray-600">{apt.admin_message}</span>
            </div>
          )}
          {apt.proposed_date && (
            <div className="text-sm rounded-lg bg-blue-50 px-3 py-2 border border-blue-200">
              <span className="font-medium text-blue-700">Créneau proposé: </span>
              <span className="text-blue-600">{apt.proposed_date} à {apt.proposed_time}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={onDelay}>
              <Clock className="h-3 w-3" /> Modifier le délai ({apt.processing_delay_days}j)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Modal content components ---
function RefuseModalContent({ apt, onClose, onConfirm }: { apt: Appointment; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal open={true} onClose={onClose} title="Refuser la demande" size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Vous êtes sur le point de refuser le rendez-vous de <strong>{apt.full_name}</strong> pour <strong>{apt.service_type}</strong>.
        </div>
        <Textarea label="Motif du refus (sera transmis au citoyen)" rows={4} value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Documents manquants, créneau indisponible, veuillez reformuler..." />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={() => onConfirm(reason || 'Demande refusée.')} disabled={!reason.trim()}>
            <XCircle className="h-4 w-4" /> Confirmer le refus
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ProposeSlotModalContent({ apt, onClose, onConfirm }: { apt: Appointment; onClose: () => void; onConfirm: (date: string, time: string, msg: string) => void }) {
  const [date, setDate] = useState(apt.preferred_date);
  const [time, setTime] = useState(apt.preferred_time);
  const [message, setMessage] = useState('');
  return (
    <Modal open={true} onClose={onClose} title="Proposer un autre créneau" size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-accent-50 border border-accent-200 px-4 py-3 text-sm text-accent-800">
          Proposez une nouvelle date/heure à <strong>{apt.full_name}</strong> pour <strong>{apt.service_type}</strong>.
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nouvelle date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Nouvelle heure" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Textarea label="Message (optionnel)" rows={3} value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Le créneau initial n'est plus disponible, merci de confirmer..." />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="warning" onClick={() => onConfirm(date, time, message)} disabled={!date || !time}>
            <CalendarClock className="h-4 w-4" /> Envoyer la proposition
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DelayModalContent({ apt, onClose, onConfirm }: { apt: Appointment; onClose: () => void; onConfirm: (days: number) => void }) {
  const [days, setDays] = useState(apt.processing_delay_days);
  return (
    <Modal open={true} onClose={onClose} title="Modifier le délai de traitement" size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          Dossier de <strong>{apt.full_name}</strong> — {apt.service_type}.<br />
          Le délai actuel est de <strong>{apt.processing_delay_days} jours</strong>.
        </div>
        <Input label="Nouveau délai (en jours)" type="number" min={1} max={60} value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 1)} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onConfirm(days)}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
