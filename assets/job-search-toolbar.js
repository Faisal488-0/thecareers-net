/* TheCareers — backend job-title search + opportunity controls polish. */
(() => {
  'use strict';
  if (window.__TC_JOB_TITLE_SEARCH__) return;
  window.__TC_JOB_TITLE_SEARCH__ = true;

  const style = document.createElement('style');
  style.id = 'tc-job-title-search-style';
  style.textContent = `
    .tc-job-searchbar{margin:14px 20px 4px;padding:10px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;background:linear-gradient(180deg,#fbfcfd,#f7f9fb);border:1px solid #e2e6eb;border-radius:14px}
    .tc-job-search-field{min-width:0;height:48px;padding:0 9px 0 14px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #d8dee6;border-radius:11px;box-shadow:0 1px 2px rgba(20,22,26,.025);transition:border-color .15s ease,box-shadow .15s ease}
    .tc-job-search-field:focus-within{border-color:#a8b2bf;box-shadow:0 0 0 3px rgba(17,19,24,.06),0 9px 22px -20px rgba(17,19,24,.55)}
    .tc-job-search-icon{width:19px;height:19px;display:grid;place-items:center;color:#69727d;flex:0 0 auto}.tc-job-search-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    #tcJobTitleSearch{width:100%;min-width:0;height:100%;padding:0;border:0;outline:0;background:transparent;color:#111318;font:700 14px/1.2 Inter,system-ui,sans-serif;-webkit-appearance:none;appearance:none}
    #tcJobTitleSearch::-webkit-search-cancel-button{display:none;-webkit-appearance:none}
    #tcJobTitleSearch::placeholder{color:#8e96a0;font-weight:520}
    .tc-job-search-clear{width:31px;height:31px;padding:0;border:0;border-radius:8px;background:#f0f3f6;color:#6d7680;display:none;place-items:center;font:800 17px/1 Inter,system-ui,sans-serif;cursor:pointer}.tc-job-search-clear.visible{display:grid}.tc-job-search-clear:hover{background:#e7ebef;color:#111318}
    .tc-job-search-meta{min-width:138px;padding:0 9px;text-align:center;color:#737c87;font:700 10.5px/1.3 'JetBrains Mono',monospace;white-space:nowrap}.tc-job-search-meta.active{color:#14764a}.tc-job-search-meta.busy{color:#2f6feb}
    .row-opps>.panel:first-child .opps-toolbar{
      display:flex;flex-wrap:wrap;align-items:stretch;
      padding:12px 18px 16px;gap:12px;
      border-bottom:1px solid #eef1f4;background:linear-gradient(180deg,#fff 0%,#fcfcfd 100%);
    }
    .row-opps>.panel:first-child .tabs{
      flex:1 1 640px;display:grid;
      grid-template-columns:repeat(4,minmax(132px,1fr));
      gap:12px;padding:2px 0 7px;border:0;border-radius:0;background:transparent;
    }
    .row-opps>.panel:first-child .tab{
      position:relative;min-height:68px;padding:13px 14px 25px;
      text-align:left;border:1px solid #dfe4e9;border-radius:15px;
      background:linear-gradient(180deg,#fff 0%,#fbfbf9 55%,#f5f3ed 100%);
      color:#252a31;
      box-shadow:0 2px 4px rgba(20,22,26,.035),0 8px 18px -18px rgba(20,22,26,.42),inset 0 1px 0 rgba(255,255,255,.96);
      font-size:13px;font-weight:800;line-height:1.2;white-space:nowrap;
      cursor:pointer;touch-action:manipulation;
      transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease,background .14s ease,color .14s ease;
    }
    .row-opps>.panel:first-child .tab::before{
      content:'';position:absolute;left:13px;right:13px;top:0;height:3px;border-radius:0 0 999px 999px;background:#c7cdd4;opacity:.9;
    }
    .row-opps>.panel:first-child .tab[data-tab="high"]::before{background:#d89532}
    .row-opps>.panel:first-child .tab[data-tab="all"]::before{background:#343941}
    .row-opps>.panel:first-child .tab[data-tab="new"]::before{background:#3974e8}
    .row-opps>.panel:first-child .tab[data-tab="saved"]::before{background:#27a86b}
    .row-opps>.panel:first-child .tab:hover{
      transform:translateY(-2px);border-color:#cbd2da;
      box-shadow:0 4px 8px rgba(20,22,26,.05),0 14px 26px -22px rgba(20,22,26,.46),inset 0 1px 0 #fff;
    }
    .row-opps>.panel:first-child .tab:focus-visible{
      outline:3px solid rgba(47,111,235,.20);outline-offset:3px;
    }
    .row-opps>.panel:first-child .tab::after{
      position:absolute;left:14px;bottom:9px;color:#7b838d;
      font-size:9.5px;font-weight:650;line-height:1;letter-spacing:.005em;
    }
    .row-opps>.panel:first-child .tab[data-tab="high"]::after{content:'Best matches for your CV'}
    .row-opps>.panel:first-child .tab[data-tab="all"]::after{content:'Every verified role'}
    .row-opps>.panel:first-child .tab[data-tab="new"]::after{content:'Added today'}
    .row-opps>.panel:first-child .tab[data-tab="saved"]::after{content:'Your shortlist'}
    .row-opps>.panel:first-child .tab.active{
      color:#fff;border-color:#101318;
      background:linear-gradient(155deg,#3b414a 0%,#20242b 45%,#0d1014 100%);
      box-shadow:0 5px 0 #07090c,0 11px 20px -9px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.13),inset 0 -2px 5px rgba(0,0,0,.32);
      transform:translateY(-1px);
    }
    .row-opps>.panel:first-child .tab.active::before{background:rgba(255,255,255,.52)}
    .row-opps>.panel:first-child .tab.active::after{color:#d6dbe2}
    .row-opps>.panel:first-child .opps-actions{align-self:center;gap:8px}.row-opps>.panel:first-child .select-like,.row-opps>.panel:first-child .filter-btn{min-height:44px;padding:0 14px;border-radius:11px;border-color:#dbe1e7;background:#fff;box-shadow:0 1px 2px rgba(20,22,26,.025);font-size:12px;font-weight:760}.row-opps>.panel:first-child .select-like:hover{background:#f8f9fa;border-color:#cbd1d8}.row-opps>.panel:first-child .filter-btn{background:#111318;color:#fff;border-color:#111318;box-shadow:0 7px 18px -14px rgba(0,0,0,.7)}
    .tc-country-filter{width:max-content;max-width:100%;margin-top:0!important;padding:7px 8px!important;gap:6px!important;background:#fff;border:1px solid #e2e6eb;border-radius:14px;box-shadow:0 1px 2px rgba(20,22,26,.025),0 8px 22px -22px rgba(20,22,26,.38)}.tc-country-filter-label{min-height:36px;padding:0 9px 0 5px;margin-right:1px!important;display:inline-flex;align-items:center;border-right:1px solid #edf0f2;color:#717a85!important;font-size:10.5px!important}.tc-country-btn{min-height:38px!important;padding:0 12px!important;border-color:#dfe4e9!important;background:#fbfcfd!important;box-shadow:none!important;border-radius:10px!important;font-size:11.5px!important}.tc-country-btn:hover{background:#fff!important;border-color:#cbd1d8!important}.tc-country-btn.active{background:#111318!important;color:#fff!important;border-color:#111318!important}
    @media(max-width:1050px){
      .row-opps>.panel:first-child .tabs{flex-basis:100%;gap:10px}
      .row-opps>.panel:first-child .opps-actions{width:100%;justify-content:flex-end}
    }
    @media(max-width:760px){
      .tc-job-searchbar{margin:10px 10px 4px;padding:8px;grid-template-columns:1fr;gap:6px}
      .tc-job-search-field{height:50px}
      .tc-job-search-meta{min-width:0;padding:2px 4px 0;text-align:left;font-size:10px}
      .row-opps>.panel:first-child .opps-toolbar{padding:10px;display:block;overflow:hidden}
      .row-opps>.panel:first-child .tabs{width:100%;display:flex;overflow-x:auto;gap:8px;padding:2px 2px 9px;scrollbar-width:none;scroll-snap-type:x proximity}
      .row-opps>.panel:first-child .tabs::-webkit-scrollbar{display:none}
      .row-opps>.panel:first-child .tab{flex:0 0 164px;min-height:66px;scroll-snap-align:start}
      .row-opps>.panel:first-child .opps-actions{margin-top:8px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .row-opps>.panel:first-child .select-like,.row-opps>.panel:first-child .filter-btn{justify-content:center;min-height:46px}
      .tc-country-filter{width:100%;border-radius:12px;overflow-x:auto;flex-wrap:nowrap!important}
      .tc-country-filter-label{display:none!important}
    }
  `;
  document.head.appendChild(style);

  let timer = null;
  let query = '';
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();

  function updateUrl(value) {
    try {
      const u = new URL(location.href);
      if (clean(value)) u.searchParams.set('q', clean(value)); else u.searchParams.delete('q');
      history.replaceState(history.state, '', u);
    } catch (_) {}
  }

  function setMeta(text, state='') {
    const meta = document.getElementById('tcJobSearchMeta');
    if (!meta) return;
    meta.classList.toggle('active', state === 'active');
    meta.classList.toggle('busy', state === 'busy');
    meta.textContent = text;
  }

  function emitSearch(value) {
    query = clean(value);
    document.documentElement.dataset.tcJobTitleQuery = query;
    if (!query) delete document.documentElement.dataset.tcJobTitleQuery;
    document.querySelector('.tc-job-search-clear')?.classList.toggle('visible', Boolean(query));
    updateUrl(query);
    setMeta(query ? 'SEARCHING BACKEND…' : 'TYPE A JOB TITLE', query ? 'busy' : '');
    document.dispatchEvent(new CustomEvent('tc:job-title-search', { detail: { query } }));
  }

  function schedule(value, delay=260) {
    clearTimeout(timer);
    timer = setTimeout(() => emitSearch(value), delay);
  }

  function mount() {
    const toolbar = document.querySelector('.row-opps > .panel:first-child .opps-toolbar');
    if (!toolbar) return setTimeout(mount, 120);
    if (document.getElementById('tcJobTitleSearch')) return;

    const form = document.createElement('form');
    form.className = 'tc-job-searchbar';
    form.id = 'tcJobSearchBar';
    form.setAttribute('role','search');
    form.setAttribute('aria-label','Search jobs by role');
    form.innerHTML = `
      <label class="tc-job-search-field" for="tcJobTitleSearch">
        <span class="tc-job-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.2 4.2"></path></svg></span>
        <input id="tcJobTitleSearch" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="Search a role — e.g. HR, Teacher, Engineer, Accountant">
        <button class="tc-job-search-clear" type="button" aria-label="Clear role search" title="Clear search">×</button>
      </label>
      <div class="tc-job-search-meta" id="tcJobSearchMeta" aria-live="polite">TYPE A JOB TITLE</div>`;
    toolbar.insertAdjacentElement('beforebegin', form);

    const input = form.querySelector('#tcJobTitleSearch');
    const clear = form.querySelector('.tc-job-search-clear');
    const initial = clean(new URL(location.href).searchParams.get('q') || '');
    if (initial) { input.value = initial; query = initial; clear.classList.add('visible'); setMeta('SEARCHING BACKEND…','busy'); setTimeout(()=>emitSearch(initial),650); }

    form.addEventListener('submit', e => { e.preventDefault(); emitSearch(input.value); });
    input.addEventListener('input', () => schedule(input.value, 280));
    input.addEventListener('search', () => schedule(input.value, 0));
    clear.addEventListener('click', () => { input.value=''; emitSearch(''); input.focus(); });
  }

  document.addEventListener('tc:job-search-results', e => {
    const detail = e.detail || {};
    if (clean(detail.query) !== query) return;
    const count = Number(detail.count || 0);
    setMeta(query ? `${count.toLocaleString()} RELATED ROLE${count === 1 ? '' : 'S'}` : 'BACKEND READY', query ? 'active' : '');
    const input = document.getElementById('tcJobTitleSearch');
    if (input) input.setAttribute('aria-label', query ? `Search related job roles. ${count} results.` : 'Search jobs by role');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
