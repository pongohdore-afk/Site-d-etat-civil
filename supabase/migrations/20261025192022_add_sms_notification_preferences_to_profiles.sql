/*
# Add SMS notification preferences to profiles

1. Changes
- Adds `sms_notifications_enabled` (boolean, default true) to `profiles` — master switch for SMS notifications.
- Adds `sms_notify_status_changes` (boolean, default true) — notify when appointment status changes (accepted, refused, new slot).
- Adds `sms_notify_reminders` (boolean, default true) — notify with appointment reminders before the scheduled date.
- Adds `sms_notify_document_ready` (boolean, default true) — notify when documents are ready for pickup.
2. Security
- No new tables; existing RLS policies on `profiles` already cover SELECT/INSERT/UPDATE/DELETE for authenticated users on their own row.
- UPDATE grant already exists on `profiles` for `authenticated`; the new columns inherit that grant automatically.
3. Notes
- All new columns default to `true` so existing users keep receiving notifications unless they opt out.
- The columns are nullable-safe booleans — never null after migration.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notify_status_changes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notify_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notify_document_ready boolean NOT NULL DEFAULT true;
