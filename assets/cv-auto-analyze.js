/* TheCareers — one-step CV upload + analysis
   Selecting a CV is the action: upload and analysis start automatically. */
(() => {
  'use strict';
  if (window.__TC_CV_AUTO_ANALYZE__) return;
  window.__TC_CV_AUTO_ANALYZE__ = true;

  const style = document.createElement('style');
  style.id = 'tc-cv-auto-analyze-style';
  style.textContent = `
    .tc-cvm-uploadrow{display:none!important}
    .tc-cvm-filepick{min-height:52px!important;font-size:12px!important}
  `;
  document.head.appendChild(style);

  const enhance = (root = document) => {
    const input = root.querySelector?.('#tcCvInput') || document.querySelector('#tcCvInput');
    const label = document.querySelector('label.tc-cvm-filepick[for="tcCvInput"]');
    const analyze = document.querySelector('#tcAnalyze');
    const status = document.querySelector('#tcCvStatus');

    if (label && !label.dataset.tcAutoCopy) {
      label.dataset.tcAutoCopy = '1';
      const textNodes = [...label.childNodes].filter(n => n.nodeType === Node.TEXT_NODE);
      if (textNodes.length) textNodes[textNodes.length - 1].textContent = ' Choose CV & analyze';
      else label.append(document.createTextNode(' Choose CV & analyze'));
      label.setAttribute('aria-label', 'Choose CV and analyze automatically');
    }

    if (!input || input.dataset.tcAutoAnalyze === '1') return;
    input.dataset.tcAutoAnalyze = '1';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      if (status) status.textContent = `${file.name} selected — starting upload and analysis…`;

      // Let existing validation/file-selection handlers finish first, then invoke
      // the established secure upload + analysis pipeline exactly once.
      window.setTimeout(() => {
        const btn = document.querySelector('#tcAnalyze') || analyze;
        if (btn && !btn.disabled) btn.click();
      }, 80);
    });
  };

  const boot = () => {
    enhance(document);
    const observer = new MutationObserver(() => enhance(document));
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
