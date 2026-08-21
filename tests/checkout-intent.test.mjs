import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
 appendCheckoutIntent,
 checkoutIntentCookieValue,
 checkoutLoginPath,
 checkoutResumePath,
 clearCheckoutIntentCookieValue,
 isCheckoutPlan,
 readCheckoutIntentFromSearch,
} from '../lib/checkout-intent.ts';
import { checkoutProducts } from '../lib/plans.ts';

const planButton = readFileSync(new URL('../components/PlanButton.tsx', import.meta.url), 'utf8');
const loginPage = readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const registerPage = readFileSync(new URL('../app/register/page.tsx', import.meta.url), 'utf8');
const authConfirmPage = readFileSync(new URL('../app/auth/confirm/page.tsx', import.meta.url), 'utf8');
const authCallbackRoute = readFileSync(new URL('../app/api/auth/callback/route.ts', import.meta.url), 'utf8');
const checkoutResumePage = readFileSync(new URL('../app/checkout/resume/page.tsx', import.meta.url), 'utf8');

test('PlanButton stuurt 401 naar login met checkout-intentie', () => {
 assert.equal(checkoutLoginPath('send_credits_10'), '/login?plan=send_credits_10&redirect=checkout');
 assert.match(planButton, /router\.push\(checkoutLoginPath\(plan\)\)/);
 assert.doesNotMatch(planButton, /router\.push\("\/login"\)/);
});

test('checkout-intentie accepteert alleen betaalde beschikbare plannen', () => {
 assert.equal(isCheckoutPlan('send_credits_10'), true);
 assert.equal(isCheckoutPlan('send_credits_25'), true);
 assert.equal(isCheckoutPlan('send_credits_50'), true);
 assert.equal(isCheckoutPlan('monitoring'), true);
 assert.equal(isCheckoutPlan('monitoring_accountant'), true);
 assert.equal(isCheckoutPlan('free'), false);
 assert.equal(isCheckoutPlan('verzenden_25'), false);
 assert.equal(isCheckoutPlan('verzenden_100'), false);
 assert.equal(isCheckoutPlan('niet_bestaand'), false);
});

test('checkout-intentie whitelist volgt de actuele checkoutProducts-config', () => {
 const expected = checkoutProducts.filter((product) => product.paid && product.available !== false).map((product) => product.id).sort();
 const accepted = ['send_credits_10', 'send_credits_25', 'send_credits_50', 'monitoring', 'monitoring_accountant']
  .filter((plan) => isCheckoutPlan(plan))
  .sort();
 assert.deepEqual(accepted, expected);
 assert.doesNotMatch(readFileSync(new URL('../lib/checkout-intent.ts', import.meta.url), 'utf8'), /verzenden_25|verzenden_100/);
});

test('checkout-intentie wordt veilig door auth-links en cookies gedragen', () => {
 const params = new URLSearchParams('plan=send_credits_10&redirect=checkout');
 assert.equal(readCheckoutIntentFromSearch(params), 'send_credits_10');
 assert.equal(readCheckoutIntentFromSearch(new URLSearchParams('plan=free&redirect=checkout')), null);
 assert.equal(readCheckoutIntentFromSearch(new URLSearchParams('plan=send_credits_10&redirect=/dashboard')), null);
 assert.equal(
  appendCheckoutIntent('https://peppolpro.nl/api/auth/callback', 'send_credits_10'),
  'https://peppolpro.nl/api/auth/callback?plan=send_credits_10&redirect=checkout'
 );
 assert.equal(checkoutResumePath('send_credits_10'), '/checkout/resume?plan=send_credits_10');
 assert.match(checkoutIntentCookieValue('send_credits_10'), /peppolpro_checkout_plan=send_credits_10; Path=\/; Max-Age=3600; SameSite=Lax/);
 assert.match(clearCheckoutIntentCookieValue(), /peppolpro_checkout_plan=; Path=\/; Max-Age=0; SameSite=Lax/);
});

test('login, magic link, Google, register en callback hervatten checkout-intentie', () => {
 assert.match(loginPage, /readCheckoutIntentFromSearch/);
 assert.match(loginPage, /fetch\("\/api\/checkout"/);
 assert.match(loginPage, /window\.location\.href = data\.checkoutUrl/);
 assert.match(loginPage, /appendCheckoutIntent\(`\$\{window\.location\.origin\}\/auth\/confirm`, checkoutPlan\)/);
 assert.match(loginPage, /appendCheckoutIntent\(`\$\{window\.location\.origin\}\/api\/auth\/callback`, checkoutPlan\)/);
 assert.match(loginPage, /document\.cookie = checkoutIntentCookieValue\(checkoutPlan\)/);
 assert.match(registerPage, /appendCheckoutIntent\(`\$\{window\.location\.origin\}\/api\/auth\/callback`, checkoutPlan\)/);
 assert.match(registerPage, /checkoutResumePath\(checkoutPlan\)/);
 assert.match(authConfirmPage, /checkoutResumePath\(checkoutPlan\)/);
 assert.match(authCallbackRoute, /CHECKOUT_INTENT_COOKIE/);
 assert.match(authCallbackRoute, /checkoutResumePath\(checkoutPlan\)/);
 assert.match(checkoutResumePage, /fetch\("\/api\/checkout"/);
 assert.match(checkoutResumePage, /window\.location\.href = data\.checkoutUrl/);
});
