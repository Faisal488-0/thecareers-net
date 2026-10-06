# MiroFish Site Lab

Read-only synthetic-customer testing for Faisal's public websites.

## Scope

Targets:
- ShamX
- TheCareers.net
- TheCareers.org
- Al-Fahad International

Explicitly excluded:
- Kuwait AI Teacher / `Faisal488-0/kuwait-ai-teacher`

This lab does **not** change production pages, databases, authentication, job data, RFQs, DNS, deployments, or business logic.

## Free-only rule

The lab is pinned to `shayswrld/mirofish@8d4eea4dfa981ecd23c3b385953b4085dfd9b6ca` because that fork supports local Ollama and local graph storage without Zep.

No paid API fallback is allowed. If local Ollama is unavailable, the full MiroFish stage stops rather than switching to a paid provider.

## Run policy

1. Capture each live site into a text seed.
2. Preserve fetch failures instead of fabricating page content.
3. Use site-specific simulation requirements from `prompts/`.
4. Start small: 12-24 synthetic users and 2-4 rounds.
5. Treat output as hypothesis generation, not real customer evidence.
6. Never auto-edit a production site from MiroFish findings.

The “1000 fake customers” claim is intentionally not the default. A 1000-agent run is compute-heavy and is not appropriate for a free smoke test.

## Files

- `targets.json` — sites, repositories, audiences, exclusions.
- `scripts/snapshot_sites.py` — deterministic live-page capture and seed generation.
- `prompts/all-sites.md` — simulation questions for each site.
- GitHub workflow `.github/workflows/mirofish-site-lab.yml` — creates seed artifacts without touching production.
