# TheCareers Backend Skills Pack V1

Installed and wired into `backend/scrape.mjs`:

1. `challenge-detector.mjs` — detects CAPTCHA / anti-bot challenge pages and marks the source blocked instead of crashing the run.
2. `robots-policy.mjs` — checks `robots.txt` before crawling.
3. `rss-reader.mjs` — reads RSS/Atom job feeds.
4. `jsonld-job-parser.mjs` — extracts Schema.org `JobPosting` JSON-LD when available.
5. `normalize-job.mjs` — normalizes URLs and job fields before storage.
6. `relevance-scorer.mjs` — scores jobs against TheCareers preferred categories and Kuwait relevance.
7. `sitemap-discovery.mjs` — discovers career/job URLs from sitemaps.

Core open-source crawler stack already used by the project:
- Crawlee
- Playwright
- Cheerio
- Supabase JS

Additional packages installed:
- robots-parser
- rss-parser
- fast-xml-parser
- normalize-url
- p-limit
- zod

## Source engines

Set `sources.engine` to one of:
- `cheerio`
- `playwright`
- `rss`

Useful `sources.config` options:
```json
{
  "item_selector": ".job-card",
  "title_selector": ".job-title",
  "company_selector": ".company",
  "location_selector": ".location",
  "link_selector": "a",
  "discover_sitemap": true,
  "sitemap_limit": 40,
  "max_concurrency": 2,
  "default_category": "Operations",
  "preferred_terms": ["HR", "Operations", "Administration", "Oil & Gas"]
}
```

The challenge detector intentionally does not solve or bypass CAPTCHA/anti-bot protections. A challenged source is logged with `challenge_blocked` so it can be switched to an official API/RSS feed or manually reviewed.
