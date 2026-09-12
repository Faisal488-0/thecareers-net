/* TheCareers — full-page CV workspace
   UI/UX Pro Max direction: enterprise dashboard, clear hierarchy, accessible focus,
   restrained motion, no decorative modal. CV upload/analysis stays on the existing
   secure account pipeline and editable profile chips remain persisted to Supabase. */
(() => {
  'use strict';
  if (window.__TC_CV_PROFILE_MANAGER__) return;
  window.__TC_CV_PROFILE_MANAGER__ = true;

  const cfg=window.THECAREERS_CONFIG||{};
  const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
  const apiKey=cfg.SUPABASE_PUBLISHABLE_KEY||'';
  const SESSION_KEY='thecareers_auth_session_v1';
  let toastTimer=null,refreshing=false,legacySyncTimer=null;

  const icon=(name)=>({
    file:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></svg>',
    upload:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>',
    target:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    skill:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v5c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V7z"/><path d="m9 12 2 2 4-4"/></svg>',
    sector:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12"/><path d="M8 20v-6h8v6M8 10h.01M12 10h.01M16 10h.01"/></svg>',
    dashboard:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    user:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>'
  }[name]||'');

  const style=document.createElement('style');
  style.id='tc-cv-profile-manager-style';
  style.textContent=`
    .tc-cv-manager-page{padding:22px 24px 42px;min-height:calc(100vh - 66px);background:#f6f8fb;overflow:auto;color:#15191f}
    .tc-cvm-shell{max-width:1280px;margin:0 auto}
    .tc-cvm-top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:18px}
    .tc-cvm-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:7px;color:#717a86;font:800 10px/1 'JetBrains Mono',monospace;letter-spacing:.11em;text-transform:uppercase}
    .tc-cvm-eyebrow::before{content:"";width:7px;height:7px;border-radius:2px;background:#1fb567;box-shadow:0 0 0 4px rgba(31,181,103,.10)}
    .tc-cvm-title{margin:0;color:#0c0f13;font-size:30px;line-height:1.12;font-weight:850;letter-spacing:-.035em}
    .tc-cvm-sub{max-width:690px;margin-top:8px;color:#687280;font-size:12px;line-height:1.6}
    .tc-cvm-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
    .tc-cvm-btn{min-height:44px;border:1px solid #d8dee6;background:#fff;color:#20252c;border-radius:11px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:800 11px/1 Inter,system-ui,sans-serif;cursor:pointer;transition:transform .18s var(--tc-motion,cubic-bezier(.22,1,.36,1)),box-shadow .18s ease,border-color .18s ease,background .18s ease}
    .tc-cvm-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .tc-cvm-btn.primary{background:#111318;border-color:#111318;color:#fff}.tc-cvm-btn.green{background:#1fb567;border-color:#1fb567;color:#fff}
    .tc-cvm-btn:hover{transform:translateY(-1px);border-color:#bdc7d2;box-shadow:0 10px 26px -20px rgba(20,22,26,.45)}
    .tc-cvm-btn:focus-visible,.tc-cvm-filepick:focus-visible,.tc-chip-remove:focus-visible{outline:2px solid #2f6feb;outline-offset:3px;box-shadow:0 0 0 4px rgba(47,111,235,.14)}

    .tc-cvm-hero{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(330px,.75fr);gap:14px;margin-bottom:14px}
    .tc-cvm-panel{background:#fff;border:1px solid #e0e5eb;border-radius:16px;box-shadow:0 1px 2px rgba(20,22,26,.025),0 18px 42px -34px rgba(20,22,26,.26)}
    .tc-cvm-overview{padding:20px 20px 18px}
    .tc-cvm-overview-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:15px}
    .tc-cvm-status{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #cfe9dc;border-radius:999px;background:#f5fbf8;color:#207047;font-size:10.5px;font-weight:800}
    .tc-cvm-status.off{border-color:#e2e6eb;background:#f8f9fb;color:#747e8a}.tc-cvm-dot{width:7px;height:7px;border-radius:50%;background:#1fb567}.tc-cvm-status.off .tc-cvm-dot{background:#9aa3ad}
    .tc-cvm-summary{max-width:820px;color:#313a46;font-size:13px;line-height:1.65}
    .tc-cvm-fileline{display:flex;align-items:center;gap:9px;margin-top:14px;padding:11px 12px;border:1px solid #edf0f3;border-radius:11px;background:#fafbfc;color:#66717e;font-size:10.5px;overflow:hidden}
    .tc-cvm-fileline svg{width:16px;height:16px;flex:0 0 auto;fill:none;stroke:#2f6feb;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.tc-cvm-fileline b{color:#252c34;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .tc-cvm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}
    .tc-cvm-stat{min-width:0;padding:12px;border:1px solid #e5e9ef;border-radius:12px;background:#fbfcfe}
    .tc-cvm-stat b{display:block;color:#7b8490;font:800 9px/1.3 'JetBrains Mono',monospace;letter-spacing:.035em;text-transform:uppercase}.tc-cvm-stat strong{display:block;margin-top:5px;color:#101318;font-size:20px;line-height:1;font-weight:850;font-variant-numeric:tabular-nums}

    .tc-cvm-upload{padding:18px;display:flex;flex-direction:column;min-width:0}
    .tc-cvm-upload-head{display:flex;align-items:center;gap:11px;margin-bottom:7px}.tc-cvm-upload-icon{width:38px;height:38px;border-radius:11px;background:#101318;color:#fff;display:grid;place-items:center;flex:0 0 auto}.tc-cvm-upload-icon svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .tc-cvm-upload-title{font-size:13px;font-weight:850;color:#171b20}.tc-cvm-upload-copy{margin:0 0 13px;color:#747e89;font-size:10.5px;line-height:1.55}
    .tc-cv-box.tc-cvm-uploadbox{border:1px dashed #ccd5df;border-radius:13px;padding:13px;background:#fafcff}
    .tc-cvm-filepick{min-height:44px;width:100%;box-sizing:border-box;border:1px solid #dce2e9;border-radius:10px;background:#fff;color:#353c45;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:800;cursor:pointer;transition:border-color .18s ease,background .18s ease,transform .18s ease}
    .tc-cvm-filepick:hover{border-color:#bfc9d5;background:#fdfefe}.tc-cvm-filepick svg{width:16px;height:16px;fill:none;stroke:#2f6feb;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    #tcCvInput{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
    .tc-cvm-uploadrow{display:grid;grid-template-columns:1fr;gap:8px;margin-top:9px}.tc-cvm-uploadrow #tcAnalyze{width:100%;min-height:44px}
    .tc-cvm-uploadmeta{margin-top:9px;color:#7a8490;font-size:9.5px;line-height:1.45}.tc-cvm-upload #tcCvStatus{margin-top:10px;padding:9px 10px;border:1px solid #e1e6ed;border-radius:10px;background:#f8fafc;color:#606c79;font-size:10px;line-height:1.45}

    .tc-cvm-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tc-cvm-card{position:relative;background:#fff;border:1px solid #e0e5eb;border-radius:16px;padding:17px 18px;min-height:160px;box-shadow:0 12px 34px -32px rgba(20,22,26,.3)}.tc-cvm-card.wide{grid-column:1/-1}
    .tc-cvm-cardhead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}.tc-cvm-cardtitle{display:flex;align-items:center;gap:9px}.tc-cvm-cardicon{width:30px;height:30px;border-radius:9px;background:#f1f5fb;color:#2f6feb;display:grid;place-items:center}.tc-cvm-cardicon svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.tc-cvm-cardhead h3{margin:0;color:#1d242d;font-size:12px;line-height:1.25;font-weight:850}.tc-cvm-count{flex:0 0 auto;color:#6e7884;background:#f3f5f8;border:1px solid #e8ebef;border-radius:999px;padding:5px 8px;font:800 9px/1 'JetBrains Mono',monospace}.tc-cvm-help{margin:0 0 11px;color:#7b8490;font-size:10.5px;line-height:1.55}
    .tc-chips{display:flex;flex-wrap:wrap;gap:7px}.tc-chip.tc-chip-editable{position:relative;display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border:1px solid #d8e4f8;border-radius:999px;background:#f1f5fd;color:#315fa9;font-size:10.5px;font-weight:650;transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease}.tc-chip.tc-chip-editable:hover,.tc-chip.tc-chip-editable:focus-within{background:#fff;border-color:#bfcfea;box-shadow:0 7px 18px -14px rgba(47,111,235,.45);transform:translateY(-1px)}
    .tc-chip-remove{width:0;height:20px;opacity:0;overflow:hidden;margin-left:0;padding:0;border:0;border-radius:999px;background:#fff;color:#b42318;font-size:14px;font-weight:900;line-height:20px;cursor:pointer;display:inline-grid;place-items:center;transition:width .16s ease,opacity .16s ease,margin-left .16s ease,background .16s ease}.tc-chip-editable:hover .tc-chip-remove,.tc-chip-editable:focus-within .tc-chip-remove{width:20px;opacity:1;margin-left:5px}.tc-chip-remove:hover{background:#feeceb}.tc-chip.tc-chip-saving{opacity:.52;pointer-events:none}.tc-chip-empty{font-size:10.5px;color:#8b949f;padding:7px 0}
    .tc-cvm-note{display:flex;align-items:flex-start;gap:9px;margin-top:14px;padding:12px 14px;border:1px solid #dce6f6;border-radius:13px;background:#f8fbff;color:#50677f;font-size:10.5px;line-height:1.55}.tc-cvm-note b{color:#294c72}.tc-cvm-note svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:#2f6feb;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .tc-cv-toast{position:fixed;right:24px;bottom:24px;z-index:10020;background:#101318;color:#fff;border-radius:12px;padding:11px 14px;font-size:11px;font-weight:750;box-shadow:0 16px 38px rgba(15,23,42,.22);opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease;pointer-events:none}.tc-cv-toast.show{opacity:1;transform:translateY(0)}.tc-cv-toast.err{background:#9f2f2f}
    .tc-cvm-auth{padding:34px;display:grid;place-items:center;text-align:center;min-height:360px}.tc-cvm-auth-inner{max-width:420px}.tc-cvm-auth-icon{width:50px;height:50px;margin:0 auto 14px;border-radius:14px;background:#101318;color:#fff;display:grid;place-items:center}.tc-cvm-auth-icon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8}.tc-cvm-auth h2{margin:0 0 7px;font-size:20px}.tc-cvm-auth p{margin:0 0 16px;color:#707a86;font-size:11px;line-height:1.6}

    @media(max-width:1024px){.tc-cvm-hero{grid-template-columns:1fr}.tc-cvm-stats{grid-template-columns:repeat(4,minmax(120px,1fr));overflow-x:auto}.tc-cvm-upload{min-height:auto}}
    @media(max-width:760px){.tc-cv-manager-page{padding:16px 12px 30px}.tc-cvm-top{flex-direction:column;gap:13px}.tc-cvm-title{font-size:25px}.tc-cvm-actions{width:100%;justify-content:flex-start}.tc-cvm-actions .tc-cvm-btn{flex:1}.tc-cvm-grid{grid-template-columns:1fr}.tc-cvm-card.wide{grid-column:auto}.tc-cvm-stats{grid-template-columns:1fr 1fr;overflow:visible}.tc-cvm-overview,.tc-cvm-upload,.tc-cvm-card{padding:15px}.tc-cvm-summary{font-size:12px}.tc-chip-remove{width:20px;opacity:1;margin-left:5px}}
    @media(max-width:430px){.tc-cvm-actions{display:grid;grid-template-columns:1fr}.tc-cvm-stats{grid-template-columns:1fr 1fr}.tc-cvm-stat strong{font-size:18px}.tc-cvm-fileline{align-items:flex-start}.tc-cvm-fileline b{white-space:normal}}
    @media(prefers-reduced-motion:reduce){.tc-cvm-btn,.tc-cvm-filepick,.tc-chip.tc-chip-editable,.tc-chip-remove,.tc-cv-toast{transition:none!important;transform:none!important}}
  `;
  document.head.appendChild(style);

  function esc(v=''){return String(v).replace(/[&<>"']/g,s=>s==='&'?'&amp;':s==='<'?'&lt;':s==='>'?'&gt;':s==='"'?'&quot;':'&#39;');}
  const norm=v=>String(v||'').trim().toLowerCase();
  const list=v=>Array.isArray(v)?v:[];
  const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
  const account=()=>{const a=window.TheCareersAccount||{};return{user:a.user||null,analysis:a.analysis||null,preferences:a.preferences||null,profile:a.profile||null}};

  function toast(msg,error=false){let el=document.getElementById('tcCvManagerToast');if(!el){el=document.createElement('div');el.id='tcCvManagerToast';document.body.appendChild(el)}el.textContent=msg;el.className=`tc-cv-toast${error?' err':''} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1900)}
  async function rest(path,options={}){const s=session();if(!s?.access_token)throw new Error('Your session expired. Please sign in again.');const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);try{const res=await fetch(`${base}/rest/v1/${path}`,{...options,headers:{apikey:apiKey,'Content-Type':'application/json',Authorization:`Bearer ${s.access_token}`,...(options.headers||{})},signal:ctrl.signal});const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!res.ok)throw new Error(data?.message||data?.error||`Request failed (${res.status})`);return data}finally{clearTimeout(timer)}}

  async function saveRemoval(kind,value){
    const a=account(),u=a.user,an=a.analysis,p=a.preferences,pr=a.profile;if(!u?.id||!an)throw new Error('CV profile is not available.');
    const field=kind==='role'?'inferred_titles':kind==='skill'?'skills':'industries';
    const nextMain=list(an[field]).filter(x=>norm(x)!==norm(value));
    const nextKeywords=list(an.search_keywords).filter(x=>norm(x)!==norm(value));
    const filter=an.id?`id=eq.${encodeURIComponent(an.id)}`:an.cv_id?`cv_id=eq.${encodeURIComponent(an.cv_id)}`:`user_id=eq.${encodeURIComponent(u.id)}`;
    const writes=[rest(`cv_analysis?${filter}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({[field]:nextMain,search_keywords:nextKeywords})})];
    let pPatch=null,profilePatch=null;
    if(p){pPatch={};if(kind==='role')pPatch.target_titles=list(p.target_titles).filter(x=>norm(x)!==norm(value));if(kind==='skill')pPatch.keywords=list(p.keywords).filter(x=>norm(x)!==norm(value));if(kind==='sector')pPatch.sectors=list(p.sectors).filter(x=>norm(x)!==norm(value));if(kind!=='skill')pPatch.keywords=list(p.keywords).filter(x=>norm(x)!==norm(value));writes.push(rest(`search_preferences?user_id=eq.${encodeURIComponent(u.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(pPatch)}))}
    if(pr&&(kind==='role'||kind==='sector')){const key=kind==='role'?'target_roles':'preferred_sectors';profilePatch={[key]:list(pr[key]).filter(x=>norm(x)!==norm(value))};writes.push(rest(`profiles?id=eq.${encodeURIComponent(u.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(profilePatch)}))}
    const results=await Promise.allSettled(writes),failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
    an[field]=nextMain;an.search_keywords=nextKeywords;if(pPatch)Object.assign(p,pPatch);if(profilePatch)Object.assign(pr,profilePatch);
    window.TheCareersAccount={...window.TheCareersAccount,analysis:an,preferences:p,profile:pr};return nextMain.length;
  }

  document.addEventListener('click',async e=>{
    const x=e.target.closest('.tc-chip-remove');if(!x)return;
    e.preventDefault();e.stopPropagation();
    const chip=x.closest('.tc-chip'),kind=chip?.dataset.kind,value=chip?.dataset.value;if(!chip||!kind||!value)return;
    const parent=chip.parentElement,marker=chip.nextSibling,backup=chip.cloneNode(true);chip.classList.add('tc-chip-saving');
    try{const count=await saveRemoval(kind,value);chip.remove();if(parent&&!parent.querySelector('.tc-chip')){const empty=document.createElement('div');empty.className='tc-chip-empty';empty.textContent='No items selected.';parent.appendChild(empty)}document.querySelectorAll(`[data-tc-count="${kind}"]`).forEach(el=>el.textContent=String(count));toast(`${value} removed from your active CV profile.`);window.dispatchEvent(new CustomEvent('thecareers:cv-profile-updated',{detail:{kind,value}}))}
    catch(err){chip.remove();parent?.insertBefore(backup,marker);toast(err?.message||'Could not save this change.',true)}
  },true);

  function chipHtml(kind,items){const values=list(items);return values.length?`<div class="tc-chips">${values.map(v=>`<span class="tc-chip tc-chip-editable" data-kind="${kind}" data-value="${esc(v)}"><span>${esc(v)}</span><button type="button" class="tc-chip-remove" title="Remove ${esc(v)}" aria-label="Remove ${esc(v)}">×</button></span>`).join('')}</div>`:'<div class="tc-chip-empty">No items selected.</div>'}
  async function latestCv(uid){try{const r=await rest(`user_cvs?select=original_name,status,created_at&user_id=eq.${encodeURIComponent(uid)}&order=created_at.desc&limit=1`);return r?.[0]||null}catch{return null}}

  function signedOutHtml(){return `<div class="tc-cvm-auth tc-cvm-panel"><div class="tc-cvm-auth-inner"><div class="tc-cvm-auth-icon">${icon('user')}</div><h2>Sign in to manage your CV</h2><p>Your CV analysis, matching signals and uploaded file are private to your account.</p><button type="button" class="tc-cvm-btn primary" id="tcCvmSignIn">Sign in</button></div></div>`}
  function pageHtml(a,file=null){
    if(!a.user)return `<div class="tc-cvm-shell"><div class="tc-cvm-top"><div><div class="tc-cvm-eyebrow">CV WORKSPACE</div><h1 class="tc-cvm-title">Manage CV</h1><div class="tc-cvm-sub">One place to upload your CV and control the signals used for personalized job matching.</div></div><div class="tc-cvm-actions"><button class="tc-cvm-btn" id="tcCvmDone">${icon('dashboard')}Back to Dashboard</button></div></div>${signedOutHtml()}</div>`;
    const an=a.analysis||{},roles=list(an.inferred_titles),skills=list(an.skills),sectors=list(an.industries),active=!!a.analysis;
    const summary=active?(an.summary||'Your CV has been analyzed and is actively shaping job matching and search preferences.'):'Upload a CV to create your personalized matching profile. The analysis will extract target roles, skills and sectors.';
    const fileName=file?.original_name||'No CV uploaded yet';
    return `<div class="tc-cvm-shell">
      <header class="tc-cvm-top"><div><div class="tc-cvm-eyebrow">CV WORKSPACE</div><h1 class="tc-cvm-title">Manage CV</h1><div class="tc-cvm-sub">Review what TheCareers learned from your CV, remove signals you do not want used, and replace the document whenever your experience changes.</div></div><div class="tc-cvm-actions"><button class="tc-cvm-btn" id="tcCvmAccount">${icon('user')}My account</button><button class="tc-cvm-btn primary" id="tcCvmDone">${icon('dashboard')}Back to Dashboard</button></div></header>
      <div class="tc-cvm-hero">
        <section class="tc-cvm-panel tc-cvm-overview"><div class="tc-cvm-overview-head"><div class="tc-cvm-status${active?'':' off'}"><span class="tc-cvm-dot"></span>${active?'CV personalization active':'CV analysis not active'}</div></div><div class="tc-cvm-summary">${esc(summary)}</div><div class="tc-cvm-fileline">${icon('file')}<span>Current CV</span><b>${esc(fileName)}</b></div><div class="tc-cvm-stats"><div class="tc-cvm-stat"><b>ATS readiness</b><strong>${active?Number(an.ats_score||0):0}%</strong></div><div class="tc-cvm-stat"><b>Experience</b><strong>${an.years_experience==null?'—':`${an.years_experience}+`}</strong></div><div class="tc-cvm-stat"><b>Target roles</b><strong data-tc-count="role">${roles.length}</strong></div><div class="tc-cvm-stat"><b>Skills</b><strong data-tc-count="skill">${skills.length}</strong></div></div></section>
        <aside class="tc-cvm-panel tc-cvm-upload"><div class="tc-cvm-upload-head"><div class="tc-cvm-upload-icon">${icon('upload')}</div><div><div class="tc-cvm-upload-title">${active?'Replace your CV':'Upload your CV'}</div></div></div><p class="tc-cvm-upload-copy">PDF, DOCX or TXT up to 10 MB. Uploading a newer CV refreshes your matching profile without changing your account.</p><div class="tc-cv-box tc-cvm-uploadbox"><label class="tc-cvm-filepick" for="tcCvInput" tabindex="0">${icon('file')}Choose CV file</label><input id="tcCvInput" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"><div class="tc-cvm-uploadrow"><button class="tc-cvm-btn green" id="tcAnalyze" type="button">${active?'Replace CV':'Upload CV'}</button></div><div class="tc-cvm-uploadmeta">Secure account storage · analysis runs after upload</div></div><div id="tcCvStatus">${active?'Your current CV profile is ready. Choose a new file only when you want to replace it.':'Choose a CV to build your personalized job search profile.'}</div></aside>
      </div>
      <div class="tc-cvm-grid">
        <section class="tc-cvm-card"><div class="tc-cvm-cardhead"><div class="tc-cvm-cardtitle"><span class="tc-cvm-cardicon">${icon('target')}</span><h3>Target roles</h3></div><span class="tc-cvm-count"><span data-tc-count="role">${roles.length}</span> ACTIVE</span></div><p class="tc-cvm-help">Job titles with the strongest influence on personalized matching. Hover a chip and click × to remove it.</p>${chipHtml('role',roles)}</section>
        <section class="tc-cvm-card"><div class="tc-cvm-cardhead"><div class="tc-cvm-cardtitle"><span class="tc-cvm-cardicon">${icon('sector')}</span><h3>Search sectors</h3></div><span class="tc-cvm-count"><span data-tc-count="sector">${sectors.length}</span> ACTIVE</span></div><p class="tc-cvm-help">Industries used to prioritize where TheCareers searches and ranks opportunities.</p>${chipHtml('sector',sectors)}</section>
        <section class="tc-cvm-card wide"><div class="tc-cvm-cardhead"><div class="tc-cvm-cardtitle"><span class="tc-cvm-cardicon">${icon('skill')}</span><h3>Detected skills</h3></div><span class="tc-cvm-count"><span data-tc-count="skill">${skills.length}</span> ACTIVE</span></div><p class="tc-cvm-help">Skills used as search and CV-match signals. Remove anything you do not want influencing recommendations.</p>${chipHtml('skill',skills)}</section>
      </div>
      <div class="tc-cvm-note">${icon('target')}<div><b>High Match uses this profile.</b> Roles, skills and sectors kept here are used to calculate your personalized CV Match. Removing an item changes future matching; it does not alter your original uploaded document.</div></div>
    </div>`;
  }

  function relabelNav(){
    const nav=document.querySelector('.nav-item[data-page="cv"]');if(!nav)return;
    for(const node of nav.childNodes){if(node.nodeType===Node.TEXT_NODE&&/CV Center|Manage CV/i.test(node.textContent||'')){node.textContent='Manage CV';break}}
    nav.setAttribute('aria-label','Manage CV');
  }
  function setCvNavActive(){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page==='cv'))}
  function close(goDashboard=false){
    document.getElementById('tcCvManagerPage')?.remove();
    const content=document.querySelector('.main > .content');if(content)content.style.display='';
    if(goDashboard){document.querySelector('.nav-item[data-page="dashboard"]')?.click();window.scrollTo({top:0,behavior:'smooth'})}
  }
  async function refreshPage(page){
    if(refreshing||!page?.isConnected)return;refreshing=true;
    try{await window.TheCareersAuth?.refresh?.();const a=account(),file=a.user?.id?await latestCv(a.user.id):null;if(page.isConnected){page.innerHTML=pageHtml(a,file);bindPage(page)}}catch(err){console.warn('[TheCareers] CV manager refresh',err)}finally{refreshing=false}
  }
  function bindPage(page){
    page.querySelector('#tcCvmDone')?.addEventListener('click',()=>close(true));
    page.querySelector('#tcCvmAccount')?.addEventListener('click',()=>window.TheCareersAuth?.account?.());
    page.querySelector('#tcCvmSignIn')?.addEventListener('click',()=>window.TheCareersAuth?.signIn?.());
    const fileInput=page.querySelector('#tcCvInput'),fileLabel=page.querySelector('.tc-cvm-filepick');
    fileLabel?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput?.click()}});
    const status=page.querySelector('#tcCvStatus');
    if(status){let done=false;const mo=new MutationObserver(()=>{if(done)return;const text=status.textContent||'';if(/Ready\s*✓|personalized job search profile is active|job search is now personalized/i.test(text)){done=true;setTimeout(()=>refreshPage(page),250)}});mo.observe(status,{childList:true,subtree:true,characterData:true})}
  }
  async function open(){
    document.querySelector('.tc-modal-backdrop')?.remove();
    const content=document.querySelector('.main > .content');if(!content)return;
    content.style.display='none';document.getElementById('tcCvManagerPage')?.remove();
    const page=document.createElement('section');page.id='tcCvManagerPage';page.className='tc-cv-manager-page';page.setAttribute('aria-label','Manage CV');page.innerHTML=pageHtml(account());
    content.insertAdjacentElement('beforebegin',page);bindPage(page);setCvNavActive();relabelNav();window.scrollTo({top:0,behavior:'smooth'});refreshPage(page);
  }

  /* Capture before legacy document handlers so CV navigation never opens the old modal. */
  window.addEventListener('click',e=>{
    const cvNav=e.target.closest?.('.nav-item[data-page="cv"],#tcOpenCv,#tcCvManage,[data-open-cv-manager]');
    if(cvNav){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();return}
    const nav=e.target.closest?.('.nav-item[data-page]');if(nav&&nav.dataset.page!=='cv'&&document.getElementById('tcCvManagerPage'))close(false);
  },true);

  function syncLegacyEntryPoints(){
    relabelNav();
    if(window.TheCareersAuth&&window.TheCareersAuth.cv!==open){window.TheCareersAuth.cv=open;clearInterval(legacySyncTimer);legacySyncTimer=null}
  }
  const start=()=>{syncLegacyEntryPoints();legacySyncTimer=setInterval(syncLegacyEntryPoints,250);setTimeout(()=>{if(legacySyncTimer){clearInterval(legacySyncTimer);legacySyncTimer=null}},12000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.TheCareersCVManager={open,close,refresh:()=>refreshPage(document.getElementById('tcCvManagerPage'))};
})();
