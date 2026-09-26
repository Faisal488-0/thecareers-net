// Builds crawlable HTML leaf pages ONLY for original, approved, fresh postings.
// Output is deployed by existing GitHub Pages workflow. No frontend or CSS mutation.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ORIGIN='https://thecareers.net';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COUNTRY={kuwait:'KW',kw:'KW',uae:'AE',ae:'AE','united arab emirates':'AE','saudi arabia':'SA',sa:'SA',qatar:'QA',qa:'QA',bahrain:'BH',bh:'BH',oman:'OM',om:'OM',us:'US','united states':'US',eg:'EG',egypt:'EG',in:'IN',india:'IN'};
const TYPES={full_time:'FULL_TIME','full-time':'FULL_TIME','full time':'FULL_TIME',part_time:'PART_TIME','part-time':'PART_TIME','part time':'PART_TIME',permanent:'FULL_TIME',contract:'CONTRACTOR',contractor:'CONTRACTOR',temporary:'TEMPORARY',intern:'INTERN',internship:'INTERN'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function plain(value){return String(value??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim();}
function safeUrl(url){try{const u=new URL(url);return u.protocol==='https:'||u.protocol==='http:'?u.href:null;}catch{return null;}}
export function countryCode(job){
 let c=COUNTRY[String(job.country||'').trim().toLowerCase()];
 if(c)return c;
 const parts=String(job.location||'').split(',').map(s=>s.trim().toLowerCase());
 return COUNTRY[parts.at(-1)]||null;
}
export function eligible(job,now=Date.now()){
 if(!UUID.test(String(job.id||''))||!plain(job.title)||!plain(job.company)||!safeUrl(job.url)) return false;
 if(job.status!=='active'||job.verified!==true||job.quality_status!=='approved')return false;
 const desc=plain(job.description);
 // Do not mark scraped truncated snippets as complete Google job descriptions.\n if(desc.length<150 || /(?:\.\.\.|…)/u.test(desc))return false;
 const posted=Date.parse(job.published_at||''),fresh=Date.parse(job.updated_at||'');
 if(!Number.isFinite(posted)||posted>now||now-posted>120*864e5) return false;
 if(!Number.isFinite(fresh)||fresh>now||now-fresh>45*864e5) return false;
 return !!countryCode(job) && !!plain(job.location);
}
export function canonical(job){return ORIGIN+'/jobs/'+job.id+'/';}
export function schema(job){
 const addr=plain(job.location).replace(/\bUNAVAILABLE\b,?\s*/gi,'').replace(/,\s*,/g,',').trim();
 const s={'@context':'https://schema.org','@type':'JobPosting',title:plain(job.title),
  description:plain(job.description),datePosted:new Date(job.published_at).toISOString(),
  identifier:{'@type':'PropertyValue',name:plain(job.company),value:String(job.id)},
  hiringOrganization:{'@type':'Organization',name:plain(job.company)},
  jobLocation:{'@type':'Place',address:{'@type':'PostalAddress',addressLocality:addr,addressCountry:countryCode(job)}}};
 const type=TYPES[String(job.employment_type||'').trim().toLowerCase()];
 if(type)s.employmentType=type;
 // No real deadline in NET's schema: omit validThrough entirely.
 return s;
}
export function render(job){
 if(!eligible(job))throw new Error('SEO job ineligible');
 const title=plain(job.title), company=plain(job.company), loc=plain(job.location),date=new Date(job.published_at).toISOString().slice(0,10);
 const meta=(title+' at '+company+' in '+loc+'. Original vacancy posted '+date+'. Ref '+job.id.slice(0,8)+'.').slice(0,190);
 const json=JSON.stringify(schema(job)).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028|\u2029/g,' ');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title+' — '+company+' | TheCareers.net')+'</title><meta name="description" content="'+esc(meta)+'"><meta name="robots" content="index,follow"><link rel="canonical" href="'+esc(canonical(job))+'"><script type="application/ld+json">'+json+'</script></head><body><main><article><h1>'+esc(title)+'</h1><dl><dt>Hiring organization</dt><dd>'+esc(company)+'</dd><dt>Job location</dt><dd>'+esc(loc)+'</dd><dt>Original posting date</dt><dd>'+esc(date)+'</dd>'+(schema(job).employmentType?'<dt>Employment type</dt><dd>'+esc(schema(job).employmentType.replace('_',' '))+'</dd>':'')+'</dl><h2>Job description</h2><p>'+esc(plain(job.description))+'</p><p><a href="'+esc(safeUrl(job.url))+'" rel="nofollow noopener noreferrer">View original vacancy and application instructions</a></p></article></main></body></html>';
}
export async function generate(fetchJobs,now=new Date()){
 const indexPath=join(ROOT,'data','job-pages-state.json');
 let old={};
 try{old=JSON.parse(await readFile(indexPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const jobs=await fetchJobs();
 if(!Array.isArray(jobs)||!jobs.length)throw new Error('No approved jobs received; preserving previous deploy');
 if(jobs.length>=1000)throw new Error('SEO fetch reached safety limit; pagination required');
 const qualified=jobs.filter(j=>eligible(j,now.getTime()));
 if(!qualified.length)throw new Error('No qualified jobs; refusing to deploy empty sitemap until verified');
 const current={};
 for(const job of qualified){
   const page=render(job),hash=createHash('sha256').update(page).digest('hex');
   const prev=old[job.id],lastmod=(prev?.hash===hash && prev.lastmod)?prev.lastmod:now.toISOString();
   const path=join(ROOT,'jobs',job.id);
   await mkdir(path,{recursive:true});
   await writeFile(join(path,'index.html'),page);
   current[job.id]={hash,lastmod};
 }
 for(const id of Object.keys(old)){if(UUID.test(id)&&!current[id])await rm(join(ROOT,'jobs',id),{recursive:true,force:true});}
 await mkdir(join(ROOT,'data'),{recursive:true});
 await writeFile(indexPath,JSON.stringify(current,null,2)+'\n');
 const urls=qualified.map(j=>'<url><loc>'+esc(canonical(j))+'</loc><lastmod>'+current[j.id].lastmod+'</lastmod></url>');
 await writeFile(join(ROOT,'sitemap-jobs.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n');
 console.log('SEO_VERIFIED_JOB_PAGES='+qualified.length+'; skipped='+String(jobs.length-qualified.length));
 return qualified.length;
}
async function fromPublicRead(){
 const config=await readFile(join(ROOT,'config.js'),'utf8');
 const key=config.match(/SUPABASE_PUBLISHABLE_KEY:"([^"]+)"/)?.[1];
 const base=config.match(/SUPABASE_URL:"(https:\/\/[^"]+)"/)?.[1];
 if(!key||!base)throw new Error('Public Supabase config missing');
 const select='id,title,company,description,location,country,employment_type,published_at,updated_at,url,status,verified,quality_status';
 const q='/rest/v1/jobs?select='+select+'&status=eq.active&verified=eq.true&quality_status=eq.approved&published_at=not.is.null&order=published_at.desc&limit=1000';
 const response=await fetch(base+q,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('Public approved jobs unavailable: HTTP '+response.status);
 const body=await response.json();
 if(!Array.isArray(body))throw new Error('Unexpected public jobs response');
 return body;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 generate(fromPublicRead).catch(e=>{console.error('[job SEO generation]',e);process.exitCode=1;});
}
