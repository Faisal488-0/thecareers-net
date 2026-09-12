/* TheCareers — CV Center completion actions */
(() => {
  'use strict';
  if (window.__TC_CV_DONE_BUTTON__) return;
  window.__TC_CV_DONE_BUTTON__ = true;

  const style = document.createElement('style');
  style.id = 'tc-cv-done-style';
  style.textContent = `
    .tc-cv-done-row{display:flex;justify-content:flex-end;gap:9px;margin-top:16px;padding-top:14px;border-top:1px solid #edf0f3}
    .tc-cv-manage{min-width:132px;background:#1fb567!important;color:#fff!important;border-color:#1fb567!important;font-size:13px;padding:11px 18px!important}
    .tc-cv-done{min-width:112px;background:#101318!important;color:#fff!important;border-color:#101318!important;font-size:13px;padding:11px 22px!important}
    .tc-cv-manage:hover,.tc-cv-done:hover{transform:translateY(-1px)}
    @media(max-width:620px){.tc-cv-done-row{position:sticky;bottom:0;background:#fff;padding-bottom:2px;flex-direction:column}.tc-cv-manage,.tc-cv-done{width:100%;min-height:46px}}
  `;
  document.head.appendChild(style);

  function goDashboard(){
    window.TheCareersCVManager?.close?.(false);
    const dash=document.querySelector('.nav-item[data-page="dashboard"]');
    if(dash)dash.click();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function ensureActions(){
    const modal = document.querySelector('.tc-modal');
    const analysis = modal?.querySelector('#tcAnalysis');
    if (!modal || !analysis) return;
    const hasAnalysis = !!analysis.querySelector('.tc-analysis-card') || !!analysis.textContent.trim();
    if (!hasAnalysis) return;
    if (modal.querySelector('#tcCvDoneRow')) return;

    const row = document.createElement('div');
    row.className = 'tc-cv-done-row';
    row.id = 'tcCvDoneRow';
    row.innerHTML = '<button type="button" class="tc-modal-btn tc-cv-manage" id="tcCvManage">Manage CV</button><button type="button" class="tc-modal-btn tc-cv-done" id="tcCvDone">Done</button>';
    analysis.insertAdjacentElement('afterend', row);

    row.querySelector('#tcCvManage').addEventListener('click', () => {
      const close = modal.querySelector('.tc-modal-close');
      if (close) close.click(); else modal.closest('.tc-modal-backdrop')?.remove();
      setTimeout(()=>window.TheCareersCVManager?.open?.(),40);
    });
    row.querySelector('#tcCvDone').addEventListener('click', () => {
      const close = modal.querySelector('.tc-modal-close');
      if (close) close.click(); else modal.closest('.tc-modal-backdrop')?.remove();
      setTimeout(goDashboard,30);
    });
  }

  function watchModal(){
    ensureActions();
    const analysis=document.querySelector('.tc-modal #tcAnalysis');
    if(!analysis||analysis.dataset.tcActionsObserved==='1')return;
    analysis.dataset.tcActionsObserved='1';
    const mo=new MutationObserver(()=>queueMicrotask(ensureActions));
    mo.observe(analysis,{childList:true,subtree:false});
  }

  const bodyObserver = new MutationObserver(() => queueMicrotask(watchModal));
  const start = () => { watchModal(); bodyObserver.observe(document.body, {childList:true, subtree:false}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
