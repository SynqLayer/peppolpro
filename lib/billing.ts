import { SupabaseClient } from "@supabase/supabase-js";
import { MolliePayment } from "@/lib/mollie";
import { getPlan, isMonitoringPlan } from "@/lib/plans";

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
 if (!isMonitoringPlan(plan.id)) return null;

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
 return creditInvoice;
}
