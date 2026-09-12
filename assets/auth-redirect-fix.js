/* TheCareers production auth redirect hotfix.
   Keeps Supabase email confirmation and recovery on thecareers.net and
   consumes implicit-flow tokens before the account/CV module boots. */
(() => {
  'use strict';
  if (window.__TC_AUTH_REDIRECT_FIX__) return;
  window.__TC_AUTH_REDIRECT_FIX__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const supabaseHost = (() => { try { return new URL(cfg.SUPABASE_URL).host; } catch { return ''; } })();
  const redirectTo = String(cfg.AUTH_REDIRECT_URL || 'https://thecareers.net/');
  const sessionKey = 'thecareers_auth_session_v1';
  const flashKey = 'thecareers_auth_flash_v1';

  const cleanAuthUrl = () => {
    const u = new URL(location.href);
    u.hash = '';
    u.searchParams.delete('auth');
    history.replaceState(null, '', u.pathname + (u.search ? u.search : ''));
  };

  // Supabase implicit email-confirmation flow returns the session in the URL hash.
  try {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const err = h.get('error_description') || h.get('error');
    const access = h.get('access_token');
    const refresh = h.get('refresh_token');
    const type = h.get('type') || 'signup';
    if (err) {
      sessionStorage.setItem(flashKey, JSON.stringify({ type: 'error', message: err }));
      cleanAuthUrl();
    } else if (access && refresh) {
      const expiresIn = Number(h.get('expires_in') || 3600);
      localStorage.setItem(sessionKey, JSON.stringify({
        access_token: access,
        refresh_token: refresh,
        token_type: h.get('token_type') || 'bearer',
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn
      }));
      sessionStorage.setItem(flashKey, JSON.stringify({
        type: type === 'recovery' ? 'recovery' : 'confirmed',
        message: type === 'recovery' ? 'Recovery verified.' : 'Email confirmed.'
      }));
      cleanAuthUrl();
    }
  } catch (e) {
    console.warn('[TheCareers] auth callback parse failed', e);
  }

  // The existing account module uses Supabase Auth REST directly. Attach a
  // production redirect to signup/recovery calls so future emails never fall
  // back to localhost when the redirect is allow-listed in Supabase.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    try {
      const raw = typeof input === 'string' ? input : input?.url;
      if (raw && /^https?:/i.test(raw)) {
        const u = new URL(raw);
        const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
        if (u.host === supabaseHost && method === 'POST' && (u.pathname === '/auth/v1/signup' || u.pathname === '/auth/v1/recover')) {
          if (!u.searchParams.has('redirect_to')) u.searchParams.set('redirect_to', redirectTo);
          if (typeof input === 'string') input = u.href;
          else input = new Request(u.href, input);
        }
      }
    } catch (e) {
      console.debug('[TheCareers] auth redirect attachment skipped', e);
    }
    return nativeFetch(input, init);
  };

  // After utility-panels loads, refresh identity immediately. If the user just
  // confirmed their email, guide them straight to CV onboarding.
  const finish = () => {
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      if (window.TheCareersAuth) {
        clearInterval(t);
        try { await window.TheCareersAuth.refresh?.(); } catch {}
        let flash = null;
        try { flash = JSON.parse(sessionStorage.getItem(flashKey) || 'null'); } catch {}
        if (flash?.type === 'confirmed') {
          sessionStorage.removeItem(flashKey);
          setTimeout(() => window.TheCareersAuth.cv?.(), 250);
        }
      } else if (tries >= 80) clearInterval(t);
    }, 100);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finish, { once: true });
  else finish();
})();
