import Parser from 'rss-parser';
const parser = new Parser({ timeout: 15000 });

export async function readRss(url, defaults = {}) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, 200).map(item => ({
    title: item.title || '',
    company: defaults.company || feed.title || '',
    location: defaults.location || 'Kuwait',
    employment_type: null,
    category: defaults.category || null,
    description: item.contentSnippet || item.content || item.summary || '',
    published_at: item.isoDate || item.pubDate || null,
    url: item.link || item.guid || null,
    source_name: defaults.sourceName || feed.title || 'RSS',
    score: 0,
    verified: true
  }));
}
