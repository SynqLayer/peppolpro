-- Spiegelbestand van de productiehistorie (versie 20260908115647, reset_invoice_numbering_2026).
--
-- Deze migratie is op 8 september 2026 handmatig op productie toegepast en staat daar in
-- supabase_migrations.schema_migrations geregistreerd. Dit bestand is toegevoegd zodat repo en
-- productie exact dezelfde versiehistorie hebben; de inhoud is de oorspronkelijke productie-SQL.
--
-- Eenmalige productiecorrectie: hernummering van facturen. Op een verse omgeving raakt deze
-- statement geen enkele rij.

delete from invoices where invoice_number = 'INV-2026-00006';
update invoices set invoice_number = 'INV-2026-00001' where invoice_number = 'INV-2026-00007';
update invoice_number_sequences set last_number = 1, updated_at = now() where year = 2026;
