/* TheCareers — retire the legacy CV Center modal completely.
   Any old internal route that still tries to open it is redirected to Manage CV. */
(() => {
  'use strict';
  if (window.__TC_CV_MODAL_RETIRED__) return;
  window.__TC_CV_MODAL_RETIRED__ = true;

  let redirecting=false;
  function retire(){
    if(redirecting)return;
    const modals=[...document.querySelectorAll('.tc-modal')];
    for(const modal of modals){
      const title=(modal.querySelector('h3')?.textContent||'').trim().toLowerCase();
      if(title!=='cv center')continue;
      redirecting=true;
      modal.closest('.tc-modal-backdrop')?.remove();
      queueMicrotask(()=>{
        try{window.TheCareersCVManager?.open?.();}
        finally{setTimeout(()=>{redirecting=false},50)}
      });
      break;
    }
  }

  const observer=new MutationObserver(()=>queueMicrotask(retire));
  const start=()=>{retire();observer.observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
