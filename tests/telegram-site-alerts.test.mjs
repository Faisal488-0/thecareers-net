import test from 'node:test';
import assert from 'node:assert/strict';
import { reportWindow, runReport } from '../backend/telegram-site-alerts.mjs';

const env = {
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
  TELEGRAM_BOT_TOKEN: 'fake-token',
  TELEGRAM_CHAT_ID: '123'
};
function harness({ token, brokenSource, telegramOk = true } = {}) {
  const calls = [];
  const logs = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('api.telegram.org')) {
      return { ok: telegramOk, status: telegramOk ? 200 : 500, json: async () => ({ ok: telegramOk }) };
    }
    if (brokenSource && url.includes(brokenSource)) return { ok: false, status: 403 };
    if (url.includes('api.cloudflare.com')) {
      return {
        ok: true, status: 200,
        json: async () => ({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [{ count: 23, sum: { visits: 17 } }] }] } } })
      };
    }
    return { ok: true, headers: { get: () => '0-0/3' } };
  };
  const log = { log: s => logs.push(s), error: s => logs.push(s) };
  return { calls, fetchImpl, log };
}

test('eight-hour intervals align to Kuwait midnight, 08:00, 16:00', () => {
  const { start, end } = reportWindow(Date.parse('2026-11-22T04:30:00Z'));
  assert.equal(start.toISOString(), '2026-11-21T13:00:00.000Z');
  assert.equal(end.toISOString(), '2026-11-21T21:00:00.000Z');
  assert.equal(end.getTime() - start.getTime(), 8 * 3600 * 1000);
});

test('one delivery, five Supabase queries, and transparent Cloudflare missing-token state', async () => {
  const h = harness();
  const result = await runReport({ env, fetchImpl: h.fetchImpl, log: h.log, now: Date.parse('2026-11-22T04:30:00Z') });
  assert.equal(h.calls.filter(c => c.url.includes('api.telegram.org')).length, 1);
  assert.equal(h.calls.filter(c => c.url.includes('/rest/v1/')).length, 5);
  assert.equal(result.results.length, 6);
  assert.equal(result.results.find(s => s.domain === 'nooo.si').visits, 3);
  assert.equal(result.results.find(s => s.domain === 'shamx.net').status, 'not_configured');
  assert.match(result.message, /shamx\.net: غير مربوط \(Cloudflare Analytics\)/);
  assert.match(result.message, /الفترة \(الكويت\): 2026-11-21 16:00 — 2026-11-22 00:00/);
});

test('Cloudflare mode reads actual Cloudflare visit count when token exists', async () => {
  const h = harness();
  const result = await runReport({ env: { ...env, CF_ANALYTICS_API_TOKEN: 'test-cf-token' }, fetchImpl: h.fetchImpl, log: h.log });
  assert.equal(h.calls.filter(c => c.url.includes('api.cloudflare.com')).length, 1);
  const graphql = JSON.parse(h.calls.find(c => c.url.includes('api.cloudflare.com')).options.body).query;
  assert.match(graphql, /rumPageloadEventsAdaptiveGroups/);
  assert.match(graphql, /siteTag/);
  assert.doesNotMatch(graphql, /httpRequestsAdaptiveGroups/);
  assert.equal(result.results.find(s => s.domain === 'shamx.net').visits, 17);
  assert.equal(result.results.find(s => s.domain === 'shamx.net').pageViews, 23);
  assert.match(result.message, /shamx\.net: 17 زيارة متصفح، 23 مشاهدة صفحة \(Cloudflare\)/);
});

test('a failing source is not reported as zero, while other sites still report', async () => {
  const h = harness({ brokenSource: 'site_domain=eq.alfahadkw.com' });
  const result = await runReport({ env, fetchImpl: h.fetchImpl, log: h.log });
  assert.equal(result.results.find(s => s.domain === 'alfahadkw.com').status, 'error');
  assert.match(result.message, /alfahadkw\.com: تعذّر قراءة الإحصائيات/);
  assert.equal(h.calls.filter(c => c.url.includes('api.telegram.org')).length, 1);
});

test('delivery failures propagate instead of claiming a successful alert', async () => {
  const h = harness({ telegramOk: false });
  await assert.rejects(runReport({ env, fetchImpl: h.fetchImpl, log: h.log }), /Telegram delivery failed/);
});
