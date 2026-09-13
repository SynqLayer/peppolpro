# P1-02 billing archive

The single SQL function `invoice_retention_until(invoice_date date)` returns the inclusive final retention date for the requested calendar-year policy. It uses the invoice date, never the current clock. The insert trigger, backfill, billing RPC, restrictive CHECK and deletion guard call it. The application obtains the result through RPC and validates the stored boundary without duplicating arithmetic.

The local numbered 0030 file (not present as version 0030 in remote migration history) now refers to this function; the new additive migration replaces the active RPC too. Historical timestamped records must be reconstructed without replaying them during P1-16 reconciliation. The function is installed before any new application call.

Immutable customer/payment/supplier snapshots replace current profile lookups. Existing PDF objects are reused; new objects use insert-only upload, with a concurrent winner's stored bytes as the canonical document. SHA-256 checks detect changed bytes. Missing historical objects fail explicitly. Historical customer snapshots are labelled as later captures and do not claim to reproduce the original addressee data.

The restrictive migration preserves invoices with ON DELETE SET NULL on the account foreign key and protects financial fields, snapshots and already-set PDF paths/hashes. Non-billing sales records keep their existing behavior. The dated retention value is inclusive; deletion is blocked through that date.

Validation: PostgreSQL 17, isolated Docker container with synthetic data and no network. Exact fixtures: 2026-01-01 -> 2033-12-31; 2026-12-31 -> 2033-12-31; 2024-02-29 -> 2031-12-31; 2020-06-15 -> 2027-12-31. Financial updates/deletes were refused as both privileged role and authenticated owner (with UPDATE/DELETE granted in the fixture). Account deletion completed while all five invoice rows, snapshots, amounts and PDF paths remained. Full lint/typecheck/test/production-build gate passed before commit.

Release order: additive archive migration, application deployment READY, restrictive archive migration. No production migrations have been applied during local validation.
