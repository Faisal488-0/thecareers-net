import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const ORIGIN='https://thecareers.net';
const COUNTRY={
  kuwait:'KW',kw:'KW',
  uae:'AE','united arab emirates':'AE',ae:'AE',
  'saudi arabia':'SA',saudi:'SA',sa:'SA',
  qatar:'QA',qa:'QA',
  oman:'OM',om:'OM',
  bahrain:'BH',bh:'BH'
};
const TYPES={
  full_time:'FULL_TIME','full-time':'FULL_TIME','full time':'FULL_TIME',
  part_time:'PART_TIME','part-time':'PART_TIME','part time':'PART_TIME',
  contractor:'CONTRACTOR',contract:'CONTRACTOR',
  temporary:'TEMPORARY',intern:'INTERN',internship:'INTERN',
  permanent:'FULL_TIME'
};
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function plain(v=''){return String(v??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim();}
function safeUrl(v=''){try{const u=new URL(String(v));return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
function countryCode(j){return COUNTRY[String(j.country||'').trim().toLowerCase()]||COUNTRY[String(j.location||'').trim().toLowerCase()]||null;}
function locality(j){return plain(j.location||'').replace(/\bUNAVAILABLE\b,?\s*/gi,'').replace(/,\s*,/g,',').replace(/\s{2,}/g,' ').trim();}
function employmentType(j){return TYPES[String(j.employment_type||'').trim().toLowerCase()]||null;}
function datePosted(j){const t=Date.parse(j.published_at||'');return Number.isFinite(t)?new Date(t).toISOString():null;}
function lastmod(j){const ts=[j.updated_at,j.published_at,j.found_at].map(v=>Date.parse(v||'')).filter(Number.isFinite);return ts.length?new Date(Math.max(...ts)).toISOString():null;}
function eligible(j,now=Date.now()){
  if(!j||j.status!=='active'||j.verified!==true||j.quality_status!=='approved')return false;
  if(!j.id||!plain(j.title)||!plain(j.company)||!safeUrl(j.url))return false;
  const desc=plain(j.description);
  if(desc.length<150||/(?:\.\.\.|…)/u.test(desc))return false;
  const posted=Date.parse(j.published_at||'');
  if(!Number.isFinite(posted)||posted>now||now-posted>120*864e5)return false;
  if(!countryCode(j))return false;
  const loc=locality(j);
  if(!loc||/^(?:unknown|unavailable|international|remote)$/i.test(loc))return false;
  return true;
}
function canonical(j){return ORIGIN+'/jobs/'+encodeURIComponent(String(j.id))+'/';}
function schema(j){
  const s={
    '@context':'https://schema.org',
    '@type':'JobPosting',
    title:plain(j.title),
    description:plain(j.description),
    datePosted:datePosted(j),
    identifier:{'@type':'PropertyValue',name:plain(j.company),value:String(j.id)},
    hiringOrganization:{'@type':'Organization',name:plain(j.company)},
    jobLocation:{'@type':'Place',address:{'@type':'PostalAddress',addressLocality:locality(j),addressCountry:countryCode(j)}}
  };
  const t=employmentType(j); if(t)s.employmentType=t;
  // Google says validThrough must be omitted when the real deadline is unknown.
  return s;
}
function metaDescription(j){
  const base=plain(j.title)+' at '+plain(j.company)+' in '+locality(j)+'. ';
  const body=plain(j.description).split(/(?<=[.!?])\s+/)[0]||'View the verified original posting for complete responsibilities.';
  const ref=' Ref '+String(j.id).slice(0,8)+'.';
  let out=(base+body+ref).replace(/\s+/g,' ').trim();
  if(out.length>185)out=(base+'View the verified original posting for complete responsibilities.'+ref).slice(0,185);
  return out;
}
function render(j){
  const title=plain(j.title),company=plain(j.company),loc=locality(j),posted=datePosted(j)?.slice(0,10)||'';
  const json=JSON.stringify(schema(j)).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  const type=employmentType(j);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title+' — '+company+' | TheCareers')+'</title><meta name="description" content="'+esc(metaDescription(j))+'"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="'+esc(canonical(j))+'"><script type="application/ld+json">'+json+'</script></head><body><main><article><h1>'+esc(title)+'</h1><dl><dt>Hiring organization</dt><dd>'+esc(company)+'</dd><dt>Job location</dt><dd>'+esc(loc)+'</dd><dt>Date posted</dt><dd>'+esc(posted)+'</dd>'+(type?'<dt>Employment type</dt><dd>'+esc(type.replace('_',' '))+'</dd>':'')+'</dl><h2>Job description</h2><p>'+esc(plain(j.description))+'</p><p><a href="'+esc(safeUrl(j.url))+'" rel="nofollow noopener noreferrer">View original vacancy and application instructions</a></p></article></main></body></html>';
}
async function config(){
  const c=await readFile(join(process.cwd(),'config.js'),'utf8');
  const url=c.match(/SUPABASE_URL:"([^"]+)"/)?.[1];
  const key=c.match(/SUPABASE_PUBLISHABLE_KEY:"([^"]+)"/)?.[1];
  if(!url||!key)throw new Error('Public Supabase configuration unavailable');
  return {url,key};
}
async function fetchJobs(){
  const {url,key}=await config();
  const fields='id,title,company,description,location,country,employment_type,published_at,found_at,updated_at,url,verified,status,quality_status';
  const endpoint=url+'/rest/v1/jobs?select='+encodeURIComponent(fields)+'&status=eq.active&verified=eq.true&quality_status=eq.approved&order=updated_at.desc&limit=1000';
  const r=await fetch(endpoint,{headers:{apikey:key,Authorization:'Bearer '+key}});
  if(!r.ok)throw new Error('Supabase jobs fetch failed '+r.status);
  const rows=await r.json();
  if(!Array.isArray(rows))throw new Error('Supabase jobs response is not an array');
  return rows;
}
export async function buildJobSeo(){
  const rows=await fetchJobs();
  const eligibleRows=rows.filter(j=>eligible(j));
  const dir=join(process.cwd(),'jobs');
  await rm(dir,{recursive:true,force:true}); await mkdir(dir,{recursive:true});
  for(const j of eligibleRows){
    const out=join(dir,String(j.id)); await mkdir(out,{recursive:true});
    await writeFile(join(out,'index.html'),render(j),'utf8');
  }
  const sitemapPath=join(process.cwd(),'sitemap.xml');
  let sitemap=await readFile(sitemapPath,'utf8');
  if(!/<\/urlset>\s*$/i.test(sitemap))throw new Error('Expected urlset sitemap');
  const additions=eligibleRows.map(j=>'  <url><loc>'+esc(canonical(j))+'</loc><lastmod>'+esc(lastmod(j))+'</lastmod></url>').join('\n');
  sitemap=sitemap.replace(/\s*<\/urlset>\s*$/i,'\n'+additions+'\n</urlset>\n');
  await writeFile(sitemapPath,sitemap,'utf8');
  console.log('[SEO] generated '+eligibleRows.length+' Google-eligible job pages from '+rows.length+' approved active records');
  return {total:rows.length,eligible:eligibleRows.length};
}
export const _test={plain,safeUrl,countryCode,locality,employmentType,datePosted,lastmod,eligible,canonical,schema,metaDescription,render};
