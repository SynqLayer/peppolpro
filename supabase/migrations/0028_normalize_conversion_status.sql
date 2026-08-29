-- Normalize completed conversion status. Canonical completed status is 'done'.
-- Existing production rows written as 'success' are migrated once.

update public.conversions
 set status = 'done'
 where status = 'success';

-- A conversion with generated UBL is a completed conversion even if source-PDF storage failed.
update public.conversions
 set status = 'done'
 where status = 'failed'
  and nullif(ubl_xml, '') is not null;
