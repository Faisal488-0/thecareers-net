# TheCareers Security Policy

TheCareers treats user privacy, authentication data, CVs, and application records as sensitive data.

## Reporting a vulnerability

Please do **not** disclose security vulnerabilities, credentials, tokens, personal data, or reproduction secrets in a public GitHub issue.

Use GitHub's private vulnerability reporting / Security Advisory flow for this repository when available. If that private flow is unavailable, contact the repository owner through a private channel and include only the minimum information needed to reproduce the issue.

## What to include

- Affected page, endpoint, table, or workflow.
- Clear reproduction steps.
- Expected vs. observed behavior.
- Security impact.
- A safe proof of concept that does not access other users' data.

## Scope priorities

Highest priority issues include:

- Authentication or authorization bypass.
- Row Level Security (RLS) bypass.
- Exposure of `service_role`, private API keys, tokens, or credentials.
- Cross-user access to applications, saved jobs, CVs, or account data.
- Unauthorized writes to Supabase tables or Edge Functions.
- Supply-chain or GitHub Actions compromise.

## Safe handling

Do not download, modify, or retain personal data belonging to other users while testing. Stop testing once a vulnerability is demonstrated.

## Project controls

The repository includes recurring full-history secret scanning, dependency auditing, CodeQL static analysis, and automated dependency update monitoring. Security-sensitive database tables use RLS and least-privilege grants.
