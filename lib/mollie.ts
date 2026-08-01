const MOLLIE_API = "https://api.mollie.com/v2";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface MolliePayment {
 id: string;
 status: string;
 customerId?: string;
 mandateId?: string;
 subscriptionId?: string;
 sequenceType?: string;
 metadata?: {
 user_id?: string;
 plan?: string;
 [key: string]: string | undefined;
 };
 amount?: { currency: string; value: string };
 _links?: {
 checkout?: { href?: string };
 refunds?: { href?: string };
 chargebacks?: { href?: string };
 };
}

export interface MollieCustomer {
 id: string;
 email?: string;
 name?: string;
}

export interface MollieSubscription {
 id: string;
 status: string;
 customerId?: string;
 mandateId?: string;
 nextPaymentDate?: string;
 interval?: string;
 metadata?: Record<string, string>;
}

function mollieHeaders() {
 if (!process.env.MOLLIE_API_KEY) {
 throw new Error("MOLLIE_API_KEY ontbreekt");
 }
 return {
 Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
 "Content-Type": "application/json",
 };
}

async function parseMollieResponse<T>(res: Response): Promise<T> {
 const json = await res.json();
 if (!res.ok) throw new Error(`Mollie error: ${JSON.stringify(json)}`);
 return json;
}

export async function createPayment({
 amount,
 description,
 redirectUrl,
 webhookUrl,
 metadata,
 customerId,
 sequenceType,
}: {
 amount: string;
 description: string;
 redirectUrl: string;
 webhookUrl: string;
 metadata: Record<string, string>;
 customerId?: string;
 sequenceType?: "first" | "recurring" | "oneoff";
}): Promise<MolliePayment> {
 const body: Record<string, JsonValue> = {
 amount: { currency: "EUR", value: amount },
 description,
 redirectUrl,
 webhookUrl,
 metadata,
 };
 if (customerId) body.customerId = customerId;
 if (sequenceType) body.sequenceType = sequenceType;

 const res = await fetch(`${MOLLIE_API}/payments`, {
 method: "POST",
 headers: mollieHeaders(),
 body: JSON.stringify(body),
 });
 return parseMollieResponse<MolliePayment>(res);
}

export async function getPayment(id: string): Promise<MolliePayment> {
 const res = await fetch(`${MOLLIE_API}/payments/${id}`, {
 headers: mollieHeaders(),
 });
 return parseMollieResponse<MolliePayment>(res);
}

export async function createCustomer({ email, name }: { email: string; name?: string | null }): Promise<MollieCustomer> {
 const res = await fetch(`${MOLLIE_API}/customers`, {
 method: "POST",
 headers: mollieHeaders(),
 body: JSON.stringify({ email, name: name || email }),
 });
 return parseMollieResponse<MollieCustomer>(res);
}

export async function createSubscription({
 customerId,
 amount,
 description,
 webhookUrl,
 metadata,
 mandateId,
 startDate,
}: {
 customerId: string;
 amount: string;
 description: string;
 webhookUrl: string;
 metadata: Record<string, string>;
 mandateId?: string;
 startDate?: string;
}): Promise<MollieSubscription> {
 const body: Record<string, JsonValue> = {
 amount: { currency: "EUR", value: amount },
 interval: "1 month",
 description,
 webhookUrl,
 metadata,
 };
 if (mandateId) body.mandateId = mandateId;
 if (startDate) body.startDate = startDate;

 const res = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions`, {
 method: "POST",
 headers: mollieHeaders(),
 body: JSON.stringify(body),
 });
 return parseMollieResponse<MollieSubscription>(res);
}

export async function getSubscription(customerId: string, subscriptionId: string): Promise<MollieSubscription> {
 const res = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions/${subscriptionId}`, {
 headers: mollieHeaders(),
 });
 return parseMollieResponse<MollieSubscription>(res);
}

export async function cancelSubscription(customerId: string, subscriptionId: string): Promise<MollieSubscription> {
 const res = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions/${subscriptionId}`, {
 method: "DELETE",
 headers: mollieHeaders(),
 });
 return parseMollieResponse<MollieSubscription>(res);
}
