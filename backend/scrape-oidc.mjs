import crypto from 'node:crypto';
import { CheerioCrawler, PlaywrightCrawler, RequestQueue, log } from 'crawlee';
import { load as loadHtml } from 'cheerio';

import { detectChallenge, detectPageChallenge } from './skills/challenge-detector.mjs';
import { canCrawl } from './skills/robots-policy.mjs';
import { readRss } from './skills/rss-reader.mjs';
import { extractJobPostingJsonLd } from './skills/jsonld-job-parser.mjs';
import { normalizeJob } from './skills/normalize-job.mjs';
import { scoreJob } from './skills/relevance-scorer.mjs';
import { discoverFromSitemap } from './skills/sitemap-discovery.mjs';

const BRIDGE_URL = process.env.SUPABASE_GITHUB_BRIDGE_URL || 'https://cqqozlmsvysmxdkkxjbj.supabase.co/functions/v1/github-bridge';
let oidcToken = process.env.GITHUB_OIDC_TOKEN || '';
let oidcObtainedAt = 0;
const DRY_RUN = process.env.DRY_RUN === '1';
const USER_AGENT = 'TheCareersBot/1.0 (+https://thecareers.net)';
const OIDC_AUDIENCE = 'thecareers-supabase';
const OIDC_REFRESH_MS = 3 * 60_000;

