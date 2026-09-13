import test from 'node:test';
import assert from 'node:assert/strict';
import { amountInCents, normalizePaymentAdjustments, adjustmentEventSuffix } from '../lib/mollie-adjustments.ts';

test('P0-03: completed refund objects change the event identity even while payment status stays paid',()=>{
 const refund={id:'re_Fixture',paymentId:'tr_Fixture',status:'refunded',amount:{currency:'EUR',value:'4.50'}};
 const rows=normalizePaymentAdjustments('tr_Fixture',[refund],[]);
 assert.deepEqual(rows,[{key:'refund:re_Fixture',kind:'refund',cents:450}]);
 assert.notEqual(adjustmentEventSuffix(rows),adjustmentEventSuffix([]));
 assert.equal(adjustmentEventSuffix(normalizePaymentAdjustments('tr_Fixture',[refund,refund],[])),adjustmentEventSuffix(rows));
 assert.deepEqual(normalizePaymentAdjustments('tr_Fixture',[{...refund,status:'queued'}],[]),[]);
 assert.throws(()=>normalizePaymentAdjustments('tr_Other',[refund],[]),/identity mismatch/);
 assert.equal(amountInCents({currency:'EUR',value:'0.29'}),29);
 assert.throws(()=>amountInCents({currency:'USD',value:'4.50'}),/Invalid provider amount/);
});

test('P0-03: chargebacks and their reversal have separate idempotency keys and signed amounts',()=>{
 assert.deepEqual(normalizePaymentAdjustments('tr_Fixture',[],[{id:'chb_Test',paymentId:'tr_Fixture',reversedAt:'2026-09-13',amount:{currency:'EUR',value:'9.00'}}]),[
  {key:'chargeback:chb_Test',kind:'chargeback',cents:900},
  {key:'chargeback:chb_Test:reversed',kind:'chargeback_reversed',cents:-900},
 ]);
});
