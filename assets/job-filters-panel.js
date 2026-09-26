(() => {
  'use strict';
  if (window.__TC_NET_JOB_FILTERS__) return;
  window.__TC_NET_JOB_FILTERS__ = true;

  const PAGE_SIZE = 10;
  let page = 1;
  let applying = false;
  let wasAdvancedActive = false;
  const filters = {
    types: new Set(),
    workMode: 'any',
    postedHours: 0,
    salary: 'any'
  };

  const typeOptions = [
    ['permanent', 'Permanent'],
    ['full-time', 'Full-time'],
    ['part-time', 'Part-time'],
    ['contract', 'Contract'],
    ['temporary', 'Temporary'],
    ['internship', 'Internship']
  ];

  function clean(v = '') { return String(v || '').replace(/\s+/g, ' ').trim(); }
  function lower(v = '') { return clean(v).toLowerCase(); }
  function list() { return document.getElementById('jobList'); }
  function rows() { return Array.from(list()?.querySelectorAll(':scope > .backend-job') || []); }

  function meta(row, name) {
    // Compact cards share the .org markup. Keep filters compatible with
    // older rows without making the compact cards carry redundant metadata.
    const compact = {
      type: '.tc-card-facts>div:nth-child(2) b',
      location: '.tc-card-location',
      country: '.tc-card-tags span:first-child',
      salary: '.tc-card-facts>div:first-child b',
      date: '.tc-card-employer time',
      setting: '.tc-card-facts>div:nth-child(3) b'
    }[name];
    if (row.classList.contains('tc-job-compact') && compact) {
      return clean(row.querySelector(compact)?.textContent || '');
    }
    const item = row.querySelector(`[data-meta="${name}"]`);
    return item ? clean(item.querySelector('strong')?.textContent || item.textContent || '') : '';
  }

  function employmentKeys(row) {
    const text = lower(meta(row, 'type'));
    const out = new Set();
    if (/\bpermanent\b/.test(text)) out.add('permanent');
    if (/full[\s-]?time/.test(text)) out.add('full-time');
    if (/part[\s-]?time/.test(text)) out.add('part-time');
    if (/\bcontract\b|contractor/.test(text)) out.add('contract');
    if (/temporary|\btemp\b/.test(text)) out.add('temporary');
    if (/intern(?:ship)?|trainee/.test(text)) out.add('internship');
    return out;
  }

  function workMode(row) {
    const title = lower(row.querySelector('.job-main .title')?.textContent || '');
    const text = lower(`${meta(row, 'type')} ${meta(row, 'location')} ${title}`);
    if (/\bhybrid\b/.test(text)) return 'hybrid';
    if (/\bremote\b|work\s*from\s*home|\bwfh\b/.test(text)) return 'remote';
    if (/on[\s-]?site|onsite|in[\s-]?office/.test(text)) return 'on-site';
    return 'unknown';
  }

  function postedAgeHours(row) {
    const text = meta(row, 'date');
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return Infinity;
    return Math.max(0, (Date.now() - date.getTime()) / 3600000);
  }

  function salaryIsListed(row) {
    const text = lower(meta(row, 'salary'));
    if (!text || /not\s+disclosed|not\s+listed|unknown|n\/?a/.test(text)) return false;
    return /\d/.test(text);
  }

  function countryMatches(row) {
    const selected = lower(document.documentElement.dataset.tcCountryFilter || 'all');
    if (!selected || selected === 'all' || selected === 'gcc') return true;
    const text = lower(`${meta(row, 'country')} ${meta(row, 'location')}`);
    const matchers = {
      kuwait: /kuwait|الكويت/,
      uae: /united arab emirates|\buae\b|dubai|abu dhabi|sharjah|الإمارات/,
      saudi: /saudi|riyadh|jeddah|dammam|khobar|السعودية/,
      qatar: /qatar|doha|قطر/,
      oman: /oman|muscat|duqm|salalah|عمان/,
      bahrain: /bahrain|manama|البحرين/
    };
    return matchers[selected] ? matchers[selected].test(text) : true;
  }

  function matches(row) {
    if (!countryMatches(row)) return false;
    if (filters.types.size) {
      const keys = employmentKeys(row);
      if (![...filters.types].some(key => keys.has(key))) return false;
    }
    if (filters.workMode !== 'any' && workMode(row) !== filters.workMode) return false;
    if (filters.postedHours > 0 && postedAgeHours(row) > filters.postedHours) return false;
    if (filters.salary === 'listed' && !salaryIsListed(row)) return false;
    return true;
  }

  function activeCount() {
    return filters.types.size + (filters.workMode !== 'any' ? 1 : 0) + (filters.postedHours > 0 ? 1 : 0) + (filters.salary !== 'any' ? 1 : 0);
  }
  function isActive() { return activeCount() > 0; }

  function injectStyles() {
    if (document.getElementById('tcNetFilterStyles')) return;
    const style = document.createElement('style');
    style.id = 'tcNetFilterStyles';
    style.textContent = `
      .tc-net-filter-layout{display:block;width:100%;padding:0}
      .tc-net-results{min-width:0;width:100%}.tc-net-filter-panel{position:relative;background:#fff;border:1px solid #e3e7ec;border-radius:14px;box-shadow:0 8px 24px -22px rgba(18,22,28,.55);overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#20242a}
      .sidebar .tc-sidebar-stats{display:flex!important;flex-direction:column!important;width:100%!important;gap:9px!important;margin:14px 0 0!important}
      .sidebar .tc-sidebar-stats .stat-card{width:100%!important;min-width:0!important;min-height:104px!important;padding:12px 12px 10px!important;border-radius:13px!important;box-shadow:0 4px 16px -16px rgba(20,22,26,.45)!important}
      .sidebar .tc-sidebar-stats .stat-top{gap:8px!important;margin-bottom:7px!important}
      .sidebar .tc-sidebar-stats .stat-ic{width:26px!important;height:26px!important;min-width:26px!important;border-radius:8px!important}
      .sidebar .tc-sidebar-stats .stat-title{font-size:10.5px!important;line-height:1.2!important}
      .sidebar .tc-sidebar-stats .stat-num{font-size:22px!important;line-height:1!important;margin:0!important}
      .sidebar .tc-sidebar-stats .stat-sub{font-size:9px!important;line-height:1.25!important;margin-top:5px!important}
      .sidebar .tc-sidebar-stats .stat-spark{width:100%!important;height:18px!important;margin-top:6px!important}
      .sidebar .tc-net-filter-panel{width:100%;margin:12px 0 4px;flex:0 0 auto;box-shadow:0 4px 18px -18px rgba(18,22,28,.6);scroll-margin-top:16px}
      .sidebar .tc-net-filter-head{padding:12px 12px 10px}
      .sidebar .tc-net-filter-head b{font-size:13px}
      .sidebar .tc-net-filter-head small{font-size:9.5px}
      .sidebar .tc-net-filter-body{padding:2px 12px 12px}
      .sidebar .tc-net-filter-section{padding:10px 0}
      .sidebar .tc-net-filter-section h3{margin-bottom:6px;font-size:11px}
      .sidebar .tc-net-filter-option{min-height:28px;font-size:10.8px;gap:8px}
      .sidebar .tc-net-filter-option input{width:15px;height:15px}
      .sidebar .tc-net-filter-clear{height:36px;margin-top:8px}
      .tc-net-filter-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 14px 12px;border-bottom:1px solid #e8ebef;background:#fbfcfd}.tc-net-filter-head b{display:block;font-size:14px;font-weight:800}.tc-net-filter-head small{display:block;margin-top:2px;color:#8a919a;font-size:10px}
      .tc-net-filter-toggle{display:none;min-height:34px;padding:0 10px;border:1px solid #dce1e7;border-radius:9px;background:#fff;color:#30353c;font-size:10.5px;font-weight:800;cursor:pointer}
      .tc-net-filter-count{margin:9px 12px 0;padding:6px 8px;border-radius:9px;background:#eef8f3;color:#14764a;font-size:10px;font-weight:800;text-align:center}.tc-net-filter-count[hidden]{display:none}
      .tc-net-filter-body{padding:3px 14px 14px}.tc-net-filter-section{padding:13px 0;border-bottom:1px solid #edf0f3}.tc-net-filter-section:last-of-type{border-bottom:0}.tc-net-filter-section h3{margin:0 0 8px;font-size:11.5px;font-weight:800;color:#22272e}
      .tc-net-filter-option{display:flex;align-items:center;gap:8px;min-height:30px;color:#5c636d;font-size:11px;font-weight:600;cursor:pointer;user-select:none}.tc-net-filter-option:hover{color:#111318}.tc-net-filter-option input{width:15px;height:15px;margin:0;accent-color:#111318;flex:none}
      .tc-net-filter-clear{width:100%;height:38px;margin-top:10px;border:1px solid #dce1e7;border-radius:10px;background:#fff;color:#30353c;font-size:11px;font-weight:800;cursor:pointer}.tc-net-filter-clear:hover:not(:disabled){background:#f6f8fa;border-color:#c9d0d8}.tc-net-filter-clear:disabled{opacity:.38;cursor:default}
      .tc-advanced-pager{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;width:100%;padding:16px 8px 8px}.tc-advanced-page{min-width:38px;height:38px;padding:0 10px;border:1px solid #e0e4e9;border-radius:9px;background:#fff;color:#555c66;font:750 10.5px 'JetBrains Mono',monospace;cursor:pointer}.tc-advanced-page.active{background:#111318;color:#fff;border-color:#111318}.tc-advanced-page:disabled{opacity:.35;cursor:default}.tc-advanced-summary{width:100%;text-align:center;margin-top:3px;color:#8b919a;font-size:10px}
      @media(min-width:761px){
        .sidebar{
          position:relative!important;
          top:auto!important;
          height:auto!important;
          min-height:100vh!important;
          align-self:stretch!important;
          overflow:visible!important;
        }
        .sidebar .tc-net-filter-panel{
          position:sticky!important;
          top:16px!important;
          max-height:calc(100vh - 32px);
          overflow:auto;
        }
        .sidebar .tc-net-filter-toggle{display:none!important}
        .sidebar .tc-net-filter-body{display:block!important}
      }
      @media(max-width:760px){
        .tc-net-filter-layout{padding:0}
        .content .stat-row{display:grid!important}
        .sidebar .tc-sidebar-stats{display:none!important}
        .sidebar .tc-net-filter-panel{margin:14px 0 10px}
        .sidebar .tc-net-filter-toggle{display:inline-flex;align-items:center}
        .sidebar .tc-net-filter-body{display:none}
        .sidebar .tc-net-filter-panel.is-open .tc-net-filter-body{display:block}
        .sidebar .tc-net-filter-option{min-height:44px;font-size:13px}
        .sidebar .tc-net-filter-option input{width:18px;height:18px}
        .sidebar .tc-net-filter-clear{height:44px}
        .tc-advanced-page{height:44px;min-width:40px}
      }
    `;
    document.head.appendChild(style);
  }

  function panelMarkup() {
    const types = typeOptions.map(([value, label]) => `<label class="tc-net-filter-option"><input type="checkbox" data-tc-net-type value="${value}" ${filters.types.has(value) ? 'checked' : ''}><span>${label}</span></label>`).join('');
    const radio = (name, value, label, checked) => `<label class="tc-net-filter-option"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
    return `
      <div class="tc-net-filter-head"><div><b>Filter jobs</b><small>Narrow the results</small></div><button class="tc-net-filter-toggle" type="button" aria-expanded="false">Show filters</button></div>
      <div class="tc-net-filter-count" ${activeCount() ? '' : 'hidden'}>${activeCount()} active filter${activeCount() === 1 ? '' : 's'}</div>
      <div class="tc-net-filter-body">
        <section class="tc-net-filter-section"><h3>Job type</h3>${types}</section>
        <section class="tc-net-filter-section"><h3>Remote / on-site</h3>
          ${radio('tc-net-work', 'any', 'Any', filters.workMode === 'any')}
          ${radio('tc-net-work', 'on-site', 'On-site', filters.workMode === 'on-site')}
          ${radio('tc-net-work', 'hybrid', 'Hybrid', filters.workMode === 'hybrid')}
          ${radio('tc-net-work', 'remote', 'Remote', filters.workMode === 'remote')}
        </section>
        <section class="tc-net-filter-section"><h3>Date posted</h3>
          ${radio('tc-net-posted', '0', 'Any time', filters.postedHours === 0)}
          ${radio('tc-net-posted', '24', 'Last 24 hours', filters.postedHours === 24)}
          ${radio('tc-net-posted', '72', 'Last 3 days', filters.postedHours === 72)}
          ${radio('tc-net-posted', '168', 'Last 7 days', filters.postedHours === 168)}
          ${radio('tc-net-posted', '720', 'Last 30 days', filters.postedHours === 720)}
        </section>
        <section class="tc-net-filter-section"><h3>Salary</h3>
          ${radio('tc-net-salary', 'any', 'Any salary', filters.salary === 'any')}
          ${radio('tc-net-salary', 'listed', 'Salary listed', filters.salary === 'listed')}
        </section>
        <button class="tc-net-filter-clear" type="button" ${activeCount() ? '' : 'disabled'}>Clear all filters</button>
      </div>`;
  }

  function renderPanel(preserveOpen = true) {
    const panel = document.getElementById('tcNetJobFilters');
    if (!panel) return;
    const open = preserveOpen && panel.classList.contains('is-open');
    panel.innerHTML = panelMarkup();
    if (open) panel.classList.add('is-open');
    bindPanel(panel);
    if (open) {
      const btn = panel.querySelector('.tc-net-filter-toggle');
      if (btn) { btn.textContent = 'Hide filters'; btn.setAttribute('aria-expanded', 'true'); }
    }
  }

  function matchedRows() { return rows().filter(matches); }

  function renderAdvancedPager(matched) {
    const pager = document.getElementById('tcAdvancedJobsPager');
    if (!pager) return;
    const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), pages);
    if (matched.length <= PAGE_SIZE) {
      pager.innerHTML = matched.length ? `<div class="tc-advanced-summary">${matched.length.toLocaleString()} filtered job${matched.length === 1 ? '' : 's'}</div>` : '<div class="tc-advanced-summary">No jobs match these filters.</div>';
      return;
    }
    const tokens = [];
    const start = Math.max(1, page - 2), end = Math.min(pages, page + 2);
    if (start > 1) tokens.push(1, '…');
    for (let p = start; p <= end; p++) tokens.push(p);
    if (end < pages) tokens.push('…', pages);
    const nums = tokens.map(token => token === '…' ? '<span style="color:#8b919a;padding:0 2px">…</span>' : `<button class="tc-advanced-page${token === page ? ' active' : ''}" data-page="${token}" type="button">${String(token).padStart(2, '0')}</button>`).join('');
    const from = (page - 1) * PAGE_SIZE + 1, to = Math.min(matched.length, page * PAGE_SIZE);
    pager.innerHTML = `<button class="tc-advanced-page" data-step="prev" type="button" ${page === 1 ? 'disabled' : ''}>Prev</button>${nums}<button class="tc-advanced-page" data-step="next" type="button" ${page === pages ? 'disabled' : ''}>Next</button><div class="tc-advanced-summary">Showing ${from}–${to} of ${matched.length.toLocaleString()} filtered jobs</div>`;
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      const nativePager = document.getElementById('tcJobsPagination');
      const advancedPager = document.getElementById('tcAdvancedJobsPager');
      if (!isActive()) {
        if (advancedPager) { advancedPager.hidden = true; advancedPager.innerHTML = ''; }
        if (nativePager) nativePager.style.removeProperty('display');
        /* Do not unhide rows here. The native paginator owns the normal
           job-list visibility and enforces exactly 10 cards per page. */
        if (wasAdvancedActive) {
          wasAdvancedActive = false;
          document.dispatchEvent(new CustomEvent('tc:country-filter-change', { detail: { country: document.documentElement.dataset.tcCountryFilter || 'all', restoreFromAdvanced: true } }));
        }
        return;
      }

      wasAdvancedActive = true;
      if (nativePager) nativePager.style.setProperty('display', 'none', 'important');
      if (advancedPager) advancedPager.hidden = false;
      const matched = matchedRows();
      const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
      page = Math.min(page, pages);
      const from = (page - 1) * PAGE_SIZE, to = from + PAGE_SIZE;
      const visible = new Set(matched.slice(from, to));
      rows().forEach(row => {
        const show = visible.has(row);
        row.style.setProperty('display', show ? 'flex' : 'none', 'important');
        row.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
      renderAdvancedPager(matched);
    } finally {
      applying = false;
    }
  }

  function scheduleApply() {
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function filtersChanged() {
    page = 1;
    renderPanel(true);
    scheduleApply();
    setTimeout(alignFilterWithJobs, 150);
    setTimeout(alignFilterWithJobs, 700);
  }

  function bindPanel(panel) {
    panel.onchange = event => {
      const el = event.target;
      if (el.matches('[data-tc-net-type]')) {
        if (el.checked) filters.types.add(el.value); else filters.types.delete(el.value);
      } else if (el.name === 'tc-net-work') filters.workMode = el.value;
      else if (el.name === 'tc-net-posted') filters.postedHours = Number(el.value || 0);
      else if (el.name === 'tc-net-salary') filters.salary = el.value;
      filtersChanged();
    };
    panel.onclick = event => {
      const clear = event.target.closest('.tc-net-filter-clear');
      if (clear && !clear.disabled) {
        filters.types.clear(); filters.workMode = 'any'; filters.postedHours = 0; filters.salary = 'any';
        filtersChanged(); return;
      }
      const toggle = event.target.closest('.tc-net-filter-toggle');
      if (toggle) {
        panel.classList.toggle('is-open');
        const open = panel.classList.contains('is-open');
        toggle.textContent = open ? 'Hide filters' : 'Show filters';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    };
  }

  let statsHome = null;

  function placeStatsForViewport() {
    const statRow = document.querySelector('.stat-row');
    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar?.querySelector('.nav');
    const panel = document.getElementById('tcNetJobFilters');
    if (!statRow || !sidebar || !nav || !panel) return;

    if (!statsHome) {
      statsHome = document.createComment('tc-stat-row-home');
      statRow.parentNode?.insertBefore(statsHome, statRow);
    }

    if (matchMedia('(max-width:760px)').matches) {
      statRow.classList.remove('tc-sidebar-stats');
      if (statsHome.parentNode) statsHome.parentNode.insertBefore(statRow, statsHome.nextSibling);
      panel.style.removeProperty('margin-top');
      return;
    }

    statRow.classList.add('tc-sidebar-stats');
    nav.insertAdjacentElement('afterend', statRow);
    statRow.insertAdjacentElement('afterend', panel);
  }

  function alignFilterWithJobs() {
    const panel = document.getElementById('tcNetJobFilters');
    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar?.querySelector('.nav');
    const jobsPanel = document.querySelector('.row-opps > .panel:first-child');
    if (!panel || !sidebar || !nav || !jobsPanel) return;
    if (matchMedia('(max-width:760px)').matches) {
      panel.style.removeProperty('margin-top');
      panel.style.removeProperty('--tc-filter-align-gap');
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const jobsRect = jobsPanel.getBoundingClientRect();
    const stats = sidebar.querySelector('.tc-sidebar-stats');
    const statsBottom = stats?.getBoundingClientRect().bottom || navRect.bottom;
    const gap = Math.max(12, Math.round(jobsRect.top - statsBottom));
    panel.style.setProperty('margin-top', gap + 'px', 'important');
    panel.style.setProperty('--tc-filter-align-gap', gap + 'px');
  }

  function mount() {
    const jobList = list();
    if (!jobList || document.getElementById('tcNetJobFilters')) return;
    injectStyles();

    const panel = document.createElement('aside');
    panel.id = 'tcNetJobFilters';
    panel.className = 'tc-net-filter-panel';
    panel.setAttribute('aria-label', 'Job filters');
    const advancedPager = document.createElement('nav');
    advancedPager.id = 'tcAdvancedJobsPager';
    advancedPager.className = 'tc-advanced-pager';
    advancedPager.hidden = true;

    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar?.querySelector('.nav');
    if (sidebar && nav) {
      nav.insertAdjacentElement('afterend', panel);
    } else {
      jobList.parentNode.insertBefore(panel, jobList);
    }
    jobList.insertAdjacentElement('afterend', advancedPager);
    renderPanel(false);
    placeStatsForViewport();
    requestAnimationFrame(() => requestAnimationFrame(alignFilterWithJobs));
    addEventListener('resize', () => {
      placeStatsForViewport();
      requestAnimationFrame(alignFilterWithJobs);
    }, { passive: true });

    advancedPager.addEventListener('click', event => {
      const btn = event.target.closest('.tc-advanced-page');
      if (!btn || btn.disabled) return;
      const matched = matchedRows(), pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
      if (btn.dataset.page) page = Number(btn.dataset.page);
      else if (btn.dataset.step === 'prev') page = Math.max(1, page - 1);
      else if (btn.dataset.step === 'next') page = Math.min(pages, page + 1);
      apply();
      jobList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const observer = new MutationObserver(() => { if (!applying && isActive()) setTimeout(scheduleApply, 20); });
    observer.observe(jobList, { childList: true });
    document.addEventListener('tc:country-filter-change', event => { if (event.detail?.restoreFromAdvanced) return; page = 1; setTimeout(scheduleApply, 80); });
    document.addEventListener('tc:job-search-results', () => { page = 1; setTimeout(scheduleApply, 80); setTimeout(()=>{placeStatsForViewport();alignFilterWithJobs();}, 90); });
    document.querySelectorAll('.tab,.filter-btn,.select-like,.source-chip,.leg-row[data-sector],.net-node').forEach(el => el.addEventListener('click', () => { page = 1; setTimeout(scheduleApply, 100); }, true));

    scheduleApply();
    setTimeout(alignFilterWithJobs, 120);
    setTimeout(alignFilterWithJobs, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
