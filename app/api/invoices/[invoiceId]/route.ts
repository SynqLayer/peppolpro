import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { generateBillingInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { invoiceId } = await params;
 const { data: invoice, error } = await supabase
 .from("invoices")
 .select("id, user_id, invoice_number, invoice_kind, original_invoice_number, issued_at, invoice_date, currency, amount, vat_amount, vat_rate, total_excl, total_incl, pdf_path, paid_at, delivered_at, payment_method")
 .eq("id", invoiceId)
 .eq("user_id", user.id)
 .single();

 if (error || !invoice) return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });

 if (invoice.pdf_path) {
  const { data: stored, error: storageError } = await supabase.storage.from("invoices").download(invoice.pdf_path);
  if (storageError) console.error("Stored billing PDF download error:", storageError);
  if (stored) {
   const filename = `${invoice.invoice_number || "factuur"}.pdf`;
   return new NextResponse(Buffer.from(await stored.arrayBuffer()), {
    status: 200,
    headers: {
     "Content-Type": "application/pdf",
     "Content-Disposition": `attachment; filename="${filename}"`,
     "Cache-Control": "no-store",
    },
   });
  }
 }

 const { data: profile, error: profileError } = await supabase
 .from("user_profiles")
 .select("company_name, email, address, postal_code, city, country, btw_nr")
 .eq("id", user.id)
 .maybeSingle();
 if (profileError) return NextResponse.json({ error: "Profiel kon niet worden geladen" }, { status: 500 });

 const pdf = await generateBillingInvoicePdf({ ...invoice, user_profiles: profile || null });
 const filename = `${invoice.invoice_number || "factuur"}.pdf`;
 return new NextResponse(Buffer.from(pdf), {
 status: 200,
 headers: {
 "Content-Type": "application/pdf",
 "Content-Disposition": `attachment; filename="${filename}"`,
 "Cache-Control": "no-store",
 },
 });
}
