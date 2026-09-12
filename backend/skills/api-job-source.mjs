const USER_AGENT = 'TheCareersBot/1.0 (+https://thecareers.net)';

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

function unixToIso(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': USER_AGENT
    },
    signal: AbortSignal.timeout(25000)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`API request failed (${res.status}) ${text.slice(0, 240)}`);
  try { return text ? JSON.parse(text) : {}; }
  catch { throw new Error('API returned invalid JSON'); }
}

function mapArbeitnow(job, source) {
  const types = Array.isArray(job?.job_types) ? job.job_types.filter(Boolean) : [];
  const tags = Array.isArray(job?.tags) ? job.tags.filter(Boolean) : [];
  const rawLocation = clean(job?.location);
  return {
    title: clean(job?.title),
    company: clean(job?.company_name),
    location: rawLocation || (job?.remote ? 'Remote' : source?.default_location || 'International'),
    employment_type: clean(types.join(', ')) || (job?.remote ? 'Remote' : null),
    category: clean(tags.join(', ')) || source?.config?.default_category || null,
    description: stripHtml(job?.description),
    published_at: unixToIso(job?.created_at),
    url: clean(job?.url),
    source_name: source?.name || 'Arbeitnow',
    score: 0,
    verified: false
  };
}

async function readArbeitnow(source) {
  const cfg = source?.config || {};
  const maxPages = Math.max(1, Math.min(Number(cfg.page_limit || source?.max_pages || 1), 3));
  const startUrl = source?.url || 'https://www.arbeitnow.com/api/job-board-api';
  const jobs = [];
  let nextUrl = startUrl;

  for (let page = 1; page <= maxPages && nextUrl; page++) {
    const data = await fetchJson(nextUrl);
    const rows = Array.isArray(data?.data) ? data.data : [];
    jobs.push(...rows.map(job => mapArbeitnow(job, source)));
    const next = clean(data?.links?.next);
    nextUrl = next || null;
  }

  return jobs;
}

export async function readApiJobs(source) {
  const provider = clean(source?.config?.provider || source?.name).toLowerCase();
  if (provider === 'arbeitnow' || provider.includes('arbeitnow')) {
    return readArbeitnow(source);
  }
  throw new Error(`Unsupported API provider: ${provider || 'unknown'}`);
}
