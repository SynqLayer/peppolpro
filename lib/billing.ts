import { SupabaseClient } from "@supabase/supabase-js";
import { MolliePayment } from "@/lib/mollie";
import { getCreditBundle, getPlan } from "@/lib/plans";
import { sendTransactionalEmail } from "@/lib/brevo";
import { generateBillingInvoicePdf } from "@/lib/invoice-pdf";

type AdminClient = SupabaseClient;

type PaymentRow = {
 id: string;
 user_id: string;
 amount: number | string | null;
 mollie_payment_id?: string | null;
 mollie_subscription_id?: string | null;
 plan?: string | null;
 status?: string | null;
};

type SubscriptionRow = {
 id: string;
 user_id: string;
 plan: string;
};

type BillingInvoiceForEmail = {
 id: string;
 user_id: string;
 invoice_number?: string | null;
 invoice_kind?: string | null;
 original_invoice_number?: string | null;
 issued_at?: string | null;
 invoice_date?: string | null;
 currency?: string | null;
 amount?: number | string | null;
 vat_amount?: number | string | null;
 vat_rate?: number | string | null;
 total_excl?: number | string | null;
 total_incl?: number | string | null;
 pdf_path?: string | null;
 admin_pdf_path?: string | null;
 paid_at?: string | null;
 delivered_at?: string | null;
 payment_method?: string | null;
 email_status?: string | null;
 brevo_message_id?: string | null;
 email_error?: string | null;
};

type UserProfileForEmail = {
 company_name?: string | null;
 email?: string | null;
 address?: string | null;
 postal_code?: string | null;
 city?: string | null;
 country?: string | null;
 btw_nr?: string | null;
};

async function createBillingInvoiceForPayment({
 supabase,
 payment,
 paymentRow,
 invoiceKind,
 subscription,
 originalInvoiceId,
 originalInvoiceNumber,
}: {
 supabase: AdminClient;
 payment: MolliePayment;
 paymentRow: PaymentRow;
 invoiceKind?: "subscription" | "credits" | "credit";
 subscription?: SubscriptionRow | null;
 originalInvoiceId?: string | null;
 originalInvoiceNumber?: string | null;
}) {
 if (payment.mode === "test") throw new Error("Testbetalingen worden niet gefactureerd");
 const { data, error } = await supabase.rpc("create_billing_invoice_for_payment", {
  p_payment_id: paymentRow.id,
  p_invoice_kind: invoiceKind || null,
  p_subscription_id: subscription?.id || null,
  p_original_invoice_id: originalInvoiceId || null,
  p_original_invoice_number: originalInvoiceNumber || null,
  p_mollie_mode: payment.mode || null,
 });
 if (error) throw error;
 const invoice = Array.isArray(data) ? data[0] : data;
 if (!invoice?.id) throw new Error("Factuur kon niet worden aangemaakt");
 return invoice as { id: string; invoice_number?: string | null };
}

function billingPdfPath(invoice: BillingInvoiceForEmail, admin = false) {
 const datePart = (invoice.invoice_date || invoice.issued_at || new Date().toISOString()).slice(0, 10);
 const prefix = admin ? "admin" : "customer";
 return `billing/${invoice.user_id}/${datePart}/${prefix}-${invoice.invoice_number || invoice.id}.pdf`;
}

async function storeBillingInvoicePdfs(supabase: AdminClient, invoiceId: string) {
 const { data: invoice, error: invoiceError } = await supabase
 .from("invoices")
 .select("id, user_id, invoice_number, invoice_kind, original_invoice_number, issued_at, invoice_date, currency, amount, vat_amount, vat_rate, total_excl, total_incl, pdf_path, admin_pdf_path, paid_at, delivered_at, payment_method, email_status, brevo_message_id, email_error, payments(mollie_payment_id)")
 .eq("id", invoiceId)
 .single<BillingInvoiceForEmail & { payments?: { mollie_payment_id?: string | null } | null }>();
 if (invoiceError || !invoice) throw invoiceError || new Error("Factuur niet gevonden voor PDF opslag");

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("company_name, email, address, postal_code, city, country, btw_nr")
 .eq("id", invoice.user_id)
 .maybeSingle<UserProfileForEmail>();
 const fullInvoice = { ...invoice, user_profiles: profile || null };
 const customerPdf = await generateBillingInvoicePdf(fullInvoice);
 const adminPdf = await generateBillingInvoicePdf({ ...fullInvoice, adminCopy: true, molliePaymentId: invoice.payments?.mollie_payment_id || null });
 const pdfPath = invoice.pdf_path || billingPdfPath(invoice);
 const adminPdfPath = invoice.admin_pdf_path || billingPdfPath(invoice, true);
 const bucket = supabase.storage.from("invoices");
 const contentType = "application/pdf";
 const { error: customerError } = await bucket.upload(pdfPath, Buffer.from(customerPdf), { contentType, upsert: true });
 if (customerError) throw customerError;
 const { error: adminError } = await bucket.upload(adminPdfPath, Buffer.from(adminPdf), { contentType, upsert: true });
 if (adminError) throw adminError;
 const { error: updateError } = await supabase.from("invoices").update({
  pdf_path: pdfPath,
  admin_pdf_path: adminPdfPath,
  pdf_stored_at: new Date().toISOString(),
 }).eq("id", invoiceId);
 if (updateError) throw updateError;
 return { pdf: customerPdf, path: pdfPath };
}

