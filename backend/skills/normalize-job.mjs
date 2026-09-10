import normalizeUrl from 'normalize-url';

function clean(v){ return String(v || '').replace(/\s+/g,' ').trim(); }

const GENERIC_TITLE_PATTERNS = [
  /^apply(?:\s+now)?$/i,
  /^view\s+and\s+apply$/i,
  /^click\s+here\s+to\s+apply$/i,
  /^how\s+to\s+apply$/i,
  /^careers?$/i,
  /^careers?\s+(?:at|with)\b/i,
  /^jobs?$/i,
  /^jobs?\s+at\b/i,
  /^job\s+opportunities$/i,
  /^career\s+opportunities$/i,
  /^aiu\s+job\s+opportunities$/i,
  /^current\s+(?:openings|vacancies)$/i,
  /^search\s+jobs(?:\b.*)?$/i,
  /^advanced\s+search$/i,
  /^my\s+saved\s+jobs$/i,
  /^job\s+alerts?$/i,
  /^job\s+application\s+process$/i,
  /^vacancies$/i,
  /^(?:aag|tea)\s+vacancies$/i,
  /^(?:uae|bahraini)\s+nationals$/i,
  /^view\s+.*(?:jobs|vacancies).*$/i,
  /^view\s+details$/i,
  /^read\s+more$/i,
  /^learn\s+more$/i,
  /^recruitment\s+fairs?$/i,
  /^recruitment\s+portal$/i,
  /^nbk\s+recruitment\s+portal$/i,
  /^working\s+in\s+kuwait$/i,
  /^employment\s+(?:information|references)$/i,
  /^degree\s+authentication$/i,
  /^housing\s+for\s+overseas\s+faculty$/i,
  /^career\s+center$/i,
  /^contact(?:\s+us)?$/i,
  /^get\s+in\s+touch$/i,
  /^quick\s+links$/i,
  /^services$/i,
  /^products$/i,
  /^business\s+divisions$/i,
  /^sectors$/i,
  /^industries$/i,
  /^insights$/i,
  /^events$/i,
  /^our\s+(?:people|journey|firms)$/i,
  /^partners$/i,
  /^executives$/i,
  /^board\s+of\s+directors$/i,
  /^certifications?\s+and\s+awards?$/i,
  /^about\s+(?:us|aec)$/i,
  /^quality\s*&\s*hse$/i,
  /^contracting$/i,
  /^trading$/i,
  /^view\s+cart$/i,
  /^checkout$/i,
  /^menu$/i,
  /^website\s+by\b/i,
  /^global\s+site$/i,
  /^skip\s+to\s+content$/i,
  /^academic\s+support$/i,
  /^why\s+should\s+you\s+join\s+us\s*\??$/i,
  /^training\s+programs$/i,
  /^faqs?$/i,
  /^listen$/i,
  /^share$/i,
  /^cancel$/i,
  /^english$/i,
  /^arabic$/i,
  /^عرب[يى]$/i,
  /^sign\s+in$/i,
  /^privacy\s+policy$/i,
  /^information\s+request$/i,
  /^grievance\s+committee$/i,
  /^investor\s+relations$/i,
  /^page\s+load\s+link$/i,
  /^go\s+to\s+top$/i,
  /^k\s+link$/i,
  /^csr$/i,
  /^sitemap$/i,
  /^home$/i,
  /^about(?:\s+us)?$/i,
  /^news$/i,
  /^media$/i,
  /^download$/i,
  /^explore$/i,
  /^tes$/i,
  /^founder$/i,
  /^position\s+level\s+criteria\s+experience$/i,
  /^enter\s+(?:in-kuwait\s+koc\s+recruitment|e-recruitment\s+system\b)/i,
  /^find\s+the\s+perfect\s+opening\s+and\s+apply\s+with\s+a\s+click$/i,
  /\bestma\s+reports?\b/i,
  /^\[?email\s+protected\]?$/i,
  /^[×x]$/i
];

// One-word navigation, geography and industry labels are a common failure mode
// on career pages when broad anchor selectors are used. Real one-word role
// titles remain allowed by ROLE_WORDS below.
const ROLE_WORDS = new Set([
  'accountant','administrator','advisor','analyst','architect','assistant','associate','auditor',
  'barista','captain','cashier','chef','clerk','commis','consultant','controller','coordinator',
  'counselor','designer','developer','director','doctor','driver','electrician','engineer','estimator',
  'executive','foreman','generalist','guard','head','housekeeper','inspector','instructor','laborer',
  'lead','lecturer','manager','mason','mechanic','nurse','officer','operator','painter','pharmacist',
  'physician','planner','plumber','president','principal','professor','programmer','receptionist',
  'recruiter','representative','researcher','scientist','secretary','specialist','storekeeper','supervisor',
  'surveyor','teacher','technician','therapist','trainee','trainer','waiter','welder','worker'
]);

