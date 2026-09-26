// Network-only read stage for the public, approved job feed.
// Writes JSON to stdout; does not read or write any local files.
const BASE='https://cqqozlmsvysmxdkkxjbj.supabase.co';
const key=String(process.env.THECAREERS_SEO_PUBLIC_KEY||'').trim();
if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw new Error('Invalid public publishable key');
const fields='id,title,company,description,location,country,employment_type,published_at,updated_at,url,status,verified,quality_status';
const query='/rest/v1/jobs?select='+fields+'&status=eq.active&verified=eq.true&quality_status=eq.approved&published_at=not.is.null&order=published_at.desc&limit=1000';
const response=await fetch(BASE+query,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('Approved read-only feed returned HTTP '+response.status);
const records=await response.json();
if(!Array.isArray(records)||!records.length||records.length>=1000)throw new Error('Approved feed empty or hit safety limit');
process.stdout.write(JSON.stringify(records));
