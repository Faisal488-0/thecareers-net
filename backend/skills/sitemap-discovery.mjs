import { XMLParser } from 'fast-xml-parser';
const xml = new XMLParser({ ignoreAttributes: false });

export async function discoverFromSitemap(baseUrl, { limit = 200, include = /career|job|vacanc|employment|recruit/i } = {}) {
  const u = new URL(baseUrl);
  const candidates = [`${u.origin}/sitemap.xml`, `${u.origin}/sitemap_index.xml`];
  const found = new Set();

  async function readSitemap(url, depth = 0) {
    if (depth > 1 || found.size >= limit) return;
    const res = await fetch(url, { headers: { 'user-agent': 'TheCareersBot/1.0' } });
    if (!res.ok) return;
    const doc = xml.parse(await res.text());
    const urls = doc?.urlset?.url;
    for (const item of Array.isArray(urls) ? urls : urls ? [urls] : []) {
      const loc = typeof item === 'string' ? item : item?.loc;
      if (loc && include.test(loc)) found.add(loc);
      if (found.size >= limit) break;
    }
    const maps = doc?.sitemapindex?.sitemap;
    for (const item of Array.isArray(maps) ? maps : maps ? [maps] : []) {
      const loc = typeof item === 'string' ? item : item?.loc;
      if (loc) await readSitemap(loc, depth + 1);
      if (found.size >= limit) break;
    }
  }

  for (const c of candidates) {
    try { await readSitemap(c); } catch {}
    if (found.size) break;
  }
  return [...found].slice(0, limit);
}
