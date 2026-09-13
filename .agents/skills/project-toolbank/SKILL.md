# TheCareers Project Toolbank

Use this skill when designing, extending, or auditing TheCareers.

## Core tools for this project
- Maxun: primary optional scraping/extraction layer for sources that do not already have a stable API. Run from backend/GitHub Actions/server infrastructure only, never from browser code. Normalize, deduplicate, score, and store results in Supabase.
- MadsLorentzen/ai-job-search: reference architecture for job evaluation, CV tailoring, cover-letter generation, and interview preparation. Reuse ideas/patterns; do not blindly replace the existing TheCareers pipeline.
- Plausible Analytics: preferred lightweight analytics option for anonymous product usage. Never send CV content, emails, phone numbers, application text, or other personal job-seeker data.
- OriginKit / Impeccable / Frontend Design / Interface Design / Responsive Craft / Scroll Craft / UI UX Pro Max: design and implementation references for dashboard quality, responsiveness, accessibility, and polished interactions.

## Optional integrations
- Twenty CRM: optional employer/recruiter/company relationship layer. Keep separate from the user's personal application history unless intentionally mapped.
- Botpress: optional help/onboarding assistant. It must not become the core job-matching brain.
- BrightBean Studio: optional social publishing layer for public job-market content.
- three.ws: optional only if a future 3D agent/avatar experience is explicitly approved.
- Vercel vgpu/WebGPU patterns: optional for the AI Search Core globe and visual effects; always provide a non-WebGPU fallback.
- Sceneal.art: inspiration/reference only.
- Cap: documentation/demo recording only; never ship in runtime.

## Pipeline rules
Preferred discovery flow: trusted API/direct source -> existing scraper or Maxun -> schema normalization -> source verification -> dedupe -> scoring -> Supabase -> user review/Telegram -> email/application action.

## Engineering rules
1. Never expose Supabase service-role keys, scraping tokens, email credentials, or Telegram secrets to client code.
2. Do not weaken source verification or email verification to increase job counts.
3. Keep Kuwait/Gulf filters, school/company CV separation, and user approval controls intact.
4. Heavy tools must be optional adapters or workers, not dependencies required to render the dashboard.
5. Preserve the approved central globe/search-core experience unless the user requests a redesign.
6. Any auto-apply/send workflow must retain emergency-stop and audit logging.
