import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadRoute(path, dependencies = {}, env = {}) {
 const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
 const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 const exports = {};
 const next = { NextResponse: { json: (body, init = {}) => ({ status: init.status || 200, body }) } };
 vm.runInNewContext(output, { exports, process: { env }, console, Buffer, Date,
  require: (id) => {
   if (id === 'next/server') return next;
   if (id in dependencies) return dependencies[id];
   throw new Error(`Unexpected dependency ${id}`);
  },
 });
 return exports;
}

test('P0-01: obsolete auth callback rejects hostile input without loading any privileged dependency', async () => {
 const route = loadRoute('app/api/webhooks/auth/route.ts');
 for (const body of [{ record: { id: 'victim', email: 'attacker@example.invalid' } }, {}, null]) {
  const response = await route.POST({ json: async () => body });
  assert.equal(response.status, 401);
 }
});

test('P0-02: automatically confirmed legacy identity cannot accept a team invitation', async () => {
 let touchedAdmin = false;
 const route = loadRoute('app/api/account/members/route.ts', {
  '@/lib/supabase-server': {
   createServerSupabase: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user', email: 'invite@example.invalid', email_confirmed_at: '2026-09-13T10:00:00Z' } } }) } }),
   createAdminSupabase: () => { touchedAdmin = true; throw new Error('must not mutate'); },
  },
  '@/lib/monitoring-access': {},
 });
 const result = await route.PATCH({ json: async () => ({ id: 'invite' }) });
 assert.equal(result.status, 403);
 assert.equal(touchedAdmin, false);
});

test('P0-05: denied or unavailable database budget never invokes Gemini', async () => {
 for (const [budget, expected] of [['no_credit',402], ['rate_limited',429], [null,503]]) {
  let parsed = false;
  const route = loadRoute('app/api/convert/route.ts', {
   '../../../lib/supabase-server': {
    createServerSupabase: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) } }),
    createAdminSupabase: () => ({ rpc: async () => ({ data: budget, error: budget === null ? { message: 'offline' } : null }) }),
   },
   '../../../lib/invoice-parser': { parseInvoicePDF: () => { parsed=true; throw new Error('must not parse'); } },
   '../../../lib/conversion-drafts': {},
   '../../../lib/document-credit': { documentCreditExhaustedBody: () => ({ error: 'credits' }) },
  });
  const result = await route.POST({ formData: async () => ({ get: () => ({ type: 'application/pdf', size: 100, arrayBuffer: () => { throw new Error('must not read bytes'); } }) }) });
  assert.equal(result.status, expected);
  assert.equal(parsed,false);
 }
});

test('P0-08: contact rejects malformed input and stops before insert on quota denial', async () => {
 const crypto = await import('node:crypto');
 let inserted = false;
 const route = loadRoute('app/api/contact/route.ts', {
  'node:crypto': crypto,
  '@/lib/supabase-server': { createAdminSupabase: () => ({ rpc: async () => ({ data: 'rate_limited', error: null }), from: () => { inserted=true; throw new Error('must not insert'); } }) },
 }, { SUPABASE_SERVICE_ROLE_KEY: 'test-fixture-only' });
 assert.equal((await route.POST({ text: async () => '{' })).status,400);
 assert.equal((await route.POST({ text: async () => JSON.stringify({ name:'Audit',email:'invalid',message:'test' }) })).status,400);
 assert.equal((await route.POST({ text: async () => JSON.stringify({ name:'Audit',email:'audit@example.invalid',message:'test' }) })).status,429);
 assert.equal(inserted,false);
});

test('P0-04: a lost submission claim never calls the provider or releases another worker credit', async () => {
 let submitted=false, released=false;
 const target={id:'target',user_id:'user',ubl_xml:'fixture',total_amount:10};
 const chain=(result)=>{
  const q={select:()=>q,eq:()=>q,single:async()=>result,maybeSingle:async()=>result};return q;
 };
 const publicClient={auth:{getUser:async()=>({data:{user:{id:'user'}}})},from:(table)=>chain({data:table==='user_profiles'?{recommand_company_id:'company',recommand_verified:true}:target,error:null})};
 const route=loadRoute('app/api/recommand/send/route.ts',{
  '@/lib/supabase-server':{createServerSupabase:async()=>publicClient,createAuthenticatedSupabase:async()=>({user:{id:'user'},supabase:publicClient}),createAdminSupabase:()=>({rpc:(name)=>{
   if(name==='claim_recommand_send_with_credit') return chain({data:{claimed:true,claim_action:'claimed',reservation_id:'reservation',claim_token:'token',send_credits:2},error:null});
   if(name==='begin_recommand_submission') return Promise.resolve({data:false,error:null});
   if(name==='release_recommand_reservation') released=true;
   throw new Error('Unexpected RPC');
  }})},
  '@/lib/recommand':{verifyRecipient:async()=>({isValid:true}),verifyRecipientSupportsInvoice:async()=>({isValid:true}),sendDocument:async()=>{submitted=true;throw new Error('must not send');}},
  '@/lib/recommand-credit-note':{validateRecommandCreditNoteDocument:()=>[]},
  '@/lib/recommand-invoice':{validateRecommandInvoiceDocument:()=>[]},
  '@/lib/ubl-to-recommand':{buildRecommandPayloadFromUbl:()=>({recipient:'0106:12345678',documentType:'invoice',document:{invoiceNumber:'INV-1'}})},
  '@/lib/invoice-preview':{validateStoredInvoiceConsistency:()=>({ok:true})},
  '@/lib/recommand-send-outcome':{},
  '@/lib/superseded':{isSuperseded:()=>false,SUPERSEDED_SEND_BLOCKED_MESSAGE:'Deze factuur is achterhaald.'},
 });
 const result=await route.POST({json:async()=>({conversionId:'target'})});
 assert.equal(result.status,409);
 assert.equal(submitted,false);
 assert.equal(released,false);
});
