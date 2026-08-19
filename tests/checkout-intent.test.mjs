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

const planButton = readFileSync(new URL('../components/PlanButton.tsx', import.meta.url), 'utf8');
const loginPage = readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const registerPage = readFileSync(new URL('../app/register/page.tsx', import.meta.url), 'utf8');
const authConfirmPage = readFileSync(new URL('../app/auth/confirm/page.tsx', import.meta.url), 'utf8');
const authCallbackRoute = readFileSync(new URL('../app/api/auth/callback/route.ts', import.meta.url), 'utf8');
const checkoutResumePage = readFileSync(new URL('../app/checkout/resume/page.tsx', import.meta.url), 'utf8');

test('PlanButton stuurt 401 naar login met checkout-intentie', () => {
 assert.equal(checkoutLoginPath('verzenden_25'), '/login?plan=verzenden_25&redirect=checkout');
 assert.match(planButton, /router\.push\(checkoutLoginPath\(plan\)\)/);
 assert.doesNotMatch(planButton, /router\.push\("\/login"\)/);
});

test('checkout-intentie accepteert alleen betaalde beschikbare plannen', () => {
 assert.equal(isCheckoutPlan('verzenden_25'), true);
 assert.equal(isCheckoutPlan('verzenden_100'), true);
 assert.equal(isCheckoutPlan('monitoring'), true);
 assert.equal(isCheckoutPlan('free'), false);
 assert.equal(isCheckoutPlan('niet_bestaand'), false);
});

test('checkout-intentie wordt veilig door auth-links en cookies gedragen', () => {
 const params = new URLSearchParams('plan=verzenden_25&redirect=checkout');
 assert.equal(readCheckoutIntentFromSearch(params), 'verzenden_25');
 assert.equal(readCheckoutIntentFromSearch(new URLSearchParams('plan=free&redirect=checkout')), null);
 assert.equal(readCheckoutIntentFromSearch(new URLSearchParams('plan=verzenden_25&redirect=/dashboard')), null);
 assert.equal(
  appendCheckoutIntent('https://peppolpro.nl/api/auth/callback', 'verzenden_25'),
  'https://peppolpro.nl/api/auth/callback?plan=verzenden_25&redirect=checkout'
 );
 assert.equal(checkoutResumePath('verzenden_25'), '/checkout/resume?plan=verzenden_25');
 assert.match(checkoutIntentCookieValue('verzenden_25'), /peppolpro_checkout_plan=verzenden_25; Path=\/; Max-Age=3600; SameSite=Lax/);
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
