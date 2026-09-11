import process from 'node:process';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

if (!SERVICE_KEY || !BOT_TOKEN || !CHAT_ID) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY / TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
  process.exit(1);
}

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function telegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true })
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

const now = new Date();
const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const events = await rest(`site_events?select=id,event_type,session_id,user_id,page,meta,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc&limit=5000`);

const counts = {};
const sessions = new Set();
for (const e of events) {
  counts[e.event_type] = (counts[e.event_type] || 0) + 1;
  if (e.session_id) sessions.add(e.session_id);
}

const important = events.filter(e => ['search_now','cv_analyze_started','auth_submit','job_save'].includes(e.event_type));
const fmt = n => Number(n || 0).toLocaleString('en-US');

if (events.length) {
  const lines = [
    '📊 TheCareers • Last 60 minutes',
    `👥 Sessions: ${fmt(sessions.size)}`,
    `👀 Visits: ${fmt(counts.visit)}`,
    `🔎 Searches: ${fmt(counts.search_now)}`,
    `📄 CV actions: ${fmt(counts.cv_analyze_started)}`,
    `🔐 Auth actions: ${fmt(counts.auth_submit)}`,
    `⭐ Saved jobs: ${fmt(counts.job_save)}`,
    `↗️ Job opens: ${fmt(counts.job_open)}`
  ];
  await telegram(lines.join('\n'));
}

// Send compact instant-ish activity summary for meaningful interactions.
if (important.length) {
  const recent = important.slice(-8).map(e => {
    const icon = ({search_now:'🔎',cv_analyze_started:'📄',auth_submit:'🔐',job_save:'⭐'})[e.event_type] || '•';
    return `${icon} ${e.event_type.replaceAll('_',' ')} • ${new Date(e.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuwait'})}`;
  });
  await telegram(['⚡ TheCareers activity', ...recent].join('\n'));
}
