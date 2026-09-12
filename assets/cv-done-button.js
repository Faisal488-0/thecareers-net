/* TheCareers — CV Center completion action */
(() => {
  'use strict';
  if (window.__TC_CV_DONE_BUTTON__) return;
  window.__TC_CV_DONE_BUTTON__ = true;

  const style = document.createElement('style');
  style.id = 'tc-cv-done-style';
  style.textContent = `
    .tc-cv-done-row{display:flex;justify-content:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid #edf0f3}
    .tc-cv-done{min-width:112px;background:#101318!important;color:#fff!important;border-color:#101318!important;font-size:13px;padding:11px 22px!important}
    .tc-cv-done:hover{transform:translateY(-1px)}
    @media(max-width:620px){.tc-cv-done-row{position:sticky;bottom:0;background:#fff;padding-bottom:2px}.tc-cv-done{width:100%;min-height:46px}}
  `;
  document.head.appendChild(style);

  function ensureDone(){
    const modal = document.querySelector('.tc-modal');
    const analysis = modal?.querySelector('#tcAnalysis');
    if (!modal || !analysis || modal.querySelector('#tcCvDone')) return;

    const row = document.createElement('div');
    row.className = 'tc-cv-done-row';
    row.innerHTML = '<button type="button" class="tc-modal-btn tc-cv-done" id="tcCvDone">Done</button>';
    analysis.insertAdjacentElement('afterend', row);

    row.querySelector('#tcCvDone').addEventListener('click', () => {
      const close = modal.querySelector('.tc-modal-close');
      if (close) close.click();
      else modal.closest('.tc-modal-backdrop')?.remove();
    });
  }

  const bodyObserver = new MutationObserver(() => queueMicrotask(ensureDone));
  const start = () => {
    ensureDone();
    bodyObserver.observe(document.body, {childList:true, subtree:false});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
