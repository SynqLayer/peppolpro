import { createHmac } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { missingRequiredCompanyFields, shouldCreateRecommandCompany } from '../lib/recommand-company-validation.ts';
import { buildRecommandWebhookUpdate, verifyRecommandWebhookSignature } from '../lib/recommand-webhook.ts';

const completeProfile = {
 company_name: 'SynqLayer',
 country: 'NL',
 kvk_kbo: '42041391',
 btw_nr: 'NL001234567B01',
 address: 'Koningin Wilhelminaplein 1',
 postal_code: '1062HG',
 city: 'Amsterdam',
};

for (const [field, expectedMissing] of [
 ['company_name', 'bedrijfsnaam'],
 ['kvk_kbo', 'KvK-nummer'],
 ['btw_nr', 'btw-nummer'],
 ['address', 'adres'],
 ['postal_code', 'postcode'],
 ['city', 'plaats'],
]) {
 test(`POST /api/recommand/company blokkeert ontbrekend veld: ${expectedMissing}`, () => {
  const profile = { ...completeProfile, [field]: '   ' };
  assert.deepEqual(missingRequiredCompanyFields(profile), [expectedMissing]);
 });
}

test('POST /api/recommand/company is idempotent: bestaande company maakt geen tweede company aan', () => {
 assert.equal(shouldCreateRecommandCompany({ ...completeProfile, recommand_company_id: null }), true);
 assert.equal(shouldCreateRecommandCompany({ ...completeProfile, recommand_company_id: 'c_existing' }), false);
});

test('Recommand webhook met ongeldige signature geeft 401-equivalent en bouwt geen DB-update', () => {
 const rawBody = JSON.stringify({ eventType: 'company.verification', companyId: 'c_123', status: 'verified' });
 assert.equal(verifyRecommandWebhookSignature(rawBody, 'sha256=' + '0'.repeat(64), 'test-secret'), false);
 const update = verifyRecommandWebhookSignature(rawBody, 'sha256=' + '0'.repeat(64), 'test-secret')
  ? buildRecommandWebhookUpdate(JSON.parse(rawBody))
  : null;
 assert.equal(update, null);
});

test('Recommand webhook met geldige signature zet recommand_verified op true', () => {
 const secret = 'test-secret';
 const rawBody = JSON.stringify({ eventType: 'company.verification', companyId: 'c_123', status: 'verified' });
 const signature = 'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
 assert.equal(verifyRecommandWebhookSignature(rawBody, signature, secret), true);
 const update = buildRecommandWebhookUpdate(JSON.parse(rawBody));
 assert.equal(update.success, true);
 assert.equal(update.ignored, false);
 assert.equal(update.companyId, 'c_123');
 assert.equal(update.verified, true);
 assert.equal(update.updatePayload.recommand_verified, true);
 assert.deepEqual(update.updatePayload.recommand_raw_response, {
  webhook: { eventType: 'company.verification', companyId: 'c_123', status: 'verified' },
 });
});
