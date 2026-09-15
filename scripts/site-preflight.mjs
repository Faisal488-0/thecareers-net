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

const has = (rx) => rx.test(names + '\n' + corpus);
const checks = [
  ['Privacy policy', has(/privacy/i)],
  ['Terms & conditions', has(/(terms[-_ ]?(of[-_ ]?service|and[-_ ]?conditions)|terms & conditions)/i)],
  ['Robots file/config', /(^|\/)robots\.(txt|ts|js)$/im.test(names) || /robots\s*:/i.test(corpus)],
  ['Sitemap file/config', /(^|\/)sitemap\.(xml|ts|js)$/im.test(names) || /sitemap/i.test(corpus)],
  ['Favicon/app icon', /(favicon|apple-touch-icon|(^|\/)icon\.(png|svg|ico)|icons\/)/im.test(names + '\n' + corpus)],
  ['Custom 404 / not-found', /(^|\/)(404|not-found)(\.|\/|$)/im.test(names) || /notFoundComponent/i.test(corpus)],
  ['Meta description', /<meta[^>]+name=["']description["']/i.test(corpus) || /description\s*:/i.test(corpus)],
  ['Canonical URL', /rel=["']canonical["']/i.test(corpus) || /canonical\s*:/i.test(corpus)],
  ['HTML language attribute', /<html[^>]+\blang=/i.test(corpus)],
  ['Primary H1 present', /<h1\b/i.test(corpus)],
  ['Structured data', /application\/ld\+json/i.test(corpus) || /schema\.org/i.test(corpus)],
  ['Social preview metadata', /(og:title|og:description|openGraph\s*:|twitter\s*:)/i.test(corpus)],
  ['Social preview image', /(og:image|twitter:image|opengraph-image|twitter-image)/i.test(names + '\n' + corpus)],
  ['Mobile viewport', /name=["']viewport["']/i.test(corpus) || /viewport\s*:/i.test(corpus)],
  ['llms.txt guidance', /(^|\/)llms\.txt$/im.test(names)],
  ['Analytics/telemetry hook', /(analytics|gtag\(|googletagmanager|speed-insights|plausible|posthog|umami)/i.test(corpus)],
  ['Cookie consent handling', /(cookie.{0,30}consent|consent.{0,30}cookie)/i.test(corpus)],
];

const imgTags = corpus.match(/<img\b[^>]*>/gi) || [];
const missingAlt = imgTags.filter((tag) => !/\balt\s*=/.test(tag));
const insecureLinks = (corpus.match(/http:\/\/(?!localhost|127\.0\.0\.1)[^\s"')<>]+/gi) || []).slice(0, 10);
const sourceMaps = rels.filter((r) => r.endsWith('.map') && !r.includes('node_modules/'));

const htmlFiles = files.filter((f) => ['.html', '.htm'].includes(extname(f).toLowerCase()));
const htmlHeadingIssues = [];
for (const file of htmlFiles) {
  try {
    const data = await readFile(file, 'utf8');
    const count = (data.match(/<h1\b/gi) || []).length;
    if (count !== 1) htmlHeadingIssues.push(`${relative(root, file).replaceAll('\\', '/')} (${count} H1)`);
  } catch {}
}

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
const largeJs = [];
for (const file of files) {
  try {
    const s = await stat(file);
    const ext = extname(file).toLowerCase();
    const rel = relative(root, file).replaceAll('\\', '/');
    if (imageExts.has(ext) && s.size > 1_500_000) largeImages.push(`${rel} (${(s.size / 1_048_576).toFixed(1)} MB)`);
    if (ext === '.js' && s.size > 2_000_000) largeJs.push(`${rel} (${(s.size / 1_048_576).toFixed(1)} MB)`);
  } catch {}
}

const lines = ['# Website production preflight', ''];
for (const [label, ok] of checks) lines.push(`${ok ? '✅' : '⚠️'} ${label}`);
lines.push('', `Images without alt detected: ${missingAlt.length}`);
lines.push(`HTML pages with H1 count != 1: ${htmlHeadingIssues.length}`);
lines.push(`Large images (>1.5 MB): ${largeImages.length}`);
lines.push(`Large JavaScript files (>2 MB): ${largeJs.length}`);
lines.push(`Committed source maps: ${sourceMaps.length}`);
lines.push(`Insecure http:// links: ${insecureLinks.length}`);
lines.push(`Potential hard-coded secrets: ${secretHits.length}`);
if (htmlHeadingIssues.length) lines.push('', 'Heading issues:', ...htmlHeadingIssues.slice(0, 30).map((x) => `- ${x}`));
if (largeImages.length) lines.push('', 'Large images:', ...largeImages.slice(0, 20).map((x) => `- ${x}`));
if (largeJs.length) lines.push('', 'Large JavaScript:', ...largeJs.slice(0, 20).map((x) => `- ${x}`));
if (sourceMaps.length) lines.push('', 'Source maps:', ...sourceMaps.slice(0, 20).map((x) => `- ${x}`));
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
