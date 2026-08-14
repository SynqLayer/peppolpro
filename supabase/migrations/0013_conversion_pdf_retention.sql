alter table public.conversions
 add column if not exists pdf_deleted_at timestamptz;

create index if not exists conversions_pdf_retention_idx
 on public.conversions (created_at)
 where pdf_deleted_at is null;

comment on column public.conversions.pdf_deleted_at is 'Timestamp when the uploaded source PDF was removed from private storage by retention cleanup. Generated UBL/metadata remains in the account history.';
