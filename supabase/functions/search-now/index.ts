import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as cheerio from 'npm:cheerio@1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type':'application/json' } });
}

function clean(v='') { return String(v).replace(/\s+/g,' ').trim(); }
function absolute(href:string|undefined, base:string) { try { return href ? new URL(href, base).href : null; } catch { return null; } }
async function sha256(s:string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error:'POST required' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(url, service, { auth:{ persistSession:false } });

  // Global anti-spam: do not start more than one manual run inside 90 seconds.
  const since = new Date(Date.now()-90_000).toISOString();
  const { data: recent } = await supabase.from('search_runs').select('id,created_at,status').eq('trigger','manual_ui').gte('created_at', since).limit(1);
  if (recent?.length) return json({ ok:true, throttled:true, run_id:recent[0].id, message:'A manual search was already started recently.' });

  const { data: run, error: runErr } = await supabase.from('search_runs')
    .insert({ trigger:'manual_ui', status:'running', started_at:new Date().toISOString() })
    .select('id').single();
  if (runErr) return json({ error:runErr.message }, 500);
  const runId = run.id;

  await supabase.from('search_events').insert({ run_id:runId, level:'info', message:'Manual backend search started' });

  const { data:sources, error:srcErr } = await supabase.from('sources')
    .select('*').eq('enabled',true).eq('engine','cheerio').order('priority',{ascending:false}).limit(8);
  if (srcErr) return json({ error:srcErr.message, run_id:runId }, 500);

  let found=0, errors=0;
  for (const source of sources || []) {
    const cfg = source.config || {};
    try {
      await supabase.from('search_events').insert({ run_id:runId, level:'info', message:`Scanning ${source.name}` });
      const res = await fetch(source.url, { headers:{'User-Agent':'TheCareersBot/1.0 (+job-search; contact site owner)'}, signal:AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const rows:any[] = [];
      $(cfg.item_selector || 'a').slice(0,80).each((_:number, el:any) => {
        const q=(sel:string)=>sel?clean($(el).find(sel).first().text()):'';
        const link = cfg.link_selector ? $(el).find(cfg.link_selector).first() : ($(el).is('a') ? $(el) : $(el).find('a').first());
        const href = absolute(link.attr('href'), source.url);
        const title = q(cfg.title_selector) || clean(link.text());
        if (!title || !href) return;
        rows.push({ title, company:q(cfg.company_selector)||source.default_company||source.name, location:q(cfg.location_selector)||source.default_location||'Kuwait', employment_type:q(cfg.type_selector)||null, category:q(cfg.category_selector)||null, description:q(cfg.description_selector)||null, url:href, source_id:source.id, source_name:source.name, score:0, verified:false, status:'active' });
      });
      for (const row of rows) row.fingerprint = await sha256([row.title,row.company,row.location,row.url].join('|').toLowerCase());
      if (rows.length) {
        const { error } = await supabase.from('jobs').upsert(rows,{onConflict:'fingerprint'});
        if (error) throw error;
        found += rows.length;
      }
      await supabase.from('sources').update({last_scan_at:new Date().toISOString(),last_status:'ok',last_error:null}).eq('id',source.id);
    } catch (e) {
      errors++;
      const message = e instanceof Error ? e.message : String(e);
      await supabase.from('search_events').insert({ run_id:runId, level:'warning', message:`${source.name} failed: ${message}` });
      await supabase.from('sources').update({last_scan_at:new Date().toISOString(),last_status:'error',last_error:message.slice(0,500)}).eq('id',source.id);
    }
  }

  await supabase.from('search_runs').update({ status:'completed', completed_at:new Date().toISOString(), jobs_found:found, errors }).eq('id',runId);
  await supabase.from('search_events').insert({ run_id:runId, level:'ok', message:`Search completed — ${found} jobs processed` });
  return json({ ok:true, run_id:runId, jobs_processed:found, errors });
});
