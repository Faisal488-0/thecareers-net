const BRIDGE_URL=process.env.SUPABASE_GITHUB_BRIDGE_URL||'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
const OIDC_AUDIENCE='thecareers-supabase';
const USER_AGENT='TheCareersVerifier/1.0 (+https://thecareers.net)';
let oidcToken=process.env.GITHUB_OIDC_TOKEN||'';

async function refreshOidcToken(){
  const u=process.env.ACTIONS_ID_TOKEN_REQUEST_URL,t=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if(!u||!t){if(oidcToken)return oidcToken;throw new Error('GitHub OIDC environment is unavailable');}
  const sep=u.includes('?')?'&':'?';
  const r=await fetch(`${u}${sep}audience=${encodeURIComponent(OIDC_AUDIENCE)}`,{headers:{Authorization:`Bearer ${t}`}});
  const b=await r.json().catch(()=>({}));
  if(!r.ok||!b?.value)throw new Error(`Unable to obtain GitHub OIDC token (${r.status})`);
  oidcToken=b.value;return oidcToken;
}
async function bridge(action,payload={}){
  let token=oidcToken||await refreshOidcToken();
  let r=await fetch(BRIDGE_URL,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
  if(r.status===401){token=await refreshOidcToken();r=await fetch(BRIDGE_URL,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});}
  const text=await r.text();let b;try{b=text?JSON.parse(text):{}}catch{b={error:text}}
  if(!r.ok||b?.error)throw new Error(String(b?.error||`${r.status} ${text.slice(0,300)}`));return b;
}
function safeEmail(v){
  const e=String(v||'').replace(/^mailto:/i,'').split(/[?&#]/)[0].trim().toLowerCase();
  if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(e))return null;
  if(/^(?:support|privacy|legal|webmaster|admin|info|marketing|sales|press|media|dpo|dataprotection|data\.protection|security|help)@/i.test(e))return null;
  return e;
}
function extractApplicationEmailFromHtml(html){
  const raw=String(html||'');
  const candidates=[];
  const mailRe=/mailto:([^"'<>?\s]+)/ig;
  for(const m of raw.matchAll(mailRe))candidates.push({email:m[1],index:m.index||0});
  const text=raw.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ');
  const emailRe=/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/ig;
  for(const m of text.matchAll(emailRe))candidates.push({email:m[0],index:m.index||0,text:true});
  for(const x of candidates){
    const email=safeEmail(x.email);if(!email)continue;
    const hay=x.text?text:raw,i=Math.max(0,Math.min(x.index,hay.length));
    const ctx=hay.slice(Math.max(0,i-180),Math.min(hay.length,i+email.length+180));
    if(/\b(?:apply|application|send\s+(?:your\s+)?(?:cv|resume)|submit\s+(?:your\s+)?(?:cv|resume)|cv|résumé|resume|recruit(?:ment|er)?|hiring|vacanc(?:y|ies)|job\s+application|careers?)\b/i.test(ctx)
       && !/\b(?:privacy|legal|cookie|customer\s+service|press|media\s+enquiries|data\s+protection)\b/i.test(ctx)) return email;
  }
  return null;
}

const DEAD_PATTERNS=[
  /job (?:is )?no longer available/i,/position (?:has been|is) filled/i,/vacancy (?:is )?closed/i,
  /job (?:has been )?closed/i,/applications? (?:are )?closed/i,/application deadline has passed/i,
  /this job has expired/i,/job posting has expired/i,/job not found/i,/vacancy not found/i,
  /this position is no longer accepting applications/i
];
function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
async function inspect(job){
  const url=clean(job?.url);if(!/^https?:\/\//i.test(url))return {state:'dead',reason:'invalid_url'};
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':USER_AGENT,'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'},signal:AbortSignal.timeout(7000)});
    if(r.status===404||r.status===410)return {state:'dead',reason:`http_${r.status}`};
    if(r.status===401||r.status===403||r.status===429||r.status>=500)return {state:'unknown',reason:`http_${r.status}`};
    if(!r.ok)return {state:'unknown',reason:`http_${r.status}`};
    const type=(r.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html'))return {state:'alive',reason:'reachable'};
    const rawHtml=(await r.text()).slice(0,500000);
    const applicationEmail=extractApplicationEmailFromHtml(rawHtml);
    const html=rawHtml.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    if(DEAD_PATTERNS.some(re=>re.test(html)))return {state:'dead',reason:'explicit_closed_message',applicationEmail};
    return {state:'alive',reason:'reachable',applicationEmail};
  }catch(e){
    return {state:'unknown',reason:/timeout|abort/i.test(String(e))?'timeout':'network_error'};
  }
}
await refreshOidcToken();
const reply=await bridge('list_jobs_for_audit',{limit:600});
const jobs=reply.data||[];
let alive=0,dead=0,unknown=0;
for(let i=0;i<jobs.length;i+=20){
  const batch=jobs.slice(i,i+20);
  const checked=await Promise.all(batch.map(async job=>({job,result:await inspect(job)})));
  for(const {job,result} of checked){
    if(result.state==='alive')alive++;else if(result.state==='dead')dead++;else unknown++;
    await bridge('audit_job',{job_id:job.id,state:result.state,reason:result.reason,application_email:result.applicationEmail||null});
  }
}
await bridge('event',{message:`Hourly quality audit — checked ${jobs.length}, active ${alive}, removed ${dead}, inconclusive ${unknown}`,level:dead?'warning':'ok',meta:{checked:jobs.length,alive,dead,unknown}});
console.log(`HOURLY_JOB_AUDIT checked=${jobs.length} alive=${alive} removed=${dead} unknown=${unknown}`);
