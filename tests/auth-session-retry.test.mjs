import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withAuthRetry, AUTH_ATTEMPTS, AUTH_RETRY_DELAY_MS } from '../lib/auth-session.ts';

const generateRoute = readFileSync(new URL('../app/api/generate/route.ts', import.meta.url), 'utf8');
const recommandSendRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const supabaseServer = readFileSync(new URL('../lib/supabase-server.ts', import.meta.url), 'utf8');
const authSession = readFileSync(new URL('../lib/auth-session.ts', import.meta.url), 'utf8');

const USER = { id: 'user-1', email: 'user@example.com' };

function clientFactory(results) {
  const calls = { count: 0 };
  const create = async () => {
    const outcome = results[Math.min(calls.count, results.length - 1)];
    calls.count += 1;
    return {
      auth: {
        getUser: async () => ({ data: { user: outcome ? USER : null } }),
      },
    };
  };
  return { create, calls };
}

test('a valid session authenticates on the first attempt without a retry', async () => {
  const { create, calls } = clientFactory([true]);
  const result = await withAuthRetry(create, { delayMs: 0 });
  assert.equal(result.user?.id, USER.id);
  assert.equal(result.attempts, 1);
  assert.equal(calls.count, 1);
});

test('an unreadable session cookie is retried once with a fresh client', async () => {
  const { create, calls } = clientFactory([false, true]);
  const result = await withAuthRetry(create, { delayMs: 0 });
  assert.equal(result.user?.id, USER.id, 'retry must recover the customer session');
  assert.equal(result.attempts, 2);
  assert.equal(calls.count, 2, 'the retry must use a fresh client so cookies are re-read');
});

test('a genuinely absent session still fails after exactly one retry', async () => {
  const { create, calls } = clientFactory([false, false]);
  let reported = 0;
  const result = await withAuthRetry(create, { delayMs: 0, onExhausted: () => { reported += 1; } });
  assert.equal(result.user, null);
  assert.equal(result.attempts, AUTH_ATTEMPTS);
  assert.equal(calls.count, AUTH_ATTEMPTS);
  assert.equal(reported, 1, 'diagnostics must run once after the retry is exhausted');
});

test('diagnostics never break the request when they throw', async () => {
  const { create } = clientFactory([false, false]);
  const result = await withAuthRetry(create, {
    delayMs: 0,
    onExhausted: () => { throw new Error('diagnostics boom'); },
  });
  assert.equal(result.user, null);
});

test('the retry waits briefly instead of hammering Supabase', () => {
  assert.ok(AUTH_RETRY_DELAY_MS >= 100, 'a retry without a pause would re-read the same broken cookie');
  assert.equal(AUTH_ATTEMPTS, 2, 'a single extra attempt, not a loop');
});

test('both customer-facing routes authenticate through the retrying helper', () => {
  for (const [name, source] of [['generate', generateRoute], ['recommand/send', recommandSendRoute]]) {
    assert.match(source, /createAuthenticatedSupabase\(\)/, `${name} must use the retrying helper`);
    assert.doesNotMatch(source, /auth\.getUser\(\)/, `${name} must not authenticate without a retry`);
    assert.match(source, /Niet ingelogd/, `${name} keeps the customer-facing message`);
  }
});

test('the 401 branch is only reachable after the retry has been exhausted', () => {
  const helper = supabaseServer.match(/export async function createAuthenticatedSupabase\(\)[\s\S]*?\n\}/)?.[0] || '';
  assert.match(helper, /withAuthRetry\(createServerSupabase/);
  assert.doesNotMatch(supabaseServer, /createServerSupabase\(\)[\s\S]{0,80}getUser\(\)/);
});

test('auth diagnostics log cookie shape only, never cookie values or tokens', () => {
  const diagnostics = supabaseServer.match(/async function logSessionCookieShape\(\)[\s\S]*?\n\}/)?.[0] || '';
  assert.match(diagnostics, /cookieNames/);
  assert.match(diagnostics, /cookieLengths/);
  assert.doesNotMatch(diagnostics, /value:\s*cookie\.value/);
  assert.doesNotMatch(diagnostics, /console\.(log|error)\([^)]*cookie\.value\b(?!\.length)/);
  assert.doesNotMatch(diagnostics, /access_token|refresh_token/);
});

test('the retry helper cannot log secrets from its own module', () => {
  assert.doesNotMatch(authSession, /access_token|refresh_token|cookie\.value/);
});
