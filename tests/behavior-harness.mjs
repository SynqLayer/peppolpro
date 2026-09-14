import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

export function loadTsModule(path, dependencies = {}, options = {}) {
 const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
 const output = ts.transpileModule(source, {
  compilerOptions: {
   module: ts.ModuleKind.CommonJS,
   target: ts.ScriptTarget.ES2022,
   jsx: ts.JsxEmit.ReactJSX,
   esModuleInterop: true,
  },
 }).outputText;
 const exports = {};
 const context = {
  exports,
  module: { exports },
  process: { env: options.env || {} },
  console: options.console || console,
  Buffer,
  Date: options.Date || Date,
  Intl,
  URL,
  URLSearchParams,
  fetch: options.fetch || globalThis.fetch,
  setTimeout,
  clearTimeout,
  require(id) {
   if (Object.hasOwn(dependencies, id)) return dependencies[id];
   throw new Error(`Unexpected dependency ${id} while loading ${path}`);
  },
  ...options.globals,
 };
 vm.runInNewContext(output, context, { filename: path });
 return context.module.exports;
}

export const nextServer = {
 NextResponse: { json: (body, init = {}) => Response.json(body, init) },
};

export function query(result = { data: null, error: null }, trace = [], table = '') {
 const q = new Proxy({}, {
  get(_target, prop) {
   if (prop === 'then') return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
   return (...args) => {
    trace.push({ table, method: String(prop), args });
    if (['single', 'maybeSingle'].includes(String(prop))) return Promise.resolve(result);
    return q;
   };
  },
 });
 return q;
}

export function createDbClient(results = {}, trace = []) {
 return {
  trace,
  auth: results.auth || { getUser: async () => ({ data: { user: null } }) },
  from(table) { trace.push({ table, method: 'from', args: [] }); return query(results[table] || { data: null, error: null }, trace, table); },
  rpc(name, args) { trace.push({ table: null, method: 'rpc', args: [name, args] }); return query(results[`rpc:${name}`] || { data: null, error: null }, trace, `rpc:${name}`); },
  storage: { from(bucket) { trace.push({ table: bucket, method: 'storage.from', args: [] }); return { upload: async (...args) => { trace.push({ table: bucket, method: 'upload', args }); return { error: null }; } }; } },
 };
}
