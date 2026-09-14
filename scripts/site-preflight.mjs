import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.vercel', 'coverage', '.turbo']);
const textExts = new Set(['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.md', '.mdx', '.css', '.json', '.vue', '.svelte']);
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const files = await walk(root);
const rels = files.map((f) => relative(root, f).replaceAll('\\', '/'));
const textFiles = files.filter((f) => textExts.has(extname(f).toLowerCase()));
const chunks = [];
for (const file of textFiles) {
  try {
    const s = await stat(file);
    if (s.size <= 2_000_000) chunks.push(await readFile(file, 'utf8'));
  } catch {}
}
const corpus = chunks.join('\n');
const names = rels.join('\n');

const checks = [
  ['Privacy policy', /privacy/i.test(names + corpus)],
  ['Terms & conditions', /(terms[-_ ]?(of[-_ ]?service|and[-_ ]?conditions)|terms & conditions)/i.test(names + corpus)],
  ['Robots file/config', /(^|\/)robots\.(txt|ts|js)$/im.test(names) || /robots\s*:/i.test(corpus)],
  ['Sitemap file/config', /(^|\/)sitemap\.(xml|ts|js)$/im.test(names) || /sitemap/i.test(corpus)],
  ['Favicon/app icon', /(favicon|apple-touch-icon|icon\.(png|svg|ico)|icons\/)/i.test(names + corpus)],
  ['Meta description', /<meta[^>]+name=["']description["']/i.test(corpus) || /description\s*:/i.test(corpus)],
  ['Social preview metadata', /(og:title|og:description|openGraph\s*:|twitter\s*:)/i.test(corpus)],
  ['Mobile viewport', /name=["']viewport["']/i.test(corpus) || /viewport\s*:/i.test(corpus)],
  ['Custom 404 / not-found', /(^|\/)(404|not-found)(\.|\/|$)/im.test(names)],
  ['Analytics/telemetry hook', /(analytics|gtag\(|googletagmanager|speed-insights|plausible|posthog|umami)/i.test(corpus)],
  ['Cookie consent handling', /(cookie.{0,30}consent|consent.{0,30}cookie)/i.test(corpus)],
];

const imgTags = corpus.match(/<img\b[^>]*>/gi) || [];
const missingAlt = imgTags.filter((tag) => !/\balt\s*=/.test(tag));
const insecureLinks = (corpus.match(/http:\/\/(?!localhost|127\.0\.0\.1)[^\s"')<>]+/gi) || []).slice(0, 10);

const sourceFiles = textFiles.filter((f) => {
  const r = relative(root, f).replaceAll('\\', '/');
  return !/(^|\/)(\.env|env\.example|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.github\/)/i.test(r);
});
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9]{30,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\b(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|OPENAI_API_KEY)\s*[:=]\s*["'][^"']{12,}["']/i,
];
const secretHits = [];
for (const file of sourceFiles) {
  try {
    const data = await readFile(file, 'utf8');
    if (secretPatterns.some((rx) => rx.test(data))) secretHits.push(relative(root, file).replaceAll('\\', '/'));
  } catch {}
}

const largeImages = [];
for (const file of files.filter((f) => imageExts.has(extname(f).toLowerCase()))) {
  try {
    const s = await stat(file);
    if (s.size > 1_500_000) largeImages.push(`${relative(root, file).replaceAll('\\', '/')} (${(s.size / 1_048_576).toFixed(1)} MB)`);
  } catch {}
}

const lines = ['# Website preflight', ''];
for (const [label, ok] of checks) lines.push(`${ok ? '✅' : '⚠️'} ${label}`);
lines.push('', `Images without alt detected: ${missingAlt.length}`);
lines.push(`Large images (>1.5 MB): ${largeImages.length}`);
lines.push(`Insecure http:// links: ${insecureLinks.length}`);
lines.push(`Potential hard-coded secrets: ${secretHits.length}`);
if (largeImages.length) lines.push('', 'Large images:', ...largeImages.slice(0, 20).map((x) => `- ${x}`));
if (insecureLinks.length) lines.push('', 'Insecure links:', ...insecureLinks.map((x) => `- ${x}`));
if (secretHits.length) lines.push('', 'Potential secret locations:', ...secretHits.map((x) => `- ${x}`));

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}

if (secretHits.length) {
  console.error('\nHard-coded secret patterns require review.');
  process.exit(1);
}
