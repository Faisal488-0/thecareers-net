/* TheCareers job-list pagination
   Keeps long opportunity feeds compact: 10 jobs per page with numbered controls. */
(() => {
  'use strict';
  if (window.__TC_JOBS_PAGINATION__) return;
  window.__TC_JOBS_PAGINATION__ = true;

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastSignature = '';
  let applying = false;

  const style = document.createElement('style');
  style.id = 'tc-jobs-pagination-style';
  style.textContent = `
    .tc-jobs-pagination{display:flex;align-items:center;justify-content:center;gap:7px;padding:16px 10px 20px;border-top:1px solid #eef0f2;flex-wrap:wrap}
    .tc-page-btn{min-width:34px;height:34px;padding:0 9px;border:1px solid #e0e4e9;border-radius:9px;background:#fff;color:#5b6068;font:700 11px 'JetBrains Mono',monospace;display:inline-grid;place-items:center;cursor:pointer;transition:all .16s ease}
    .tc-page-btn:hover{border-color:#b9c7da;background:#f7f9fc;color:#14161a}
    .tc-page-btn.active{background:#0b0c0e;color:#fff;border-color:#0b0c0e;box-shadow:0 6px 16px -10px rgba(0,0,0,.6)}
    .tc-page-btn:disabled{opacity:.35;cursor:default}
    .tc-page-ellipsis{min-width:24px;text-align:center;color:#8a8f96;font:700 11px 'JetBrains Mono',monospace}
    .tc-page-summary{width:100%;text-align:center;margin-top:3px;color:#8a8f96;font-size:10px}
    @media(max-width:760px){.tc-jobs-pagination{gap:5px;padding:14px 6px 18px}.tc-page-btn{min-width:31px;height:31px;padding:0 7px;border-radius:8px;font-size:10px}.tc-page-summary{font-size:9.5px}}
  `;
  document.head.appendChild(style);

  function getList() { return document.getElementById('jobList'); }
  function rows() { return Array.from(getList()?.querySelectorAll(':scope > .backend-job') || []); }
  function signature(items) { return items.map(r => `${r.dataset.jobId || ''}|${r.dataset.jobUrl || ''}`).join('~'); }

  function ensurePager(list) {
    let pager = document.getElementById('tcJobsPagination');
    if (!pager) {
      pager = document.createElement('nav');
      pager.id = 'tcJobsPagination';
      pager.className = 'tc-jobs-pagination';
      pager.setAttribute('aria-label', 'Job result pages');
      list.insertAdjacentElement('afterend', pager);
    }
    return pager;
  }

  function pageTokens(page, total) {
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
    const out = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    if (start > 2) out.push('…');
    for (let p = start; p <= end; p++) out.push(p);
    if (end < total - 1) out.push('…');
    out.push(total);
    return out;
  }

  function renderPager(pager, totalItems, totalPages) {
    if (totalPages <= 1) {
      pager.hidden = true;
      pager.innerHTML = '';
      return;
    }
    pager.hidden = false;
    const tokenHtml = pageTokens(currentPage, totalPages).map(token => {
      if (token === '…') return '<span class="tc-page-ellipsis" aria-hidden="true">…</span>';
      const label = String(token).padStart(2, '0');
      return `<button class="tc-page-btn${token === currentPage ? ' active' : ''}" type="button" data-page="${token}" aria-label="Page ${token}" aria-current="${token === currentPage ? 'page' : 'false'}">${label}</button>`;
    }).join('');
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(totalItems, currentPage * PAGE_SIZE);
    pager.innerHTML = `<button class="tc-page-btn" type="button" data-step="prev" aria-label="Previous page" ${currentPage === 1 ? 'disabled' : ''}>‹</button>${tokenHtml}<button class="tc-page-btn" type="button" data-step="next" aria-label="Next page" ${currentPage === totalPages ? 'disabled' : ''}>›</button><div class="tc-page-summary">Showing ${start}–${end} of ${totalItems.toLocaleString()} jobs</div>`;
  }

  function apply({resetIfChanged = true, scroll = false} = {}) {
    if (applying) return;
    const list = getList();
    if (!list) return;
    applying = true;
    try {
      const items = rows();
      const sig = signature(items);
      if (resetIfChanged && sig !== lastSignature) currentPage = 1;
      lastSignature = sig;

      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      items.forEach((row, index) => {
        row.style.display = index >= from && index < to ? '' : 'none';
        row.setAttribute('aria-hidden', index >= from && index < to ? 'false' : 'true');
      });

      const pager = ensurePager(list);
      renderPager(pager, items.length, totalPages);
      if (scroll) list.scrollIntoView({behavior:'smooth', block:'start'});
    } finally {
      applying = false;
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('#tcJobsPagination .tc-page-btn');
    if (!btn || btn.disabled) return;
    const total = Math.max(1, Math.ceil(rows().length / PAGE_SIZE));
    if (btn.dataset.page) currentPage = Number(btn.dataset.page);
    else if (btn.dataset.step === 'prev') currentPage = Math.max(1, currentPage - 1);
    else if (btn.dataset.step === 'next') currentPage = Math.min(total, currentPage + 1);
    apply({resetIfChanged:false, scroll:true});
  });

  document.addEventListener('click', e => {
    if (e.target.closest('.tab,.filter-btn,.select-like')) {
      currentPage = 1;
      setTimeout(() => apply({resetIfChanged:false}), 50);
    }
  }, true);

  function boot() {
    const list = getList();
    if (!list) return setTimeout(boot, 150);
    const observer = new MutationObserver(() => {
      if (applying) return;
      requestAnimationFrame(() => apply({resetIfChanged:true}));
    });
    observer.observe(list, {childList:true});
    apply({resetIfChanged:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
