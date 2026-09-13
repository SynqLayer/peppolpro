import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase-server";

function failure(message: string, status: number) {
 return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
 try {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return failure("Niet ingelogd", 401);
  const { invoiceId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId)) {
   return failure("Ongeldig factuurnummer", 400);
  }
  // The session client proves ownership without embedding the protected payments table.
  const { data: invoice, error } = await supabase
   .from("invoices")
   .select("id, user_id, invoice_number, pdf_path")
   .eq("id", invoiceId)
   .eq("user_id", user.id)
   .maybeSingle();
  if (error) return failure("Factuur kon niet worden geladen", 500);
  if (!invoice) return failure("Factuur niet gevonden", 404);
  if (!invoice.pdf_path) return failure("Factuurarchief is nog niet beschikbaar", 503);

  // Use private storage only after the ownership query succeeded. Never regenerate
  // an issued invoice from mutable current profile data when its archive is missing.
  const admin = createAdminSupabase();
  const { data: stored, error: storageError } = await admin.storage.from("invoices").download(invoice.pdf_path);
  if (storageError || !stored) return failure("Factuurarchief kon niet worden opgehaald", 503);
  const filename = `${String(invoice.invoice_number || "factuur").replace(/[^a-zA-Z0-9_.-]/g, "_")}.pdf`;
  return new NextResponse(Buffer.from(await stored.arrayBuffer()), {
   status: 200,
   headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
   },
  });
 } catch {
  return failure("Factuur kon niet worden geladen", 500);
 }
}
