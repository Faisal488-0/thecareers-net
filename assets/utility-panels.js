/* TheCareers utility panels: turns the sidebar CV Center and Settings entries
   into real controls instead of placeholder scroll targets. */
(() => {
  'use strict';
  if (window.__TC_UTILITY_PANELS__) return;
  window.__TC_UTILITY_PANELS__ = true;

  const style=document.createElement('style');
  style.textContent=`
    .tc-modal-backdrop{position:fixed;inset:0;background:rgba(18,22,28,.28);backdrop-filter:blur(3px);z-index:9998;display:flex;align-items:center;justify-content:center;padding:24px}
    .tc-modal{width:min(560px,96vw);background:#fff;border:1px solid #dfe5ec;border-radius:18px;box-shadow:0 24px 70px rgba(23,32,44,.22);padding:20px;position:relative}
    .tc-modal h3{margin:0 0 6px;font-size:17px}.tc-modal p{margin:0 0 16px;color:#68717d;font-size:12px;line-height:1.6}
    .tc-modal-close{position:absolute;right:14px;top:14px;border:1px solid #dfe5ec;background:#fff;border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px}
    .tc-modal-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.tc-modal-btn{border:1px solid #d6dde6;background:linear-gradient(145deg,#fff,#f2f5f9);border-radius:11px;padding:10px 13px;font-weight:700;cursor:pointer}.tc-modal-btn.primary{background:#101318;color:#fff;border-color:#101318}
    .tc-cv-box{border:1px dashed #cfd8e3;border-radius:12px;padding:16px;background:#fafcff}.tc-cv-status{margin-top:10px;font-size:12px;color:#4f5d6c}.tc-setting{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #edf0f3}.tc-setting:last-child{border-bottom:0}
  `;
  document.head.appendChild(style);

  let current=null;
  function close(){ current?.remove(); current=null; }
  function open(title,body){
    close();
    const back=document.createElement('div'); back.className='tc-modal-backdrop';
    back.innerHTML=`<div class="tc-modal" role="dialog" aria-modal="true" aria-label="${title}"><button class="tc-modal-close" aria-label="Close">×</button><h3>${title}</h3>${body}</div>`;
    back.querySelector('.tc-modal-close').addEventListener('click',close);
    back.addEventListener('click',e=>{if(e.target===back)close();});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});
    document.body.appendChild(back); current=back; return back;
  }

  function cvPanel(){
    const m=open('CV Center',`<p>Pre-launch privacy mode: this control does not upload, transmit, or permanently store your CV. A private account-bound CV vault will be enabled only after authentication and storage policies are ready.</p><div class="tc-cv-box"><input id="tcCvInput" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><div class="tc-cv-status" id="tcCvStatus">No CV selected. Nothing is stored.</div></div><div class="tc-modal-row"><button class="tc-modal-btn" id="tcCvRemove">Clear selection</button></div>`);
    const status=m.querySelector('#tcCvStatus');
    const input=m.querySelector('#tcCvInput');
    // Remove metadata left by older builds. We intentionally retain no CV filename
    // or file metadata in localStorage before the private authenticated vault exists.
    localStorage.removeItem('thecareers_cv_meta_v1');
    input.addEventListener('change',e=>{
      const f=e.target.files?.[0];
      if(!f){status.textContent='No CV selected. Nothing is stored.';return;}
      status.textContent=`Selected for this browser session only (${Math.round(f.size/1024)} KB). The file has not been uploaded.`;
    });
    m.querySelector('#tcCvRemove').addEventListener('click',()=>{
      input.value='';
      status.textContent='No CV selected. Nothing is stored.';
    });
  }

  function settingsPanel(){
    const m=open('Settings',`<p>Live dashboard controls.</p><div class="tc-setting"><span>Refresh Supabase data now</span><button class="tc-modal-btn primary" id="tcRefresh">Refresh</button></div><div class="tc-setting"><span>Reset job tabs, sort and filters</span><button class="tc-modal-btn" id="tcResetFilters">Reset</button></div><div class="tc-setting"><span>Clear locally saved job bookmarks</span><button class="tc-modal-btn" id="tcClearSaved">Clear</button></div>`);
    m.querySelector('#tcRefresh').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Refreshing…';try{await window.TheCareersLive?.refresh?.();b.textContent='Done';}catch{b.textContent='Retry';}setTimeout(()=>{b.disabled=false;b.textContent='Refresh';},1000);});
    m.querySelector('#tcResetFilters').addEventListener('click',()=>{window.TheCareersLive?.resetFilters?.();window.pushActivity?.('Filters reset');});
    m.querySelector('#tcClearSaved').addEventListener('click',()=>{localStorage.removeItem('thecareers_saved_job_ids_v2');window.TheCareersLive?.refresh?.();window.pushActivity?.('Saved jobs cleared');});
  }

  // Capture at document level before older target-level navigation handlers.
  document.addEventListener('click',e=>{
    const item=e.target.closest('.nav-item[data-page]'); if(!item)return;
    if(item.dataset.page==='cv'){e.preventDefault();e.stopPropagation();cvPanel();}
    else if(item.dataset.page==='settings'){e.preventDefault();e.stopPropagation();settingsPanel();}
  },true);
})();
