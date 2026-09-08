(() => {
  'use strict';

  const cfg = window.THECAREERS_CONFIG || {};
  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.startsWith('__') && !cfg.SUPABASE_PUBLISHABLE_KEY.startsWith('__');
  if (!ready) {
    console.info('[TheCareers] Supabase not configured; live controls disabled.');
    return;
  }

  const base = cfg.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json'
  };
  const savedKey = 'thecareers_saved_job_ids_v2';

  let latestJobs = [];
  let activeTab = document.querySelector('.tab.active')?.dataset.tab || 'high';
  let filterMode = 'all';
  let sortMode = 'relevance';
  let sectorFilter = '';
  let autoRefresh = true;

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

  function clean(v='') { return String(v || '').replace(/\s+/g,' ').trim(); }

  function safeJobUrl(value) {
    try {
      const raw = clean(value);
      if (!raw || /(?:^|\/)null(?:$|[/?#])/i.test(raw) || /(?:^|\/)undefined(?:$|[/?#])/i.test(raw)) return '';
      const u = new URL(raw);
      if (!['https:','http:'].includes(u.protocol)) return '';
      return u.href;
    } catch (_) { return ''; }
  }

  const genericTitle = /^(?:apply(?:\s+now)?|careers?|jobs?|job\s+opportunities|current\s+(?:openings|vacancies)|vacancies|search\s+jobs|advanced\s+search|job\s+alerts?|recruitment\s+(?:portal|fairs?)|how\s+to\s+apply|job\s+application\s+process|our\s+people|why\s+should\s+you\s+join\s+us\s*\??|quick\s+links|services|get\s+in\s+touch|training\s+programs|english|عرب[يى]|listen|share|cancel)$/i;
  function specificTitle(value) {
    const t = clean(value).replace(/[↗→]+$/g,'').trim();
    if (!t || t.length < 3 || t.length > 180) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false;
    if (genericTitle.test(t)) return false;
    if (/^(?:aag|tea)\s+vacancies$/i.test(t)) return false;
    if (/^(?:uae|bahraini)\s+nationals$/i.test(t)) return false;
    if (/^search\s+jobs\b/i.test(t)) return false;
    return true;
  }

  function isToday(value) {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function getSaved() {
    try { return new Set(JSON.parse(localStorage.getItem(savedKey) || '[]')); }
    catch { return new Set(); }
  }
  function putSaved(set) { localStorage.setItem(savedKey, JSON.stringify([...set])); }

  function sectorOf(job) {
    const hay = `${job.category || ''} ${job.title || ''}`.toLowerCase();
    if (/oil|gas|petroleum|refiner|hse|pipeline|scaffold|commission|maintenance|equipment/.test(hay)) return 'Oil & Gas';
    if (/human resources|\bhr\b|talent|recruit/.test(hay)) return 'HR';
    if (/admin|registrar|office|coordinator/.test(hay)) return 'Administration';
    if (/operation|logistic|procurement|supply chain/.test(hay)) return 'Operations';
    if (/engineer|engineering|electrical|mechanical|civil|computer engineering/.test(hay)) return 'Engineering';
    if (/finance|account|collection|audit/.test(hay)) return 'Finance';
    if (/information system|information technology|\bit\b|software|data|digital|cyber|computer science/.test(hay)) return 'IT & Technology';
    if (/education|teacher|school|university|faculty|adjunct|mathematics|academic/.test(hay)) return 'Education';
    if (/health|hospital|nurse|medical|radiology|orthodont|consultant|registrar/.test(hay)) return 'Healthcare';
    return 'Others';
  }

  function validJobs(rows) {
    const seen = new Set();
    return (rows || []).filter(j => {
      const url = safeJobUrl(j.url);
      const title = specificTitle(j.title);
      if (!url || !title) return false;
      const key = `${clean(j.title).toLowerCase()}|${clean(j.company).toLowerCase()}|${url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function highJobs(rows) {
    const strict = rows.filter(j => Number(j.score || 0) >= 70);
    if (strict.length) return strict;
    return rows.slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0, Math.min(20, rows.length));
  }

  function tabRows(rows, mode) {
    if (mode === 'all') return rows.slice();
    if (mode === 'new') return rows.filter(j => isToday(j.found_at || j.published_at));
    if (mode === 'saved') {
      const saved = getSaved();
      return rows.filter(j => saved.has(String(j.id)) || saved.has(safeJobUrl(j.url)));
    }
    return highJobs(rows);
  }

  function applyExtraFilters(rows) {
    let out = rows.slice();
    if (filterMode === 'kuwait') out = out.filter(j => /kuwait/i.test(`${j.location || ''} ${j.title || ''}`));
    else if (filterMode === 'verified') out = out.filter(j => j.verified === true);
    else if (filterMode === 'priority') out = out.filter(j => Number(j.score || 0) >= 50);
    if (sectorFilter) out = out.filter(j => sectorOf(j) === sectorFilter);
    return out;
  }

  function sortRows(rows) {
    const out = rows.slice();
    if (sortMode === 'company') out.sort((a,b)=>clean(a.company).localeCompare(clean(b.company)) || clean(a.title).localeCompare(clean(b.title)));
    else if (sortMode === 'newest') out.sort((a,b)=>new Date(b.published_at || b.found_at || 0)-new Date(a.published_at || a.found_at || 0));
    else out.sort((a,b)=>Number(b.score||0)-Number(a.score||0) || new Date(b.published_at || b.found_at || 0)-new Date(a.published_at || a.found_at || 0));
    return out;
  }

  function currentRows() {
    const all = validJobs(latestJobs);
    const baseRows = tabRows(all, activeTab);
    const filtered = applyExtraFilters(baseRows);
    if (filtered.length) return { rows: sortRows(filtered), note: '' };

    // Never leave the opportunity panel visually blank. If a selected view has
    // no matches, keep useful live jobs visible and explain the fallback.
    let note = 'No jobs matched this view — showing current live opportunities instead.';
    if (activeTab === 'saved') note = 'No saved jobs yet — showing current live opportunities. Use the bookmark button to save jobs.';
    else if (activeTab === 'new') note = 'No new jobs matched this filter today — showing current live opportunities.';
    return { rows: sortRows(all), note };
  }

  function jobTime(job) {
    const value = job.published_at || job.found_at;
    if (!value) return 'Recently';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Recently' : d.toLocaleString([], {year:'numeric',month:'short',day:'numeric'});
  }

  function renderJobs() {
    const list = document.getElementById('jobList');
    if (!list) return;
    const { rows, note } = currentRows();
    if (!rows.length) {
      list.innerHTML = '<div class="jobs-empty-state" style="margin:8px 10px 14px;padding:24px;border:1px dashed #dcdfe3;border-radius:12px;background:#fbfbfc;color:#5b6068;font-size:12px"><b style="display:block;color:#14161a;margin-bottom:4px">No verified job records are available right now.</b>The search engine is refreshing official sources.</div>';
      return;
    }

    const saved = getSaved();
    const noteHtml = note ? `<div class="tc-job-note" style="margin:8px 10px 4px;padding:9px 12px;border:1px solid #dbe6f7;border-radius:9px;background:#f7faff;color:#4d6079;font-size:11px">${escapeHtml(note)}</div>` : '';
    const html = rows.map(j => {
      const pct = Math.max(0, Math.min(100, Number(j.score || 0)));
      const badgeClass = j.verified ? 'verified' : (pct >= 70 ? 'high' : 'new');
      const badgeLabel = j.verified ? 'Verified' : (pct >= 70 ? 'High Match' : 'New');
      const company = escapeHtml(j.company || 'Unknown company');
      const title = escapeHtml(j.title || 'Untitled role');
      const location = escapeHtml(j.location || 'Kuwait');
      const type = escapeHtml(j.employment_type || 'Full-time');
      const cat = escapeHtml(j.category || sectorOf(j));
      const initials = escapeHtml((j.company || 'TC').split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase());
      const url = safeJobUrl(j.url);
      const id = String(j.id || url);
      const isSaved = saved.has(id) || saved.has(url);
      return `<div class="job-row backend-job" data-job-id="${escapeHtml(id)}" data-job-url="${escapeHtml(url)}" tabindex="0" role="link" aria-label="Open ${title} at ${company}">
        <div class="job-logo" style="background:#2f6feb">${initials}</div>
        <div class="job-main"><div class="title">${title}</div><div class="company">${company}</div><div class="job-meta"><span>📍 ${location}</span><span>🕐 ${type}</span><span>▤ ${cat}</span></div></div>
        <div class="job-score"><div class="pct">${pct}%</div><div class="lbl">Relevance</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="badge ${badgeClass}">${badgeLabel}</span><span class="job-time">${escapeHtml(jobTime(j))}</span></div>
        <div class="job-actions"><button class="icon-btn tc-save-job${isSaved ? ' tc-saved' : ''}" type="button" title="${isSaved ? 'Remove saved job' : 'Save job'}" aria-label="${isSaved ? 'Remove saved job' : 'Save job'}">${isSaved ? '✓' : '🔖'}</button><a class="icon-btn tc-open-job" title="Open official job page" aria-label="Open official job page" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">↗</a></div>
      </div>`;
    }).join('');
    list.innerHTML = noteHtml + html;

    list.querySelectorAll('.backend-job').forEach(row => {
      const open = () => { const u = safeJobUrl(row.dataset.jobUrl); if (u) window.open(u, '_blank', 'noopener,noreferrer'); };
      row.addEventListener('click', e => { if (!e.target.closest('a,button')) open(); });
      row.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); open(); } });
    });
    list.querySelectorAll('.tc-save-job').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const row = btn.closest('.backend-job');
        if (!row) return;
        const id = row.dataset.jobId || row.dataset.jobUrl;
        const url = row.dataset.jobUrl;
        const savedNow = getSaved();
        const has = savedNow.has(id) || savedNow.has(url);
        if (has) { savedNow.delete(id); savedNow.delete(url); }
        else savedNow.add(id);
        putSaved(savedNow);
        updateTabCounts();
        renderJobs();
      });
    });
  }

  function updateTabCounts() {
    const rows = validJobs(latestJobs);
    const saved = getSaved();
    const counts = {
      high: highJobs(rows).length,
      all: rows.length,
      new: rows.filter(j => isToday(j.found_at || j.published_at)).length,
      saved: rows.filter(j => saved.has(String(j.id)) || saved.has(safeJobUrl(j.url))).length
    };
    const names = {high:'High Match',all:'All Jobs',new:'New Today',saved:'Saved'};
    document.querySelectorAll('.tab').forEach(tab => {
      const mode = tab.dataset.tab;
      if (counts[mode] !== undefined) tab.textContent = `${names[mode]} (${counts[mode].toLocaleString()})`;
      tab.classList.toggle('active', mode === activeTab);
      tab.setAttribute('aria-pressed', mode === activeTab ? 'true' : 'false');
    });
  }

  function updateMetrics(sourceCount = null, applicationCount = null) {
    const rows = validJobs(latestJobs);
    const high = highJobs(rows).length;
    const today = rows.filter(j => isToday(j.found_at || j.published_at)).length;
    const set = (id,val) => { const el=document.getElementById(id); if(el) el.textContent=Number(val||0).toLocaleString(); };
    set('statJobs', rows.length);
    set('statHigh', high);
    set('metricOpps', rows.length);
    if (sourceCount !== null) set('statSrc', sourceCount);
    if (applicationCount !== null) set('statApps', applicationCount);
    const donutNum = document.querySelector('.donut-center .num'); if (donutNum) donutNum.textContent = rows.length.toLocaleString();

    const cards = document.querySelectorAll('.stat-card');
    if (cards[0]?.querySelector('.stat-sub')) cards[0].querySelector('.stat-sub').textContent = `▲ ${today} new today`;
    if (cards[1]?.querySelector('.stat-sub')) cards[1].querySelector('.stat-sub').textContent = `▲ ${rows.length ? Math.round(high/rows.length*100) : 0}% of current jobs`;
    if (cards[2]?.querySelector('.stat-sub') && sourceCount !== null) cards[2].querySelector('.stat-sub').textContent = `▲ ${sourceCount} enabled sources`;
    if (cards[3]?.querySelector('.stat-sub') && applicationCount !== null) cards[3].querySelector('.stat-sub').textContent = `${applicationCount} total applications`;
    if (sourceCount !== null) {
      const scan = document.getElementById('scanCount'); if (scan) scan.innerHTML = `${sourceCount}<span>/ 300</span>`;
      const bar = document.getElementById('scanBar'); if (bar) bar.style.width = `${Math.min(100,sourceCount/300*100)}%`;
    }
  }

  function updateSectorUI() {
    const rows = validJobs(latestJobs);
    const palette = ['#0b0c0e','#2f6feb','#1fb567','#e0912b','#7c5cff','#e15c7a','#17b8c4','#6f7b8b','#c7cbd1'];
    const order = ['Oil & Gas','Administration','HR','Operations','Engineering','Finance','IT & Technology','Education','Healthcare','Others'];
    const counts = new Map(order.map(x=>[x,0]));
    rows.forEach(j => counts.set(sectorOf(j),(counts.get(sectorOf(j))||0)+1));
    const data = order.map((name,i)=>({name,count:counts.get(name)||0,color:palette[i%palette.length]})).filter(x=>x.count>0);
    const total = rows.length || 1;
    const legend = document.getElementById('sectorLegend');
    if (legend) legend.innerHTML = data.map(s=>`<div class="leg-row${sectorFilter===s.name?' tc-sector-active':''}" data-sector="${escapeHtml(s.name)}" role="button" tabindex="0"><div class="name"><span class="sw" style="background:${s.color}"></span>${escapeHtml(s.name)}</div><div class="pct">${Math.round(s.count/total*100)}%</div></div>`).join('');

    const canvas = document.getElementById('donutCanvas');
    if (canvas && data.length) {
      const ctx = canvas.getContext('2d');
      const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,ro=100,ri=68; let a=-Math.PI/2;
      ctx.clearRect(0,0,w,h);
      data.forEach(s=>{const ang=s.count/total*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,ro,a,a+ang);ctx.arc(cx,cy,ri,a+ang,a,true);ctx.closePath();ctx.fillStyle=s.color;ctx.fill();a+=ang;});
    }
  }

  async function loadJobs() {
    const rows = await rest('jobs?select=id,title,company,location,employment_type,category,score,verified,published_at,found_at,url,source_name&status=eq.active&url=not.is.null&order=score.desc.nullslast,found_at.desc.nullslast&limit=300');
    latestJobs = rows || [];
    updateTabCounts();
    updateMetrics();
    updateSectorUI();
    renderJobs();
  }

  async function loadDashboardCounts() {
    const [sources, apps] = await Promise.all([
      rest('sources?select=id&enabled=eq.true&limit=500'),
      rest('applications?select=id&limit=500')
    ]);
    updateMetrics((sources||[]).length,(apps||[]).length);
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
    const res = await fetch(`${base}/functions/v1/search-now`, {method:'POST',headers,body:JSON.stringify({reason:'manual_ui'})});
    const body = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(body.error || `Search Now failed (${res.status})`);
    return body;
  }

  // Own all live-data controls in capture phase so legacy demo handlers cannot
  // replace live rows or make the opportunity list disappear.
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', e => {
    e.preventDefault(); e.stopImmediatePropagation();
    activeTab = tab.dataset.tab || 'all';
    updateTabCounts(); renderJobs();
  }, true));

  const sortCtl = document.querySelector('.select-like');
  if (sortCtl) {
    const modes = [['relevance','Relevance'],['newest','Newest'],['company','Company']]; let i=0;
    sortCtl.addEventListener('click', e => {
      e.preventDefault(); e.stopImmediatePropagation(); i=(i+1)%modes.length; sortMode=modes[i][0]; sortCtl.textContent=`Sort by: ${modes[i][1]}`; renderJobs();
    }, true);
  }

  const filterCtl = document.querySelector('.filter-btn');
  if (filterCtl) {
    const modes = [['all','Filters'],['kuwait','Filters: Kuwait'],['verified','Filters: Verified'],['priority','Filters: Priority 50+']]; let i=0;
    filterCtl.addEventListener('click', e => {
      e.preventDefault(); e.stopImmediatePropagation(); i=(i+1)%modes.length; filterMode=modes[i][0]; filterCtl.textContent=modes[i][1]; filterCtl.classList.toggle('tc-filter-active',filterMode!=='all'); renderJobs();
    }, true);
  }

  const btn = document.getElementById('searchNowBtn');
  if (btn) btn.addEventListener('click', async e => {
    e.preventDefault(); e.stopImmediatePropagation(); if (btn.dataset.busy==='1') return;
    btn.dataset.busy='1'; const old=btn.innerHTML; btn.innerHTML='<span class="ic"></span>Searching…'; btn.style.opacity='.72';
    try { const result=await callSearchNow(); window.pushActivity?.(`BACKEND SEARCH STARTED — run ${result.run_id||''}`); await new Promise(r=>setTimeout(r,1200)); await refresh(); }
    catch(err){ console.error('[TheCareers] Search Now',err); window.pushActivity?.(`BACKEND ERROR — ${err.message}`); }
    finally { btn.innerHTML=old; btn.style.opacity='1'; btn.dataset.busy='0'; }
  }, true);

  // Sidebar navigation: every visible navigation item lands on a real section.
  const navTargets = {dashboard:'.content',jobs:'.row-opps',search:'.row-core',companies:'.sources-scan',cv:'.workflow',settings:'.topbar'};
  document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', e => {
    e.preventDefault(); e.stopImmediatePropagation();
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); item.classList.add('active');
    const target=document.querySelector(navTargets[item.dataset.page]||'.content'); target?.scrollIntoView({behavior:'smooth',block:'start'});
    if(item.dataset.page==='jobs') setTimeout(()=>document.querySelector('.tab.active')?.focus(),300);
    if(item.dataset.page==='search') setTimeout(()=>btn?.focus(),300);
    if(item.dataset.page==='cv') window.pushActivity?.('CV Center workflow selected');
    if(item.dataset.page==='settings') window.pushActivity?.('Settings/navigation controls ready');
  }, true));

  // Source chips become useful search filters rather than decorative buttons.
  const chipSector = {'OIL & GAS':'Oil & Gas','SCHOOLS':'Education','GOVERNMENT':'Administration','TALENT NETWORK':'HR'};
  document.querySelectorAll('.source-chip').forEach(chip => chip.addEventListener('click', e => {
    e.preventDefault(); e.stopImmediatePropagation();
    const label=clean(chip.querySelector('b')?.textContent).toUpperCase();
    sectorFilter=chipSector[label]||'';
    activeTab='all'; updateTabCounts(); updateSectorUI(); renderJobs();
    document.querySelector('.row-opps')?.scrollIntoView({behavior:'smooth',block:'start'});
  }, true));

  // Network nodes also filter the live list where a meaningful mapping exists.
  const networkSector = {'Universities':'Education','Recruiters':'HR','Government':'Administration','Company Sites':'','Indeed':'','LinkedIn':''};
  document.querySelectorAll('.net-node').forEach(node => node.addEventListener('click', e => {
    e.preventDefault(); e.stopImmediatePropagation();
    const label=clean(node.querySelector('b')?.textContent); sectorFilter=networkSector[label]||''; activeTab='all'; updateTabCounts(); updateSectorUI(); renderJobs();
    document.querySelector('.row-opps')?.scrollIntoView({behavior:'smooth',block:'start'});
  }, true));

  document.addEventListener('click', e => {
    const leg=e.target.closest('.leg-row[data-sector]');
    if (!leg) return;
    e.preventDefault(); sectorFilter = sectorFilter===leg.dataset.sector ? '' : leg.dataset.sector; updateSectorUI(); renderJobs();
  }, true);

  async function refresh() {
    await Promise.allSettled([loadJobs(),loadDashboardCounts(),loadActivity()]);
  }
  refresh();
  setInterval(()=>{ if(autoRefresh) refresh(); },30000);

  window.TheCareersLive = {
    refresh,
    getState:()=>({jobs:validJobs(latestJobs).length,activeTab,filterMode,sortMode,sectorFilter,autoRefresh}),
    resetFilters:()=>{activeTab='all';filterMode='all';sortMode='relevance';sectorFilter='';updateTabCounts();updateSectorUI();renderJobs();}
  };
})();

// Load visual enhancement after the live controller. It is intentionally
// presentation-only and cannot modify live job filtering/state.
(() => {
  if (document.querySelector('script[data-tc-controls-3d]')) return;
  const s=document.createElement('script'); s.dataset.tcControls3d='1';
  const base=document.currentScript?.src||location.href; s.src=new URL('./controls-3d.js',base).href; s.defer=true;
  s.addEventListener('error',()=>console.error('[TheCareers] 3D controls failed to load')); document.head.appendChild(s);
})();
