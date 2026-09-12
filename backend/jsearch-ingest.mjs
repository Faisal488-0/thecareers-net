import crypto from 'node:crypto';
import { normalizeJob } from './skills/normalize-job.mjs';
import { scoreJob } from './skills/relevance-scorer.mjs';

const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const OIDC_AUDIENCE = 'thecareers-supabase';
const API_URL = 'https://api.openwebninja.com/jsearch/search-v2';
const API_KEY = String(process.env.JSEARCH_API_KEY || '').trim();
const COUNTRY = String(process.env.JSEARCH_COUNTRY || 'kw').trim();
const LANGUAGE = String(process.env.JSEARCH_LANGUAGE || 'en').trim();
const QUERY_OVERRIDE = String(process.env.JSEARCH_QUERY || '').trim();

let oidcToken = process.env.GITHUB_OIDC_TOKEN || '';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function fingerprint(job) {
  const raw = [job.title, job.company, job.location, job.url]
    .map(v => clean(v).toLowerCase())
    .join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function defaultQuery() {
  if (QUERY_OVERRIDE) return QUERY_OVERRIDE;
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour < 12) return 'jobs in Kuwait';
  const specialist = [
    'teacher school education jobs in Kuwait',
    'oil gas engineering technician jobs in Kuwait',
    'HR administration operations jobs in Kuwait',
    'accounting finance jobs in Kuwait',
    'IT software support jobs in Kuwait',
    'sales marketing business development jobs in Kuwait',
    'healthcare medical jobs in Kuwait',
    'logistics driver operator jobs in Kuwait'
  ];
  const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
  return specialist[day % specialist.length];
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

function bestApplyLink(row) {
  const options = Array.isArray(row?.apply_options) ? row.apply_options : [];
  const direct = options.find(option => option?.is_direct && /^https?:\/\//i.test(clean(option?.apply_link)));
  const firstValid = options.find(option => /^https?:\/\//i.test(clean(option?.apply_link)));
  return clean(direct?.apply_link || row?.job_apply_link || firstValid?.apply_link || row?.job_google_link);
}

function mapJob(row) {
  return {
    title: clean(row?.job_title),
    company: clean(row?.employer_name),
    location: clean(row?.job_location) || clean([row?.job_city, row?.job_state, row?.job_country].filter(Boolean).join(', ')) || 'Kuwait',
    employment_type: clean(row?.job_employment_type),
    category: clean(row?.job_function) || clean(row?.industry),
    description: clean(row?.job_description),
    published_at: clean(row?.job_posted_at_datetime_utc) || null,
    url: bestApplyLink(row),
    source_name: 'JSearch API',
    score: 0,
    verified: Boolean(row?.job_apply_is_direct || (Array.isArray(row?.apply_options) && row.apply_options.some(option => option?.is_direct))),
    country: clean(row?.job_country) || 'KW',
    salary_min: Number.isFinite(Number(row?.job_min_salary)) ? Number(row.job_min_salary) : null,
    salary_max: Number.isFinite(Number(row?.job_max_salary)) ? Number(row.job_max_salary) : null,
    currency: clean(row?.job_salary_currency || row?.job_salary?.currency) || null
  };
}

async function main() {
  if (!API_KEY) throw new Error('JSEARCH_API_KEY is missing');
  await refreshOidcToken();

  const query = defaultQuery();
  const url = new URL(API_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('country', COUNTRY);
  url.searchParams.set('language', LANGUAGE);
  url.searchParams.set('date_posted', 'week');

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY, accept: 'application/json' },
    signal: AbortSignal.timeout(30000)
  });
  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; }
  catch { throw new Error('JSearch returned invalid JSON'); }
  if (!res.ok || String(payload?.status || '').toUpperCase() === 'ERROR') {
    throw new Error(`JSearch API failed (${res.status}) ${clean(payload?.message || payload?.error || text).slice(0, 250)}`);
  }

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const normalized = rows
    .map(mapJob)
    .map(raw => {
      const job = normalizeJob(raw, { location: 'Kuwait', sourceName: 'JSearch API' });
      if (!job.title || !job.company || !job.url) return null;
      return {
        ...job,
        country: raw.country,
        salary_min: raw.salary_min,
        salary_max: raw.salary_max,
        currency: raw.currency,
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
    console.log(`JSEARCH_API_OK query=${JSON.stringify(query)} fetched=${rows.length} submitted=0`);
    return;
  }

  const result = await bridge('upsert_jobs', { rows: unique });
  const stored = Number(result?.count ?? unique.length);
  const skipped = Number(result?.skipped_invalid || 0);
  console.log(`JSEARCH_API_OK query=${JSON.stringify(query)} fetched=${rows.length} submitted=${unique.length} stored=${stored} skipped_invalid=${skipped}`);
}

main().catch(error => {
  console.error(`JSEARCH_API_FAILED ${String(error?.message || error)}`);
  process.exitCode = 1;
});
