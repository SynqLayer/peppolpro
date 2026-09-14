import type { User } from "@supabase/supabase-js";

/**
 * Eén herkansing met een verse sessie.
 *
 * De Supabase-sessie zit in twee chunks (`sb-<ref>-auth-token.0/.1`, ~3,4 kB) en kan
 * tijdens een gelijktijdige cookieherschrijving even onleesbaar zijn. De server leest de
 * cookies dan opnieuw in met een verse client in plaats van de klant direct
 * "Niet ingelogd" te tonen.
 */
export const AUTH_ATTEMPTS = 2;
export const AUTH_RETRY_DELAY_MS = 250;

export type SessionClientLike = {
  auth: {
    getUser: () => Promise<{ data: { user: User | null } }>;
  };
};

export type AuthRetryOptions = {
  delayMs?: number;
  onExhausted?: () => void | Promise<void>;
};

export async function withAuthRetry<T extends SessionClientLike>(
  createClient: () => Promise<T>,
  options: AuthRetryOptions = {},
): Promise<{ supabase: T; user: User | null; attempts: number }> {
  const delayMs = options.delayMs ?? AUTH_RETRY_DELAY_MS;
  let supabase = await createClient();
  let attempts = 0;

  while (attempts < AUTH_ATTEMPTS) {
    attempts += 1;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return { supabase, user: data.user, attempts };
    }
    if (attempts < AUTH_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // verse client, dus de cookies worden opnieuw gelezen
      supabase = await createClient();
    }
  }

  if (options.onExhausted) {
    try {
      await options.onExhausted();
    } catch {
      // diagnostiek mag een request nooit laten mislukken
    }
  }

  return { supabase, user: null, attempts };
}
