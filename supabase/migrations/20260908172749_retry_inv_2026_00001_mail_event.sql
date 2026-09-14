-- Spiegelbestand van de productiehistorie (versie 20260908172749, retry_inv_2026_00001_mail_event).
--
-- Deze migratie is op 8 september 2026 handmatig op productie toegepast en staat daar in
-- supabase_migrations.schema_migrations geregistreerd. Dit bestand is toegevoegd zodat repo en
-- productie exact dezelfde versiehistorie hebben; de inhoud is de oorspronkelijke productie-SQL.
--
-- Eenmalige productiecorrectie: mailgebeurtenis voor factuur 2026-00001 opnieuw klaarzetten.
-- Op een verse omgeving raakt deze statement geen enkele rij.

update public.webhook_events
set status = 'failed',
    error_message = 'manual retry requested for pending invoice mail INV-2026-00001',
    processed_at = null
where event_key = 'tr_d9VvcSBKZmPV2pE63xVWJ:paid'
  and mollie_payment_id = 'tr_d9VvcSBKZmPV2pE63xVWJ'
  and status = 'processed';