export async function sendBillingInvoiceEmail(supabase: AdminClient, invoiceId: string) {
 const { data: invoice, error: invoiceError } = await supabase
 .from("invoices")
 .select("id, user_id, invoice_number, invoice_kind, original_invoice_number, issued_at, invoice_date, currency, amount, vat_amount, vat_rate, total_excl, total_incl, pdf_path, paid_at, delivered_at, payment_method, email_status, brevo_message_id, email_error")
 .eq("id", invoiceId)
 .single<BillingInvoiceForEmail>();
 if (invoiceError || !invoice) throw invoiceError || new Error("Factuur niet gevonden voor e-mail");

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("company_name, email, address, postal_code, city, country, btw_nr")
 .eq("id", invoice.user_id)
 .maybeSingle<UserProfileForEmail>();
 if (!profile?.email) {
  const message = "Factuurmail geblokkeerd: profiel mist e-mailadres";
  console.error(message, { invoiceId });
  const { error: updateError } = await supabase.from("invoices").update({ email_status: "failed", email_error: message }).eq("id", invoiceId);
  if (updateError) throw updateError;
  throw new Error(message);
 }

 const stored = await storeBillingInvoicePdfs(supabase, invoice.id);
 const displayName = profile.company_name || profile.email;
 let result: { messageId?: string; messageIds?: string[] } | undefined;
 try {
 result = await sendTransactionalEmail({
 to: [{ email: profile.email, name: displayName || profile.email }],
 subject: `Factuur ${invoice.invoice_number} — PeppolPro`,
 htmlContent: `<!DOCTYPE html><html lang="nl"><body><p>Beste ${displayName || "klant"},</p><p>In de bijlage vind je je ${invoice.invoice_kind === "credit" ? "creditnota" : "factuur"} van PeppolPro.</p><p>Met vriendelijke groet,<br>SynqLayer / PeppolPro</p></body></html>`,
 attachment: [
 {
 content: Buffer.from(stored.pdf).toString("base64"),
 name: `${invoice.invoice_number || "factuur"}.pdf`,
 },
 ],
 });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Brevo factuurmail mislukt";
  const { error: updateError } = await supabase.from("invoices").update({ email_status: "failed", email_error: message }).eq("id", invoiceId);
  if (updateError) console.error("Factuurmail status update failed:", updateError);
  throw error;
 }
 const brevoMessageId = result?.messageId || result?.messageIds?.[0] || null;
 const { error: updateError } = await supabase.from("invoices").update({
  email_status: "accepted",
  brevo_message_id: brevoMessageId,
  email_accepted_at: new Date().toISOString(),
  email_error: null,
 }).eq("id", invoiceId);
 if (updateError) throw updateError;
}

export async function ensurePaymentInvoice({
 supabase,
 payment,
 paymentRow,
 subscription,
}: {
 supabase: AdminClient;
 payment: MolliePayment;
 paymentRow: PaymentRow;
 subscription?: SubscriptionRow | null;
}) {
 if (payment.status !== "paid") return null;
 if (payment.mode === "test") return null;
 const planId = paymentRow.plan || payment.metadata?.plan;
 const product = getCreditBundle(planId) || getPlan(planId);
 if (!product.paid) return null;

 const { data: existing, error: existingError } = await supabase
 .from("invoices")
 .select("id, invoice_number, email_status")
 .eq("payment_id", paymentRow.id)
 .neq("invoice_kind", "credit")
 .maybeSingle();
 if (existingError) throw existingError;
 if (existing) {
  if (!["accepted", "delivered"].includes(String(existing.email_status || ""))) await sendBillingInvoiceEmail(supabase, existing.id);
  return existing;
 }

 const invoice = await createBillingInvoiceForPayment({
  supabase,
  payment,
  paymentRow,
  subscription,
  invoiceKind: product.recurring ? "subscription" : "credits",
 });
 await sendBillingInvoiceEmail(supabase, invoice.id);
 return invoice;
}

export async function ensureCreditInvoice({
 supabase,
 payment,
 paymentRow,
 subscription,
}: {
 supabase: AdminClient;
 payment: MolliePayment;
 paymentRow: PaymentRow;
 subscription?: SubscriptionRow | null;
}) {
 if (payment.status !== "refunded" && payment.status !== "charged_back") return null;
 if (payment.mode === "test") return null;
 const { data: existingCredit, error: existingCreditError } = await supabase
 .from("invoices")
 .select("id, invoice_number, email_status")
 .eq("payment_id", paymentRow.id)
 .eq("invoice_kind", "credit")
 .maybeSingle();
 if (existingCreditError) throw existingCreditError;
 if (existingCredit) {
  if (!["accepted", "delivered"].includes(String(existingCredit.email_status || ""))) await sendBillingInvoiceEmail(supabase, existingCredit.id);
  return existingCredit;
 }

 const { data: original, error: originalError } = await supabase
 .from("invoices")
 .select("id, invoice_number, amount, vat_amount, vat_rate, currency, total_excl, total_incl")
 .eq("payment_id", paymentRow.id)
 .neq("invoice_kind", "credit")
 .order("issued_at", { ascending: true })
 .limit(1)
 .maybeSingle();
 if (originalError) throw originalError;

 const creditInvoice = await createBillingInvoiceForPayment({
  supabase,
  payment,
  paymentRow,
  subscription,
  invoiceKind: "credit",
  originalInvoiceId: original?.id || null,
  originalInvoiceNumber: original?.invoice_number || null,
 });
 await sendBillingInvoiceEmail(supabase, creditInvoice.id);
 return creditInvoice;
}
