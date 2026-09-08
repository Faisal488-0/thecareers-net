import normalizeUrl from 'normalize-url';

function clean(v){ return String(v || '').replace(/\s+/g,' ').trim(); }

export function normalizeJob(job, defaults = {}) {
  let url = clean(job.url);
  try {
    if (url) url = normalizeUrl(url, { removeQueryParameters: [/^utm_/, 'fbclid', 'gclid'], stripWWW: false });
  } catch {}
  return {
    title: clean(job.title),
    company: clean(job.company) || clean(defaults.company),
    location: clean(job.location) || clean(defaults.location) || 'Kuwait',
    employment_type: clean(job.employment_type) || null,
    category: clean(job.category) || clean(defaults.category) || null,
    description: clean(job.description) || null,
    published_at: job.published_at || null,
    url: url || null,
    source_name: clean(job.source_name) || clean(defaults.sourceName),
    score: Number(job.score || 0),
    verified: Boolean(job.verified)
  };
}
