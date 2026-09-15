import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const site = 'https://thecareers.net'
const socialImage = `${site}/assets/global-search-blackhole.webp`

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'backend', 'docs', 'qa', 'scripts', 'supabase', 'tools'].includes(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (['.html', '.htm'].includes(extname(full).toLowerCase())) out.push(full)
  }
  return out
}

function insertBeforeHeadEnd(html, markup) {
  return html.replace(/<\/head>/i, `${markup}\n</head>`)
}

for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/')
  let html = await readFile(file, 'utf8')
  const isArabic = rel.startsWith('ar/')
  const url = rel === 'index.html' ? `${site}/` : `${site}/${rel}`
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || 'TheCareers'
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]?.trim() || 'TheCareers AI-assisted job discovery and matching.'

  if (!/<html[^>]+\blang=/i.test(html)) {
    html = html.replace(/<html(\s|>)/i, `<html lang="${isArabic ? 'ar' : 'en'}"$1`)
  }
  if (!/rel=["']icon["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, '<link rel="icon" href="/favicon.svg" type="image/svg+xml">')
  }
  if (!/rel=["']manifest["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, '<link rel="manifest" href="/site.webmanifest">')
  }
  if (!/rel=["']canonical["']/i.test(html) && !/name=["']robots["'][^>]+noindex/i.test(html)) {
    html = insertBeforeHeadEnd(html, `<link rel="canonical" href="${url}">`)
  }
  if (!/property=["']og:image["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, `<meta property="og:image" content="${socialImage}">\n<meta property="og:image:alt" content="TheCareers AI job search">`)
  }
  if (!/name=["']twitter:image["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, `<meta name="twitter:image" content="${socialImage}">`)
  }
  if (!/application\/ld\+json/i.test(html) && !/name=["']robots["'][^>]+noindex/i.test(html)) {
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      inLanguage: isArabic ? 'ar-KW' : 'en',
      isPartOf: { '@type': 'WebSite', name: 'TheCareers', url: `${site}/` },
    })
    html = insertBeforeHeadEnd(html, `<script type="application/ld+json">${schema}</script>`)
  }
  if (!/<h1\b/i.test(html) && !/name=["']robots["'][^>]+noindex/i.test(html)) {
    const safeTitle = title.replace(/[<&]/g, '')
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n<h1 style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${safeTitle}</h1>`)
  }

  await writeFile(file, html, 'utf8')
  console.log(`Prepared ${rel}`)
}
