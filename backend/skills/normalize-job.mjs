import normalizeUrl from 'normalize-url';

function clean(v){ return String(v || '').replace(/\s+/g,' ').trim(); }

const GENERIC_TITLE_PATTERNS = [
  /^apply(?:\s+now)?$/i,
  /^click\s+here\s+to\s+apply$/i,
  /^how\s+to\s+apply$/i,
  /^careers?$/i,
  /^careers?\s+(?:at|with)\b/i,
  /^jobs?$/i,
  /^jobs?\s+at\b/i,
  /^job\s+opportunities$/i,
  /^aiu\s+job\s+opportunities$/i,
  /^current\s+openings$/i,
  /^search\s+jobs$/i,
  /^advanced\s+search$/i,
  /^my\s+saved\s+jobs$/i,
  /^job\s+alerts?$/i,
  /^vacancies$/i,
  /^(?:aag|tea)\s+vacancies$/i,
  /^(?:uae|bahraini)\s+nationals$/i,
  /^view\s+.*(?:jobs|vacancies).*$/i,
  /^recruitment\s+fairs?$/i,
  /^recruitment\s+portal$/i,
  /^nbk\s+recruitment\s+portal$/i,
  /^working\s+in\s+kuwait$/i,
  /^employment\s+(?:information|references)$/i,
  /^degree\s+authentication$/i,
  /^housing\s+for\s+overseas\s+faculty$/i,
  /^career\s+center$/i,
  /^contact\s+us$/i,
  /^faqs?$/i,
  /^listen$/i,
  /^share$/i,
  /^cancel$/i,
  /^english$/i,
  /^عرب[يى]$/i,
  /^tes$/i,
  /^[×x]$/i,
  /^position\s+level\s+criteria\s+experience$/i,
  /^enter\s+(?:in-kuwait\s+koc\s+recruitment|e-recruitment\s+system\b)/i,
  /^find\s+the\s+perfect\s+opening\s+and\s+apply\s+with\s+a\s+click$/i
];

export function sanitizeJobTitle(value) {
  let title = clean(value)
    .replace(/[↗→]+$/g, '')
    .trim();

  if (!title || title.length < 3 || title.length > 180) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(title)) return null;

  // Some pages expose headings such as “Apply for Senior Accountant”.
  // Keep the real role while dropping the CTA prefix.
  const prefixed = title.match(/^apply\s+(?:now\s+)?(?:for|to)\s+(.+)$/i);
  if (prefixed?.[1]) title = clean(prefixed[1]);

  if (!title || GENERIC_TITLE_PATTERNS.some(re => re.test(title))) return null;

  // Reject labels that are mostly navigation/action words rather than a role.
  const words = title.toLowerCase().split(/\s+/).filter(Boolean);
  const navWords = new Set(['apply','career','careers','job','jobs','vacancy','vacancies','search','openings','portal','recruitment']);
  if (words.length <= 4 && words.filter(w => navWords.has(w)).length >= Math.ceil(words.length * 0.6)) return null;

  return title;
}

export function normalizeJob(job, defaults = {}) {
  let url = clean(job.url);
  try {
    if (url) url = normalizeUrl(url, { removeQueryParameters: [/^utm_/, 'fbclid', 'gclid'], stripWWW: false });
  } catch {}

  // mailto/tel/javascript links are not job-detail URLs.
  if (/^(mailto:|tel:|javascript:)/i.test(url)) url = '';

  return {
    title: sanitizeJobTitle(job.title),
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
