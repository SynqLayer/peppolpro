import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authCookieJarIsUsable,
  combineAuthCookieValue,
  isAuthCookieName,
  readableCookiesOnly,
} from '../lib/auth-cookie-guard.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supabaseServer = readFileSync(path.join(root, 'lib/supabase-server.ts'), 'utf8');

const KEY = 'sb-nqnznblztvbhwzcmdqga-auth-token';
const session = { access_token: 'a'.repeat(600), refresh_token: 'r'.repeat(40), user: { id: 'x', email: 'test@example.com' } };
const encoded = (value) => 'base64-' + Buffer.from(JSON.stringify(value ?? session)).toString('base64url');
const chunked = (value) => {
  const raw = encoded(value);
  const parts = raw.match(/.{1,3180}/g) || [];
  return parts.map((part, index) => ({ name: `${KEY}.${index}`, value: part }));
};

test('een sessiecookie wordt herkend, de PKCE-cookie niet', () => {
  assert.equal(isAuthCookieName(KEY), true);
  assert.equal(isAuthCookieName(`${KEY}.0`), true);
  assert.equal(isAuthCookieName(`${KEY}-code-verifier`), false);
  assert.equal(isAuthCookieName('andere-cookie'), false);
});

test('de waarde wordt hetzelfde samengesteld als de client doet', () => {
  const cookies = chunked();
  assert.equal(combineAuthCookieValue(KEY, cookies), cookies.map((c) => c.value).join(''));
  assert.equal(combineAuthCookieValue(KEY, [{ name: KEY, value: 'direct' }]), 'direct');
  // zonder chunk .0 stopt de client ook: de reeks is dan niet te lezen
  assert.equal(combineAuthCookieValue(KEY, [{ name: `${KEY}.1`, value: 'los' }]), null);
  assert.equal(combineAuthCookieValue(KEY, []), null);
});

test('geldige sessies blijven werken: één cookie, twee chunks en een onversierde cookie', () => {
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: encoded() }]), true);
  assert.equal(authCookieJarIsUsable(chunked()), true);
  assert.equal(authCookieJarIsUsable([...chunked(), { name: KEY, value: encoded() }]), true);
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: JSON.stringify(session) }]), true);
  assert.equal(authCookieJarIsUsable([]), true);
});

test('onleesbare cookies worden geweigerd in plaats van een crash te geven', () => {
  // base64 die geen geldige UTF-8 oplevert: dit gaf op productie "Invalid UTF-8 sequence" (500)
  const ongeldigeUtf8 = 'base64-' + 'x'.repeat(40);
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: ongeldigeUtf8 }]), false);
  // geldige JSON, maar een string in plaats van een object: "Cannot create property 'user' on string"
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: 'base64-' + Buffer.from(JSON.stringify('{"a":1}')).toString('base64url') }]), false);
  // afgekapte waarde
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: encoded().slice(0, 60) }]), false);
  // onvolledige chunkreeks
  assert.equal(authCookieJarIsUsable([{ name: `${KEY}.1`, value: 'abc' }]), false);
  // geen base64url
  assert.equal(authCookieJarIsUsable([{ name: KEY, value: 'base64-!!!geen-base64!!!' }]), false);
});

test('alleen onleesbare sessiecookies verdwijnen; de rest blijft staan', () => {
  const kapot = [
    { name: KEY, value: 'base64-' + 'x'.repeat(40) },
    { name: 'andere-cookie', value: 'blijft' },
    { name: `${KEY}-code-verifier`, value: 'verifier' },
  ];
  const gefilterd = readableCookiesOnly(kapot);
  assert.equal(gefilterd.length, 2);
  assert.ok(gefilterd.every((cookie) => !isAuthCookieName(cookie.name)));
  assert.ok(gefilterd.some((cookie) => cookie.name.endsWith('-code-verifier')));

  const gezond = [{ name: KEY, value: encoded() }, { name: 'andere-cookie', value: 'blijft' }];
  assert.deepEqual(readableCookiesOnly(gezond), gezond);
});

test('de server-client gebruikt de guard in getAll', () => {
  assert.match(supabaseServer, /return readableCookiesOnly\(cookieStore\.getAll\(\)\);/);
});
