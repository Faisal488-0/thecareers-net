import robotsParser from 'robots-parser';

const cache = new Map();

export async function canCrawl(targetUrl, userAgent = 'TheCareersBot/1.0') {
  // robots.txt is origin-scoped. A relative URL has no origin by itself, so it
  // cannot be checked safely here; callers should resolve it against the
  // discovered source URL first. Treat it as non-crawlable instead of crashing
  // the entire ingestion workflow.
  let u;
  try {
    u = new URL(targetUrl);
  } catch {
    return false;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

  const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
  let robot = cache.get(robotsUrl);
  if (!robot) {
    try {
      const res = await fetch(robotsUrl, { headers: { 'user-agent': userAgent } });
      const body = res.ok ? await res.text() : '';
      robot = robotsParser(robotsUrl, body);
    } catch {
      robot = robotsParser(robotsUrl, '');
    }
    cache.set(robotsUrl, robot);
  }
  return robot.isAllowed(u.href, userAgent) !== false;
}
