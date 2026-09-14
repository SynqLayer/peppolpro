-- 0035: markeer conversies als achterhaald (superseded) door een afgeleverde versie.
--
-- Achtergrond: een conversie kan inhoudelijk vervangen zijn door een latere, wél afgeleverde
-- versie (bijvoorbeeld een gecorrigeerde UBL). Zo'n oud bestand mag niet meer gedownload en
-- niet meer verzonden worden. De verwijzing houdt vast wélke versie leidend is.
--
-- Alleen DDL. Het markeren van bestaande rijen gebeurt als losse, gecontroleerde datastap.

alter table public.conversions
  add column if not exists superseded_by_conversion_id uuid references public.conversions(id) on delete set null,
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_reason text;

comment on column public.conversions.superseded_by_conversion_id is
  'De conversie die deze rij vervangt. Gevuld betekent: niet downloaden, niet verzenden.';
comment on column public.conversions.superseded_at is
  'Moment waarop deze rij als achterhaald is gemarkeerd.';
comment on column public.conversions.superseded_reason is
  'Korte, klantvriendelijke uitleg waarom deze rij achterhaald is.';

create index if not exists conversions_superseded_by_idx
  on public.conversions (superseded_by_conversion_id)
  where superseded_by_conversion_id is not null;
