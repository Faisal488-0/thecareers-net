import { spawnSync } from 'node:child_process';

const allowed = new Map([
  ['GHSA-ch52-4w7c-c8xp', {
    package: 'http-cache-semantics',
    reason: 'Upstream has no patched release as of 2026-10-07. TheCareers uses Crawlee as a private outbound crawler and does not implement a shared HTTP response cache or accept client max-stale directives.'
  }]
]);

const run = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8' });
let report;
try {
  report = JSON.parse(run.stdout || '{}');
} catch (error) {
  console.error('Could not parse npm audit JSON:', error);
  console.error(run.stdout);
  process.exit(2);
}

const unresolved = [];
const acknowledged = [];
for (const [pkg, finding] of Object.entries(report.vulnerabilities || {})) {
  const severity = String(finding.severity || '').toLowerCase();
  if (!['high', 'critical'].includes(severity)) continue;

  const advisories = (finding.via || []).filter(v => v && typeof v === 'object');
  const ghsaIds = advisories.map(v => {
    const m = String(v.url || '').match(/GHSA-[a-z0-9-]+/i);
    return m ? m[0] : '';
  }).filter(Boolean);

  const allAllowed = ghsaIds.length > 0 && ghsaIds.every(id => {
    const entry = allowed.get(id);
    return entry && entry.package === pkg;
  });

  if (allAllowed) {
    acknowledged.push({ pkg, severity, ghsaIds });
  } else {
    unresolved.push({ pkg, severity, ghsaIds, via: finding.via });
  }
}

for (const item of acknowledged) {
  console.warn('[security exception]', item.pkg, item.severity, item.ghsaIds.join(','));
}
if (unresolved.length) {
  console.error('Unapproved high/critical npm vulnerabilities:', JSON.stringify(unresolved, null, 2));
  process.exit(1);
}
console.log('No unapproved high/critical npm vulnerabilities.');
