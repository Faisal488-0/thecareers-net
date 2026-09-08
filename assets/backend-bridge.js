(() => {
  const cfg = window.THECAREERS_CONFIG || {};
  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.startsWith('__') && !cfg.SUPABASE_PUBLISHABLE_KEY.startsWith('__');

  if (!ready) {
    console.info('[TheCareers] Supabase not configured yet; keeping UI demo data.');
    return;
  }

  const base = cfg.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json'
  };

  let latestJobs = [];
  let activeJobTab = document.querySelector('.tab.active')?.dataset.tab || 'high';

  async function rest(path, options = {}) {
    const res = await fetch(`${base}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
    if (res.status === 204) return null;
    return res.json();
  }

  function escapeHtml(v='') {
    return String(v).replace(/[&<>'\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[s]));
  }

  function safeJobUrl(value) {
    try {
      const u = new URL(String(value || ''));
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch (_) {
      return '';
    }
  }

  function isToday(value) {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function updateTabCounts(rows) {
    const valid = (rows || []).filter(j => safeJobUrl(j.url));
    const high = valid.filter(j => Number(j.score || 0) >= 85).length;
    const newToday = valid.filter(j => isToday(j.found_at || j.published_at)).length;
    const labels = {
      high: `High Match (${high || Math.min(valid.length, 20)})`,
      all: `All Jobs (${valid.length})`,
      new: `New Today (${newToday})`,
      saved: 'Saved (0)'
    };
    document.querySelectorAll('.tab').forEach(tab => {
      if (labels[tab.dataset.tab]) tab.textContent = labels[tab.dataset.tab];
    });
  }

  function filteredJobs(rows, mode) {
    const valid = (rows || []).filter(j => safeJobUrl(j.url));
    if (mode === 'all') return valid;
    if (mode === 'new') return valid.filter(j => isToday(j.found_at || j.published_at));
    if (mode === 'saved') return [];
    if (mode === 'high') {
      const high = valid.filter(j => Number(j.score || 0) >= 85);
      // Many newly scraped rows may not have a score yet. Keep the panel useful
      // instead of turning it into a blank area while scoring catches up.
      return high.length ? high : valid.slice(0, Math.min(20, valid.length));
    }
    return valid;
  }

  function emptyState(mode) {
    const copy = mode === 'saved'
      ? ['No saved jobs yet.', 'Open a job and save it to build your shortlist.']
      : mode === 'new'
        ? ['No new jobs found today yet.', 'Existing active opportunities are still available under All Jobs.']
        : ['No working job links are available for this filter yet.', 'The search engine is refreshing verified sources.'];
    return `<div class="jobs-empty-state" style="margin:8px 10px 14px;padding:24px;border:1px dashed #dcdfe3;border-radius:12px;background:#fbfbfc;color:#5b6068;font-size:12px;line-height:1.6"><b style="display:block;color:#14161a;margin-bottom:3px">${copy[0]}</b>${copy[1]}</div>`;
  }

  function renderBackendJobs(rows, mode = activeJobTab) {
    const list = document.getElementById('jobList');
    if (!list) return;
    const validRows = filteredJobs(rows, mode);
    if (!validRows.length) {
      list.innerHTML = emptyState(mode);
      return;
    }
    list.innerHTML = validRows.map(j => {
      const pct = Math.max(0, Math.min(100, Number(j.score || 0)));
      const badgeClass = pct >= 90 ? 'high' : (j.verified ? 'verified' : 'new');
      const badgeLabel = pct >= 90 ? 'High Match' : (j.verified ? 'Verified' : 'New');
      const company = escapeHtml(j.company || 'Unknown company');
      const title = escapeHtml(j.title || 'Untitled role');
      const location = escapeHtml(j.location || 'Kuwait');
      const type = escapeHtml(j.employment_type || 'Full-time');
      const cat = escapeHtml(j.category || 'Other');
      const ini = escapeHtml((j.company || 'TC').split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase());
      const time = j.published_at ? new Date(j.published_at).toLocaleString() : 'Recently';
      const url = safeJobUrl(j.url);
      return `<div class="job-row backend-job" data-job-id="${escapeHtml(j.id)}" data-job-url="${escapeHtml(url)}" data-score="${pct}" data-verified="${j.verified ? '1' : '0'}" tabindex="0" role="link" aria-label="Open ${title} at ${company}">
        <div class="job-logo" style="background:#2f6feb">${ini}</div>
        <div class="job-main">
          <div class="title">${title}</div>
          <div class="company">${company}</div>
          <div class="job-meta"><span>📍 ${location}</span><span>🕐 ${type}</span><span>▤ ${cat}</span></div>
        </div>
        <div class="job-score"><div class="pct">${pct}%</div><div class="lbl">Relevance</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="badge ${badgeClass}">${badgeLabel}</span><span class="job-time">${escapeHtml(time)}</span>
        </div>
        <div class="job-actions"><a class="icon-btn" title="Open job" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">↗</a></div>
      </div>`;
    }).join('');

    list.querySelectorAll('.backend-job').forEach(row => {
      const open = () => { const u = safeJobUrl(row.dataset.jobUrl); if (u) window.open(u, '_blank', 'noopener,noreferrer'); };
      row.addEventListener('click', e => { if (!e.target.closest('a,button')) open(); });
      row.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
  }

  function applyActiveTab(mode, clickedTab) {
    activeJobTab = mode || 'all';
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === clickedTab || x.dataset.tab === activeJobTab));
    renderBackendJobs(latestJobs, activeJobTab);
  }

  // ui.js was originally written for local demo rows and re-rendered that demo
  // array whenever a tab was clicked. Intercept the tabs before that handler so
  // the live Supabase jobs remain the source of truth and never disappear.
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      applyActiveTab(tab.dataset.tab || 'all', tab);
    }, true);
  });

  async function loadJobs() {
    const rows = await rest('jobs?select=id,title,company,location,employment_type,category,score,verified,published_at,found_at,url&status=eq.active&url=not.is.null&order=score.desc.nullslast,published_at.desc.nullslast&limit=200');
    latestJobs = (rows || []).filter(j => safeJobUrl(j.url));
    updateTabCounts(latestJobs);
    renderBackendJobs(latestJobs, activeJobTab);
    const stat = document.getElementById('statJobs');
    if (stat) stat.textContent = latestJobs.length.toLocaleString();
  }

  async function loadActivity() {
    const rows = await rest('search_events?select=message,level,created_at&order=created_at.desc&limit=18');
    const list = document.getElementById('activityList');
    if (!list || !rows?.length) return;
    list.innerHTML = rows.reverse().map(r => {
      const t = new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const cls = r.level === 'warning' ? 'a' : (r.level === 'info' ? 'b' : 'g');
      return `<div class="activity-row"><span class="t">${escapeHtml(t)}</span><span class="m">${escapeHtml(r.message)}</span><span class="d ${cls}"></span></div>`;
    }).join('');
  }

  async function callSearchNow() {
    const res = await fetch(`${base}/functions/v1/search-now`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'manual_ui' })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Search Now failed (${res.status})`);
    return body;
  }

  const btn = document.getElementById('searchNowBtn');
  if (btn) {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (btn.dataset.busy === '1') return;
      btn.dataset.busy = '1';
      const old = btn.innerHTML;
      btn.style.opacity = '.7';
      btn.innerHTML = '<span class="ic"></span>Starting…';
      try {
        const result = await callSearchNow();
        if (typeof window.pushActivity === 'function') window.pushActivity(`BACKEND SEARCH STARTED — run ${result.run_id || ''}`);
        await new Promise(r => setTimeout(r, 1200));
        await Promise.allSettled([loadJobs(), loadActivity()]);
      } catch (err) {
        console.error('[TheCareers] search-now:', err);
        if (typeof window.pushActivity === 'function') window.pushActivity(`BACKEND ERROR — ${err.message}`);
      } finally {
        btn.innerHTML = old;
        btn.style.opacity = '1';
        btn.dataset.busy = '0';
      }
    }, true);
  }

  async function refresh() {
    await Promise.allSettled([loadJobs(), loadActivity()]);
  }
  refresh();
  setInterval(refresh, 30000);
})();

// Load the visual/interaction enhancement independently from the globe and black-hole engines.
(() => {
  if (document.querySelector('script[data-tc-controls-3d]')) return;
  const s = document.createElement('script');
  s.dataset.tcControls3d = '1';
  const base = document.currentScript?.src || location.href;
  s.src = new URL('./controls-3d.js', base).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] 3D controls failed to load'));
  document.head.appendChild(s);
})();
