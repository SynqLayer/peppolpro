/**
 * Controleert of de Supabase-sessiecookies leesbaar zijn voordat de client ze krijgt.
 *
 * @supabase/ssr leest de sessiecookie en decodeert die met een strenge UTF-8-decoder. Is de
 * waarde geen geldige base64url of geen geldige UTF-8, dan gooit die decoder een fout die als
 * unhandled rejection de hele route omlegt (HTTP 500 in plaats van een nette 401). Dezelfde
 * bibliotheek laat een achtergebleven chunk stil doorwerken, met een onleesbare sessie tot
 * gevolg.
 *
 * Daarom reconstrueren we hier dezelfde waarde als de bibliotheek doet en beoordelen die:
 * lukt dat niet, dan krijgt de client geen sessiecookies te zien. Het gevolg is een gewone
 * "niet ingelogd" in plaats van een crash, en de bestaande herkansing plus diagnostiek doen
 * daarna hun werk.
 *
 * De `-code-verifier`-cookie hoort bij de PKCE-flow en bevat geen JSON; die blijft altijd staan.
 */

const BASE64_URL_PREFIX = "base64-";
const MAX_CHUNK_READS = 5;
const AUTH_COOKIE_PATTERN = /-auth-token(\.\d+)?$/;

export type CookieLike = { name: string; value: string };

export function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_PATTERN.test(name);
}

export function authCookieKey(name: string): string {
  return name.replace(/\.\d+$/, "");
}

export function combineAuthCookieValue(key: string, cookies: CookieLike[]): string | null {
  const direct = cookies.find((cookie) => cookie.name === key);
  if (direct) return direct.value;

  let combined = "";
  for (let index = 0; index < MAX_CHUNK_READS; index += 1) {
    const chunk = cookies.find((cookie) => cookie.name === `${key}.${index}`);
    if (!chunk) break;
    combined += chunk.value;
  }
  return combined.length > 0 ? combined : null;
}

function decodeBase64Url(value: string): string {
  const cleaned = value.replace(/[\s=]/g, "");
  if (!/^[A-Za-z0-9\-_]*$/.test(cleaned)) {
    throw new Error("geen geldige base64url");
  }
  const bytes = Buffer.from(cleaned.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Is de sessiecookie in deze vorm door de client te lezen? */
export function authCookieJarIsUsable(cookies: CookieLike[]): boolean {
  const authCookies = cookies.filter((cookie) => isAuthCookieName(cookie.name));
  if (authCookies.length === 0) return true;

  const keys = new Set(authCookies.map((cookie) => authCookieKey(cookie.name)));
  try {
    for (const key of keys) {
      const combined = combineAuthCookieValue(key, cookies);
      if (combined === null) return false;
      const encoded = combined.startsWith(BASE64_URL_PREFIX);
      const decoded = encoded ? decodeBase64Url(combined.slice(BASE64_URL_PREFIX.length)) : combined;
      const parsed = JSON.parse(decoded);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Laat alleen sessiecookies weg als ze onleesbaar zijn; al het andere blijft ongemoeid. */
export function readableCookiesOnly<T extends CookieLike>(cookies: T[]): T[] {
  if (authCookieJarIsUsable(cookies)) return cookies;
  return cookies.filter((cookie) => !isAuthCookieName(cookie.name));
}
