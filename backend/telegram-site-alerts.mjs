import process from 'node:process';
import { pathToFileURL } from 'node:url';

// Aggregated, privacy-minimized site analytics: no user/customer information.
const SUPABASE_DEFAULT = 'https://cqqozlmsvysmxdkkxjbj.supabase.co';
const SHAMX_CF_ACCOUNT = 'dc4d0b77edbbc1a90904c17ad3cf9ca3';
const SHAMX_CF_RUM_SITE = '671f656991a946ac9f1ec60487b074cf';
const HOUR = 60 * 60 * 1000;
const PERIOD = 8 * HOUR;
const UTC_OFFSET = 5 * HOUR; // Kuwait 00/08/16 = UTC 21/05/13.
const SITES = Object.freeze([
  { domain: 'thecareers.net', provider: 'supabase', legacy: true },
  { domain: 'thecareers.org', provider: 'supabase' },
  { domain: 'theaiteachers.net', provider: 'supabase' },
  { domain: 'alfahadkw.com', provider: 'supabase' },
  { domain: 'shamx.net', provider: 'cloudflare' },
  { domain: 'nooo.si', provider: 'supabase' }
]);

export function reportWindow(now = Date.now()) {
  const end = new Date(Math.floor((now - UTC_OFFSET) / PERIOD) * PERIOD + UTC_OFFSET);
  return { start: new Date(end.getTime() - PERIOD), end };
}

function localKuwait(date) {
  return new Date(date.getTime() + 3 * HOUR).toISOString().slice(0, 16).replace('T', ' ');
}

export async function countSupabase(site, { fetchImpl, env, start, end }) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const base = (env.SUPABASE_URL || SUPABASE_DEFAULT).replace(/\/$/, '');
  const query = new URLSearchParams({
    select: 'created_at',
    created_at: `gte.${start.toISOString()}`,
    and: `(created_at.lt.${end.toISOString()})`,
    limit: '1',
    ...(site.legacy ? { event_type: 'eq.visit' } : { site_domain: `eq.${site.domain}` })
  });
  const table = site.legacy ? 'site_events' : 'website_visit_sessions';
  const response = await fetchImpl(`${base}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Supabase ${site.domain}: HTTP ${response.status}`);
  const total = response.headers.get('content-range')?.split('/')[1];
  if (!total || !/^\d+$/.test(total)) throw new Error(`Supabase ${site.domain}: exact count unavailable`);
  return Number(total);
}

// RUM counts successful browser page loads. It is less polluted by bot/API traffic
// than zone-level HTTP visit counters, but it still is not an exact distinct-person count.
// Query only the Sham X site tag; never mix visits from other Cloudflare sites.
export async function countCloudflare({ fetchImpl, env, start, end }) {
  const token = env.CF_ANALYTICS_API_TOKEN;
  if (!token) return null;
  const query = `{ viewer { accounts(filter: { accountTag: "${SHAMX_CF_ACCOUNT}" }) {
    rumPageloadEventsAdaptiveGroups(limit: 1, filter: {
      datetime_geq: "${start.toISOString()}", datetime_lt: "${end.toISOString()}",
      siteTag: "${SHAMX_CF_RUM_SITE}", requestHost: "shamx.net"
    }) { count sum { visits } }
  } } }`;
  const response = await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Cloudflare web analytics HTTP ${response.status}`);
  const data = await response.json();
  if (data.errors?.length) throw new Error('Cloudflare GraphQL returned an analytics error');
  const accounts = data?.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || accounts.length !== 1) throw new Error('Cloudflare analytics account unavailable');
  const rows = accounts[0]?.rumPageloadEventsAdaptiveGroups;
  if (!Array.isArray(rows)) throw new Error('Cloudflare RUM aggregates unavailable');
  if (rows.length === 0) return { visits: 0, pageViews: 0 };
  if (rows.length !== 1) throw new Error('Unexpected Cloudflare RUM aggregate shape');
  const visits = rows[0]?.sum?.visits;
  const pageViews = rows[0]?.count;
  if (!Number.isSafeInteger(visits) || visits < 0 || !Number.isSafeInteger(pageViews) || pageViews < 0) {
    throw new Error('Cloudflare RUM aggregate invalid');
  }
  return { visits, pageViews };
}

export async function runReport({ env = process.env, fetchImpl = fetch, now = Date.now(), log = console } = {}) {
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']) {
    if (!env[name]) throw new Error(`Missing required secret: ${name}`);
  }
  const { start, end } = reportWindow(now);
  const results = await Promise.all(SITES.map(async site => {
    if (site.provider === 'cloudflare' && !env.CF_ANALYTICS_API_TOKEN) {
      return { ...site, visits: null, status: 'not_configured' };
    }
    try {
      const metrics = site.provider === 'cloudflare'
        ? await countCloudflare({ fetchImpl, env, start, end })
        : await countSupabase(site, { fetchImpl, env, start, end });
      const visits = site.provider === 'cloudflare' ? metrics.visits : metrics;
      const pageViews = site.provider === 'cloudflare' ? metrics.pageViews : null;
      return { ...site, visits, pageViews, status: 'ok' };
    } catch (error) {
      log.error(`Analytics source error (${site.domain}): ${error?.message || String(error)}`);
      return { ...site, visits: null, status: 'error' };
    }
  }));
  const lines = results.map(({ domain, provider, visits, pageViews, status }) => {
    if (status === 'not_configured') return `${domain}: غير مربوط (Cloudflare Analytics)`;
    if (status === 'error') return `${domain}: تعذّر قراءة الإحصائيات`;
    return provider === 'cloudflare'
      ? `${domain}: ${visits.toLocaleString('en-US')} زيارة متصفح، ${pageViews.toLocaleString('en-US')} مشاهدة صفحة (Cloudflare)`
      : `${domain}: ${visits.toLocaleString('en-US')}`;
  });
  const message = [
    '📊 زيارات آخر ٨ ساعات',
    `الفترة (الكويت): ${localKuwait(start)} — ${localKuwait(end)}`,
    ...lines,
    'الأرقام الأخرى = جلسات مسجلة من الموقع؛ Cloudflare Web Analytics يحسب نشاط المتصفح، وليس أشخاصاً فريدين.'
  ].join('\n');
  const delivered = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15000)
  });
  if (!delivered.ok) throw new Error(`Telegram delivery failed: HTTP ${delivered.status}`);
  const receipt = await delivered.json();
  if (receipt?.ok !== true) throw new Error('Telegram did not confirm message delivery');
  log.log(`Sent one 8-hour report for window ending ${end.toISOString()}`);
  return { start, end, results, message };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReport().catch(error => {
    console.error(error?.message || String(error));
    process.exitCode = 1;
  });
}
