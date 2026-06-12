with extracted as (
 select
  id,
  nullif((regexp_match(ubl_xml, '<cbc:ID>([^<]+)</cbc:ID>'))[1], '') as extracted_invoice_number,
  nullif((regexp_match(ubl_xml, '<cac:AccountingCustomerParty>(.|\n|\r)*?<cac:PartyName>(.|\n|\r)*?<cbc:Name>([^<]*)</cbc:Name>'))[3], '') as extracted_customer_name,
  nullif((regexp_match(ubl_xml, '<cbc:PayableAmount currencyID="([^"]+)">([0-9]+(\.[0-9]+)?)</cbc:PayableAmount>'))[1], '') as extracted_currency,
  nullif((regexp_match(ubl_xml, '<cbc:PayableAmount currencyID="([^"]+)">([0-9]+(\.[0-9]+)?)</cbc:PayableAmount>'))[2], '')::numeric as extracted_total_amount
 from public.conversions
 where ubl_xml is not null
),
updated as (
 update public.conversions c
 set
  invoice_number = coalesce(c.invoice_number, e.extracted_invoice_number),
  customer_name = coalesce(c.customer_name, e.extracted_customer_name),
  currency = coalesce(c.currency, e.extracted_currency, 'EUR'),
  total_amount = coalesce(c.total_amount, e.extracted_total_amount)
 from extracted e
 where c.id = e.id
  and (
   e.extracted_invoice_number is not null
   or e.extracted_customer_name is not null
   or e.extracted_total_amount is not null
  )
 returning c.id
),
skipped as (
 select e.id
 from extracted e
 where e.extracted_invoice_number is null
  and e.extracted_customer_name is null
  and e.extracted_total_amount is null
)
select
 (select count(*) from updated) as updated_rows,
 (select count(*) from skipped) as skipped_rows,
 coalesce((select json_agg(id) from skipped), '[]'::json) as skipped_ids;

