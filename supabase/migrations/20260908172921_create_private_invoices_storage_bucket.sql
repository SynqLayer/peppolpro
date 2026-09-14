-- Spiegelbestand van de productiehistorie (versie 20260908172921, create_private_invoices_storage_bucket).
--
-- Deze migratie is op 8 september 2026 handmatig op productie toegepast en staat daar in
-- supabase_migrations.schema_migrations geregistreerd. Dit bestand is toegevoegd zodat repo en
-- productie exact dezelfde versiehistorie hebben; de inhoud is de oorspronkelijke productie-SQL.
--
-- Storage-bucket voor privéfacturen. Dit bestand is aangescherpt met een conflict-guard zodat het
-- ook op een verse omgeving opnieuw uitgevoerd kan worden.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']
