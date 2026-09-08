import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { CheerioCrawler, PlaywrightCrawler, RequestQueue, log } from 'crawlee';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function fingerprint(job) {
  const s = [job.title, job.company, job.location, job.url].map(x => String(x || '').trim().toLowerCase()).join('|');
  return crypto.createHash('sha256').update(s).digest('hex');
}

function normalizeUrl(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

async function emit(message, level='ok', runId=null, meta={}) {
  log.info(message);
  if (DRY_RUN) return;
  await supabase.from('search_events').insert({ run_id: runId, message, level, meta });
}

async function upsertJobs(jobs, sourceId, runId) {
  const rows = jobs.filter(j => j.title && j.url).map(j => ({
    ...j,
    source_id: sourceId,
    fingerprint: fingerprint(j),
    status: 'active',
    found_at: new Date().toISOString()
  }));
  if (!rows.length || DRY_RUN) return rows.length;
  const { error } = await supabase.from('jobs').upsert(rows, { onConflict: 'fingerprint', ignoreDuplicates: false });
  if (error) throw error;
  await emit(`Stored ${rows.length} normalized jobs`, 'ok', runId, { source_id: sourceId });
  return rows.length;
}

const { data: sources, error: sourceError } = await supabase
  .from('sources')
  .select('*')
  .eq('enabled', true)
  .order('priority', { ascending: false });
if (sourceError) throw sourceError;
if (!sources?.length) {
  console.log('No enabled sources. Add sources in Supabase table public.sources.');
  process.exit(0);
}

const { data: run, error: runError } = DRY_RUN ? { data:{id:null}, error:null } : await supabase
  .from('search_runs')
  .insert({ trigger: 'github_actions', status: 'running', started_at: new Date().toISOString() })
  .select('id').single();
if (runError) throw runError;
const runId = run.id;
let found = 0;

for (const source of sources) {
  const cfg = source.config || {};
  try {
    await emit(`Scanning ${source.name}`, 'info', runId, { source_id: source.id, engine: source.engine });
    const requestQueue = await RequestQueue.open(`src-${source.id}-${Date.now()}`);
    await requestQueue.addRequest({ url: source.url, userData: { source } });
    const collected = [];

    const makeJob = ($, el, pageUrl) => {
      const q = sel => sel ? clean($(el).find(sel).first().text()) : '';
      const linkEl = cfg.link_selector ? $(el).find(cfg.link_selector).first() : $(el).find('a').first();
      const href = linkEl.attr('href');
      return {
        title: q(cfg.title_selector) || clean(linkEl.text()),
        company: q(cfg.company_selector) || source.default_company || source.name,
        location: q(cfg.location_selector) || source.default_location || 'Kuwait',
        employment_type: q(cfg.type_selector) || null,
        category: q(cfg.category_selector) || null,
        description: q(cfg.description_selector) || null,
        published_at: null,
        url: normalizeUrl(href, pageUrl),
        source_name: source.name,
        score: 0,
        verified: false
      };
    };

    if (source.engine === 'playwright') {
      const crawler = new PlaywrightCrawler({
        requestQueue,
        maxRequestsPerCrawl: source.max_pages || 5,
        maxConcurrency: 2,
        requestHandlerTimeoutSecs: 45,
        async requestHandler({ page, request }) {
          await page.waitForLoadState('domcontentloaded');
          if (cfg.wait_for) await page.waitForSelector(cfg.wait_for, { timeout: 15000 }).catch(()=>{});
          const items = await page.locator(cfg.item_selector || 'a').evaluateAll((els, cfg) => els.slice(0, 100).map(el => {
            const txt = sel => sel ? (el.querySelector(sel)?.textContent || '').trim() : '';
            const link = cfg.link_selector ? el.querySelector(cfg.link_selector) : el.querySelector('a') || el;
            return {
              title: txt(cfg.title_selector) || (link?.textContent || '').trim(),
              company: txt(cfg.company_selector),
              location: txt(cfg.location_selector),
              employment_type: txt(cfg.type_selector),
              category: txt(cfg.category_selector),
              description: txt(cfg.description_selector),
              href: link?.getAttribute('href') || ''
            };
          }), cfg);
          for (const j of items) collected.push({
            ...j,
            company: clean(j.company) || source.default_company || source.name,
            location: clean(j.location) || source.default_location || 'Kuwait',
            url: normalizeUrl(j.href, request.loadedUrl || request.url),
            source_name: source.name,
            score: 0,
            verified: false
          });
        }
      });
      await crawler.run();
    } else {
      const crawler = new CheerioCrawler({
        requestQueue,
        maxRequestsPerCrawl: source.max_pages || 5,
        maxConcurrency: 4,
        requestHandlerTimeoutSecs: 30,
        async requestHandler({ $, request }) {
          $(cfg.item_selector || 'a').slice(0, 100).each((_, el) => collected.push(makeJob($, el, request.loadedUrl || request.url)));
        }
      });
      await crawler.run();
    }

    const unique = [...new Map(collected.filter(j=>j.url).map(j => [fingerprint(j), j])).values()];
    found += await upsertJobs(unique, source.id, runId);
    if (!DRY_RUN) await supabase.from('sources').update({ last_scan_at: new Date().toISOString(), last_status: 'ok' }).eq('id', source.id);
  } catch (err) {
    await emit(`Source failed: ${source.name} — ${err.message}`, 'warning', runId, { source_id: source.id });
    if (!DRY_RUN) await supabase.from('sources').update({ last_scan_at: new Date().toISOString(), last_status: 'error', last_error: String(err.message).slice(0, 500) }).eq('id', source.id);
  }
}

if (!DRY_RUN) {
  await supabase.from('search_runs').update({ status: 'completed', completed_at: new Date().toISOString(), jobs_found: found }).eq('id', runId);
}
await emit(`Search completed — ${found} jobs processed`, 'ok', runId, { jobs_found: found });
