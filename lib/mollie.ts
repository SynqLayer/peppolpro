const MOLLIE_API = "https://api.mollie.com/v2";

export interface MolliePayment {
 id: string;
 status: string;
 metadata?: {
 user_id?: string;
 plan?: string;
 credits?: string;
 };
 _links?: {
 checkout?: {
 href?: string;
 };
 };
}

export async function createPayment({
 amount,
 description,
 redirectUrl,
 webhookUrl,
 metadata,
}: {
 amount: string;
 description: string;
 redirectUrl: string;
 webhookUrl: string;
 metadata: Record<string, string>;
}): Promise<MolliePayment> {
 if (!process.env.MOLLIE_API_KEY) {
 throw new Error("MOLLIE_API_KEY ontbreekt");
 }

 const res = await fetch(`${MOLLIE_API}/payments`, {
 method: "POST",
 headers: {
 Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 amount: { currency: "EUR", value: amount },
 description,
 redirectUrl,
 webhookUrl,
 metadata,
 }),
 });

 if (!res.ok) {
 const err = await res.json();
 throw new Error(`Mollie error: ${JSON.stringify(err)}`);
 }

 return res.json();
}

export async function getPayment(id: string): Promise<MolliePayment> {
 if (!process.env.MOLLIE_API_KEY) {
 throw new Error("MOLLIE_API_KEY ontbreekt");
 }

 const res = await fetch(`${MOLLIE_API}/payments/${id}`, {
 headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
 });

 if (!res.ok) {
 const err = await res.json();
 throw new Error(`Mollie error: ${JSON.stringify(err)}`);
 }

 return res.json();
}
