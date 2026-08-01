import { createHash } from "node:crypto";

const PRIVATE_HOST_PATTERNS = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^169\.254\./, /^0\./];

export function normalizeWebhookUrl(raw: string) {
 const url = new URL(raw.trim());
 if (url.protocol !== "https:") throw new Error("Webhook-URL moet met https:// beginnen");
 if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
 throw new Error("Webhook-URL mag niet naar localhost of private IP-adressen wijzen");
 }
 url.username = "";
 url.password = "";
 url.hash = "";
 return url.toString();
}

type WebhookConfig = {
 webhook_url: string | null;
};

type MonitoringEventPayload = {
 id?: string;
 target_id: string;
 user_id: string;
 event_type: string;
 severity: string;
 payload?: unknown;
 created_at?: string;
};

export async function dispatchMonitoringWebhook(config: WebhookConfig | null, event: MonitoringEventPayload) {
 if (!config?.webhook_url || !["warning", "critical"].includes(event.severity)) return { sent: false, reason: "not_dispatchable" };
 const url = normalizeWebhookUrl(config.webhook_url);
 const body = JSON.stringify({ type: "monitoring.event", event });
 const signature = createHash("sha256").update(body).digest("hex");
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 5000);
 try {
 const res = await fetch(url, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "X-PeppolPro-Event": "monitoring.event",
 "X-PeppolPro-Signature": signature,
 },
 body,
 signal: controller.signal,
 redirect: "error",
 });
 return { sent: res.ok, status: res.status };
 } catch (err) {
 return { sent: false, reason: err instanceof Error ? err.message : "webhook_failed" };
 } finally {
 clearTimeout(timeout);
 }
}
