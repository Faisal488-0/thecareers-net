# TheCareers Job API Source Registry

Purpose: keep a persistent shortlist of job APIs / structured ATS feeds to expand TheCareers coverage with higher precision than generic scraping.

## Priority 1 — broad coverage APIs

1. **JSearch** — broad aggregated job search API. Use as a discovery layer, then deduplicate and prefer canonical employer URLs when available.
2. **Jooble REST API** — official job-search API suitable for job portals and country-specific coverage.
3. **Adzuna API** — structured jobs, location, employer and salary fields in supported markets.
4. **Careerjet API** — international job aggregation API for broader country coverage.
5. **Reed API** — strong UK coverage; useful especially for education and international-school roles.
6. **Arbeitnow API** — useful supplemental feed for European / remote opportunities.

## Priority 2 — official ATS / employer feeds

Prefer these over aggregators whenever a company or school exposes a legitimate structured endpoint:

7. **Greenhouse** — official/public job-board JSON endpoints used by many employers.
8. **Lever** — structured public postings endpoints for employers using Lever.
9. **Ashby** — structured job-board data where publicly exposed by the employer.
10. **Workday career endpoints** — employer-specific structured career-site endpoints when legitimately public; treat as per-employer integrations rather than one universal public API.

## Integration order for TheCareers

1. Official employer / ATS structured feed
2. JSearch / Jooble / Adzuna / Careerjet
3. Trusted server-rendered HTML scraping
4. Playwright only when necessary for legitimate JS-rendered public pages
5. Everything passes the TheCareers quality gate before publication

## Quality rules

- Require clear job title, clear employer/entity, and valid HTTP/HTTPS job URL.
- Prefer direct/canonical employer job URL over aggregator redirect.
- Deduplicate by normalized title + company + location + canonical URL.
- Reject navigation/legal/product/content pages.
- Reject expired postings when expiry is known.
- Never bypass CAPTCHA, login barriers, robots.txt, or access controls.
- Store API secrets only in server-side secrets / GitHub Actions / Supabase secrets, never frontend code.

## Next implementation target

**Start with JSearch** as the first broad API connector, then add Jooble as the second connector. Both must normalize into the existing `jobs` schema and pass the same validation/quality gate before becoming `active`.
