import { createHash } from "node:crypto";

export function hashApiKey(key: string) {
 return createHash("sha256").update(key).digest("hex");
}

export function maskApiKeyHash(hash?: string | null) {
 if (!hash) return "-";
 return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
