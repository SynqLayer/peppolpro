import test from 'node:test';
import assert from 'node:assert/strict';
import { isPostgresInfraError } from './helpers/postgres.mjs';
test('harness classifies connection and startup failures as INFRA', () => {
 assert.equal(isPostgresInfraError(new Error('psql: error: connection to server on socket failed')), true);
 assert.equal(isPostgresInfraError(Object.assign(new Error('startup timeout'), { infra: true })), true);
});
test('harness never retries assertions or SQL correctness errors as INFRA', () => {
 assert.equal(isPostgresInfraError(Object.assign(new Error('connection to server was expected'), { code: 'ERR_ASSERTION' })), false);
 assert.equal(isPostgresInfraError(new Error('ERROR: duplicate key violates unique constraint')), false);
 assert.equal(isPostgresInfraError(new Error('ERROR: syntax error at or near RETURN')), false);
});
