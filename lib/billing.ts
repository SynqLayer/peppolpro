import { SupabaseClient } from "@supabase/supabase-js";
import { MolliePayment } from "@/lib/mollie";
import { getPlan } from "@/lib/plans";
import { sendTransactionalEmail } from "@/lib/brevo";
import { generateBillingInvoicePdf } from "@/lib/invoice-pdf";

const VAT_RATE = 21;

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
};

type UserProfileForEmail = {
 company_name?: string | null;
 full_name?: string | null;
 email?: string | null;
 address?: string | null;
 btw_number?: string | null;
 btw_nr?: string | null;
};

function amountFromPayment(payment: MolliePayment, fallbackAmount?: string | number | null) {
 const raw = payment.amount?.value ?? fallbackAmount ?? "0";
 return Math.round(Number(raw) * 100) / 100;
}

function vatFromGross(gross: number, vatRate = VAT_RATE) {
 return Math.round((gross - gross / (1 + vatRate / 100)) * 100) / 100;
}

async function nextInvoiceNumber(supabase: AdminClient) {
 const { data, error } = await supabase.rpc("next_billing_invoice_number");
 if (error) throw error;
 if (!data || typeof data !== "string") throw new Error("Factuurnummer kon niet worden gegenereerd");
 return data;
}

export async function sendBillingInvoiceEmail(supabase: AdminClient, invoiceId: string) {
 const { data: invoice, error: invoiceError } = await supabase
 .from("invoices")
 .select("id, user_id, invoice_number, invoice_kind, original_invoice_number, issued_at, invoice_date, currency, amount, vat_amount, vat_rate, total_excl, total_incl")
 .eq("id", invoiceId)
 .single<BillingInvoiceForEmail>();
 if (invoiceError || !invoice) throw invoiceError || new Error("Factuur niet gevonden voor e-mail");

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("company_name, full_name, email, address, btw_number, btw_nr")
 .eq("id", invoice.user_id)
 .maybeSingle<UserProfileForEmail>();
 if (!profile?.email) return;

 const pdf = await generateBillingInvoicePdf({ ...invoice, user_profiles: profile || null });
 const displayName = profile.company_name || profile.full_name || profile.email;
 await sendTransactionalEmail({
 to: [{ email: profile.email, name: displayName || profile.email }],
 subject: `Factuur ${invoice.invoice_number} — PeppolPro`,
 htmlContent: `<!DOCTYPE html><html lang="nl"><body><p>Beste ${displayName || "klant"},</p><p>In de bijlage vind je je ${invoice.invoice_kind === "credit" ? "creditnota" : "factuur"} van PeppolPro.</p><p>Met vriendelijke groet,<br>SynqLayer / PeppolPro</p></body></html>`,
 attachment: [
 {
 content: Buffer.from(pdf).toString("base64"),
 name: `${invoice.invoice_number || "factuur"}.pdf`,
 },
 ],
 });
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
 const planId = paymentRow.plan || payment.metadata?.plan;
 const plan = getPlan(planId);
 if (!plan.paid) return null;

 const { data: existing } = await supabase
 .from("invoices")
 .select("id, invoice_number")
 .eq("payment_id", paymentRow.id)
 .neq("invoice_kind", "credit")
 .maybeSingle();
 if (existing) return existing;

 const amount = amountFromPayment(payment, paymentRow.amount);
 const vatAmount = vatFromGross(amount);
 const invoiceNumber = await nextInvoiceNumber(supabase);
 const issuedAt = new Date().toISOString();
 const { data: invoice, error } = await supabase
 .from("invoices")
 .insert({
 user_id: paymentRow.user_id,
 invoice_number: invoiceNumber,
 invoice_date: issuedAt.slice(0, 10),
 currency: payment.amount?.currency || "EUR",
 status: "generated",
 total_excl: Math.round((amount - vatAmount) * 100) / 100,
 vat_total: vatAmount,
 total_incl: amount,
 subscription_id: subscription?.id || null,
 payment_id: paymentRow.id,
 amount,
 vat_amount: vatAmount,
 vat_rate: VAT_RATE,
 issued_at: issuedAt,
 invoice_kind: "subscription",
 })
 .select("id, invoice_number")
 .single();
 if (error) throw error;
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
 const { data: existingCredit } = await supabase
 .from("invoices")
 .select("id, invoice_number")
 .eq("payment_id", paymentRow.id)
 .eq("invoice_kind", "credit")
 .maybeSingle();
 if (existingCredit) return existingCredit;

 const { data: original } = await supabase
 .from("invoices")
 .select("id, invoice_number, amount, vat_amount, vat_rate, currency, total_excl, total_incl")
 .eq("payment_id", paymentRow.id)
 .neq("invoice_kind", "credit")
 .order("issued_at", { ascending: true })
 .limit(1)
 .maybeSingle();

 const amount = -Math.abs(Number(original?.amount ?? amountFromPayment(payment, paymentRow.amount)));
 const vatAmount = -Math.abs(Number(original?.vat_amount ?? vatFromGross(Math.abs(amount))));
 const invoiceNumber = await nextInvoiceNumber(supabase);
 const issuedAt = new Date().toISOString();
 const { data: creditInvoice, error } = await supabase
 .from("invoices")
 .insert({
 user_id: paymentRow.user_id,
 invoice_number: invoiceNumber,
 invoice_date: issuedAt.slice(0, 10),
 currency: original?.currency || payment.amount?.currency || "EUR",
 status: "generated",
 total_excl: Math.round((amount - vatAmount) * 100) / 100,
 vat_total: vatAmount,
 total_incl: amount,
 subscription_id: subscription?.id || null,
 payment_id: paymentRow.id,
 amount,
 vat_amount: vatAmount,
 vat_rate: Number(original?.vat_rate ?? VAT_RATE),
 issued_at: issuedAt,
 invoice_kind: "credit",
 original_invoice_id: original?.id || null,
 original_invoice_number: original?.invoice_number || null,
 })
 .select("id, invoice_number")
 .single();
 if (error) throw error;
 await sendBillingInvoiceEmail(supabase, creditInvoice.id);
 return creditInvoice;
}
