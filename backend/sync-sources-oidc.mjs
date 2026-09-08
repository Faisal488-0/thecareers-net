const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const OIDC_TOKEN = process.env.GITHUB_OIDC_TOKEN;
if (!OIDC_TOKEN) throw new Error('Missing GITHUB_OIDC_TOKEN');

const sources = [
  { name:'Jazeera Airways Careers', url:'https://aem.jazeeraairways.com/en-in/jazeera-careers.html', engine:'playwright', enabled:true, priority:96, max_pages:2, default_company:'Jazeera Airways', default_location:'Kuwait', config:{ item_selector:'a[href*="career"], a[href*="job"], .job, .job-card, [class*="job"]', link_selector:'a', max_concurrency:1, preferred_terms:['operations','hr','human resources','administration','manager','systems','information'] } },
  { name:'Shell Kuwait Careers', url:'https://www.shell.com.kw/careers.html', engine:'cheerio', enabled:true, priority:95, max_pages:2, default_company:'Shell', default_location:'Kuwait', config:{ item_selector:'a[href*="job"], a[href*="career"]', max_concurrency:2, preferred_terms:['operations','hr','administration','oil','gas','systems','information'] } },
  { name:'KPMG Kuwait Work With Us', url:'https://kpmg.com/kw/en/careers/work-with-us.html', engine:'cheerio', enabled:true, priority:94, max_pages:2, default_company:'KPMG Kuwait', default_location:'Kuwait', config:{ item_selector:'a[href*="career"], a[href*="job"], li', max_concurrency:2, preferred_terms:['business support','translation','consulting','advisory','operations','administration','human resources'] } },
  { name:'Gulf Insurance Group Careers', url:'https://www.gulfinsgroup.com/en/careers/', engine:'cheerio', enabled:true, priority:92, max_pages:2, default_company:'Gulf Insurance Group', default_location:'Kuwait', config:{ item_selector:'a[href*="career"], a[href*="job"], a[href*="apply"]', max_concurrency:2, preferred_terms:['operations','administration','hr','human resources','information systems'] } },
  { name:'Agility Careers', url:'https://agility.com/careers/', engine:'playwright', enabled:true, priority:91, max_pages:2, default_company:'Agility', default_location:'Kuwait', config:{ item_selector:'a[href*="job"], a[href*="career"], iframe', max_concurrency:1, preferred_terms:['logistics','operations','administration','hr','human resources','systems'] } },
  { name:'Worley Middle East & Africa Jobs', url:'https://www.worley.com/en/careers/your-global-career/middle-east-africa', engine:'cheerio', enabled:true, priority:90, max_pages:3, default_company:'Worley', default_location:'Kuwait', config:{ item_selector:'a[href*="job"], a[href*="career"], a[href*="opportun"]', max_concurrency:2, preferred_terms:['kuwait','operations','administration','project','oil','gas','hr'] } },
  { name:'PwC Middle East Careers', url:'https://careers.pwc.com/', engine:'cheerio', enabled:true, priority:88, max_pages:3, default_company:'PwC MiddleEast', default_location:'GCC', config:{ item_selector:'a[href*="job/"]', max_concurrency:2, preferred_terms:['kuwait','human capital','operations','administration','office management','hr','translation'] } }
];

const res = await fetch(BRIDGE_URL, {
  method:'POST',
  headers:{ Authorization:`Bearer ${OIDC_TOKEN}`, 'Content-Type':'application/json' },
  body:JSON.stringify({ action:'sync_sources', sources })
});
const text = await res.text();
if (!res.ok) throw new Error(`${res.status} ${text}`);
console.log(text);
