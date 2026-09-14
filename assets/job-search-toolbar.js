/* TheCareers — job-title search + opportunity toolbar visual polish.
   Scope is intentionally limited to Top Opportunities controls. */
(() => {
  'use strict';
  if (window.__TC_JOB_TITLE_SEARCH__) return;
  window.__TC_JOB_TITLE_SEARCH__ = true;

  const style = document.createElement('style');
  style.id = 'tc-job-title-search-style';
  style.textContent = `
    /* Search field */
    .tc-job-searchbar{
      margin:14px 20px 2px;padding:10px;
      display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;
      background:linear-gradient(180deg,#fbfcfd,#f8f9fa);border:1px solid #e5e8ec;border-radius:14px;
    }
    .tc-job-search-field{
      min-width:0;height:46px;padding:0 10px 0 13px;
      display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #dfe3e8;border-radius:11px;
      box-shadow:0 1px 2px rgba(20,22,26,.025);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;
    }
    .tc-job-search-field:focus-within{
      border-color:#aeb7c2;background:#fff;box-shadow:0 0 0 3px rgba(17,19,24,.06),0 8px 20px -18px rgba(17,19,24,.55);
    }
    .tc-job-search-icon{width:18px;height:18px;display:grid;place-items:center;color:#777f89;flex:0 0 auto;}
    .tc-job-search-icon svg{width:17px;height:17px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
    #tcJobTitleSearch{
      width:100%;min-width:0;height:100%;padding:0;border:0;outline:0;background:transparent;color:#111318;
      font:650 13.5px/1.2 Inter,system-ui,sans-serif;
    }
    #tcJobTitleSearch::placeholder{color:#9aa0a8;font-weight:500;}
    .tc-job-search-clear{
      width:30px;height:30px;padding:0;border:0;border-radius:8px;background:#f2f4f6;color:#737b85;
      display:none;place-items:center;font:700 17px/1 Inter,system-ui,sans-serif;cursor:pointer;
    }
    .tc-job-search-clear.visible{display:grid;}
    .tc-job-search-clear:hover{background:#e9edf1;color:#111318;}
    .tc-job-search-meta{
      min-width:114px;padding:0 7px;text-align:center;color:#7d848e;font:650 10px/1.25 'JetBrains Mono',monospace;
      white-space:nowrap;
    }
    .tc-job-search-meta.active{color:#14764a;}

    /* Make the four opportunity views read as clear cards. */
    .row-opps > .panel:first-child .opps-toolbar{
      padding:10px 20px 14px;gap:12px;align-items:stretch;border-bottom:1px solid #f0f2f4;
    }
    .row-opps > .panel:first-child .tabs{
      flex:1 1 560px;display:grid;grid-template-columns:repeat(4,minmax(116px,1fr));gap:8px;
      padding:0;border:0;border-radius:0;background:transparent;
    }
    .row-opps > .panel:first-child .tab{
      position:relative;min-height:58px;padding:9px 12px 23px;text-align:left;
      border:1px solid #e1e5e9;border-left-width:3px;border-radius:12px;background:#fff;color:#2d3238;
      box-shadow:0 1px 2px rgba(20,22,26,.025),0 8px 20px -20px rgba(20,22,26,.36);
      font-size:11.5px;font-weight:800;line-height:1.15;white-space:nowrap;
      transition:border-color .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease,transform .15s ease;
    }
    .row-opps > .panel:first-child .tab:hover{
      transform:translateY(-1px);border-color:#cbd1d8;box-shadow:0 4px 14px -12px rgba(20,22,26,.42);
    }
    .row-opps > .panel:first-child .tab[data-tab="high"]{border-left-color:#e0912b;}
    .row-opps > .panel:first-child .tab[data-tab="all"]{border-left-color:#111318;}
    .row-opps > .panel:first-child .tab[data-tab="new"]{border-left-color:#2f6feb;}
    .row-opps > .panel:first-child .tab[data-tab="saved"]{border-left-color:#1fb567;}
    .row-opps > .panel:first-child .tab::after{
      position:absolute;left:12px;bottom:7px;color:#8a919a;font-size:8.5px;font-weight:650;line-height:1;letter-spacing:.01em;
    }
    .row-opps > .panel:first-child .tab[data-tab="high"]::after{content:'Best matches for your CV';}
    .row-opps > .panel:first-child .tab[data-tab="all"]::after{content:'Every verified role';}
    .row-opps > .panel:first-child .tab[data-tab="new"]::after{content:'Added today';}
    .row-opps > .panel:first-child .tab[data-tab="saved"]::after{content:'Your shortlist';}
    .row-opps > .panel:first-child .tab.active{
      background:#111318;color:#fff;border-color:#111318;box-shadow:0 8px 20px -15px rgba(0,0,0,.72);transform:none;
    }
    .row-opps > .panel:first-child .tab.active::after{color:#b9bec6;}

    /* Sort / filters aligned to the new cards. */
    .row-opps > .panel:first-child .opps-actions{align-self:center;gap:8px;}
    .row-opps > .panel:first-child .select-like,
    .row-opps > .panel:first-child .filter-btn{
      min-height:42px;padding:0 13px;border-radius:11px;border-color:#dfe3e8;
      background:#fff;box-shadow:0 1px 2px rgba(20,22,26,.025);font-size:11.5px;font-weight:750;
    }
    .row-opps > .panel:first-child .select-like:hover{background:#f8f9fa;border-color:#cbd1d8;}
    .row-opps > .panel:first-child .filter-btn{
      background:#111318;color:#fff;border-color:#111318;box-shadow:0 7px 18px -14px rgba(0,0,0,.7);
    }
    .row-opps > .panel:first-child .filter-btn:hover{background:#000;border-color:#000;}

    /* Country filter: same visual language as the opportunities controls. */
    .tc-country-filter{
      width:max-content;max-width:100%;margin-top:0!important;padding:7px 8px!important;gap:6px!important;
      background:#fff;border:1px solid #e5e8ec;border-radius:14px;box-shadow:0 1px 2px rgba(20,22,26,.025),0 8px 22px -22px rgba(20,22,26,.38);
    }
    .tc-country-filter-label{
      min-height:34px;padding:0 9px 0 5px;margin-right:1px!important;display:inline-flex;align-items:center;
      border-right:1px solid #edf0f2;color:#777f89!important;font-size:9.5px!important;
    }
    .tc-country-btn{
      min-height:36px!important;padding:0 12px!important;border-color:#e3e6ea!important;background:#fbfcfd!important;
      box-shadow:none!important;border-radius:10px!important;
    }
    .tc-country-btn:hover{background:#fff!important;border-color:#cbd1d8!important;}
    .tc-country-btn.active{background:#111318!important;color:#fff!important;border-color:#111318!important;}

    @media(max-width:1050px){
      .row-opps > .panel:first-child .tabs{flex-basis:100%;}
      .row-opps > .panel:first-child .opps-actions{width:100%;justify-content:flex-end;}
    }
    @media(max-width:760px){
      .tc-job-searchbar{margin:10px 10px 2px;padding:8px;grid-template-columns:1fr;gap:6px;}
      .tc-job-search-field{height:48px;}
      .tc-job-search-meta{min-width:0;padding:2px 4px 0;text-align:left;font-size:9.5px;}
      .row-opps > .panel:first-child .opps-toolbar{padding:9px 10px 12px;display:block;overflow:hidden;}
      .row-opps > .panel:first-child .tabs{
        width:100%;display:flex;overflow-x:auto;gap:7px;padding:1px 0 5px;scrollbar-width:none;
      }
      .row-opps > .panel:first-child .tabs::-webkit-scrollbar{display:none;}
      .row-opps > .panel:first-child .tab{flex:0 0 145px;min-height:58px;}
      .row-opps > .panel:first-child .opps-actions{margin-top:7px;width:100%;display:grid;grid-template-columns:1fr 1fr;}
      .row-opps > .panel:first-child .select-like,.row-opps > .panel:first-child .filter-btn{justify-content:center;}
      .tc-country-filter{width:100%;border-radius:12px;overflow-x:auto;flex-wrap:nowrap!important;}
      .tc-country-filter-label{display:none!important;}
    }
  `;
  document.head.appendChild(style);

  const normalize = value => String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let query = '';
  let timer = null;
  let mutating = false;
  let suppressObserverUntil = 0;
  let generation = 0;
  let sequence = 0;
  const order = new WeakMap();
  const stash = document.createElement('div');
  stash.id = 'tcJobSearchStash';
  stash.hidden = true;
  stash.setAttribute('aria-hidden', 'true');

  const list = () => document.getElementById('jobList');
  const rowsIn = root => Array.from(root?.querySelectorAll(':scope > .backend-job') || []);

  function resetOrder() {
    generation += 1;
    sequence = 0;
    rowsIn(list()).forEach(row => order.set(row, { generation, value: sequence++ }));
  }

  function ensureOrder(rows) {
    rows.forEach(row => {
      const entry = order.get(row);
      if (!entry || entry.generation !== generation) order.set(row, { generation, value: sequence++ });
    });
  }

  function allSearchRows() {
    const main = rowsIn(list());
    const hidden = rowsIn(stash);
    const rows = [...main, ...hidden];
    ensureOrder(rows);
    return rows.sort((a, b) => (order.get(a)?.value || 0) - (order.get(b)?.value || 0));
  }

  function titleMatches(row, rawQuery) {
    const q = normalize(rawQuery);
    if (!q) return true;
    const title = normalize(row.querySelector('.job-main .title')?.textContent || '');
    if (!title) return false;
    return q.split(' ').filter(Boolean).every(token => title.includes(token));
  }

  function restoreAll() {
    suppressObserverUntil = Date.now() + 260;
    const jobList = list();
    if (!jobList) return;
    const rows = allSearchRows();
    rows.forEach(row => jobList.appendChild(row));
  }

  function updateMeta(total) {
    const meta = document.getElementById('tcJobSearchMeta');
    const clear = document.querySelector('.tc-job-search-clear');
    const input = document.getElementById('tcJobTitleSearch');
    const active = Boolean(normalize(query));
    clear?.classList.toggle('visible', active);
    if (input) input.setAttribute('aria-label', active ? `Search job title. ${total} title matches.` : 'Search by job title');
    if (!meta) return;
    meta.classList.toggle('active', active);
    meta.textContent = active ? `${total.toLocaleString()} title match${total === 1 ? '' : 'es'}` : 'TYPE A JOB TITLE';
  }

  function applySearch() {
    suppressObserverUntil = Date.now() + 320;
    const jobList = list();
    if (!jobList) return;
    if (!stash.isConnected) jobList.insertAdjacentElement('afterend', stash);

    mutating = true;
    try {
      const rows = allSearchRows();
      rows.forEach(row => jobList.appendChild(row));
      const active = normalize(query);
      let matched = rows;
      if (active) {
        matched = rows.filter(row => titleMatches(row, active));
        const matchedSet = new Set(matched);
        rows.forEach(row => { if (!matchedSet.has(row)) stash.appendChild(row); });
        document.documentElement.dataset.tcJobTitleQuery = active;
      } else {
        delete document.documentElement.dataset.tcJobTitleQuery;
      }
      updateMeta(matched.length);
    } finally {
      mutating = false;
    }

    /* Reuse the existing country/pagination pipeline so counts, pages and
       country filters remain authoritative after title filtering. */
    document.dispatchEvent(new CustomEvent('tc:country-filter-change', {
      detail: { country: document.documentElement.dataset.tcCountryFilter || 'all', source: 'job-title-search' }
    }));
  }

  function scheduleApply(delay = 140) {
    clearTimeout(timer);
    timer = setTimeout(applySearch, delay);
  }

  function mount() {
    const jobList = list();
    const toolbar = document.querySelector('.row-opps > .panel:first-child .opps-toolbar');
    if (!jobList || !toolbar) return setTimeout(mount, 120);
    if (document.getElementById('tcJobTitleSearch')) return;

    resetOrder();

    const form = document.createElement('form');
    form.className = 'tc-job-searchbar';
    form.id = 'tcJobSearchBar';
    form.setAttribute('role', 'search');
    form.setAttribute('aria-label', 'Search jobs by title');
    form.innerHTML = `
      <label class="tc-job-search-field" for="tcJobTitleSearch">
        <span class="tc-job-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.2 4.2"></path></svg></span>
        <input id="tcJobTitleSearch" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="Search by job title — e.g. HR Manager, Teacher, Engineer">
        <button class="tc-job-search-clear" type="button" aria-label="Clear job title search" title="Clear search">×</button>
      </label>
      <div class="tc-job-search-meta" id="tcJobSearchMeta" aria-live="polite">TYPE A JOB TITLE</div>`;
    toolbar.insertAdjacentElement('beforebegin', form);

    const input = form.querySelector('#tcJobTitleSearch');
    const clear = form.querySelector('.tc-job-search-clear');

    form.addEventListener('submit', event => {
      event.preventDefault();
      query = input.value;
      applySearch();
    });
    input.addEventListener('input', () => {
      query = input.value;
      scheduleApply(150);
    });
    input.addEventListener('search', () => {
      query = input.value;
      scheduleApply(0);
    });
    clear.addEventListener('click', () => {
      input.value = '';
      query = '';
      applySearch();
      input.focus();
    });

    /* Before a view/sort change, put every row back so the existing code sees
       the complete current result set. Then reapply the title query. */
    document.addEventListener('click', event => {
      if (!normalize(query)) return;
      if (!event.target.closest('.tab,.select-like,.filter-btn,.leg-row[data-sector],.source-chip,.net-node')) return;
      mutating = true;
      try { restoreAll(); } finally { mutating = false; }
      setTimeout(() => {
        resetOrder();
        applySearch();
      }, 180);
    }, true);

    const observer = new MutationObserver(mutations => {
      if (mutating || Date.now() < suppressObserverUntil || !normalize(query)) return;
      const hasNewRows = mutations.some(m => Array.from(m.addedNodes || []).some(node => node.nodeType === 1 && (node.matches?.('.backend-job') || node.querySelector?.('.backend-job'))));
      if (!hasNewRows) return;
      /* A backend refresh is authoritative; stale stashed rows belong to the
         previous result generation and must not be restored. */
      stash.replaceChildren();
      setTimeout(() => {
        resetOrder();
        applySearch();
      }, 90);
    });
    observer.observe(jobList, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
