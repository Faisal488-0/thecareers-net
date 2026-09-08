import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const sources = [
  {
    name: 'Jazeera Airways Careers',
    url: 'https://aem.jazeeraairways.com/en-in/jazeera-careers.html',
    engine: 'playwright', priority: 96, max_pages: 2,
    default_company: 'Jazeera Airways', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], .job, .job-card, [class*="job"]', link_selector: 'a', max_concurrency: 1, preferred_terms: ['operations','hr','human resources','administration','manager','systems','information'] }
  },
  {
    name: 'Shell Kuwait Careers',
    url: 'https://www.shell.com.kw/careers.html',
    engine: 'cheerio', priority: 95, max_pages: 2,
    default_company: 'Shell', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"]', max_concurrency: 2, preferred_terms: ['operations','hr','administration','oil','gas','systems','information'] }
  },
  {
    name: 'KPMG Kuwait Work With Us',
    url: 'https://kpmg.com/kw/en/careers/work-with-us.html',
    engine: 'cheerio', priority: 94, max_pages: 2,
    default_company: 'KPMG Kuwait', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], li', max_concurrency: 2, preferred_terms: ['business support','translation','consulting','advisory','operations','administration','human resources'] }
  },
  {
    name: 'Gulf Insurance Group Careers',
    url: 'https://www.gulfinsgroup.com/en/careers/',
    engine: 'cheerio', priority: 92, max_pages: 2,
    default_company: 'Gulf Insurance Group', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="career"], a[href*="job"], a[href*="apply"]', max_concurrency: 2, preferred_terms: ['operations','administration','hr','human resources','information systems'] }
  },
  {
    name: 'Agility Careers',
    url: 'https://agility.com/careers/',
    engine: 'playwright', priority: 91, max_pages: 2,
    default_company: 'Agility', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"], iframe', max_concurrency: 1, preferred_terms: ['logistics','operations','administration','hr','human resources','systems'] }
  },
  {
    name: 'Worley Middle East & Africa Jobs',
    url: 'https://www.worley.com/en/careers/your-global-career/middle-east-africa',
    engine: 'cheerio', priority: 90, max_pages: 3,
    default_company: 'Worley', default_location: 'Kuwait',
    config: { item_selector: 'a[href*="job"], a[href*="career"], a[href*="opportun"]', max_concurrency: 2, preferred_terms: ['kuwait','operations','administration','project','oil','gas','hr'] }
  },
  {
    name: 'PwC Middle East Careers',
    url: 'https://careers.pwc.com/',
    engine: 'cheerio', priority: 88, max_pages: 3,
    default_company: 'PwC MiddleEast', default_location: 'GCC',
    config: { item_selector: 'a[href*="job/"]', max_concurrency: 2, preferred_terms: ['kuwait','human capital','operations','administration','office management','hr','translation'] }
  }
];

let added = 0, updated = 0, failures = [];
for (const source of sources) {
  const { data: existing, error: findErr } = await supabase.from('sources').select('id').eq('url', source.url).maybeSingle();
  if (findErr) { failures.push(`${source.name}: ${findErr.message}`); continue; }
  const payload = { ...source, enabled: true };
  const op = existing
    ? supabase.from('sources').update(payload).eq('id', existing.id)
    : supabase.from('sources').insert(payload);
  const { error } = await op;
  if (error) failures.push(`${source.name}: ${error.message}`);
  else existing ? updated++ : added++;
}

await supabase.from('search_events').insert({
  level: failures.length ? 'warning' : 'ok',
  message: `Source expansion sync: ${added} new, ${updated} refreshed, ${failures.length} failed`,
  meta: { source_names: sources.map(s => s.name), failures, verified_on: '2026-09-08' }
});

console.log(JSON.stringify({ added, updated, failures }, null, 2));
if (failures.length) process.exitCode = 2;