async function refreshOidcToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) {
    if (oidcToken) return oidcToken;
    throw new Error('GitHub OIDC refresh environment is unavailable');
  }

  const separator = requestUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${requestUrl}${separator}audience=${encodeURIComponent(OIDC_AUDIENCE)}`, {
    headers: { Authorization: `Bearer ${requestToken}` }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok || !data?.value) {
    throw new Error(`Unable to refresh GitHub OIDC token (${res.status})`);
  }

  oidcToken = data.value;
  oidcObtainedAt = Date.now();
  log.info('GitHub OIDC token refreshed');
  return oidcToken;
}

async function ensureFreshOidc() {
  const canRefresh = Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
  if (!oidcToken) return refreshOidcToken();
  if (canRefresh && (!oidcObtainedAt || Date.now() - oidcObtainedAt >= OIDC_REFRESH_MS)) {
    return refreshOidcToken();
  }
  return oidcToken;
}

async function bridge(action, payload = {}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = attempt === 0 ? await ensureFreshOidc() : await refreshOidcToken();
    const res = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if (res.ok && !data?.error) return data;

    const message = String(data?.error || `${res.status} ${text.slice(0, 500)}`);
    lastError = new Error(message);
    const authExpired = res.status === 401 || /\bexp\b|expired|jwt|oidc|token/i.test(message);
    const canRefresh = Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
    if (!(attempt === 0 && authExpired && canRefresh)) break;
  }
  throw lastError || new Error('GitHub bridge request failed');
}

function fingerprint(job) {
  const s = [job.title, job.company, job.location, job.url]
    .map(x => String(x || '').trim().toLowerCase())
    .join('|');
  return crypto.createHash('sha256').update(s).digest('hex');
}

function normalizeUrl(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

async function emit(message, level = 'ok', runId = null, meta = {}) {
  log.info(message);
  if (DRY_RUN) return;
  await bridge('event', { run_id: runId, message, level, meta });
}

async function upsertJobs(jobs, sourceId, runId, source) {
  const preferredTerms = source?.config?.preferred_terms || undefined;
  const rows = jobs
    .map(j => normalizeJob(j, {
      company: source?.default_company,
      location: source?.default_location,
      category: source?.config?.default_category,
      sourceName: source?.name
    }))
    .filter(j => j.title && j.url)
    .map(j => {
      const score = scoreJob(j, preferredTerms);
      return {
        ...j,
        score,
        source_id: sourceId,
        fingerprint: fingerprint(j),
        status: 'active',
        found_at: new Date().toISOString()
      };
    });

  if (!rows.length || DRY_RUN) return rows.length;
  const result = await bridge('upsert_jobs', { rows });
  const stored = Number(result?.count ?? rows.length);
  await emit(`Stored ${stored} normalized jobs`, 'ok', runId, {
    source_id: sourceId,
    submitted: rows.length,
    skipped_invalid: Number(result?.skipped_invalid || 0)
  });
  return stored;
}

async function markSource(source, fields) {
  if (DRY_RUN) return;
  await bridge('mark_source', { source_id: source.id, fields });
}

await ensureFreshOidc();
const sourceReply = await bridge('list_sources');
const sources = sourceReply.data || [];

if (!sources.length) {
  console.log('No enabled sources in Supabase.');
  process.exit(0);
}

const runReply = DRY_RUN ? { data: { id: null } } : await bridge('begin_run');
const runId = runReply.data?.id || null;
let found = 0;
let errors = 0;

for (const source of sources) {
  const cfg = source.config || {};
  try {
    await emit(`Scanning ${source.name}`, 'info', runId, { source_id: source.id, engine: source.engine });

    if (source.engine === 'rss') {
      const rssJobs = await readRss(source.url, {
        company: source.default_company,
        location: source.default_location,
        category: cfg.default_category,
        sourceName: source.name
      });
      found += await upsertJobs(rssJobs, source.id, runId, source);
      await markSource(source, { last_status: 'ok', last_error: null });
      continue;
    }

    const allowed = await canCrawl(source.url, USER_AGENT);
    if (!allowed) {
      await emit(`Skipped by robots.txt: ${source.name}`, 'warning', runId, { source_id: source.id, url: source.url });
      await markSource(source, { last_status: 'robots_blocked', last_error: 'Blocked by robots.txt' });
      continue;
    }

    const requestQueue = await RequestQueue.open(`src-${source.id}-${Date.now()}`);
    await requestQueue.addRequest({ url: source.url, userData: { source } });

    if (cfg.discover_sitemap) {
      const discovered = await discoverFromSitemap(source.url, {
        limit: Math.min(Number(cfg.sitemap_limit || 40), 100)
      }).catch(() => []);
      for (const url of discovered) {
        if (await canCrawl(url, USER_AGENT)) await requestQueue.addRequest({ url, userData: { source, discovered: true } });
      }
      if (discovered.length) await emit(`Discovered ${discovered.length} career URLs from sitemap`, 'info', runId, { source_id: source.id });
    }

    const collected = [];

    const makeJob = ($, el, pageUrl) => {
      const q = sel => sel ? clean($(el).find(sel).first().text()) : '';
      const linkEl = cfg.link_selector ? $(el).find(cfg.link_selector).first() : $(el).find('a').first();
      const href = linkEl.attr('href') || ($(el).is('a') ? $(el).attr('href') : null);
      return {
        title: q(cfg.title_selector) || clean(linkEl.text()) || clean($(el).text()),
        company: q(cfg.company_selector) || source.default_company || source.name,
        location: q(cfg.location_selector) || source.default_location || 'Kuwait',
        employment_type: q(cfg.type_selector) || null,
        category: q(cfg.category_selector) || cfg.default_category || null,
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
        maxRequestsPerCrawl: Math.min(Number(source.max_pages || 5), 25),
        maxConcurrency: Math.min(Number(cfg.max_concurrency || 2), 3),
        requestHandlerTimeoutSecs: 50,
        launchContext: { launchOptions: { headless: true } },
        preNavigationHooks: [async ({ page }) => {
          await page.setExtraHTTPHeaders({
            'user-agent': USER_AGENT,
            'accept-language': 'en-US,en;q=0.9,ar;q=0.8'
          });
        }],
        async requestHandler({ page, request }) {
          await page.waitForLoadState('domcontentloaded');
          if (cfg.wait_for) await page.waitForSelector(cfg.wait_for, { timeout: 15000 }).catch(() => {});
          const challenge = await detectPageChallenge(page);
          if (challenge.challenged) throw new Error(`Anti-bot/CAPTCHA challenge detected (${challenge.reason})`);

          const html = await page.content();
          const $ = loadHtml(html);
          collected.push(...extractJobPostingJsonLd($, request.loadedUrl || request.url, {
            company: source.default_company,
            location: source.default_location,
            category: cfg.default_category,
            sourceName: source.name
          }));

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

          for (const j of items) {
            collected.push({
              ...j,
              company: clean(j.company) || source.default_company || source.name,
              location: clean(j.location) || source.default_location || 'Kuwait',
              category: clean(j.category) || cfg.default_category || null,
              url: normalizeUrl(j.href, request.loadedUrl || request.url),
              source_name: source.name,
              score: 0,
              verified: false
            });
          }
        }
      });
      await crawler.run();
    } else {
      const crawler = new CheerioCrawler({
        requestQueue,
        maxRequestsPerCrawl: Math.min(Number(source.max_pages || 5), 40),
        maxConcurrency: Math.min(Number(cfg.max_concurrency || 4), 6),
        requestHandlerTimeoutSecs: 35,
        additionalMimeTypes: ['application/xhtml+xml'],
        async requestHandler({ $, request, body, response }) {
          const challenge = detectChallenge({
            html: typeof body === 'string' ? body : $.html(),
            status: response?.statusCode,
            url: request.loadedUrl || request.url
          });
          if (challenge.challenged) throw new Error(`Anti-bot/CAPTCHA challenge detected (${challenge.reason})`);

          collected.push(...extractJobPostingJsonLd($, request.loadedUrl || request.url, {
            company: source.default_company,
            location: source.default_location,
            category: cfg.default_category,
            sourceName: source.name
          }));
          $(cfg.item_selector || 'a').slice(0, 100).each((_, el) => collected.push(makeJob($, el, request.loadedUrl || request.url)));
        }
      });
      await crawler.run();
    }

    const unique = [...new Map(
      collected
        .map(j => normalizeJob(j, {
          company: source?.default_company,
          location: source?.default_location,
          category: source?.config?.default_category,
          sourceName: source?.name
        }))
        .filter(j => j.url && j.title)
        .map(j => [fingerprint(j), j])
    ).values()];

    found += await upsertJobs(unique, source.id, runId, source);
    await markSource(source, { last_status: 'ok', last_error: null });
  } catch (err) {
    errors++;
    const message = String(err?.message || err);
    const challenged = /captcha|anti-bot|challenge/i.test(message);
    try {
      await emit(`Source failed: ${source.name} — ${message}`, 'warning', runId, { source_id: source.id, challenged });
      await markSource(source, {
        last_status: challenged ? 'challenge_blocked' : 'error',
        last_error: message.slice(0, 500)
      });
    } catch (bridgeErr) {
      log.error(`Unable to record source failure for ${source.name}: ${String(bridgeErr?.message || bridgeErr)}`);
    }
  }
}

if (!DRY_RUN) await bridge('finish_run', { run_id: runId, status: 'completed', jobs_found: found, errors });
await emit(`Search completed — ${found} jobs processed`, 'ok', runId, { jobs_found: found, errors });
