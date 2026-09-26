// Builds crawlable HTML leaf pages ONLY for original, approved, fresh postings.
// Output is deployed by existing GitHub Pages workflow. No frontend or CSS mutation.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ORIGIN='https://thecareers.net';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COUNTRY={kuwait:'KW',kw:'KW',uae:'AE',ae:'AE','united arab emirates':'AE','saudi arabia':'SA',sa:'SA',qatar:'QA',qa:'QA',bahrain:'BH',bh:'BH',oman:'OM',om:'OM',us:'US','united states':'US',eg:'EG',egypt:'EG',in:'IN',india:'IN'};
const TYPES={full_time:'FULL_TIME','full-time':'FULL_TIME','full time':'FULL_TIME',part_time:'PART_TIME','part-time':'PART_TIME','part time':'PART_TIME',permanent:'FULL_TIME',contract:'CONTRACTOR',contractor:'CONTRACTOR',temporary:'TEMPORARY',intern:'INTERN',internship:'INTERN'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function plain(value){
 const raw=String(value??'');
 if(!/[<&]/.test(raw))return raw.replace(/\s+/g,' ').trim();
 const $=load('<main id="tc-extract">'+raw+'</main>');
 $('#tc-extract script,#tc-extract style,#tc-extract noscript').remove();
 return $('#tc-extract').text().replace(/\s+/g,' ').trim();
}
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
 // Do not mark scraped truncated snippets as complete Google job descriptions.
 if(desc.length<150 || /(?:\.\.\.|…)/u.test(desc))return false;
 const posted=Date.parse(job.published_at||''),fresh=Date.parse(job.updated_at||'');
 if(!Number.isFinite(posted)||posted>now||now-posted>120*864e5) return false;
 if(!Number.isFinite(fresh)||fresh>now||now-fresh>45*864e5) return false;
 return !!countryCode(job) && !!plain(job.location);
}
export function safeSlug(id){return createHash('sha256').update(String(id)).digest('hex').slice(0,28);}
export function canonical(job){return ORIGIN+'/jobs/'+safeSlug(job.id)+'/';}
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
 const prefix=(title+' at '+company+' in '+loc).slice(0,125).replace(/\s+\S*$/,'').trim();
 const meta=prefix+'. Original vacancy: '+date+'. Unique listing ref '+job.id.slice(0,8)+'.';
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
   const path=join(ROOT,'jobs',safeSlug(job.id));
   await mkdir(path,{recursive:true});
   await writeFile(join(path,'index.html'),page);
   current[job.id]={hash,lastmod};
 }
 for(const id of Object.keys(old)){if(UUID.test(id)&&!current[id])await rm(join(ROOT,'jobs',safeSlug(id)),{recursive:true,force:true});}
 await mkdir(join(ROOT,'data'),{recursive:true});
 await writeFile(indexPath,JSON.stringify(current,null,2)+'\n');
 const urls=qualified.map(j=>'<url><loc>'+esc(canonical(j))+'</loc><lastmod>'+current[j.id].lastmod+'</lastmod></url>');
 await writeFile(join(ROOT,'sitemap-jobs.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n');
 console.log('SEO_VERIFIED_JOB_PAGES='+qualified.length+'; skipped='+String(jobs.length-qualified.length));
 return qualified.length;
}
// Filesystem stage receives a finite validated JSON feed from the isolated,
 // fixed-origin read-only fetch process. It never makes outbound requests.
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=[];
 for await (const part of process.stdin) {
   input.push(part);
   if(input.reduce((sum,b)=>sum+b.length,0)>8_000_000)throw new Error('SEO input too large');
 }
 const rows=JSON.parse(Buffer.concat(input).toString('utf8'));
 generate(async()=>rows).catch(e=>{console.error('[job SEO generation]',e);process.exitCode=1;});
}
