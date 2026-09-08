## Change summary

Describe what changed and why.

## Pre-merge security checklist

- [ ] No secrets, credentials, service-role keys, private tokens, CVs, or personal data are committed.
- [ ] Browser code contains only public/publishable credentials.
- [ ] Any new user-data table has RLS enabled and explicit SELECT/INSERT/UPDATE/DELETE policies as applicable.
- [ ] Cross-user access was considered and tested.
- [ ] Any new Edge Function validates authentication/authorization or documents why it is intentionally public.
- [ ] New redirects, origins, external domains, and CORS changes are restricted to the minimum required set.
- [ ] Logs do not expose personal data, secrets, tokens, or full request payloads.
- [ ] Security Audit and CodeQL checks pass before merge.

## Privacy / legal impact

- [ ] No new personal data is collected, or the exact data category and retention purpose are documented.
- [ ] If Terms/Privacy behavior changes, the legal document version will be updated before public release.
