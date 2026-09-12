/* TheCareers — fast CV upload + non-blocking background analysis.
   Overrides only the CV Center upload action; account/auth and existing CV logic remain intact. */
(() => {
  'use strict';
  if (window.__TC_FAST_CV_UPLOAD__) return;
  window.__TC_FAST_CV_UPLOAD__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  const SESSION_KEY = 'thecareers_auth_session_v1';
  const MAX_CV = 10 * 1024 * 1024;
  const allowedExt = new Set(['pdf','docx','txt']);
  const countries = ['Kuwait','Saudi Arabia','United Arab Emirates','Qatar','Bahrain','Oman'];
  let lastRetry = null;

  const style = document.createElement('style');
  style.id = 'tc-fast-cv-style';
  style.textContent = `
    .tc-fast-cv-progress{display:none;margin-top:12px}
    .tc-fast-cv-progress.active{display:block}
    .tc-fast-cv-track{height:8px;background:#edf1f5;border-radius:999px;overflow:hidden;border:1px solid #e3e8ee}
    .tc-fast-cv-bar{height:100%;width:0%;background:linear-gradient(90deg,#1fb567,#58cb91);border-radius:inherit;transition:width .16s ease}
    .tc-fast-cv-caption{display:flex;justify-content:space-between;gap:12px;margin-top:7px;color:#68717d;font-size:10.5px;line-height:1.3}
    .tc-fast-cv-caption strong{color:#28313b;font-weight:800}
    .tc-fast-cv-ready{border-color:#ccebd9!important;background:#f5fcf8!important;color:#277248!important}
    .tc-fast-cv-bg{border-color:#d8e5fb!important;background:#f7faff!important;color:#47617e!important}
    .tc-fast-retry{margin-left:8px}
    .tc-fast-cv-file{margin-top:8px;font-size:10.5px;color:#536171;font-weight:700;overflow-wrap:anywhere}
  `;
  document.head.appendChild(style);

  function clean(v=''){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
  function esc(v=''){ return String(v).replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
  function uniq(a){ return [...new Set((a||[]).filter(Boolean).map(x=>clean(x)).filter(Boolean))]; }
  function sessionLoad(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{return null;} }
  function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function withTimeout(promise, ms, message){
    let timer;
    return Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})
    ]).finally(()=>clearTimeout(timer));
  }

  async function api(path, options={}, timeoutMs=15000){
    const session=sessionLoad();
    if(!session?.access_token) throw new Error('Your session expired. Please sign in again.');
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
    try{
      const headers={apikey:apiKey,'Content-Type':'application/json',...(options.headers||{})};
      headers.Authorization=`Bearer ${session.access_token}`;
      const res=await fetch(`${base}${path}`,{...options,headers,signal:ctrl.signal});
      const text=await res.text(); let data=null;
      try{data=text?JSON.parse(text):null;}catch{data=text;}
      if(!res.ok) throw new Error(data?.msg||data?.message||data?.error_description||data?.error||`Request failed (${res.status})`);
      return data;
    }catch(err){
      if(err?.name==='AbortError') throw new Error('The server took too long to respond. Please retry.');
      throw err;
    }finally{ clearTimeout(timer); }
  }
  const rest=(path,options={},timeoutMs=15000)=>api(`/rest/v1/${path}`,options,timeoutMs);

  function ensureUi(){
    const input=document.getElementById('tcCvInput');
    const btn=document.getElementById('tcAnalyze');
    if(!input||!btn) return;
    if(btn.dataset.tcFastCvReady!=='1'){
      btn.dataset.tcFastCvReady='1';
      if(!btn.dataset.tcFastBusy) btn.textContent='Upload CV';
    }
    const box=input.closest('.tc-cv-box');
    if(box && !box.querySelector('.tc-fast-cv-progress')){
      const wrap=document.createElement('div');
      wrap.className='tc-fast-cv-progress';
      wrap.innerHTML='<div class="tc-fast-cv-track"><div class="tc-fast-cv-bar"></div></div><div class="tc-fast-cv-caption"><span>Ready to upload</span><strong>0%</strong></div><div class="tc-fast-cv-file"></div>';
      box.appendChild(wrap);
    }
    if(input.dataset.tcFastCvBound!=='1'){
      input.dataset.tcFastCvBound='1';
      input.addEventListener('change',()=>{
        const wrap=box?.querySelector('.tc-fast-cv-progress');
        const file=input.files?.[0];
        if(!wrap||!file)return;
        wrap.classList.add('active');
        wrap.querySelector('.tc-fast-cv-file').textContent=`Selected: ${file.name}`;
        wrap.querySelector('.tc-fast-cv-caption span').textContent='Ready to upload';
        wrap.querySelector('.tc-fast-cv-caption strong').textContent='0%';
        wrap.querySelector('.tc-fast-cv-bar').style.width='0%';
      });
    }
  }

  function uiRefs(){
    const input=document.getElementById('tcCvInput');
    const btn=document.getElementById('tcAnalyze');
    const status=document.getElementById('tcCvStatus');
    const wrap=input?.closest('.tc-cv-box')?.querySelector('.tc-fast-cv-progress');
    return {input,btn,status,wrap};
  }
  function setProgress(ui,pct,label){
    if(!ui.wrap)return;
    const n=Math.max(0,Math.min(100,Math.round(pct||0)));
    ui.wrap.classList.add('active');
    const bar=ui.wrap.querySelector('.tc-fast-cv-bar'); if(bar)bar.style.width=`${n}%`;
    const left=ui.wrap.querySelector('.tc-fast-cv-caption span'); if(left)left.textContent=label||'Uploading CV';
    const right=ui.wrap.querySelector('.tc-fast-cv-caption strong'); if(right)right.textContent=`${n}%`;
  }
  function setStatus(ui,msg,type=''){
    if(!ui.status)return;
    ui.status.className=`tc-note ${type==='ok'?'ok tc-fast-cv-ready':type==='bg'?'tc-fast-cv-bg':type==='err'?'err':''}`;
    ui.status.textContent=msg;
  }

  function uploadFile(file,path,session,onProgress){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      xhr.open('POST',`${base}/storage/v1/object/cvs/${encodeURI(path)}`,true);
      xhr.timeout=30000;
      xhr.setRequestHeader('apikey',apiKey);
      xhr.setRequestHeader('Authorization',`Bearer ${session.access_token}`);
      xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');
      xhr.setRequestHeader('x-upsert','false');
      xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(e.loaded/e.total*100);};
      xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300){onProgress?.(100);resolve(true);}else reject(new Error(`CV upload failed (${xhr.status})`));};
      xhr.onerror=()=>reject(new Error('Network error while uploading CV.'));
      xhr.ontimeout=()=>reject(new Error('CV upload timed out. Please retry.'));
      xhr.send(file);
    });
  }

  async function loadScript(src,globalName){
    if(globalName&&window[globalName])return window[globalName];
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('CV parser library could not load'));document.head.appendChild(s);});
    return globalName?window[globalName]:true;
  }
  async function extractText(file){
    if(file.type==='text/plain'||/\.txt$/i.test(file.name))return await file.text();
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
      const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const pages=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i),content=await page.getTextContent();
        pages.push(content.items.map(x=>x.str).join(' '));
      }
      return pages.join('\n');
    }
    if(/\.docx$/i.test(file.name)||file.type.includes('officedocument')){
      await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js','mammoth');
      const out=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
      return out.value||'';
    }
    throw new Error('Use PDF, DOCX or TXT.');
  }

  const skillBank=[
    'human resources','hr','recruitment','talent acquisition','onboarding','payroll','employee relations','performance management','training','administration','operations','procurement','purchasing','logistics','supply chain','inventory','warehouse','customer service','sales','business development','project management','planning','coordination','microsoft office','excel','word','powerpoint','outlook','power bi','sap','oracle','erp','crm','sql','python','javascript','typescript','react','node.js','supabase','github','data analysis','reporting','budgeting','accounting','finance','audit','hse','safety','quality','iso','oil and gas','petroleum','maintenance','fleet','heavy equipment','teaching','education','mathematics','english','curriculum','classroom management','information systems','it support','networking','cybersecurity','arabic','communication','leadership','team management'
  ];
  const roleWords=/\b(manager|specialist|officer|coordinator|supervisor|administrator|assistant|analyst|engineer|teacher|educator|consultant|executive|director|recruiter|accountant|planner|developer|technician|lead|head)\b/i;
  function analyzeText(raw){
    const text=String(raw||'').replace(/\u0000/g,' ').replace(/[ \t]+/g,' ').trim();
    const lower=text.toLowerCase();
    const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
    const email=(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';
    const phone=(text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)||[])[0]||'';
    const skills=uniq(skillBank.filter(s=>new RegExp(`(^|[^a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`,'i').test(lower))).slice(0,40);
    const titles=uniq(lines.filter(l=>l.length>=4&&l.length<=90&&roleWords.test(l)&&!/@|http|www\./i.test(l)).map(l=>l.replace(/^[-•|]+|[-•|]+$/g,'').trim())).slice(0,8);
    const industries=[];
    if(/oil|gas|petroleum|refiner|drilling|pipeline/.test(lower))industries.push('Oil & Gas');
    if(/school|teacher|education|curriculum|student|university/.test(lower))industries.push('Education');
    if(/human resources|\bhr\b|recruitment|employee relations/.test(lower))industries.push('Human Resources');
    if(/logistics|warehouse|supply chain|shipping|freight/.test(lower))industries.push('Logistics');
    if(/information technology|software|network|cyber|database|\bit\b/.test(lower))industries.push('IT & Technology');
    if(/finance|accounting|audit|bank/.test(lower))industries.push('Finance');
    if(/construction|civil|mechanical|electrical|engineering/.test(lower))industries.push('Engineering');
    const degreeRe=/(bachelor|master|diploma|phd|doctorate|b\.sc|bsc|b\.a\.|mba|degree|بكالوريوس|ماجستير|دبلوم)/i;
    const education=lines.filter(l=>degreeRe.test(l)).slice(0,6).map(x=>({text:x}));
    const languages=uniq([/\barabic\b|العربية/i.test(text)?'Arabic':'',/\benglish\b|الانجليزية|الإنجليزية/i.test(text)?'English':'',/\bfrench\b/i.test(text)?'French':'',/\bhindi\b/i.test(text)?'Hindi':'',/\burdu\b/i.test(text)?'Urdu':'']);
    const years=(text.match(/\b(?:19|20)\d{2}\b/g)||[]).map(Number).filter(y=>y>=1980&&y<=new Date().getFullYear());
    let yearsExp=null;
    if(years.length>=2&&/experience|employment|work history|professional|خبرة|الخبرات/i.test(text))yearsExp=Math.max(0,Math.min(40,new Date().getFullYear()-Math.min(...years)));
    let ats=0;
    if(email)ats+=15;if(phone)ats+=10;if(skills.length>=5)ats+=25;else ats+=skills.length*4;
    if(/experience|employment|work history|professional|خبرة|الخبرات/i.test(text))ats+=20;
    if(education.length)ats+=15;if(text.length>1200)ats+=15;ats=Math.min(100,ats);
    const inferred=titles.length?titles:uniq(skills.filter(s=>['human resources','hr','operations','administration','logistics','project management','teaching','education','information systems','it support','accounting','finance','business development'].includes(s)).map(s=>s==='hr'?'HR Specialist':`${s.replace(/\b\w/g,c=>c.toUpperCase())} Specialist`)).slice(0,6);
    const keywords=uniq([...inferred,...skills,...industries]).slice(0,45);
    const summary=[inferred[0]||'Professional',yearsExp?`${yearsExp}+ years estimated experience`:'',skills.length?`skills: ${skills.slice(0,7).join(', ')}`:''].filter(Boolean).join(' — ');
    return {summary,inferred_titles:inferred,skills,industries,education,experience:[],languages,years_experience:yearsExp,ats_score:ats,search_keywords:keywords,raw:{email,phone,text_length:text.length,parser:'local_rules_v2_fast'}};
  }

  function summaryHtml(a){
    const chips=arr=>`<div class="tc-chips">${(arr||[]).slice(0,12).map(x=>`<span class="tc-chip">${esc(x)}</span>`).join('')}</div>`;
    return `<div class="tc-analysis"><div class="tc-analysis-card"><b>ATS readiness</b><strong>${Number(a.ats_score||0)}%</strong></div><div class="tc-analysis-card"><b>Experience</b><strong>${a.years_experience==null?'Not estimated':`${a.years_experience}+ years`}</strong></div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Target roles</b>${chips(a.inferred_titles)}</div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Detected skills</b>${chips(a.skills)}</div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Search sectors</b>${chips(a.industries)}</div></div>`;
  }

  async function persistAnalysis(job){
    const {cvId,a,userId}=job;
    const bodyAnalysis={cv_id:cvId,...a};
    const bodyPrefs={user_id:userId,target_titles:a.inferred_titles,keywords:a.search_keywords,countries,sectors:a.industries,source:'cv',auto_update_from_cv:true};
    const bodyProfile={id:userId,target_roles:a.inferred_titles,target_countries:countries,preferred_sectors:a.industries,years_experience:a.years_experience};
    const results=await Promise.allSettled([
      rest('cv_analysis?on_conflict=cv_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(bodyAnalysis)}),
      rest('search_preferences?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(bodyPrefs)}),
      rest('profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(bodyProfile)})
    ]);
    const failed=results.filter(x=>x.status==='rejected');
    if(failed.length)throw failed[0].reason||new Error('Could not finish CV analysis.');
    await rest(`user_cvs?id=eq.${encodeURIComponent(cvId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'ready'})});
    return {analysis:results[0].value?.[0]||a,prefs:results[1].value?.[0]||null};
  }

  function showRetry(ui,job,error){
    lastRetry=job;
    setStatus(ui,`${error.message||error} Your CV is already uploaded — retry the analysis without uploading again.`,'err');
    const row=ui.status?.parentElement;
    if(row && !row.querySelector('.tc-fast-retry')){
      const retry=document.createElement('button');
      retry.type='button';retry.className='tc-modal-btn tc-fast-retry';retry.textContent='Retry analysis';
      retry.addEventListener('click',async()=>{
        retry.disabled=true;setStatus(ui,'Retrying CV analysis in the background…','bg');
        try{await persistAnalysis(lastRetry);await window.TheCareersAuth?.refresh?.();setStatus(ui,'Ready — your personalized job search profile is active.','ok');const out=document.getElementById('tcAnalysis');if(out)out.innerHTML=summaryHtml(lastRetry.a);retry.remove();window.pushActivity?.('CV analysis completed');}
        catch(err){setStatus(ui,err.message||'Retry failed.','err');retry.disabled=false;}
      });
      row.appendChild(retry);
    }
  }

  async function fastUpload(file,ui){
    if(!base||!apiKey)throw new Error('CV service is not configured.');
    if(file.size>MAX_CV)throw new Error('CV is too large. Maximum size is 10 MB.');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!allowedExt.has(ext))throw new Error('Use PDF, DOCX or TXT.');

    try{await window.TheCareersAuth?.refresh?.();}catch{}
    const session=sessionLoad();
    const userId=window.TheCareersAccount?.user?.id;
    if(!session?.access_token||!userId)throw new Error('Please sign in again before uploading your CV.');

    const path=`${userId}/${uuid()}.${ext}`;
    ui.btn.dataset.tcFastBusy='1';ui.btn.disabled=true;ui.btn.textContent='Uploading 0%';
    setStatus(ui,'Uploading CV securely…');
    setProgress(ui,0,'Uploading CV');

    let uploadDone=false;
    const uploadPromise=uploadFile(file,path,session,pct=>{
      setProgress(ui,pct,'Uploading CV');
      if(ui.btn?.isConnected)ui.btn.textContent=`Uploading ${Math.round(pct)}%`;
    }).then(()=>{uploadDone=true;if(ui.btn?.isConnected){ui.btn.disabled=false;ui.btn.textContent='Upload another CV';delete ui.btn.dataset.tcFastBusy;}setProgress(ui,100,'CV uploaded');setStatus(ui,'CV uploaded ✓ — reading it now. You can close this window while analysis continues.','bg');});

    const textPromise=withTimeout(extractText(file),25000,'CV text extraction took too long. Try DOCX or a text-based PDF.');
    const [,text]=await Promise.all([uploadPromise,textPromise]);
    if(!uploadDone)throw new Error('CV upload did not complete.');
    if(clean(text).length<80)throw new Error('Could not extract enough CV text. If this is a scanned PDF, use a text-based PDF or DOCX.');

    setStatus(ui,'CV uploaded ✓ — analyzing skills, experience and target roles in the background…','bg');
    const cvs=await rest('user_cvs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({storage_path:path,original_name:file.name,mime_type:file.type||null,size_bytes:file.size,status:'analyzing',extracted_text:text,is_primary:true})});
    const cv=cvs?.[0];if(!cv?.id)throw new Error('CV record could not be created.');
    const a=analyzeText(text);
    const job={cvId:cv.id,a,userId};
    lastRetry=job;

    try{
      await persistAnalysis(job);
      await window.TheCareersAuth?.refresh?.();
      const liveUi=uiRefs();
      if(liveUi.status?.isConnected){setStatus(liveUi,'Ready ✓ — your job search is now personalized from this CV.','ok');const out=document.getElementById('tcAnalysis');if(out)out.innerHTML=summaryHtml(a);}
      window.pushActivity?.('CV uploaded and personalized profile refreshed');
      window.TheCareersLive?.refresh?.();
    }catch(err){
      const liveUi=uiRefs();
      if(liveUi.status?.isConnected)showRetry(liveUi,job,err);
      else console.warn('[TheCareers] CV background analysis needs retry',err);
      window.pushActivity?.('CV uploaded — analysis needs retry');
    }
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('#tcAnalyze');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    ensureUi();
    const ui=uiRefs();
    const file=ui.input?.files?.[0];
    if(!file){setStatus(ui,'Choose a CV first.','err');return;}
    fastUpload(file,ui).catch(err=>{
      const liveUi=uiRefs();
      if(liveUi.btn?.isConnected){liveUi.btn.disabled=false;liveUi.btn.textContent='Upload CV';delete liveUi.btn.dataset.tcFastBusy;}
      setStatus(liveUi,err.message||'CV upload failed. Please retry.','err');
    });
  },true);

  const observer=new MutationObserver(ensureUi);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi,{once:true});else ensureUi();
})();
