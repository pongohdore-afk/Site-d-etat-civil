/*
# Create Civil Registry Center Schema

## Overview
This migration creates the complete database schema for a Civil Registry Center (Centre d'État Civil) application for Douala, Cameroon. It supports public information pages, citizen appointment booking, citizen auth + dashboard, and a full admin management portal.

## Tables Created

1. **profiles** — Extends auth.users with citizen profile data (full name, phone, address). Admins are identified by `is_admin = true`.
2. **appointments** — Citizen appointment requests with status tracking (EN_ATTENTE, ACCEPTE, REFUSE, NOUVEAU_CRENEAU), response messages, processing delays, and proposed new slots.
3. **services** — Civil registry service catalog (birth, marriage, death, legalization) with required documents, fees, processing delays, and editable info text. Managed by admin.
4. **site_content** — Key-value store for site-wide editable content (center hours, notifications, homepage text). Managed by admin.

## Security
- RLS enabled on all tables.
- profiles: users can read/update only their own profile; admins can read all profiles.
- appointments: citizens can read/insert their own; admins can read/update all; public (anon) can insert without login.
- services: public read (anon + authenticated); only admin can update.
- site_content: public read (anon + authenticated); only admin can update.
- Admin detection via `is_admin` column on profiles + a SECURITY DEFINER helper function `is_current_user_admin()`.

## Triggers
- `handle_new_user`: Auto-creates a profile row when a new auth user signs up.
- `handle_updated_at`: Auto-updates `updated_at` on profiles.

## Seed Data
- 4 default services (Naissance, Mariage, Décès, Légalisation) with documents, fees, delays.
- Default site content entries (center hours, notifications, contact info, homepage intro).
*/

-- =============================================
-- TABLE: profiles (must exist before is_current_user_admin function)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- TABLE: services
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'FileText',
  short_description text NOT NULL DEFAULT '',
  required_documents text NOT NULL DEFAULT '',
  fees text NOT NULL DEFAULT '',
  processing_delay text NOT NULL DEFAULT '',
  full_info text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT UPDATE, INSERT ON public.services TO authenticated;

-- =============================================
-- TABLE: appointments
-- =============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  service_type text NOT NULL,
  motif text NOT NULL DEFAULT '',
  preferred_date date NOT NULL,
  preferred_time time NOT NULL,
  status text NOT NULL DEFAULT 'EN_ATTENTE',
  admin_message text NOT NULL DEFAULT '',
  processing_delay_days int NOT NULL DEFAULT 5,
  proposed_date date,
  proposed_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_preferred_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appointments_full_name ON public.appointments(full_name);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- =============================================
-- TABLE: site_content
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT UPDATE, INSERT, DELETE ON public.site_content TO authenticated;

-- =============================================
-- HELPER FUNCTION: is_current_user_admin()
-- =============================================
-- Now that profiles exists, create the admin-check function.

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- =============================================
-- RLS POLICIES: profiles
-- =============================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS POLICIES: services
-- =============================================
DROP POLICY IF EXISTS "services_select_public" ON public.services;
CREATE POLICY "services_select_public" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "services_modify_admin" ON public.services;
CREATE POLICY "services_modify_admin" ON public.services
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "services_insert_admin" ON public.services;
CREATE POLICY "services_insert_admin" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

-- =============================================
-- RLS POLICIES: appointments
-- =============================================
DROP POLICY IF EXISTS "appointments_insert_all" ON public.appointments;
CREATE POLICY "appointments_insert_all" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
CREATE POLICY "appointments_select_own" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
CREATE POLICY "appointments_update_own" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- =============================================
-- RLS POLICIES: site_content
-- =============================================
DROP POLICY IF EXISTS "site_content_select_public" ON public.site_content;
CREATE POLICY "site_content_select_public" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "site_content_modify_admin" ON public.site_content;
CREATE POLICY "site_content_modify_admin" ON public.site_content
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "site_content_insert_admin" ON public.site_content;
CREATE POLICY "site_content_insert_admin" ON public.site_content
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "site_content_delete_admin" ON public.site_content;
CREATE POLICY "site_content_delete_admin" ON public.site_content
  FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

