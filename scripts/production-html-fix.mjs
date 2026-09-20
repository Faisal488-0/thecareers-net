import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const site = 'https://thecareers.net'
const socialImage = `${site}/assets/global-search-blackhole.webp`
const mobileBuild = '20260916a'

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

function insertBeforeBodyEnd(html, markup) {
  return html.replace(/<\/body>/i, `${markup}\n</body>`)
}

for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/')
  let html = await readFile(file, 'utf8')
  const isArabic = rel.startsWith('ar/')
  const isDashboard = rel === 'index.html'
  const url = isDashboard ? `${site}/` : `${site}/${rel}`
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || 'TheCareers'
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]?.trim() || 'TheCareers AI-assisted job discovery and matching.'

  if (!/<html[^>]+\blang=/i.test(html)) {
    html = html.replace(/<html(\s|>)/i, `<html lang="${isArabic ? 'ar' : 'en'}"$1`)
  }
  if (!/rel=["']icon["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, '<link rel="icon" href="/favicon.svg" type="image/svg+xml">')
  }
  if (!/rel=["']manifest["']/i.test(html)) {
    html = insertBeforeHeadEnd(html, '<link rel="manifest" href="/manifest.webmanifest">')
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

  // The mobile/UX hardening assets live in the repository but the source
  // dashboard historically did not load them. Wire them into the production
  // artifact here so desktop remains unchanged and mobile gets native scroll,
  // responsive layout, a usable nav drawer, and deliberate globe gestures.
  if (isDashboard) {
    // config.js is the single production bootstrap for UI/UX CSS, mobile
    // interaction scripts and the service worker. Avoid injecting older
    // duplicate assets here, which can cause conflicting CSS/listeners.
    const hasRuntimeBootstrap = /<script[^>]+src=["']\.\/config\.js(?:\?[^"']*)?["']/i.test(html)
    if (!hasRuntimeBootstrap) {
      if (!/assets\/ui-ux-pro-max\.css/i.test(html)) {
        html = insertBeforeHeadEnd(html, `<link rel="stylesheet" href="./assets/ui-ux-pro-max.css?v=${mobileBuild}">`)
      }
      const mobileScripts = [
        'mobile-nav.js',
        'mobile-jobs-fix.js',
        'mobile-globe-touch.js'
      ]
      for (const script of mobileScripts) {
        if (!html.includes(`assets/${script}`)) {
          html = insertBeforeBodyEnd(html, `<script src="./assets/${script}?v=${mobileBuild}" defer></script>`)
        }
      }
      if (!/navigator\.serviceWorker\.register/i.test(html)) {
        html = insertBeforeBodyEnd(html, `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}</script>`)
      }
    }
  }

  await writeFile(file, html, 'utf8')
  console.log(`Prepared ${rel}`)
}
