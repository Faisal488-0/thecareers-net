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
    return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));
  }

  function renderBackendJobs(rows) {
    const list = document.getElementById('jobList');
    if (!list || !rows?.length) return;
    list.innerHTML = rows.map(j => {
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
      return `<div class="job-row" data-job-id="${escapeHtml(j.id)}">
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
        <div class="job-actions"><a class="icon-btn" title="Open" href="${escapeHtml(j.url || '#')}" target="_blank" rel="noopener">↗</a></div>
      </div>`;
    }).join('');
  }

  async function loadJobs() {
    const rows = await rest('jobs?select=id,title,company,location,employment_type,category,score,verified,published_at,url&status=eq.active&order=score.desc.nullslast,published_at.desc.nullslast&limit=25');
    renderBackendJobs(rows);
    const stat = document.getElementById('statJobs');
    if (stat) stat.textContent = rows.length.toLocaleString();
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
