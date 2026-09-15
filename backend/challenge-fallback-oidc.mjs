import crypto from 'node:crypto';
import { load as loadHtml } from 'cheerio';
import { discoverFromSitemap } from './skills/sitemap-discovery.mjs';
import { canCrawl } from './skills/robots-policy.mjs';
import { extractJobPostingJsonLd } from './skills/jsonld-job-parser.mjs';
import { normalizeJob } from './skills/normalize-job.mjs';
import { scoreJob } from './skills/relevance-scorer.mjs';

const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const USER_AGENT = 'TheCareersBot/1.0 (+https://thecareers.net)';
const OIDC_AUDIENCE = 'thecareers-supabase';
let oidcToken = process.env.GITHUB_OIDC_TOKEN || '';

async function refreshOidcToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) {
    if (oidcToken) return oidcToken;
    throw new Error('GitHub OIDC environment unavailable');
  }
  const separator = requestUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${requestUrl}${separator}audience=${encodeURIComponent(OIDC_AUDIENCE)}`, {
    headers: { Authorization: `Bearer ${requestToken}` }
  });
  const data = await res.json();
  if (!res.ok || !data?.value) throw new Error(`Unable to refresh GitHub OIDC token (${res.status})`);
  oidcToken = data.value;
  return oidcToken;
}

async function bridge(action, payload = {}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = attempt === 0 && oidcToken ? oidcToken : await refreshOidcToken();
    const res = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if (res.ok && !data?.error) return data;
    lastError = new Error(String(data?.error || `${res.status} ${text.slice(0, 300)}`));
    if (res.status !== 401) break;
    oidcToken = '';
  }
  throw lastError || new Error('Bridge request failed');
}

function fingerprint(job) {
  return crypto.createHash('sha256').update(
    [job.title, job.company, job.location, job.url].map(v => String(v || '').trim().toLowerCase()).join('|')
  ).digest('hex');
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' }
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!/html|xhtml/i.test(type)) return null;
    return { html: await res.text(), finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

await refreshOidcToken();
const reply = await bridge('list_sources');
const sources = reply.data || [];
let storedTotal = 0;

for (const source of sources) {
  const cfg = source.config || {};
  const fallbackEnabled = cfg.challenge_fallback !== false;
  if (!fallbackEnabled || source.engine === 'rss') continue;

  // This fallback never solves or bypasses CAPTCHA. It only tries public sitemap URLs
  // and structured JobPosting data that are separately crawlable under robots.txt.
  let urls = [];
  try {
    urls = await discoverFromSitemap(source.url, {
      limit: Math.min(Number(cfg.fallback_sitemap_limit || 25), 50)
    });
  } catch {
    urls = [];
  }
  if (!urls.length) continue;

  const jobs = [];
  for (const url of urls.slice(0, 25)) {
    if (!(await canCrawl(url, USER_AGENT))) continue;
    const page = await fetchHtml(url);
    if (!page) continue;
    const $ = loadHtml(page.html);
    jobs.push(...extractJobPostingJsonLd($, page.finalUrl, {
      company: source.default_company,
      location: source.default_location,
      category: cfg.default_category,
      sourceName: source.name
    }));
    if (jobs.length >= 100) break;
  }

  const unique = [...new Map(jobs
    .map(j => normalizeJob(j, {
      company: source.default_company,
      location: source.default_location,
      category: cfg.default_category,
      sourceName: source.name
    }))
    .filter(j => j.title && j.url)
    .map(j => {
      const row = {
        ...j,
        score: scoreJob(j, cfg.preferred_terms || undefined),
        source_id: source.id,
        fingerprint: fingerprint(j),
        status: 'active',
        found_at: new Date().toISOString(),
        verified: true
      };
      return [row.fingerprint, row];
    })).values()];

  if (!unique.length) continue;
  const result = await bridge('upsert_jobs', { rows: unique });
  const stored = Number(result?.count ?? unique.length);
  storedTotal += stored;
  await bridge('event', {
    run_id: null,
    message: `Compliant sitemap fallback stored ${stored} jobs from ${source.name}`,
    level: 'ok',
    meta: { source_id: source.id, method: 'sitemap_jsonld_fallback', submitted: unique.length }
  });
}

console.log(`Challenge-safe fallback completed — ${storedTotal} jobs processed`);
