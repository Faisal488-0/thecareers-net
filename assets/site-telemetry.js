/* TheCareers privacy-minimized telemetry
   Records product events to Supabase. No Telegram secret is exposed in the browser. */
(() => {
  'use strict';
  if (window.__TC_SITE_TELEMETRY__) return;
  window.__TC_SITE_TELEMETRY__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  if (!base || !apiKey) return;

  const SESSION_KEY = 'thecareers_session_id_v1';
  const VISIT_KEY = 'thecareers_visit_tracked_v2';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  function userId() {
    try { return window.TheCareersAccount?.user?.id || null; } catch { return null; }
  }

  function cleanMeta(meta) {
    const out = {};
    for (const [k,v] of Object.entries(meta || {})) {
      if (v == null) continue;
      out[k] = typeof v === 'string' ? v.slice(0, 500) : v;
    }
    return out;
  }

  async function track(eventType, meta = {}) {
    if (!eventType) return false;
    const body = {
      event_type: String(eventType).slice(0, 64),
      session_id: sessionId,
      user_id: userId(),
      page: location.pathname.slice(0, 300),
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      meta: cleanMeta(meta)
    };
    try {
      const response = await fetch(`${base}/rest/v1/site_events`, {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        console.warn('[TheCareers] telemetry rejected', response.status);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[TheCareers] telemetry unavailable');
      return false;
    }
  }

  // Mark a visit as tracked only after the backend accepts it. A failed request
  // is retried on the next page load instead of being silently suppressed.
  if (!sessionStorage.getItem(VISIT_KEY)) {
    track('visit', {
      lang: navigator.language || '',
      viewport: `${innerWidth}x${innerHeight}`,
      device: innerWidth <= 760 ? 'mobile' : 'desktop'
    }).then(ok => { if (ok) sessionStorage.setItem(VISIT_KEY, '1'); });
  }

  document.addEventListener('click', e => {
    const job = e.target.closest('.backend-job');
    if (job && e.target.closest('.tc-open-job')) {
      track('job_open', { job_id: job.dataset.jobId || '', url: job.dataset.jobUrl || '' });
      return;
    }
    if (job && e.target.closest('.tc-save-job')) {
      track('job_save', { job_id: job.dataset.jobId || '' });
      return;
    }
    if (e.target.closest('#searchNowBtn')) {
      track('search_now');
      return;
    }
    if (e.target.closest('#tcAnalyze')) {
      track('cv_analyze_started');
      return;
    }
    if (e.target.closest('#tcAuthSubmit')) track('auth_submit');
  }, true);

  window.TheCareersTelemetry = { track };
})();
