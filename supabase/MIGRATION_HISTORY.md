# Migratiehistorie PeppolPro

Dit bestand legt vast hoe de migratiehistorie van productie en de repo zich tot elkaar verhouden.
Het is de referentie bij elke vraag "is deze migratie al toegepast?" en bij de CI-driftcheck.

## Regel vanaf nu

Elke wijziging op productie — DDL én datafix — gaat via een migratiebestand in
`supabase/migrations`. Geen losse SQL meer in de SQL-editor zonder bestand, want dan ontstaat
opnieuw drift tussen `supabase_migrations.schema_migrations` en de repo.

## Versiehistorie

Productie (`supabase_migrations.schema_migrations`) en de repo hebben nu dezelfde versies:
39 geregistreerde productiemigraties en 42 bestanden, waarvan 3 genummerde bestanden als
toegepast geregistreerd zijn (zie "Reparatie" hieronder).

## Mapping: 0030 dekt twee productieversies

| Productieversie | Naam | Repo-bestand |
|---|---|---|
| 20260908163021 | billing_address_validation_and_atomic_invoice_rpc | `20260908163021_billing_address_validation_and_atomic_invoice_rpc.sql` |
| 20260908163043 | create_billing_invoice_for_payment_rpc | `20260908163043_create_billing_invoice_for_payment_rpc.sql` |
| 0030 | billing_address_validation_and_atomic_invoice_rpc | `0030_billing_address_validation_and_atomic_invoice_rpc.sql` |

`0030` is de genummerde repo-versie van dezelfde wijziging die op productie in twee losse stappen
is toegepast. Beide zijn idempotent (`create or replace function`), dus een verse omgeving die
0030 en de twee tijdstempelbestanden na elkaar toepast, krijgt hetzelfde eindresultaat.

## Eenmalige productiecorrecties (historie-only)

Deze vier migraties corrigeerden data op productie. Ze blijven in de historie staan en hebben een
spiegelbestand zodat de versienummers gelijk zijn; de statements zijn rij-specifiek en raken op een
verse omgeving geen enkele rij.

| Versie | Wat | Repo-bestand |
|---|---|---|
| 20260908115647 | factuurnummers hernummeren (`invoices`, `invoice_number_sequences`) | `20260908115647_reset_invoice_numbering_2026.sql` |
| 20260908125414 | adres van Red Productions (`user_profiles`) | `20260908125414_set_red_productions_address.sql` |
| 20260908172749 | mailgebeurtenis INV-2026-00001 opnieuw klaarzetten (`webhook_events`) | `20260908172749_retry_inv_2026_00001_mail_event.sql` |
| 20260908180450 | idem, na domeinautorisatie (`webhook_events`) | `20260908180450_retry_inv_2026_00001_after_synqlayer_domain_auth.sql` |

## Storage

| Versie | Wat | Repo-bestand |
|---|---|---|
| 20260908172921 | privébucket `invoices` (`storage.buckets`) | `20260908172921_create_private_invoices_storage_bucket.sql` |

Deze bucket is een echt object dat in een verse omgeving ontbreekt; het bestand voert een upsert uit
en is daarmee herhaalbaar.

## Reparatie

Op 14 september 2026 is de productiehistorie gerepareerd met
`supabase migration repair --status applied` voor de versies die al toegepast waren maar niet
geregistreerd stonden:

- `0030` — toegepast als de twee tijdstempelversies hierboven.
- `0034` — idempotente refund van UBL-generatiecredits bij een mislukte verzending.
- `0035` — kolommen en index voor achterhaalde conversies (`superseded_*`).

Vóór de reparatie is de volledige tabel gedumpt naar een bestand buiten de repo
(`~/db-backups/peppolpro/`).

## Controle

`scripts/check-migration-drift.mjs` vergelijkt de repo met de geregistreerde productiehistorie.
De controle leest productie **live** via de Management API en heeft daarvoor
`SUPABASE_ACCESS_TOKEN` nodig (in CI als repository-secret). Er is geen handmatig manifest meer.

Zonder token stopt de controle met exitcode 2: er is dan niets vergeleken, dus een groen vinkje
zou onterecht zijn. Draai hem in CI en voor elke release.
