/* TheCareers country filter
   Adds a compact country selector between KPI cards and Top Opportunities.
   Filtering is visual/client-side only; no backend/search behavior is changed. */
(() => {
  'use strict';
  if (window.__TC_COUNTRY_FILTER__) return;
  window.__TC_COUNTRY_FILTER__ = true;

  const countries = [
    ['all','All Countries','◎'],
    ['kuwait','Kuwait','KW'],
    ['uae','UAE','AE'],
    ['gcc','GCC','GCC'],
    ['saudi','Saudi Arabia','SA'],
    ['qatar','Qatar','QA'],
    ['oman','Oman','OM'],
    ['bahrain','Bahrain','BH']
  ];

  const style = document.createElement('style');
  style.id = 'tc-country-filter-style';
  style.textContent = `
    .tc-country-filter{
      display:flex;align-items:center;gap:8px;flex-wrap:wrap;
      padding:2px 2px 0;margin-top:-2px;
    }
    .tc-country-filter-label{
      font-size:10px;font-weight:800;letter-spacing:.08em;color:#7b828c;
      margin-right:3px;text-transform:uppercase;
    }
    .tc-country-btn{
      min-height:34px;padding:0 13px;border:1px solid #ddd8cf;border-radius:11px;
      background:linear-gradient(180deg,#fff,#faf8f3);color:#34373c;
      box-shadow:0 1px 2px rgba(20,22,26,.04),0 6px 16px -12px rgba(20,22,26,.22);
      display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;
      transition:transform .14s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease;
    }
    .tc-country-btn:hover{transform:translateY(-1px);border-color:#bfc7d0;background:#fff;}
    .tc-country-btn .tc-flag{
      min-width:23px;height:20px;padding:0 4px;border-radius:6px;background:#edf3ff;color:#2f6feb;
      display:inline-grid;place-items:center;font:800 8px 'JetBrains Mono',monospace;
    }
    .tc-country-btn[data-country="kuwait"] .tc-flag{background:#eef8f3;color:#15784b;}
    .tc-country-btn.active{
      color:#fff;background:#121417;border-color:#121417;
      box-shadow:0 7px 18px -12px rgba(0,0,0,.65);
    }
    .tc-country-btn.active .tc-flag{background:rgba(255,255,255,.13);color:#fff;}
    @media(max-width:760px){
      .tc-country-filter{gap:6px;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;scrollbar-width:none;}
      .tc-country-filter::-webkit-scrollbar{display:none;}
      .tc-country-filter-label{display:none;}
      .tc-country-btn{flex:0 0 auto;min-height:32px;padding:0 10px;font-size:10px;}
    }
  `;
  document.head.appendChild(style);

  function mount(){
    if (document.getElementById('tcCountryFilter')) return;
    const statRow = document.querySelector('.stat-row');
    const opps = document.querySelector('.row-opps');
    if (!statRow || !opps) return setTimeout(mount, 120);

    const wrap = document.createElement('div');
    wrap.id = 'tcCountryFilter';
    wrap.className = 'tc-country-filter';
    wrap.setAttribute('aria-label','Filter jobs by country');
    wrap.innerHTML = `<span class="tc-country-filter-label">Country</span>` + countries.map(([key,label,code],i)=>
      `<button type="button" class="tc-country-btn${i===0?' active':''}" data-country="${key}" aria-pressed="${i===0?'true':'false'}"><span class="tc-flag">${code}</span><span>${label}</span></button>`
    ).join('');
    opps.parentNode.insertBefore(wrap, opps);

    document.documentElement.dataset.tcCountryFilter = 'all';
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.tc-country-btn');
      if (!btn) return;
      const key = btn.dataset.country || 'all';
      document.documentElement.dataset.tcCountryFilter = key;
      wrap.querySelectorAll('.tc-country-btn').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.dispatchEvent(new CustomEvent('tc:country-filter-change',{detail:{country:key}}));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
