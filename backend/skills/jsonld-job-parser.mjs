export function extractJobPostingJsonLd($, pageUrl, defaults = {}) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    const stack = Array.isArray(data) ? [...data] : [data];
    while (stack.length) {
      const item = stack.shift();
      if (!item || typeof item !== 'object') continue;
      if (Array.isArray(item['@graph'])) stack.push(...item['@graph']);
      const type = item['@type'];
      const types = Array.isArray(type) ? type : [type];
      if (!types.includes('JobPosting')) continue;
      const org = item.hiringOrganization || {};
      const loc = Array.isArray(item.jobLocation) ? item.jobLocation[0] : item.jobLocation;
      const address = loc?.address || {};
      let url = item.url || pageUrl;
      try { url = new URL(url, pageUrl).href; } catch {}
      out.push({
        title: item.title || '',
        company: org.name || defaults.company || '',
        location: [address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join(', ') || defaults.location || 'Kuwait',
        employment_type: Array.isArray(item.employmentType) ? item.employmentType.join(', ') : item.employmentType || null,
        category: item.industry || defaults.category || null,
        description: typeof item.description === 'string' ? item.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '',
        published_at: item.datePosted || null,
        url,
        source_name: defaults.sourceName || '',
        score: 0,
        verified: true
      });
    }
  });
  return out;
}
