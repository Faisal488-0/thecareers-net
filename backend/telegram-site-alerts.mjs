import process from 'node:process';

// Single consolidated visit report. Site-only counts: no visitor or customer data.
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

if (!SERVICE_KEY || !BOT_TOKEN || !CHAT_ID) {
  console.error('Missing Supabase service role or Telegram delivery credentials.');
  process.exit(1);
}

const hour = 60 * 60 * 1000;
const eightHours = 8 * hour;
// Midnight / 08:00 / 16:00 in Kuwait = 21:00 / 05:00 / 13:00 UTC.
const offset = 5 * hour;
const windowEnd = new Date(Math.floor((Date.now() - offset) / eightHours) * eightHours + offset);
const windowStart = new Date(windowEnd.getTime() - eightHours);

const sites = [
  { domain: 'thecareers.net', legacy: true },
  { domain: 'thecareers.org' },
  { domain: 'theaiteachers.net' },
  { domain: 'alfahadkw.com' },
  { domain: 'shamx.net', pending: true }
];

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: 'count=exact'
};

async function countVisits(site) {
  if (site.pending) return null; // No tracker installed; zero would misrepresent traffic.
  const query = new URLSearchParams({
    select: 'created_at',
    created_at: `gte.${windowStart.toISOString()}`,
    and: `(created_at.lt.${windowEnd.toISOString()})`,
    limit: '1',
    ...(site.legacy ? { event_type: 'eq.visit' } : { site_domain: `eq.${site.domain}` })
  });
  const table = site.legacy ? 'site_events' : 'website_visit_sessions';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Website traffic query failed for ${site.domain}: HTTP ${res.status}`);
  const total = res.headers.get('content-range')?.split('/')[1];
  if (!total || !/^\d+$/.test(total)) throw new Error(`Missing exact traffic count for ${site.domain}`);
  return Number(total);
}

const results = await Promise.all(sites.map(async site => {
  try { return { ...site, visits: await countVisits(site) }; }
  catch (error) {
    console.error(String(error?.message || error));
    return { ...site, visits: null };
  }
}));

// Never report missing data as zero; never send one message per individual site.
const lines = results.map(({ domain, visits }) => `${domain}: ${visits === null ? 'غير متاح' : visits.toLocaleString('en-US')}`);
const text = ['زيارات آخر ٨ ساعات', ...lines].join('\n');

const delivered = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
  signal: AbortSignal.timeout(15000)
});
if (!delivered.ok) throw new Error(`Telegram delivery failed: HTTP ${delivered.status}`);
console.log(`Sent one 8-hour website report for window ending ${windowEnd.toISOString()}`);