const TAXONOMY_WORDS = new Set([
  'advisory','audit','insurance','technology','tax','finance','manufacturing','industrial','education',
  'healthcare','pharmaceuticals','retail','wholesale','telecommunication','media','aviation','logistics',
  'transportation','hospitality','tourism','leisure','government','public','sector','sectors','industry',
  'industries','products','services','trading','contracting'
]);

const PLACE_WORDS = new Set([
  'afghanistan','albania','andorra','argentina','armenia','aruba','australia','austria','azerbaijan',
  'bahrain','barbados','belgium','bolivia','brazil','bulgaria','cambodia','canada','chile','china',
  'colombia','croatia','cyprus','denmark','ecuador','estonia','finland','france','georgia','germany',
  'guatemala','hawaii','honduras','india','indonesia','japan','kuwait','malaysia','maldives','mexico',
  'mongolia','nepal','pakistan','panama','paraguay','peru','philippines','qatar','singapore','suriname',
  'taiwan','thailand','uruguay','venezuela','vietnam'
]);

export function sanitizeJobTitle(value) {
  let title = clean(value).replace(/[↗→]+$/g, '').trim();
  if (!title || title.length < 3 || title.length > 180) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(title) || /email\s+protected/i.test(title)) return null;

  const prefixed = title.match(/^apply\s+(?:now\s+)?(?:for|to)\s+(.+)$/i);
  if (prefixed?.[1]) title = clean(prefixed[1]);

  if (!title || GENERIC_TITLE_PATTERNS.some(re => re.test(title))) return null;

  const words = title.toLowerCase().replace(/[^a-z0-9&/-]+/g, ' ').split(/\s+/).filter(Boolean);
  const navWords = new Set(['apply','career','careers','job','jobs','vacancy','vacancies','search','openings','portal','recruitment']);
  if (words.length <= 5 && words.filter(w => navWords.has(w)).length >= Math.ceil(words.length * 0.6)) return null;

  if (words.length === 1) {
    const w = words[0].replace(/s$/, '');
    if (!ROLE_WORDS.has(w) && (PLACE_WORDS.has(words[0]) || TAXONOMY_WORDS.has(words[0]))) return null;
  }

  // Reject short pure taxonomy/location labels such as "Oil & Gas", "South Korea"
  // and "Financial Services" unless they also contain a recognisable role noun.
  if (words.length <= 4) {
    const normalized = words.map(w => w.replace(/s$/, ''));
    const hasRole = normalized.some(w => ROLE_WORDS.has(w));
    const onlyTaxonomy = normalized.every(w => TAXONOMY_WORDS.has(w) || PLACE_WORDS.has(w) || ['and','&','of','middle','east','south','north','new','united','states','republic','islands','asia','pacific','americas','africa','global'].includes(w));
    if (!hasRole && onlyTaxonomy) return null;
  }

  return title;
}

function inferLocation(title, location) {
  const t = clean(title).toLowerCase();
  if (/\bkuwait\b/.test(t)) return 'Kuwait';
  if (/\bqatar\b|\bdoha\b/.test(t)) return 'Qatar';
  if (/\buae\b|\bdubai\b|\babu dhabi\b/.test(t)) return 'UAE';
  if (/\bksa\b|\bsaudi\b/.test(t)) return 'Saudi Arabia';
  if (/\bbahrain\b/.test(t)) return 'Bahrain';
  if (/\begypt\b|\bcairo\b/.test(t)) return 'Egypt';
  return clean(location) || 'Kuwait';
}

export function sanitizeJobUrl(value) {
  let url = clean(value);
  if (!url || /^(mailto:|tel:|javascript:)/i.test(url)) return null;
  if (/(?:^|\/)null(?:$|[/?#])/i.test(url) || /(?:^|\/)undefined(?:$|[/?#])/i.test(url)) return null;
  try {
    url = normalizeUrl(url, { removeQueryParameters: [/^utm_/, 'fbclid', 'gclid'], stripWWW: false });
  } catch { return null; }
  try {
    const u = new URL(url);
    if (!['http:','https:'].includes(u.protocol)) return null;
  } catch { return null; }
  return url;
}

export function normalizeJob(job, defaults = {}) {
  const title = sanitizeJobTitle(job.title);
  const url = sanitizeJobUrl(job.url);
  const location = inferLocation(title, clean(job.location) || clean(defaults.location));
  return {
    title,
    company: clean(job.company) || clean(defaults.company),
    location,
    employment_type: clean(job.employment_type) || null,
    category: clean(job.category) || clean(defaults.category) || null,
    description: clean(job.description) || null,
    published_at: job.published_at || null,
    url,
    source_name: clean(job.source_name) || clean(defaults.sourceName),
    score: Number(job.score || 0),
    verified: Boolean(job.verified)
  };
}
