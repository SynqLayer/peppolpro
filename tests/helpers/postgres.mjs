import { execFile } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { hostname } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const owner = 'peppolpro-p1-audit';
function execute(args, { input, timeout = 60000, includeStderr = false } = {}) {
 return new Promise((resolve, reject) => {
  const child = execFile('docker', args, { encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
   if (error) { error.stdout = stdout; error.stderr = stderr; reject(error); } else resolve(includeStderr ? stdout + stderr : stdout);
  });
  child.stdin.on('error', () => {}); // Completion callback reports command/connection failures.
  child.stdin.end(input);
 });
}
function processExists(pid) {
 try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}
export function isPostgresInfraError(error) {
 if (error?.code === 'ERR_ASSERTION') return false;
 const text = `${error?.message || ''}\n${error?.stderr || ''}`;
 return error?.infra === true || error?.code === 'ENOENT' || /psql: error: connection to server|could not connect to server|Cannot connect to the Docker daemon|error during connect|port is already allocated|address already in use|network is unreachable|TLS handshake timeout|dial tcp.*timeout/i.test(text);
}
async function cleanupStaleContainers() {
 const names = (await execute(['ps','-a','--filter','name=peppolpro-p1-','--format','{{.Names}}'])).trim().split('\n').filter(Boolean);
 for (const name of names) {
  if (!/^peppolpro-p1-[a-z-]+-test-\d+(?:-\d+)?$/.test(name)) continue;
  const details = JSON.parse(await execute(['inspect',name]))[0];
  const labels = details.Config.Labels || {};
  const pid = Number(labels['audit.pid'] || name.match(/-test-(\d+)/)?.[1]);
  const owned = labels['audit.owner'] === owner && labels['audit.host'] === hostname();
  const legacy = !labels['audit.owner'] && /^peppolpro-p1-(billing|idempotency)-test-\d+$/.test(name);
  if ((owned || legacy) && pid && !processExists(pid)) await execute(['rm','--force',name]);
 }
}

export async function withPostgres(label, callback) {
 let infraFailures = 0;
 const failures = [];
 for (let attempt = 1; attempt <= 3; attempt++) {
  const name = `peppolpro-p1-${label}-test-${process.pid}-${attempt}`;
  // Each container has its own isolated network namespace. This port is free in
  // that namespace; no host port is published and no host socket is reused.
  const port = String(randomInt(20000, 60000));
  let created = false;
  let starting = true;
  try {
   await cleanupStaleContainers();
   await execute(['run','--detach','--rm','--name',name,'--label',`audit.owner=${owner}`,'--label',`audit.host=${hostname()}`,'--label',`audit.pid=${process.pid}`,
    '--network','none','--tmpfs','/var/lib/postgresql/data','--env','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17','-p',port]);
   created = true;
   const args = ['exec','-i',name,'psql','-h','127.0.0.1','-p',port,'-X','-U','postgres','-v','ON_ERROR_STOP=1','-At'];
   const deadline = Date.now() + 60000;
   let ready = false;
   let lastError;
   while (Date.now() < deadline) {
    try {
     // TCP rejects the image's temporary initialization server, which listens
     // only on a Unix socket and is stopped again before normal startup.
     await execute(['exec',name,'pg_isready','-h','127.0.0.1','-p',port,'-U','postgres'], { timeout: 3000 });
     const result = await execute([...args,'-c','select 1'], { timeout: 3000 });
     if (result.trim() === '1') { ready = true; break; }
     lastError = new Error('readiness query returned an unexpected result');
    } catch (error) { lastError = error; }
    await delay(250);
   }
   if (!ready) throw Object.assign(new Error(`PostgreSQL startup timed out after 60 seconds: ${lastError?.message || ''}`), { infra: true });
   starting = false;
   console.log(`POSTGRES_READY ${label} attempt=${attempt} infra_failures=${infraFailures}`);
   const db = {
    query: (sql) => execute(args, { input: sql }),
    command: (sql) => execute([...args,'-c',sql]),
   };
   await callback(db);
   console.log(`POSTGRES_COMPLETE ${label} infra_failures=${infraFailures}`);
   return;
  } catch (error) {
   const logs = created ? await execute(['logs','--tail','100',name], { includeStderr: true }).catch(logError => `${logError.stdout || ''}\n${logError.stderr || ''}`) : 'container did not start';
   const detail = `${error.message}\n${error.stderr || ''}\nContainer logs:\n${logs}`;
   if (!starting && !isPostgresInfraError(error)) throw Object.assign(new Error(detail, { cause: error }), { code: error.code });
   infraFailures++;
   failures.push(detail);
   console.error(`INFRA_RETRY ${label} attempt=${attempt}/3\n${detail}`);
   if (attempt === 3) throw Object.assign(new Error(`INFRA: PostgreSQL failed after 3 attempts\n${failures.join('\n--- attempt ---\n')}`), { infra: true });
  } finally {
   if (created) await execute(['rm','--force',name]);
  }
 }
 throw new Error('INFRA: PostgreSQL test did not execute');
}
