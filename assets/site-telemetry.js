/* TheCareers privacy-minimized telemetry
   Persistent pseudonymous visitor ID + 30-minute sessions.
   No IP collection and no Telegram secret is exposed in the browser. */
(() => {
  'use strict';
  if (window.__TC_SITE_TELEMETRY__) return;
  window.__TC_SITE_TELEMETRY__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  if (!base || !apiKey) return;

  const VISITOR_KEY = 'thecareers_visitor_id_v1';
  const SESSION_KEY = 'thecareers_session_v2';
  const SESSION_TTL = 30 * 60 * 1000;

  const newId = () => crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = newId();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  function loadSession() {
    const now = Date.now();
    try {
      const old = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (old?.id && Number(old.last || 0) + SESSION_TTL > now) {
        old.last = now;
        localStorage.setItem(SESSION_KEY, JSON.stringify(old));
        return old;
      }
    } catch (_) {}
    const fresh = { id: newId(), started: now, last: now, visitTracked: false };
    localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
    return fresh;
  }

  let session = loadSession();

  function touchSession() {
    const now = Date.now();
    try {
      const current = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!current?.id || Number(current.last || 0) + SESSION_TTL <= now) {
        session = { id: newId(), started: now, last: now, visitTracked: false };
      } else {
        session = current;
        session.last = now;
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (_) {}
    return session;
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
    touchSession();
    const body = {
      event_type: String(eventType).slice(0, 64),
      visitor_id: visitorId,
      session_id: session.id,
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
    } catch (_) {
      console.warn('[TheCareers] telemetry unavailable');
      return false;
    }
  }

  // A visit is one 30-minute activity session, shared across tabs on this browser.
  if (!session.visitTracked) {
    track('visit', {
      lang: navigator.language || '',
      viewport: `${innerWidth}x${innerHeight}`,
      device: innerWidth <= 760 ? 'mobile' : 'desktop'
    }).then(ok => {
      if (!ok) return;
      try {
        const current = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        if (current?.id === session.id) {
          current.visitTracked = true;
          current.last = Date.now();
          localStorage.setItem(SESSION_KEY, JSON.stringify(current));
          session = current;
        }
      } catch (_) {}
    });
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

  window.addEventListener('pageshow', touchSession);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) touchSession(); });

  window.TheCareersTelemetry = {
    track,
    visitorId,
    get sessionId() { return session.id; }
  };
})();
