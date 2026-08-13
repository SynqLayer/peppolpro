alter table public.conversions
 add column if not exists recommand_document_id text,
 add column if not exists recommand_status text,
 add column if not exists recommand_raw_response jsonb,
 add column if not exists verified_recipient boolean not null default false,
 add column if not exists sent_via_recommand_at timestamptz;

alter table public.invoices
 add column if not exists recommand_document_id text,
 add column if not exists recommand_status text,
 add column if not exists recommand_raw_response jsonb,
 add column if not exists verified_recipient boolean not null default false,
 add column if not exists sent_via_recommand_at timestamptz;

create index if not exists conversions_recommand_document_id_idx
 on public.conversions (recommand_document_id)
 where recommand_document_id is not null;

create index if not exists invoices_recommand_document_id_idx
 on public.invoices (recommand_document_id)
 where recommand_document_id is not null;
