export type AppointmentStatus = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' | 'NOUVEAU_CRENEAU';

export type DossierStatus = 'NON_TRAITE' | 'APPROUVE' | 'EN_COURS' | 'REPOUSSE' | 'TERMINE';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  is_admin: boolean;
  sms_notifications_enabled: boolean;
  sms_notify_status_changes: boolean;
  sms_notify_reminders: boolean;
  sms_notify_document_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  icon: string;
  short_description: string;
  required_documents: string;
  fees: string;
  processing_delay: string;
  full_info: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  motif: string;
  preferred_date: string;
  preferred_time: string;
  status: AppointmentStatus;
  admin_message: string;
  processing_delay_days: number;
  proposed_date: string | null;
  proposed_time: string | null;
  dossier_status: DossierStatus;
  notification_sent_at: string | null;
  notification_type: string | null;
  pickup_time_slot: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteContent {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export type SiteContentMap = Record<string, SiteContent>;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  NOUVEAU_CRENEAU: 'Nouveau créneau proposé',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTE: 'bg-green-100 text-green-800 border-green-200',
  REFUSE: 'bg-red-100 text-red-800 border-red-200',
  NOUVEAU_CRENEAU: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  NON_TRAITE: 'Non traité',
  APPROUVE: 'Approuvé',
  EN_COURS: 'En cours',
  REPOUSSE: 'Repoussé',
  TERMINE: 'Terminé',
};

export const DOSSIER_STATUS_COLORS: Record<DossierStatus, string> = {
  NON_TRAITE: 'bg-gray-100 text-gray-600 border-gray-200',
  APPROUVE: 'bg-green-100 text-green-800 border-green-200',
  EN_COURS: 'bg-blue-100 text-blue-800 border-blue-200',
  REPOUSSE: 'bg-amber-100 text-amber-800 border-amber-200',
  TERMINE: 'bg-primary-100 text-primary-800 border-primary-200',
};

export const DOSSIER_STATUS_ORDER: DossierStatus[] = ['APPROUVE', 'EN_COURS', 'REPOUSSE', 'TERMINE'];
