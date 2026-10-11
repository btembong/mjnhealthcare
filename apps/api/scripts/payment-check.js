#!/usr/bin/env node
/*
 * Read-only check of what Tranzak and Stripe say about recent payments.
 * Run on the server from any folder:   node /var/www/mjnhealthcare/apps/api/scripts/payment-check.js
 * Optional: a number of payments to look at (default 8), e.g.  ... payment-check.js 15
 *
 * For each recent order or consultation that has a payment reference, it asks the running
 * server to look the payment up with the provider (the same "Check" button the Payments page
 * has) and prints the answer next to what our own records say.
 *
 * It changes nothing: nothing is confirmed, cancelled or refunded. It prints no names,
 * emails or phone numbers — only ids, amounts and statuses.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const API_DIR = path.resolve(__dirname, '..');
const { JwtService } = require(path.join(API_DIR, 'node_modules/@nestjs/jwt'));

const sh = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
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
const pid = sh('pm2 pid mjn-api').split(/\s+/).filter((p) => /^\d+$/.test(p) && p !== '0')[0] || '';
function fromProcEnv(key) {
  try {
    const entry = fs.readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0').find((e) => e.startsWith(key + '='));
    return entry ? entry.slice(key.length + 1) : null;
  } catch { return null; }
}
const listening = pid ? sh('ss -ltnpH').split('\n').filter((l) => l.includes(`pid=${pid},`)).map((l) => (l.match(/:(\d+)\s/) || [])[1]).filter(Boolean) : [];
const port = listening[0] || fromProcEnv('PORT') || fromEnvFile(path.join(API_DIR, '.env'), 'PORT').pop() || 3000;
const base = `http://localhost:${port}/api/v1`;

async function call(token, method, urlPath, body) {
  const res = await fetch(base + urlPath, {
    method,
    headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text };
}

async function adminToken() {
  const secrets = [fromProcEnv('JWT_SECRET'), ...fromEnvFile(path.join(API_DIR, '.env'), 'JWT_SECRET'), ...fromEnvFile(path.join(API_DIR, '../../.env'), 'JWT_SECRET'), process.env.JWT_SECRET].filter(Boolean);
  for (const secret of secrets) {
    const token = new JwtService({ secret }).sign({ sub: 'payment-check-admin', role: 'ADMIN' }, { expiresIn: 300 });
    if ((await call(token, 'GET', '/admin/payments/stats')).status === 200) return token;
  }
  return null;
}

const short = (s, n = 26) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
const pad = (s, n) => String(s ?? '').padEnd(n);

(async () => {
  const limit = Math.min(40, Math.max(1, Number(process.argv[2]) || 8));
  console.log(`Server: ${base}   (mjn-api pid ${pid || 'not found'})`);
  // Which provider accounts the running server is set up for — presence only, never the values.
  const has = (key) => (fromProcEnv(key) || fromEnvFile(path.join(API_DIR, '.env'), key).pop() ? 'set' : 'MISSING');
  console.log(`Tranzak app id: ${has('TRANZAK_APP_ID')}   Tranzak app key: ${has('TRANZAK_APP_KEY')}   Tranzak address: ${fromProcEnv('TRANZAK_BASE_URL') || fromEnvFile(path.join(API_DIR, '.env'), 'TRANZAK_BASE_URL').pop() || 'default (dsapi.tranzak.me)'}`);
  console.log(`Stripe secret key: ${has('STRIPE_SECRET_KEY')}   Stripe notice secret: ${has('STRIPE_WEBHOOK_SECRET')}\n`);

  const token = await adminToken();
  if (!token) { console.log('Could not sign in to the running server. Run access-check.js to see why.'); process.exit(1); }

  // Is the automatic check (every ten minutes) running, and what did its last run do?
  const stats = await call(token, 'GET', '/admin/payments/stats');
  const auto = stats.json && stats.json.autoCheck;
  if (!auto) console.log('Automatic check: this server version does not report it.');
  else if (!auto.enabled) console.log('Automatic check: SWITCHED OFF on this server (PAYMENT_AUTO_CHECK=off).');
  else if (!auto.lastRun) console.log('Automatic check: on, but it has not run since the server started. It runs about a minute after start-up, then every 10 minutes.');
  else {
    const r = auto.lastRun;
    const minutes = Math.round((Date.now() - new Date(r.at).getTime()) / 60000);
    console.log(`Automatic check: last ran ${minutes} min ago. ${r.looked} looked up, ${r.confirmed} confirmed as paid, ${r.closed} closed unpaid, ${r.unreachable} could not be looked up${r.stoppedEarly ? ' (provider unreachable, stopped early)' : ''}.`);
  }
  console.log('');

  const list = await call(token, 'GET', '/admin/payments');
  if (list.status !== 200 || !Array.isArray(list.json)) { console.log(`The payments list could not be read (status ${list.status}).`); process.exit(1); }
  const all = list.json;
  const count = (state) => all.filter((p) => p.state === state).length;
  console.log(`${all.length} payments on record: ${count('paid') + count('part_refunded')} paid, ${count('waiting')} waiting, ${count('checking')} need checking, ${count('cancelled')} cancelled unpaid, ${count('refunded')} refunded.`);
  const withRef = all.filter((p) => p.attempts && p.attempts.length > 0);
  console.log(`${withRef.length} of them have a payment reference from Tranzak or Stripe. Looking up the ${Math.min(limit, withRef.length)} most recent.\n`);
  if (withRef.length === 0) { console.log('Nothing to look up: no client has started a payment through Tranzak or Stripe yet.'); return; }

  console.log(`${pad('Type', 13)}${pad('Our record', 16)}${pad('Provider', 9)}${pad('Provider says', 22)}${pad('Amount', 16)}${pad('Agrees?', 28)}Reference`);
  let disagree = 0; let unreachable = 0;
  for (const p of withRef.slice(0, limit)) {
    const attempt = p.attempts[0];
    const r = await call(token, 'POST', `/admin/payments/${p.kind}/${p.id}/check`, { ref: attempt.ref });
    let says; let amount = ''; let verdict;
    if (r.status === 200 && r.json) {
      says = r.json.paid ? 'PAID' : r.json.status ? String(r.json.status) : 'no record';
      amount = r.json.amount != null ? `${r.json.amount} ${r.json.currency ?? ''}` : '';
      const weSayPaid = ['paid', 'part_refunded', 'refunded'].includes(p.state);
      if (r.json.paid && !weSayPaid) { verdict = 'NO - provider paid, we did not'; disagree++; }
      else if (!r.json.paid && weSayPaid) { verdict = 'NO - we say paid, provider not'; disagree++; }
      else verdict = 'yes';
    } else {
      says = `lookup failed (${r.status})`;
      verdict = short((r.json && r.json.message) || r.text || '', 27);
      unreachable++;
    }
    console.log(`${pad(p.kind, 13)}${pad(p.state, 16)}${pad(attempt.provider, 9)}${pad(short(says, 21), 22)}${pad(amount, 16)}${pad(verdict, 28)}${short(attempt.ref, 30)}${attempt.checkedAt ? '  (auto-checked)' : ''}`);
  }

  console.log('');
  if (unreachable) console.log(`${unreachable} lookup(s) failed. If all of them failed for one provider, that provider's keys or address are the likely cause.`);
  if (disagree) console.log(`${disagree} payment(s) where the provider and our records disagree. "Provider paid, we did not" is money received that was never confirmed: open it on the Payments page and use Record as paid.`);
  if (!unreachable && !disagree) console.log('Every payment looked up agrees with the provider.');
  console.log('Nothing was changed.');
})().catch((e) => { console.error('The check stopped:', e.message); process.exit(1); });
