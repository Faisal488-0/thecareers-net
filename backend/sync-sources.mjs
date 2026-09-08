const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json'
};

async function rest(path, options = {}) {
  const res = await fetch(`${base}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0,500)}`);
  return text ? JSON.parse(text) : null;
}

const sources = [
  {
    name: 'Jazeera Airways Careers',
    url: 'https://aem.jazeeraairways.com/en-in/jazeera-careers.html',
    engine: 'playwright', enabled: true, priority: 96, max_pages: 2,
    default_company: 'Jazeera Airways', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], .job, .job-card, [class*="job"]', link_selector: 'a', max_concurrency: 1, preferred_terms: ['operations','hr','human resources','administration','manager','systems','information'] }
  },
  {
    name: 'Shell Kuwait Careers',
    url: 'https://www.shell.com.kw/careers.html',
    engine: 'cheerio', enabled: true, priority: 95, max_pages: 2,
    default_company: 'Shell', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"]', max_concurrency: 2, preferred_terms: ['operations','hr','administration','oil','gas','systems','information'] }
  },
  {
    name: 'KPMG Kuwait Work With Us',
    url: 'https://kpmg.com/kw/en/careers/work-with-us.html',
    engine: 'cheerio', enabled: true, priority: 94, max_pages: 2,
    default_company: 'KPMG Kuwait', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], li', max_concurrency: 2, preferred_terms: ['business support','translation','consulting','advisory','operations','administration','human resources'] }
  },
  {
    name: 'Gulf Insurance Group Careers',
    url: 'https://www.gulfinsgroup.com/en/careers/',
    engine: 'cheerio', enabled: true, priority: 92, max_pages: 2,
    default_company: 'Gulf Insurance Group', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], a[href*="apply"]', max_concurrency: 2, preferred_terms: ['operations','administration','hr','human resources','information systems'] }
  },
  {
    name: 'Agility Careers',
    url: 'https://agility.com/careers/',
    engine: 'playwright', enabled: true, priority: 91, max_pages: 2,
    default_company: 'Agility', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"], iframe', max_concurrency: 1, preferred_terms: ['logistics','operations','administration','hr','human resources','systems'] }
  },
  {
    name: 'Worley Middle East & Africa Jobs',
    url: 'https://www.worley.com/en/careers/your-global-career/middle-east-africa',
    engine: 'cheerio', enabled: true, priority: 90, max_pages: 3,
    default_company: 'Worley', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"], a[href*="opportun"]', max_concurrency: 2, preferred_terms: ['kuwait','operations','administration','project','oil','gas','hr'] }
  },
  {
    name: 'PwC Middle East Careers',
    url: 'https://careers.pwc.com/',
    engine: 'cheerio', enabled: true, priority: 88, max_pages: 3,
    default_company: 'PwC MiddleEast', default_location: 'GCC',
    config: { item_selector: 'a[href*="job/"]', max_concurrency: 2, preferred_terms: ['kuwait','human capital','operations','administration','office management','hr','translation'] }
  }
];

let added = 0, updated = 0; const failures = [];
for (const source of sources) {
  try {
    const q = encodeURIComponent(source.url);
    const existing = await rest(`sources?select=id&url=eq.${q}&limit=1`, { method: 'GET' });
    if (existing?.length) {
      await rest(`sources?id=eq.${existing[0].id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(source)
      });
      updated++;
    } else {
      await rest('sources', {
        method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(source)
      });
      added++;
    }
  } catch (e) { failures.push(`${source.name}: ${e.message}`); }
}

try {
  await rest('search_events', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      level: failures.length ? 'warning' : 'ok',
      message: `Source expansion sync: ${added} new, ${updated} refreshed, ${failures.length} failed`,
      meta: { source_names: sources.map(s => s.name), failures, verified_on: '2026-09-08' }
    })
  });
} catch (e) { failures.push(`event log: ${e.message}`); }

console.log(JSON.stringify({ added, updated, failures }, null, 2));
if (failures.length) process.exitCode = 2;
