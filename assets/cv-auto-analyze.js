/* TheCareers — one-step CV upload + analysis + single-current-CV cleanup
   Selecting a CV starts upload/analysis automatically.
   After the NEW CV reaches ready state, every older CV is permanently removed
   from Supabase Storage, cv_analysis, and user_cvs. The old CV is kept until the
   replacement succeeds so a failed upload never destroys the current profile. */
(() => {
  'use strict';
  if (window.__TC_CV_AUTO_ANALYZE__) return;
  window.__TC_CV_AUTO_ANALYZE__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  const SESSION_KEY = 'thecareers_auth_session_v1';
  let cleanupRunning = false;
  let initialCleanupDoneFor = '';

  const style = document.createElement('style');
  style.id = 'tc-cv-auto-analyze-style';
  style.textContent = `
    .tc-cvm-uploadrow{display:none!important}
    .tc-cvm-filepick{min-height:52px!important;font-size:12px!important}
  `;
  document.head.appendChild(style);

  function sessionLoad(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}
    catch{return null;}
  }

  async function request(url, options={}){
    const session = sessionLoad();
    if(!session?.access_token) throw new Error('Please sign in again.');
    const headers={apikey:apiKey,'Content-Type':'application/json',...(options.headers||{}),Authorization:`Bearer ${session.access_token}`};
    const res=await fetch(url,{...options,headers});
    const text=await res.text();
    let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
    if(!res.ok) throw new Error(data?.message||data?.error||`Request failed (${res.status})`);
    return data;
  }

  const rest=(path,options={})=>request(`${base}/rest/v1/${path}`,options);

  async function deleteStorageObject(path){
    if(!path) return;
    const encoded=String(path).split('/').map(encodeURIComponent).join('/');
    const session=sessionLoad();
    if(!session?.access_token) throw new Error('Please sign in again.');
    const res=await fetch(`${base}/storage/v1/object/cvs/${encoded}`,{
      method:'DELETE',
      headers:{apikey:apiKey,Authorization:`Bearer ${session.access_token}`}
    });
    // A previous partial cleanup may already have removed the object.
    if(res.status===404) return;
    if(!res.ok){
      let msg='Could not delete the previous CV file.';
      try{const body=await res.json();msg=body?.message||body?.error||msg}catch{}
      throw new Error(msg);
    }
  }

  async function cleanupOlderCvs({announce=false}={}){
    if(cleanupRunning || !base || !apiKey) return false;
    const uid=window.TheCareersAccount?.user?.id;
    if(!uid || !sessionLoad()?.access_token) return false;

    cleanupRunning=true;
    try{
      const rows=await rest(`user_cvs?select=id,storage_path,status,created_at&user_id=eq.${encodeURIComponent(uid)}&order=created_at.desc,id.desc`);
      if(!Array.isArray(rows) || rows.length<=1) return true;

      // Never delete the current CV until the newest replacement has completed.
      const newest=rows[0];
      if(String(newest.status||'').toLowerCase()!=='ready') return false;

      const older=rows.slice(1);
      for(const cv of older){
        // 1) Remove the physical object first so we never orphan a private file.
        await deleteStorageObject(cv.storage_path);
        // 2) Remove its analysis.
        await rest(`cv_analysis?cv_id=eq.${encodeURIComponent(cv.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
        // 3) Remove the CV record itself.
        await rest(`user_cvs?id=eq.${encodeURIComponent(cv.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
      }

      if(announce && older.length){
        const status=document.getElementById('tcCvStatus');
        if(status?.isConnected){
          status.className='tc-note ok tc-fast-cv-ready';
          status.textContent=`Ready ✓ — new CV analyzed. ${older.length===1?'Previous CV was':'Previous CVs were'} permanently deleted.`;
        }
      }

      try{await window.TheCareersAuth?.refresh?.()}catch{}
      window.dispatchEvent(new CustomEvent('thecareers:cv-profile-updated',{detail:{reason:'cv-replaced',deleted_previous:older.length}}));
      return true;
    }catch(err){
      console.warn('[TheCareers] previous CV cleanup failed',err);
      if(announce){
        const status=document.getElementById('tcCvStatus');
        if(status?.isConnected){
          status.className='tc-note err';
          status.textContent=`New CV is ready, but the previous CV could not be fully deleted. Retry by reopening Manage CV. (${err.message||'cleanup failed'})`;
        }
      }
      return false;
    }finally{
      cleanupRunning=false;
    }
  }

  function isReadyStatus(status){
    return /ready\s*✓|personalized.*active|job search is now personalized/i.test(status?.textContent||'');
  }

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

    if(status && status.dataset.tcSingleCvWatch!=='1'){
      status.dataset.tcSingleCvWatch='1';
      const observer=new MutationObserver(()=>{
        if(isReadyStatus(status)) cleanupOlderCvs({announce:true});
      });
      observer.observe(status,{childList:true,characterData:true,subtree:true});
      if(isReadyStatus(status)) cleanupOlderCvs({announce:false});
    }

    if (!input || input.dataset.tcAutoAnalyze === '1') return;
    input.dataset.tcAutoAnalyze = '1';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      if (status) status.textContent = `${file.name} selected — starting upload and analysis…`;

      // Let the existing validation/file-selection handlers finish first, then
      // invoke the established secure upload + analysis pipeline exactly once.
      window.setTimeout(() => {
        const btn = document.querySelector('#tcAnalyze') || analyze;
        if (btn && !btn.disabled) btn.click();
      }, 80);
    });
  };

  function initialCleanup(){
    const uid=window.TheCareersAccount?.user?.id;
    if(!uid || initialCleanupDoneFor===uid) return;
    cleanupOlderCvs({announce:false}).then(done=>{if(done)initialCleanupDoneFor=uid;});
  }

  const boot = () => {
    enhance(document);
    // Lightweight polling avoids a page-wide MutationObserver that can slow job cards.
    window.setInterval(()=>{enhance(document);initialCleanup();},900);
    document.addEventListener('click',e=>{
      if(e.target.closest('.nav-item[data-page="cv"]')){
        window.setTimeout(()=>enhance(document),80);
        window.setTimeout(()=>enhance(document),350);
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
