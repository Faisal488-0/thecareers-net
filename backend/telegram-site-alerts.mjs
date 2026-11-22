import process from 'node:process';
import { pathToFileURL } from 'node:url';

// Aggregated, privacy-minimized site analytics: no user/customer information.
const SUPABASE_DEFAULT = 'https://cqqozlmsvysmxdkkxjbj.supabase.co';
const SHAMX_CF_ZONE = '2d86e9ae06e60012e2a0e2178fdd5a36';
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

// Cloudflare measures edge visits; these are not identical to anonymous browser-tab sessions.
export async function countCloudflare({ fetchImpl, env, start, end }) {
  const token = env.CF_ANALYTICS_API_TOKEN;
  if (!token) return null;
  const query = `{ viewer { zones(filter: { zoneTag: "${SHAMX_CF_ZONE}" }) {
    httpRequestsAdaptiveGroups(limit: 1, filter: {
      datetime_geq: "${start.toISOString()}", datetime_lt: "${end.toISOString()}"
    }) { sum { visits } }
  } } }`;
  const response = await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Cloudflare analytics HTTP ${response.status}`);
  const data = await response.json();
  if (data.errors?.length) throw new Error('Cloudflare GraphQL returned an analytics error');
  const zones = data?.data?.viewer?.zones;
  if (!Array.isArray(zones) || zones.length !== 1) throw new Error('Cloudflare analytics zone unavailable');
  const rows = zones[0]?.httpRequestsAdaptiveGroups;
  if (!Array.isArray(rows)) throw new Error('Cloudflare analytics aggregate unavailable');
  if (rows.length === 0) return 0;
  const visits = rows[0]?.sum?.visits;
  if (!Number.isFinite(visits) || visits < 0) throw new Error('Cloudflare analytics count invalid');
  return Math.round(visits);
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
      const visits = site.provider === 'cloudflare'
        ? await countCloudflare({ fetchImpl, env, start, end })
        : await countSupabase(site, { fetchImpl, env, start, end });
      return { ...site, visits, status: 'ok' };
    } catch (error) {
      log.error(`Analytics source error (${site.domain}): ${error?.message || String(error)}`);
      return { ...site, visits: null, status: 'error' };
    }
  }));
  const lines = results.map(({ domain, provider, visits, status }) => {
    if (status === 'not_configured') return `${domain}: غير مربوط (Cloudflare)`;
    if (status === 'error') return `${domain}: تعذّر قراءة الإحصائيات`;
    return `${domain}: ${visits.toLocaleString('en-US')}${provider === 'cloudflare' ? ' (زيارات Cloudflare)' : ''}`;
  });
  const message = [
    '📊 زيارات آخر ٨ ساعات',
    `الفترة (الكويت): ${localKuwait(start)} — ${localKuwait(end)}`,
    ...lines,
    'الأرقام الأخرى = جلسات مسجلة من الموقع؛ Cloudflare يستخدم تعريفاً مختلفاً للزيارة.'
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