-- =============================================
-- TRIGGER: handle_new_user
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: handle_updated_at for profiles
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- SEED DATA: Services
-- =============================================
INSERT INTO public.services (slug, title, icon, short_description, required_documents, fees, processing_delay, full_info, sort_order) VALUES
(
  'naissance',
  'Acte de Naissance',
  'Baby',
  'Déclaration de naissance, reconstitution et copie intégrale d''acte de naissance.',
  '• Certificat de naissance de la maternité ou du centre de santé
• Pièce d''identité du déclarant (père, mère ou tuteur)
• Acte de mariage des parents (si applicable)
• Déclaration de naissance dans les 90 jours
• Pour reconstitution: ancien acte ou témoignage + pièce d''identité',
  'Création: 1 000 FCFA
Reconstitution: 2 000 FCFA
Copie intégrale: 500 FCFA',
  'Création: 3 à 5 jours ouvrables
Reconstitution: 7 à 14 jours ouvrables',
  'L''acte de naissance est le document officiel qui atteste de la naissance d''une personne. Il est indispensable pour de nombreuses démarches administratives: inscription scolaire, obtention de la CNI, passeport, mariage, etc. La déclaration doit être faite dans les 90 jours suivant la naissance. Au-delà de ce délai, une procédure de reconstitution est nécessaire.',
  1
),
(
  'mariage',
  'Acte de Mariage',
  'Heart',
  'Célébration du mariage civil, publication des bans et délivrance de l''acte de mariage.',
  '• Extrait de naissance des deux futurs époux (datant de moins de 3 mois)
• Pièce d''identité de chaque époux
• Certificat de célibat ou de non-remariage
• Acte de décès du conjoint précédent (si veuf/veuve)
• Copie de l''acte de mariage des parents (si applicable)
• 2 témoins majeurs avec pièce d''identité
• Certificat médical prénuptial (datant de moins de 2 mois)',
  'Publication des bans: 2 000 FCFA
Célébration du mariage: 5 000 FCFA
Acte de mariage: 1 000 FCFA',
  'Publication des bans: 30 jours minimum
Délivrance de l''acte: 5 jours après célébration',
  'Le mariage civil est célébré à l''officiel d''état civil du Centre d''État Civil. La publication des bans est obligatoire et doit précéder la célébration d''au moins 30 jours. Les deux époux doivent être présents le jour de la célébration, accompagnés de leurs témoins.',
  2
),
(
  'deces',
  'Acte de Décès',
  'Cross',
  'Déclaration de décès et délivrance de l''acte de décès.',
  '• Certificat de décès délivré par un médecin
• Pièce d''identité du défunt (si disponible)
• Pièce d''identité du déclarant
• Acte de naissance du défunt (si disponible)
• Livret de famille (si disponible)',
  'Déclaration: 1 000 FCFA
Acte de décès: 500 FCFA',
  '3 à 5 jours ouvrables',
  'La déclaration de décès doit être faite dans les 7 jours suivant le décès. Le déclarant peut être un membre de la famille, un voisin ou toute personne possédant les informations nécessaires. L''acte de décès est nécessaire pour la succession, l''assurance et les démarches administratives.',
  3
),
(
  'legalisation',
  'Légalisation de Documents',
  'Stamp',
  'Légalisation de signatures et authentification de documents administratifs.',
  '• Document original à légaliser
• Pièce d''identité du demandeur
• Photocopie du document
• Pour les traductions: traduction certifiée conforme',
  'Légalisation de signature: 500 FCFA par document
Certification de copie: 300 FCFA par page
Légalisation de traduction: 1 000 FCFA',
  'Immédiat (sur place) à 24h',
  'La légalisation consiste à authentifier la signature apposée sur un document par un officier d''état civil. Cette procédure est requise pour de nombreuses démarches: visas, inscriptions universitaires, démarches consulaires, etc. Le demandeur doit se présenter en personne avec le document original.',
  4
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: Site Content
-- =============================================
INSERT INTO public.site_content (key, value, category, label) VALUES
('center_name', 'Centre d''État Civil de Douala', 'general', 'Nom du Centre'),
('center_address', 'Avenue de la République, Douala, Cameroun', 'general', 'Adresse'),
('center_phone', '+237 6 99 00 00 00', 'general', 'Téléphone'),
('center_email', 'etatcivil@douala.cm', 'general', 'Email'),
('center_hours_weekdays', '07h30 - 15h30', 'hours', 'Horaires (Lundi - Vendredi)'),
('center_hours_saturday', '08h00 - 12h00', 'hours', 'Horaires (Samedi)'),
('center_hours_sunday', 'Fermé', 'hours', 'Horaires (Dimanche)'),
('homepage_intro', 'Bienvenue au Centre d''État Civil de Douala. Notre mission est de garantir l''authenticité et la fiabilité des actes d''état civil pour tous les citoyens. Nous vous accompagnons dans toutes vos démarches administratives avec professionnalisme et diligence.', 'homepage', 'Introduction (Page d''accueil)'),
('notification_default', 'Votre demande a bien été enregistrée. Vous recevrez une réponse dans les meilleurs délais.', 'notifications', 'Notification par défaut'),
('admin_portal_hint', 'Lien d''accès: /admin-portal', 'general', 'Lien d''administration')
ON CONFLICT (key) DO NOTHING;
