#!/usr/bin/env node
/*
 * Shows exactly what Tranzak answers when asked about one payment request.
 * Run on the server:   node /var/www/mjnhealthcare/apps/api/scripts/tranzak-probe.js REQ26101113112OFDHLO
 *
 * Read-only: it signs in to Tranzak with the server's own keys and sends GET requests only.
 * It prints the shape of each answer with personal details and secrets masked.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const API_DIR = path.resolve(__dirname, '..');

const sh = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
function fromEnvFile(key) {
  try {
    const line = fs.readFileSync(path.join(API_DIR, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.trim().startsWith(key + '=')).pop();
    if (!line) return null;
    const v = line.slice(line.indexOf('=') + 1).trim();
    const quoted = v.match(/^(["'`])(.*)\1/);
    return quoted ? quoted[2] : v.replace(/\s*#.*$/, '').trim();
  } catch { return null; }
}
const pid = sh('pm2 pid mjn-api').split(/\s+/).filter((p) => /^\d+$/.test(p) && p !== '0')[0] || '';
function setting(key) {
  try {
    const entry = fs.readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0').find((e) => e.startsWith(key + '='));
    if (entry) return entry.slice(key.length + 1);
  } catch { /* fall through to the file */ }
  return fromEnvFile(key);
}

// Anything that could identify a person or act as a credential is replaced before printing.
const SENSITIVE = /name|phone|email|msisdn|payer|customer|token|key|secret|account|address|ip/i;
function mask(value, key = '') {
  if (Array.isArray(value)) return value.slice(0, 3).map((v) => mask(v, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mask(v, k)]));
  if (SENSITIVE.test(key) && value !== null && value !== '') return `<hidden ${typeof value}>`;
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return value.replace(/\?.*$/, '?…');
  return value;
}

(async () => {
  const requestId = process.argv[2];
  if (!requestId) { console.log('Give a Tranzak request reference, for example:\n  node apps/api/scripts/tranzak-probe.js REQ26101113112OFDHLO'); process.exit(1); }
  const baseUrl = setting('TRANZAK_BASE_URL') || 'https://dsapi.tranzak.me';
  const appId = setting('TRANZAK_APP_ID'); const appKey = setting('TRANZAK_APP_KEY');
  console.log(`Tranzak address: ${baseUrl}`);
  console.log(`App id: ${appId ? `set (${appId.length} characters)` : 'MISSING'}   App key: ${appKey ? `set (${appKey.length} characters, starts "${appKey.slice(0, 5)}…")` : 'MISSING'}`);
  console.log('A key that starts "SAND_" is a test key; live payments need a "PROD_" key.\n');

  const authRes = await fetch(`${baseUrl}/auth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, appKey }) });
  const auth = await authRes.json().catch(() => ({}));
  const token = auth?.data?.token;
  console.log(`Sign-in: HTTP ${authRes.status}, success=${auth?.success}, token ${token ? 'received' : 'NOT received'}${auth?.errorMsg ? `, message: ${auth.errorMsg}` : ''}`);
  if (auth?.data) console.log('Sign-in answer fields:', Object.keys(auth.data).join(', '));
  if (!token) { console.log('\nWithout a token nothing can be looked up. The app id / key are the likely cause.'); process.exit(1); }

  const id = encodeURIComponent(requestId);
  const tries = [
    ['details?requestId=', `${baseUrl}/xp021/v1/request/details?requestId=${id}`],
    ['request/<id>', `${baseUrl}/xp021/v1/request/${id}`],
    ['refresh-transaction-status', `${baseUrl}/xp021/v1/request/refresh-transaction-status?requestId=${id}`],
  ];
  for (const [label, url] of tries) {
    console.log(`\n── ${label} ──`);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* not JSON */ }
      console.log(`HTTP ${res.status}`);
      console.log(json ? JSON.stringify(mask(json), null, 2) : `Not JSON. First 300 characters: ${text.slice(0, 300)}`);
    } catch (e) {
      console.log(`Request failed: ${e.message}`);
    }
  }
  console.log('\nNothing was changed.');
})().catch((e) => { console.error('The probe stopped:', e.message); process.exit(1); });
