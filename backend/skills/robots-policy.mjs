import robotsParser from 'robots-parser';

const cache = new Map();

export async function canCrawl(targetUrl, userAgent = 'TheCareersBot/1.0') {
  const u = new URL(targetUrl);
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
  return robot.isAllowed(targetUrl, userAgent) !== false;
}
