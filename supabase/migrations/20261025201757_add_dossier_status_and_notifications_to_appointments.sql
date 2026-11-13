/*
# Add dossier tracking status and notification fields to appointments

1. Changes
- Adds `dossier_status` (text, default 'NON_TRAITE') to `appointments` — tracks the operational status of a citizen's dossier once they physically come to the office. Values: 'APPROUVE', 'EN_COURS', 'REPOUSSE', 'TERMINE', 'NON_TRAITE'.
- Adds `notification_sent_at` (timestamptz, nullable) — timestamp of the last citizen notification (email/SMS).
- Adds `notification_type` (text, nullable) — type of the last notification sent ('EMAIL', 'SMS', 'EMAIL_SMS').
- Adds `pickup_time_slot` (text, nullable) — optional pickup time slot communicated to the citizen when the dossier is ready.
2. Security
- No new tables; existing RLS policies on `appointments` already cover all CRUD operations.
- UPDATE grant already exists on `appointments` for `authenticated`; new columns inherit that grant.
3. Notes
- `dossier_status` defaults to 'NON_TRAITE' so existing appointments remain unaffected until an admin acts on them.
- `notification_sent_at` and `notification_type` are nullable to allow tracking only when a notification is actually sent.
*/

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS dossier_status text NOT NULL DEFAULT 'NON_TRAITE',
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_type text,
  ADD COLUMN IF NOT EXISTS pickup_time_slot text;
