import normalizeUrl from 'normalize-url';

function clean(v){ return String(v || '').replace(/\s+/g,' ').trim(); }

const GENERIC_TITLE_PATTERNS = [
  /^apply(?:\s+now)?$/i,/^view\s+and\s+apply$/i,/^click\s+here\s+to\s+apply$/i,/^how\s+to\s+apply$/i,
  /^careers?(?:\s+(?:at|with)\b.*)?$/i,/^jobs?(?:\s+at\b.*)?$/i,/^(?:job|career)\s+opportunities$/i,
  /^current\s+(?:openings|vacancies)$/i,/^search\s+jobs(?:\b.*)?$/i,/^advanced\s+search$/i,/^my\s+saved\s+jobs$/i,
  /^job\s+alerts?$/i,/^job\s+application\s+process$/i,/^vacancies$/i,/^view\s+.*(?:jobs|vacancies).*$/i,/^view\s+details$/i,
  /^read\s+more$/i,/^learn\s+more$/i,/^recruitment\s+(?:fairs?|portal)$/i,/^working\s+in\s+kuwait$/i,
  /^career\s+center$/i,/^contact(?:\s+us)?$/i,/^get\s+in\s+touch$/i,/^quick\s+links$/i,/^services$/i,/^products$/i,
  /^business\s+divisions$/i,/^sectors$/i,/^industries$/i,/^insights$/i,/^events$/i,/^partners$/i,/^executives$/i,
  /^board\s+of\s+directors$/i,/^about(?:\s+us)?$/i,/^news(?:\s+and\s+press)?$/i,/^media$/i,/^download$/i,/^explore$/i,
  /^global\s+site$/i,/^skip\s+to\s+(?:main\s+)?content$/i,/^home$/i,/^menu$/i,/^sitemap$/i,
  /^privacy(?:\s+policy)?$/i,/^privacy\s+and\s+cookie\s+notices$/i,/^terms\s+of\s+use$/i,/^legal\s+disclosure$/i,
  /^cookie\s+statement$/i,/^copyright$/i,/^trademark$/i,/^support\s+portal$/i,/^company\s+information$/i,
  /^customer\s+stories$/i,/^worldwide\s+directory$/i,/^newsletter$/i,/^language$/i,/^english(?:\s+\(global\))?$/i,
  /^fran[cç]ais(?:\s+\(france\))?$/i,/^deutsch(?:\s+\(deutschland\))?$/i,/^opens\s+in\s+a\s+new\s+tab\.?$/i,
  /^view\s+profile$/i,/^sap\s+(?:insights|community|trust\s+center)$/i,/^intelligent\s+enterprise$/i,/^top\s+jobs$/i,
  /^small\s+and\s+midsize\s+enterprises$/i,/^sustainability\s+management$/i,/^taulia\s+careers$/i,
  /^school\s+(?:fees|policies|facilities|timings|tours?)$/i,/^term\s+dates$/i,/^admissions?(?:\s+(?:process|&\s*fees))?$/i,
  /^virtual\s+tour$/i,/^open\s+days$/i,/^student\s+success$/i,/^academic\s+outcomes$/i,/^british\s+curriculum$/i,
  /^curriculum$/i,/^university\s+destinations$/i,/^inspection\s+reports$/i,/^expectations$/i,/^cognita\s+(?:family|schools|enrich\s+me)$/i,
  /^pastoral\s+care$/i,/^boarding(?:\s+(?:school|life|summer\s+camps|admissions\s+and\s+fees))?$/i,/^our\s+schools(?:\s+in\s+.+)?$/i,
  /^why\s+boarding$/i,/^collaborations$/i,/^alumni$/i,/^expeditions$/i,/^teaching\s+quality$/i,/^curricula$/i,
  /^creativity\s+and\s+culture$/i,/^university\s+and\s+careers\s+counselling$/i,/^our\s+history\s*&\s*heritage$/i,
  /^vision\s*&\s*values$/i,/^principal['’]s\s+welcome$/i,/^visit$/i,/^enquire$/i,/^make\s+an\s+enquiry$/i,
  /^friends\s+of\s+repton$/i,/^documents\s*&\s*policies$/i,/^senior\s+leadership\s+team$/i,/^latest\s+news$/i,
  /^extra-curricular\s+activities$/i,/^duke\s+of\s+edinburgh\s+award$/i,/^ceiag$/i,/^inclusion$/i,/^music$/i,/^sport$/i,
  /^founder\s*&\s*gm\s+speech$/i,/^registration\s+steps$/i,/^certificates$/i,/^comprehensive\s+rehabilitation\s+stage$/i,
  /^supportive\s+therapy\s+service$/i,/^external\s+training\s+program$/i,/^book\s+a\s+service$/i,
  /^bmw\b/i,/^mini\b/i,/^range\s+rover\b/i,/^land\s+rover\b/i,/^mclaren\b/i,/^geely\b/i,/^rolls-royce\b/i,
  /^repton\s+school\s+dubai$/i,/^[×x]$/i
];

const ROLE_WORDS = new Set(['accountant','administrator','advisor','analyst','architect','assistant','associate','auditor','barista','captain','cashier','chef','clerk','commis','consultant','controller','coordinator','counselor','designer','developer','director','doctor','driver','electrician','engineer','estimator','executive','foreman','generalist','guard','head','housekeeper','inspector','instructor','laborer','lead','lecturer','manager','mason','mechanic','nurse','officer','operator','painter','pharmacist','physician','planner','plumber','president','principal','professor','programmer','receptionist','recruiter','representative','researcher','scientist','secretary','specialist','storekeeper','supervisor','surveyor','teacher','technician','therapist','trainee','trainer','waiter','welder','worker']);

function stripListingNoise(value){
  let t = clean(value).replace(/[↗→]+$/g,'').trim();
  // Odoo/SOMS listings append job code, location, opening count, closing date and “View details”.
  t = t.replace(/\s+JOB_[A-Z0-9_-]+\b.*$/i,'').trim();
  // Some sites append timestamps to otherwise-valid titles.
  t = t.replace(/\s+\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*$/,'').trim();
  return t;
}

function closingDateFromRaw(value){
  const raw = clean(value);
  const m = raw.match(/closing\s+date\s*:\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i);
  if (!m) return null;
  const d = new Date(`${m[1]} ${m[2]} ${m[3]} 23:59:59 UTC`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function sanitizeJobTitle(value) {
  const raw = clean(value);
  const close = closingDateFromRaw(raw);
  if (close && close.getTime() < Date.now() - 86400000) return null;

  let title = stripListingNoise(raw);
  if (!title || title.length < 3 || title.length > 180) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(title) || /email\s+protected/i.test(title)) return null;

  const prefixed = title.match(/^apply\s+(?:now\s+)?(?:for|to)\s+(.+)$/i);
  if (prefixed?.[1]) title = clean(prefixed[1]);
  if (!title || GENERIC_TITLE_PATTERNS.some(re => re.test(title))) return null;

  // Reject obvious navigation/product/article labels even when a role-like word appears.
  if (/\b(?:privacy|cookie|copyright|trademark|newsletter|directory|press|insights|community|portal|curriculum|admissions|boarding|school\s+timings|terms\s+of\s+use)\b/i.test(title)) return null;

  const words = title.toLowerCase().replace(/[^a-z0-9&/-]+/g,' ').split(/\s+/).filter(Boolean);
  const navWords = new Set(['apply','career','careers','job','jobs','vacancy','vacancies','search','openings','portal','recruitment']);
  if (words.length <= 5 && words.filter(w => navWords.has(w)).length >= Math.ceil(words.length * 0.6)) return null;

  // Very short labels must look like an actual occupation.
  if (words.length <= 2) {
    const normalized = words.map(w => w.replace(/s$/,''));
    if (!normalized.some(w => ROLE_WORDS.has(w))) return null;
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
  if (/\boman\b|\bmuscat\b|\bduqm\b|\bsalalah\b/.test(t)) return 'Oman';
  return clean(location) || 'Kuwait';
}

export function sanitizeJobUrl(value) {
  let url = clean(value);
  if (!url || /^(mailto:|tel:|javascript:)/i.test(url)) return null;
  if (/(?:^|\/)null(?:$|[/?#])/i.test(url) || /(?:^|\/)undefined(?:$|[/?#])/i.test(url)) return null;
  try { url = normalizeUrl(url, { removeQueryParameters: [/^utm_/, 'fbclid', 'gclid'], stripWWW: false }); }
  catch { return null; }
  try { const u = new URL(url); if (!['http:','https:'].includes(u.protocol)) return null; }
  catch { return null; }
  return url;
}

export function normalizeJob(job, defaults = {}) {
  const title = sanitizeJobTitle(job.title);
  const url = sanitizeJobUrl(job.url);
  const company = clean(job.company) || clean(defaults.company);
  const location = inferLocation(title, clean(job.location) || clean(defaults.location));
  if (!title || !company || !url) return { title:null, company:company||null, location, employment_type:null, category:null, description:null, published_at:null, url:null, source_name:clean(job.source_name)||clean(defaults.sourceName), score:0, verified:false };
  return { title, company, location, employment_type:clean(job.employment_type)||null, category:clean(job.category)||clean(defaults.category)||null, description:clean(job.description)||null, published_at:job.published_at||null, url, source_name:clean(job.source_name)||clean(defaults.sourceName), score:Number(job.score||0), verified:Boolean(job.verified) };
}
