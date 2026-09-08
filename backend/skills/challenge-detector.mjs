const CAPTCHA_MARKERS = [
  'captcha', 'recaptcha', 'hcaptcha', 'cf-chl-', 'challenge-platform',
  'verify you are human', 'are you a human', 'checking your browser',
  'access denied', 'bot detection', 'unusual traffic'
];

export function detectChallenge({ html = '', title = '', status = 200, url = '' } = {}) {
  const haystack = `${title}\n${url}\n${html}`.toLowerCase();
  const marker = CAPTCHA_MARKERS.find(x => haystack.includes(x));
  const blockedStatus = [401, 403, 429, 503].includes(Number(status));
  return {
    challenged: Boolean(marker || blockedStatus),
    reason: marker ? `marker:${marker}` : blockedStatus ? `http:${status}` : null
  };
}

export async function detectPageChallenge(page) {
  const [title, html] = await Promise.all([
    page.title().catch(() => ''),
    page.content().catch(() => '')
  ]);
  return detectChallenge({ title, html, url: page.url() });
}
