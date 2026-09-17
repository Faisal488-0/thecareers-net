(()=>{'use strict';
if(window.__TC_APPLY_METHOD_OVERLAY__)return;window.__TC_APPLY_METHOD_OVERLAY__=true;
const cfg=window.THECAREERS_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
const key=String(cfg.SUPABASE_PUBLISHABLE_KEY||'');
if(!base||!key||base.startsWith('__')||key.startsWith('__'))return;
const headers={apikey:key,Authorization:`Bearer ${key}`};
let map=new Map();
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeEmail(v=''){const e=String(v||'').trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)?e:'';}
async function load(){
  try{
    const r=await fetch(`${base}/rest/v1/jobs?select=id,application_email,apply_method,url&status=eq.active&limit=1000`,{headers});
    if(!r.ok)return;
    const rows=await r.json();
    map=new Map((rows||[]).map(j=>[String(j.id),j]));
    decorate();
  }catch(e){console.warn('[TheCareers] apply method overlay',e);}
}
function decorate(){
  document.querySelectorAll('.backend-job[data-job-id]').forEach(row=>{
    const j=map.get(String(row.dataset.jobId));if(!j)return;
    const email=safeEmail(j.application_email);
    let box=row.querySelector('.tc-apply-method');
    if(!box){box=document.createElement('div');box.className='tc-apply-method';box.style.cssText='margin-top:7px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11px';const main=row.querySelector('.job-main');main?.appendChild(box);}
    if(email){
      box.innerHTML=`<span style="display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;background:#e9f8ef;color:#137547;font-weight:800">EMAIL APPLY</span><a href="mailto:${esc(email)}" style="color:#1769e0;font-weight:700;text-decoration:none">${esc(email)}</a>`;
      const open=row.querySelector('.tc-open-job');if(open){open.textContent='✉';open.href=`mailto:${email}`;open.title='Apply by email';open.setAttribute('aria-label','Apply by email');}
    }else{
      box.innerHTML='<span style="display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;background:#eef2f6;color:#59616b;font-weight:800">WEBSITE APPLY</span>';
    }
  });
}
const obs=new MutationObserver(()=>decorate());
const start=()=>{const list=document.getElementById('jobList');if(list)obs.observe(list,{childList:true,subtree:true});load();setInterval(load,5*60*1000);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
