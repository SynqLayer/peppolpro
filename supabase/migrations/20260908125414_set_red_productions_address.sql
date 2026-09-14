-- Spiegelbestand van de productiehistorie (versie 20260908125414, set_red_productions_address).
--
-- Deze migratie is op 8 september 2026 handmatig op productie toegepast en staat daar in
-- supabase_migrations.schema_migrations geregistreerd. Dit bestand is toegevoegd zodat repo en
-- productie exact dezelfde versiehistorie hebben; de inhoud is de oorspronkelijke productie-SQL.
--
-- Eenmalige productiecorrectie: adres van Red Productions. Op een verse omgeving raakt deze
-- statement geen enkele rij.

update user_profiles
set address = 'Zuidelijke Knibbelweg 38',
    postal_code = '2765 JT',
    city = 'Cortelande',
    country = 'NL'
where email = 'administratie@redproductions.nl';
