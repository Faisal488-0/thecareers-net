import crypto from 'node:crypto';
import { normalizeJob } from './skills/normalize-job.mjs';
import { scoreJob } from './skills/relevance-scorer.mjs';

const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const OIDC_AUDIENCE = 'thecareers-supabase';
const API_KEY = String(process.env.JOOBLE_KW_API_KEY || '').trim();
const KEYWORDS_OVERRIDE = String(process.env.JOOBLE_KEYWORDS || '').trim();
const LOCATION = String(process.env.JOOBLE_LOCATION || 'Kuwait').trim();
const RESULT_ON_PAGE = Math.max(10, Math.min(Number(process.env.JOOBLE_RESULTS || 50), 100));
let oidcToken = process.env.GITHUB_OIDC_TOKEN || '';

function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function fingerprint(job) {
  const raw = [job.title, job.company, job.location, job.url].map(v => clean(v).toLowerCase()).join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function defaultKeywords() {
  if (KEYWORDS_OVERRIDE) return KEYWORDS_OVERRIDE;
  const groups = [
    'engineer technician oil gas',
    'teacher school education',
    'HR administrator operations',
    'accountant finance',
    'sales marketing business development',
    'IT developer support',
    'healthcare nurse doctor',
    'driver operator logistics'
  ];
  const now = new Date();
  const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
  return groups[day % groups.length];
}

async function refreshOidcToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) {
    if (oidcToken) return oidcToken;
    throw new Error('GitHub OIDC environment is unavailable');
  }
  const separator = requestUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${requestUrl}${separator}audience=${encodeURIComponent(OIDC_AUDIENCE)}`, {
    headers: { Authorization: `Bearer ${requestToken}` }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.value) throw new Error(`Unable to obtain GitHub OIDC token (${res.status})`);
  oidcToken = body.value;
  return oidcToken;
}

async function bridge(action, payload = {}) {
  const token = oidcToken || await refreshOidcToken();
  let res = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  if (res.status === 401) {
    const fresh = await refreshOidcToken();
    res = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${fresh}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
  }
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok || data?.error) throw new Error(String(data?.error || `${res.status} ${text.slice(0, 300)}`));
  return data;
}

function mapJob(row) {
  return {
    title: clean(row?.title),
    company: clean(row?.company),
    location: clean(row?.location) || 'Kuwait',
    employment_type: clean(row?.type),
    category: null,
    description: clean(row?.snippet),
    published_at: clean(row?.updated) || null,
    url: clean(row?.link),
    source_name: 'Jooble Kuwait API',
    score: 0,
    verified: false
  };
}

async function main() {
  if (!API_KEY) throw new Error('JOOBLE_KW_API_KEY is missing');
  await refreshOidcToken();

  const keywords = defaultKeywords();
  const endpoint = `https://kw.jooble.org/api/${encodeURIComponent(API_KEY)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      keywords,
      location: LOCATION,
      radius: '80',
      page: 1,
      ResultOnPage: RESULT_ON_PAGE,
      SearchMode: 0,
      companysearch: false
    }),
    signal: AbortSignal.timeout(30000)
  });

  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; }
  catch { throw new Error('Jooble returned invalid JSON'); }
  if (!res.ok) throw new Error(`Jooble API failed (${res.status}) ${clean(payload?.error || text).slice(0, 250)}`);

  const rows = Array.isArray(payload?.jobs) ? payload.jobs : [];
  const normalized = rows
    .map(mapJob)
    .map(raw => {
      const job = normalizeJob(raw, { location: 'Kuwait', sourceName: 'Jooble Kuwait API' });
      if (!job.title || !job.company || !job.url) return null;
      return {
        ...job,
        source_id: null,
        fingerprint: fingerprint(job),
        score: scoreJob(job),
        status: 'active',
        found_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  const unique = [...new Map(normalized.map(job => [job.fingerprint, job])).values()];
  if (!unique.length) {
    console.log(`JOOBLE_KW_API_OK keywords=${JSON.stringify(keywords)} fetched=${rows.length} submitted=0`);
    return;
  }

  const result = await bridge('upsert_jobs', { rows: unique });
  const stored = Number(result?.count ?? unique.length);
  const skipped = Number(result?.skipped_invalid || 0);
  console.log(`JOOBLE_KW_API_OK keywords=${JSON.stringify(keywords)} fetched=${rows.length} submitted=${unique.length} stored=${stored} skipped_invalid=${skipped}`);
}

main().catch(error => {
  console.error(`JOOBLE_KW_API_FAILED ${String(error?.message || error)}`);
  process.exitCode = 1;
});
