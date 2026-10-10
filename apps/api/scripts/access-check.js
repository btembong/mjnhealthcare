#!/usr/bin/env node
/*
 * Read-only check of the API's access rules against a running server.
 * Run on the server from apps/api:   node scripts/access-check.js
 *
 * Signs 5-minute test logins with the server's own JWT secret, sends GET requests only,
 * and prints status codes. It changes no data and prints no personal information.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { JwtService } = require(path.join(process.cwd(), 'node_modules/@nestjs/jwt'));

const crypto = require('crypto');
const sh = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

// Every value a key takes in an env file (a key defined twice is a common cause of confusion).
function fromEnvFile(file, key) {
  try {
    return fs.readFileSync(file, 'utf8').split(/\r?\n/)
      .filter((l) => l.trim().startsWith(key + '='))
      .map((line) => {
        const v = line.slice(line.indexOf('=') + 1).trim();
        const quoted = v.match(/^(["'`])(.*)\1/);
        return quoted ? quoted[2] : v.replace(/\s*#.*$/, '').trim();
      })
      .filter(Boolean);
  } catch { return []; }
}

// The live process: its pid, working directory, start-up environment and listening port.
const pid = sh('pm2 pid mjn-api').split(/\s+/).filter((p) => /^\d+$/.test(p) && p !== '0')[0] || '';
const procCwd = pid ? sh(`readlink /proc/${pid}/cwd`) : '';
function fromProcEnv(key) {
  try {
    const entry = fs.readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0').find((e) => e.startsWith(key + '='));
    return entry ? entry.slice(key.length + 1) : null;
  } catch { return null; }
}
const listening = pid ? (sh('ss -ltnpH').split('\n').filter((l) => l.includes(`pid=${pid},`)).map((l) => (l.match(/:(\d+)\s/) || [])[1]).filter(Boolean)) : [];

const port = listening[0] || fromProcEnv('PORT') || process.env.PORT || fromEnvFile('.env', 'PORT').pop() || 3000;
const base = `http://localhost:${port}/api/v1`;

async function call(token, urlPath) {
  const res = await fetch(base + urlPath, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, text, json };
}

const fingerprint = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);

async function findSecret() {
  const candidates = [];
  const add = (source, value) => { if (value) candidates.push([source, value]); };
  add('the running process start-up environment', fromProcEnv('JWT_SECRET'));
  if (procCwd) fromEnvFile(path.join(procCwd, '.env'), 'JWT_SECRET').forEach((v, i) => add(`${procCwd}/.env (entry ${i + 1})`, v));
  fromEnvFile('.env', 'JWT_SECRET').forEach((v, i) => add(`apps/api/.env (entry ${i + 1})`, v));
  fromEnvFile('../../.env', 'JWT_SECRET').forEach((v, i) => add(`repo root .env (entry ${i + 1})`, v));
  add('this shell', process.env.JWT_SECRET);

  const tried = [];
  for (const [source, secret] of candidates) {
    const jwt = new JwtService({ secret });
    const probe = jwt.sign({ sub: 'access-check-admin', role: 'ADMIN' }, { expiresIn: 300 });
    const r = await call(probe, '/persons/me');
    tried.push(`  ${source}: ${secret.length} chars, fingerprint ${fingerprint(secret)} -> ${r.status}`);
    if (r.status !== 401) return { source, jwt };
  }
  console.log('Could not find the JWT secret the running server uses.\n');
  console.log(`mjn-api pid: ${pid || 'not found'}`);
  console.log(`working directory: ${procCwd || 'unknown'}`);
  console.log(`listening on port(s): ${listening.join(', ') || 'unknown'}  (checked ${base})`);
  console.log('secrets tried (fingerprints only, never the secret itself):');
  console.log(tried.join('\n') || '  none found');
  const anon = await call(null, '/persons/me');
  console.log(`no-login request to ${base}/persons/me -> ${anon.status} ${anon.text.slice(0, 120)}`);
  return null;
}

(async () => {
  const found = await findSecret();
  if (!found) process.exit(3);
  console.log(`Server at ${base} accepts logins signed with the secret from: ${found.source}\n`);
  const token = (sub, role) => found.jwt.sign({ sub, role }, { expiresIn: 300 });

  let fail = 0;
  let count = 0;
  async function check(label, tok, urlPath, expected, noHash) {
    count += 1;
    const r = await call(tok, urlPath);
    let ok = r.status === expected;
    let note = '';
    if (ok && noHash && r.text.includes('passwordHash')) { ok = false; note = ' (password field present!)'; }
    if (!ok) { fail += 1; note += '  ' + JSON.stringify(r.json?.message ?? '').slice(0, 140); }
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${r.status} (expected ${expected})${note}`);
  }

  const admin = token('access-check-admin', 'ADMIN');
  const finance = token('access-check-finance', 'FINANCE');
  const consultant = token('access-check-consultant', 'CONSULTANT');
  const officer = token('access-check-officer', 'PROCESSING_OFFICER');

  const rPeople = await call(admin, '/persons?role=CANDIDATE');
  const rEngs = await call(admin, '/engagements');
  const people = Array.isArray(rPeople.json) ? rPeople.json : [];
  const engs = Array.isArray(rEngs.json) ? rEngs.json : [];
  const a = people[0]?.id;
  const b = people[1]?.id;
  const otherEng = engs.find((e) => e.personId !== a)?.id;
  const assignedEng = engs.find((e) => e.consultantId)?.id;
  const client = a ? token(a, 'CANDIDATE') : null;
  console.log(`Found ${people.length} client account(s) and ${engs.length} case(s) to test with.\n`);

  await check('no login is rejected', null, '/persons', 401);

  for (const [label, p, noHash] of [
    ['lists people, no password field', '/persons', true], ['lists all cases', '/engagements'], ['lists all orders', '/orders/admin'],
    ['sees document queue', '/documents'], ['sees finance reports', '/reports/finance'], ['sees payment stats', '/admin/payments/stats'],
    ['sees pending AI drafts', '/ai/drafts/pending'], ['sees audit log', '/compliance/audit-log'], ['lists officers', '/admin/officers'],
  ]) await check('admin ' + label, admin, p, 200, noHash);

  for (const p of ['/reports/finance', '/admin/payments/stats', '/persons', '/credits/admin/wallets']) await check('finance can open ' + p, finance, p, 200);
  await check('finance cannot see audit log', finance, '/compliance/audit-log', 403);

  for (const p of ['/persons', '/engagements', '/documents', '/orders/admin', '/ai/drafts/pending']) await check('consultant can open ' + p, consultant, p, 200);
  for (const p of ['/reports/finance', '/admin/payments/stats', '/compliance/audit-log']) await check('consultant cannot open ' + p, consultant, p, 403);
  if (assignedEng) await check("consultant cannot open a case assigned to someone else", consultant, '/engagements/' + assignedEng, 403);

  for (const p of ['/officer/my-cases', '/persons', '/documents']) await check('officer can open ' + p, officer, p, 200);
  await check('officer cannot see finance reports', officer, '/reports/finance', 403);

  if (!client) console.log('SKIP  no client accounts found, client checks skipped');
  else {
    await check('client reads own record, no password field', client, '/persons/' + a, 200, true);
    await check('client reads own orders', client, '/orders/person/' + a, 200);
    await check('client reads own cases', client, '/engagements/client/' + a, 200);
    await check('client reads own bookings', client, '/bookings/person/' + a, 200);
    for (const p of ['/persons', '/engagements', '/orders/admin', '/documents', '/reports/finance', '/admin/payments/stats',
      '/ai/drafts/pending', '/compliance/audit-log', '/admin/officers', '/academy/courses/admin', '/bookings/admin',
      '/credits/admin/wallets', '/officer/my-cases', '/blog/admin/all', '/staffing/admin/applications'])
      await check('client cannot open ' + p, client, p, 403);
    if (b) for (const p of ['/persons/', '/orders/person/', '/documents/person/', '/engagements/client/', '/bookings/person/',
      '/academy/study-plan/', '/ai/study-conversation/'])
      await check(`client cannot read another person's ${p}`, client, p + b, 403);
    if (otherEng) for (const p of ['/engagements/' + otherEng, '/messages/engagement/' + otherEng, '/orders/engagement/' + otherEng,
      '/engagements/' + otherEng + '/tracking'])
      await check("client cannot open another's case " + p.replace(otherEng, ':id'), client, p, 403);
  }

  console.log(`\n${count - fail} of ${count} checks passed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('CHECK CRASHED:', e.message);
  process.exit(2);
});
