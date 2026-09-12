import crypto from 'node:crypto';
import { normalizeJob } from './skills/normalize-job.mjs';
import { scoreJob } from './skills/relevance-scorer.mjs';

const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const OIDC_AUDIENCE = 'thecareers-supabase';
const USER_AGENT = 'TheCareersBot/1.0 (+https://thecareers.net)';
const API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const MAX_PAGES = Math.max(1, Math.min(Number(process.env.ARBEITNOW_PAGES || 1), 2));

let oidcToken = process.env.GITHUB_OIDC_TOKEN || '';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripHtml(value) {
  return clean(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>'));
}

function fingerprint(job) {
  const raw = [job.title, job.company, job.location, job.url]
    .map(v => clean(v).toLowerCase())
    .join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
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

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Arbeitnow API failed (${res.status}) ${text.slice(0, 250)}`);
  try { return text ? JSON.parse(text) : {}; }
  catch { throw new Error('Arbeitnow API returned invalid JSON'); }
}

function mapJob(row) {
  const types = Array.isArray(row?.job_types) ? row.job_types.filter(Boolean) : [];
  const tags = Array.isArray(row?.tags) ? row.tags.filter(Boolean) : [];
  const publishedAt = Number.isFinite(Number(row?.created_at))
    ? new Date(Number(row.created_at) * 1000).toISOString()
    : null;

  return {
    title: clean(row?.title),
    company: clean(row?.company_name),
    location: clean(row?.location) || (row?.remote ? 'Remote' : 'International'),
    employment_type: clean(types.join(', ')) || (row?.remote ? 'Remote' : null),
    category: clean(tags.join(', ')) || null,
    description: stripHtml(row?.description),
    published_at: publishedAt,
    url: clean(row?.url),
    source_name: 'Arbeitnow API',
    score: 0,
    verified: false
  };
}

async function main() {
  await refreshOidcToken();
  const collected = [];
  let nextUrl = API_URL;

  for (let page = 1; page <= MAX_PAGES && nextUrl; page++) {
    const payload = await fetchPage(nextUrl);
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    collected.push(...rows.map(mapJob));
    nextUrl = clean(payload?.links?.next) || null;
  }

  const normalized = collected
    .map(job => normalizeJob(job, { location: 'International', sourceName: 'Arbeitnow API' }))
    .filter(job => job.title && job.company && job.url)
    .map(job => ({
      ...job,
      source_id: null,
      fingerprint: fingerprint(job),
      score: scoreJob(job),
      status: 'active',
      found_at: new Date().toISOString()
    }));

  const unique = [...new Map(normalized.map(job => [job.fingerprint, job])).values()];
  if (!unique.length) {
    console.log('ARBEITNOW_API_OK jobs=0');
    return;
  }

  const result = await bridge('upsert_jobs', { rows: unique });
  const stored = Number(result?.count ?? unique.length);
  const skipped = Number(result?.skipped_invalid || 0);
  console.log(`ARBEITNOW_API_OK fetched=${collected.length} submitted=${unique.length} stored=${stored} skipped_invalid=${skipped}`);
}

main().catch(error => {
  console.error(`ARBEITNOW_API_FAILED ${String(error?.message || error)}`);
  process.exitCode = 1;
});
