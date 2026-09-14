import { createHash } from "node:crypto";

export type PaymentAdjustment = { key: string; kind: "refund" | "chargeback" | "chargeback_reversed"; cents: number };
type ProviderAdjustment = { id: string; paymentId: string; status?: string; reversedAt?: string | null; amount: { currency: string; value: string } };

export function amountInCents(amount: { currency: string; value: string }): number {
 if (amount.currency !== "EUR" || !/^\d+\.\d{2}$/.test(amount.value)) throw new Error("Invalid provider amount");
 const [whole,fraction]=amount.value.split(".");
 const cents=Number(whole)*100+Number(fraction);
 if (!Number.isSafeInteger(cents) || cents<=0) throw new Error("Invalid provider amount");
 return cents;
}

export function normalizePaymentAdjustments(paymentId: string, refunds: ProviderAdjustment[], chargebacks: ProviderAdjustment[]): PaymentAdjustment[] {
 const rows: PaymentAdjustment[]=[];
 for (const row of refunds) {
  if (row.paymentId!==paymentId || !/^re_[A-Za-z0-9]+$/.test(row.id)) throw new Error("Refund identity mismatch");
  if (row.status === "refunded") rows.push({key:`refund:${row.id}`,kind:"refund",cents:amountInCents(row.amount)});
 }
 for (const row of chargebacks) {
  if (row.paymentId!==paymentId || !/^chb_[A-Za-z0-9]+$/.test(row.id)) throw new Error("Chargeback identity mismatch");
  const cents=amountInCents(row.amount);
  rows.push({key:`chargeback:${row.id}`,kind:"chargeback",cents});
  if (row.reversedAt) rows.push({key:`chargeback:${row.id}:reversed`,kind:"chargeback_reversed",cents:-cents});
 }
 const unique=new Map<string,PaymentAdjustment>();
 for (const row of rows) {
  if (unique.has(row.key) && unique.get(row.key)?.cents!==row.cents) throw new Error("Conflicting provider adjustment");
  unique.set(row.key,row);
 }
 return [...unique.values()].sort((a,b)=>a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

export function adjustmentEventSuffix(rows: PaymentAdjustment[]): string {
 const identities=[...new Set(rows.map(({key,kind,cents})=>JSON.stringify([key,kind,cents])))].sort();
 return identities.length ? `:${createHash("sha256").update(JSON.stringify(identities)).digest("hex")}` : "";
}

export function mollieWebhookEventKey(paymentId: string, paymentStatus: string, rows: PaymentAdjustment[]): string {
 return `${paymentId}:${paymentStatus}${adjustmentEventSuffix(rows)}`;
}

interface AdjustmentPaginationResponse {
 _embedded?: {
  refunds?: ProviderAdjustment[];
  chargebacks?: ProviderAdjustment[];
 };
 _links?: { next?: { href?: string | null } | null };
}

export async function getPaymentAdjustments(paymentId: string): Promise<PaymentAdjustment[]> {
 if (!/^tr_[A-Za-z0-9]+$/.test(paymentId)) throw new Error("Invalid payment id");
 const key=process.env.MOLLIE_API_KEY;
 if (!key) throw new Error("MOLLIE_API_KEY ontbreekt");
 const origin="https://api.mollie.com";
 async function list(kind:"refunds"|"chargebacks"): Promise<ProviderAdjustment[]> {
  const path=`/v2/payments/${paymentId}/${kind}`;
  let url: string | null=`${origin}${path}?limit=250`;
  const rows: ProviderAdjustment[]=[];
  for(let page=0;url && page<10;page++) {
   const parsed=new URL(url);
   if(parsed.origin!==origin || parsed.pathname!==path) throw new Error("Unexpected provider pagination URL");
   const response: Response=await fetch(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10_000),cache:"no-store",redirect:"error"});
   if(!response.ok) throw new Error(`Mollie ${kind} lookup failed (${response.status})`);
   const body: AdjustmentPaginationResponse=await response.json();
   const items=body._embedded?.[kind];
   if(!Array.isArray(items)) throw new Error("Incomplete provider adjustment response");
   rows.push(...items);
   url=body._links?.next?.href || null;
  }
  if(url) throw new Error("Provider adjustment pagination limit reached");
  return rows;
 }
 const [refunds,chargebacks]=await Promise.all([list("refunds"),list("chargebacks")]);
 return normalizePaymentAdjustments(paymentId,refunds,chargebacks);
}
