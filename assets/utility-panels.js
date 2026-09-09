/* TheCareers account + CV Center
   - Supabase email/password authentication
   - Private account-bound CV storage protected by RLS
   - Browser-side PDF/DOCX/TXT text extraction
   - Free deterministic CV analysis -> personalized search profile
   - No service-role/secret keys in the browser
*/
(() => {
  'use strict';
  if (window.__TC_ACCOUNT_CV__) return;
  window.__TC_ACCOUNT_CV__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  const configured = /^https:\/\//.test(base) && !!apiKey;
  const SESSION_KEY = 'thecareers_auth_session_v1';
  const MAX_CV = 10 * 1024 * 1024;
  const allowed = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]);

  const style = document.createElement('style');
  style.textContent = `
    .tc-modal-backdrop{position:fixed;inset:0;background:rgba(18,22,28,.34);backdrop-filter:blur(4px);z-index:9998;display:flex;align-items:center;justify-content:center;padding:24px}
    .tc-modal{width:min(620px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #dfe5ec;border-radius:18px;box-shadow:0 24px 70px rgba(23,32,44,.24);padding:22px;position:relative}
    .tc-modal h3{margin:0 0 6px;font-size:18px}.tc-modal p{margin:0 0 16px;color:#68717d;font-size:12px;line-height:1.6}
    .tc-modal-close{position:absolute;right:14px;top:14px;border:1px solid #dfe5ec;background:#fff;border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px}
    .tc-form{display:grid;gap:10px}.tc-label{font-size:11px;font-weight:800;color:#424b57;letter-spacing:.02em}.tc-input{width:100%;box-sizing:border-box;border:1px solid #d7dee7;border-radius:10px;padding:11px 12px;font:inherit;background:#fff;outline:none}.tc-input:focus{border-color:#2f6feb;box-shadow:0 0 0 3px rgba(47,111,235,.10)}
    .tc-modal-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.tc-modal-btn{border:1px solid #d6dde6;background:linear-gradient(145deg,#fff,#f2f5f9);border-radius:11px;padding:10px 13px;font-weight:800;cursor:pointer}.tc-modal-btn.primary{background:#101318;color:#fff;border-color:#101318}.tc-modal-btn.green{background:#1fb567;color:#fff;border-color:#1fb567}.tc-modal-btn:disabled{opacity:.55;cursor:wait}
    .tc-linkbtn{border:0;background:transparent;color:#2f6feb;font-weight:800;cursor:pointer;padding:0}.tc-divider{height:1px;background:#edf0f3;margin:16px 0}.tc-note{padding:10px 12px;border:1px solid #dfe6ee;background:#f8fafc;border-radius:10px;color:#56606d;font-size:11px;line-height:1.55}.tc-note.ok{border-color:#ccebd9;background:#f5fcf8;color:#277248}.tc-note.err{border-color:#f2d4d4;background:#fff8f8;color:#9e3737}
    .tc-cv-box{border:1px dashed #cbd6e3;border-radius:13px;padding:17px;background:#fafcff}.tc-cv-status{margin-top:10px;font-size:12px;color:#4f5d6c}.tc-analysis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.tc-analysis-card{border:1px solid #e1e6ed;border-radius:11px;padding:12px;background:#fff}.tc-analysis-card b{font-size:11px;text-transform:uppercase;color:#68717d}.tc-analysis-card strong{display:block;margin-top:5px;font-size:14px;color:#11151a}.tc-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.tc-chip{font-size:10px;padding:4px 7px;border-radius:999px;background:#eef4ff;color:#2d5eae;border:1px solid #d8e5fb}.tc-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #edf0f3}.tc-setting:last-child{border-bottom:0}.tc-profile{display:grid;gap:9px}.tc-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile{cursor:pointer}
    @media(max-width:620px){.tc-analysis,.tc-account-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  let current = null;
  let auth = { session: null, user: null, profile: null, analysis: null, prefs: null };

  function esc(v='') { return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
  function close(){ current?.remove(); current=null; }
  function open(title, body){
    close();
    const back=document.createElement('div'); back.className='tc-modal-backdrop';
    back.innerHTML=`<div class="tc-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button class="tc-modal-close" aria-label="Close">×</button><h3>${esc(title)}</h3>${body}</div>`;
    back.querySelector('.tc-modal-close').addEventListener('click',close);
    back.addEventListener('click',e=>{if(e.target===back)close();});
    document.addEventListener('keydown',function onEsc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',onEsc);}});
    document.body.appendChild(back); current=back; return back;
  }
  function setNote(el,msg,type=''){ if(!el)return; el.className=`tc-note ${type}`; el.textContent=msg; }
  function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function sessionLoad(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{return null;} }
  function sessionSave(s){ if(s) localStorage.setItem(SESSION_KEY,JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); auth.session=s; }

  async function api(path, options={}){
    const headers={apikey:apiKey,'Content-Type':'application/json',...(options.headers||{})};
    if(options.auth!==false && auth.session?.access_token) headers.Authorization=`Bearer ${auth.session.access_token}`;
    const res=await fetch(`${base}${path}`,{...options,headers});
    const text=await res.text(); let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;}
    if(!res.ok) throw new Error(data?.msg||data?.message||data?.error_description||data?.error||`Request failed (${res.status})`);
    return data;
  }
  async function rest(path,options={}){
    return api(`/rest/v1/${path}`,options);
  }
  async function refreshSession(){
    const s=auth.session||sessionLoad();
    if(!s?.refresh_token) return false;
    try{
      const next=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:JSON.stringify({refresh_token:s.refresh_token})});
      sessionSave(next); return true;
    }catch{sessionSave(null);return false;}
  }
  async function loadMe(){
    if(!configured) return false;
    auth.session=sessionLoad();
    if(!auth.session?.access_token){updateIdentity();return false;}
    try{ auth.user=await api('/auth/v1/user'); }
    catch{ if(await refreshSession()) auth.user=await api('/auth/v1/user'); else {auth.user=null;updateIdentity();return false;} }
    const uid=auth.user.id;
    const [profiles, analyses, prefs] = await Promise.all([
      rest(`profiles?select=*&id=eq.${encodeURIComponent(uid)}&limit=1`),
      rest(`cv_analysis?select=*&user_id=eq.${encodeURIComponent(uid)}&order=updated_at.desc&limit=1`),
      rest(`search_preferences?select=*&user_id=eq.${encodeURIComponent(uid)}&limit=1`)
    ]);
    auth.profile=profiles?.[0]||null; auth.analysis=analyses?.[0]||null; auth.prefs=prefs?.[0]||null;
    window.TheCareersAccount={user:auth.user,profile:auth.profile,analysis:auth.analysis,preferences:auth.prefs};
    updateIdentity(); applyPersonalizedScores(); return true;
  }
  function updateIdentity(){
    const name=document.querySelector('.profile-name'), role=document.querySelector('.profile-role'), avatar=document.querySelector('.profile .avatar');
    if(auth.user){
      const full=(auth.profile?.full_name||auth.user.user_metadata?.full_name||auth.user.email?.split('@')[0]||'Member').trim();
      if(name) name.textContent=full; if(role) role.textContent=auth.analysis?'CV profile active':'Job Seeker';
      if(avatar) avatar.textContent=full.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
    }else{
      if(name) name.textContent='Sign in'; if(role) role.textContent='Upload CV & personalize'; if(avatar) avatar.textContent='TC';
    }
  }

  function loginPanel(mode='login'){
    if(!configured){ open('Account','<p>Authentication is not configured yet.</p>'); return; }
    const signup=mode==='signup';
    const m=open(signup?'Create account':'Sign in',`<p>${signup?'Create a simple account before uploading your CV.':'Sign in to access your private CV and personalized job search.'}</p><form class="tc-form" id="tcAuthForm">${signup?'<label class="tc-label">Name</label><input class="tc-input" id="tcName" autocomplete="name" required>':''}<label class="tc-label">Email</label><input class="tc-input" id="tcEmail" type="email" autocomplete="email" required><label class="tc-label">Password</label><input class="tc-input" id="tcPassword" type="password" minlength="8" autocomplete="${signup?'new-password':'current-password'}" required><button class="tc-modal-btn primary" id="tcAuthSubmit" type="submit">${signup?'Create account':'Sign in'}</button><div class="tc-note" id="tcAuthNote">${signup?'Use at least 8 characters. Email confirmation may be required.':'Your CV stays private to your account.'}</div></form><div class="tc-divider"></div><button class="tc-linkbtn" id="tcSwapAuth">${signup?'Already have an account? Sign in':'New here? Create account'}</button>`);
    m.querySelector('#tcSwapAuth').addEventListener('click',()=>loginPanel(signup?'login':'signup'));
    m.querySelector('#tcAuthForm').addEventListener('submit',async e=>{
      e.preventDefault(); const btn=m.querySelector('#tcAuthSubmit'), note=m.querySelector('#tcAuthNote'); btn.disabled=true;
      const email=m.querySelector('#tcEmail').value.trim(), password=m.querySelector('#tcPassword').value;
      try{
        if(signup){
          const full_name=m.querySelector('#tcName').value.trim();
          const data=await api('/auth/v1/signup',{method:'POST',auth:false,body:JSON.stringify({email,password,data:{full_name}})});
          if(data?.access_token){sessionSave(data);await loadMe();setNote(note,'Account created. You are signed in.','ok');setTimeout(()=>cvPanel(),450);}
          else setNote(note,'Account created. Check your email to confirm, then sign in.','ok');
        }else{
          const data=await api('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:JSON.stringify({email,password})});
          sessionSave(data);await loadMe();setNote(note,'Signed in.','ok');setTimeout(()=>cvPanel(),350);
        }
      }catch(err){setNote(note,err.message,'err');}finally{btn.disabled=false;}
    });
  }

  async function upsertProfile(values){
    const uid=auth.user.id;
    const rows=await rest('profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:uid,...values})});
    auth.profile=rows?.[0]||auth.profile; updateIdentity();
  }
  function accountPanel(){
    if(!auth.user){loginPanel();return;}
    const p=auth.profile||{};
    const m=open('My account',`<p>Your account controls your private CV vault and personalized search profile.</p><div class="tc-account-grid"><div><label class="tc-label">Name</label><input class="tc-input" id="tcPName" value="${esc(p.full_name||'')}"></div><div><label class="tc-label">Email</label><input class="tc-input" value="${esc(auth.user.email||'')}" disabled></div><div><label class="tc-label">Phone (optional)</label><input class="tc-input" id="tcPhone" type="tel" placeholder="+965 ..." value="${esc(p.phone||'')}"></div><div><label class="tc-label">Phone verification</label><input class="tc-input" value="${p.phone_verified_at?'Verified':'Not enabled yet'}" disabled></div></div><div class="tc-modal-row"><button class="tc-modal-btn primary" id="tcSaveProfile">Save</button><button class="tc-modal-btn" id="tcOpenCv">CV Center</button><button class="tc-modal-btn" id="tcLogout">Sign out</button></div><div class="tc-note" id="tcPNote">Phone verification is prepared in the profile schema; SMS OTP can be enabled later without redesigning the account.</div>`);
    m.querySelector('#tcSaveProfile').addEventListener('click',async e=>{const b=e.currentTarget,n=m.querySelector('#tcPNote');b.disabled=true;try{await upsertProfile({full_name:m.querySelector('#tcPName').value.trim(),phone:m.querySelector('#tcPhone').value.trim()||null});setNote(n,'Profile saved.','ok');}catch(err){setNote(n,err.message,'err');}finally{b.disabled=false;}});
    m.querySelector('#tcOpenCv').addEventListener('click',cvPanel);
    m.querySelector('#tcLogout').addEventListener('click',async()=>{try{await api('/auth/v1/logout',{method:'POST'});}catch{}sessionSave(null);auth={session:null,user:null,profile:null,analysis:null,prefs:null};updateIdentity();close();});
  }

  async function loadScript(src, globalName){
    if(globalName && window[globalName]) return window[globalName];
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('CV parser library could not load'));document.head.appendChild(s);});
    return globalName?window[globalName]:true;
  }
  async function extractText(file){
    if(file.type==='text/plain' || /\.txt$/i.test(file.name)) return await file.text();
    if(file.type==='application/pdf' || /\.pdf$/i.test(file.name)){
      const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise; const pages=[];
      for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i), content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(' '));}
      return pages.join('\n');
    }
    if(/\.docx$/i.test(file.name) || file.type.includes('officedocument')){
      await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js','mammoth');
      const out=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}); return out.value||'';
    }
    throw new Error('Use PDF, DOCX or TXT. Legacy .DOC is not accepted for security/reliability.');
  }

  const skillBank=[
    'human resources','hr','recruitment','talent acquisition','onboarding','payroll','employee relations','performance management','training','administration','operations','procurement','purchasing','logistics','supply chain','inventory','warehouse','customer service','sales','business development','project management','planning','coordination','microsoft office','excel','word','powerpoint','outlook','power bi','sap','oracle','erp','crm','sql','python','javascript','typescript','react','node.js','supabase','github','data analysis','reporting','budgeting','accounting','finance','audit','hse','safety','quality','iso','oil and gas','petroleum','maintenance','fleet','heavy equipment','teaching','education','mathematics','english','curriculum','classroom management','information systems','it support','networking','cybersecurity','arabic','communication','leadership','team management'
  ];
  const roleWords=/\b(manager|specialist|officer|coordinator|supervisor|administrator|assistant|analyst|engineer|teacher|educator|consultant|executive|director|recruiter|accountant|planner|developer|technician|lead|head)\b/i;
  function uniq(a){return [...new Set(a.filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];}
  function analyzeText(raw){
    const text=String(raw||'').replace(/\u0000/g,' ').replace(/[ \t]+/g,' ').trim(); const lower=text.toLowerCase();
    const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
    const email=(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';
    const phone=(text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)||[])[0]||'';
    const skills=uniq(skillBank.filter(s=>new RegExp(`(^|[^a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`,'i').test(lower))).slice(0,40);
    const titles=uniq(lines.filter(l=>l.length>=4&&l.length<=90&&roleWords.test(l)&&!/@|http|www\./i.test(l)).map(l=>l.replace(/^[-•|]+|[-•|]+$/g,'').trim())).slice(0,8);
    const industries=[];
    if(/oil|gas|petroleum|refiner|drilling|pipeline/.test(lower)) industries.push('Oil & Gas');
    if(/school|teacher|education|curriculum|student|university/.test(lower)) industries.push('Education');
    if(/human resources|\bhr\b|recruitment|employee relations/.test(lower)) industries.push('Human Resources');
    if(/logistics|warehouse|supply chain|shipping|freight/.test(lower)) industries.push('Logistics');
    if(/information technology|software|network|cyber|database|\bit\b/.test(lower)) industries.push('IT & Technology');
    if(/finance|accounting|audit|bank/.test(lower)) industries.push('Finance');
    if(/construction|civil|mechanical|electrical|engineering/.test(lower)) industries.push('Engineering');
    const degreeRe=/(bachelor|master|diploma|phd|doctorate|b\.sc|bsc|b\.a\.|mba|degree|بكالوريوس|ماجستير|دبلوم)/i;
    const education=lines.filter(l=>degreeRe.test(l)).slice(0,6).map(x=>({text:x}));
    const languages=uniq([/\barabic\b|العربية/i.test(text)?'Arabic':'',/\benglish\b|الانجليزية|الإنجليزية/i.test(text)?'English':'',/\bfrench\b/i.test(text)?'French':'',/\bhindi\b/i.test(text)?'Hindi':'',/\burdu\b/i.test(text)?'Urdu':'']);
    const years=(text.match(/\b(?:19|20)\d{2}\b/g)||[]).map(Number).filter(y=>y>=1980&&y<=new Date().getFullYear());
    let yearsExp=null;if(years.length>=2 && /experience|employment|work history|professional|خبرة|الخبرات/i.test(text)){yearsExp=Math.max(0,Math.min(40,new Date().getFullYear()-Math.min(...years)));}
    let ats=0;if(email)ats+=15;if(phone)ats+=10;if(skills.length>=5)ats+=25;else ats+=skills.length*4;if(/experience|employment|work history|professional|خبرة|الخبرات/i.test(text))ats+=20;if(education.length)ats+=15;if(text.length>1200)ats+=15;ats=Math.min(100,ats);
    const inferred=titles.length?titles:uniq(skills.filter(s=>['human resources','hr','operations','administration','logistics','project management','teaching','education','information systems','it support','accounting','finance','business development'].includes(s)).map(s=>s==='hr'?'HR Specialist':`${s.replace(/\b\w/g,c=>c.toUpperCase())} Specialist`)).slice(0,6);
    const keywords=uniq([...inferred,...skills,...industries]).slice(0,45);
    const summary=[inferred[0]||'Professional',yearsExp?`${yearsExp}+ years estimated experience`:'',skills.length?`skills: ${skills.slice(0,7).join(', ')}`:''].filter(Boolean).join(' — ');
    return {summary,inferred_titles:inferred,skills,industries,education,experience:[],languages,years_experience:yearsExp,ats_score:ats,search_keywords:keywords,raw:{email,phone,text_length:text.length,parser:'local_rules_v1'}};
  }

  async function uploadAndAnalyze(file,status){
    if(!auth.user) throw new Error('Sign in first.');
    if(file.size>MAX_CV) throw new Error('CV is too large. Maximum size is 10 MB.');
    const ext=(file.name.split('.').pop()||'bin').toLowerCase();
    if(!allowed.has(file.type) && !['pdf','docx','txt'].includes(ext)) throw new Error('Use PDF, DOCX or TXT.');
    setNote(status,'1/4 Uploading CV securely…');
    const path=`${auth.user.id}/${uuid()}.${ext}`;
    const up=await fetch(`${base}/storage/v1/object/cvs/${encodeURI(path)}`,{method:'POST',headers:{apikey:apiKey,Authorization:`Bearer ${auth.session.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!up.ok) throw new Error(`CV upload failed (${up.status})`);
    setNote(status,'2/4 Extracting CV text in your browser…');
    const text=await extractText(file); if(text.trim().length<80) throw new Error('Could not extract enough CV text. If it is a scanned image PDF, upload a text-based PDF or DOCX for now.');
    const cvs=await rest('user_cvs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({storage_path:path,original_name:file.name,mime_type:file.type||null,size_bytes:file.size,status:'analyzing',extracted_text:text,is_primary:true})});
    const cv=cvs?.[0]; if(!cv?.id) throw new Error('CV record could not be created.');
    setNote(status,'3/4 Analyzing skills, experience and target roles…');
    const a=analyzeText(text);
    const analyses=await rest('cv_analysis?on_conflict=cv_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({cv_id:cv.id,...a})});
    const analysis=analyses?.[0];
    const countries=['Kuwait','Saudi Arabia','United Arab Emirates','Qatar','Bahrain','Oman'];
    const prefRows=await rest('search_preferences?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:auth.user.id,target_titles:a.inferred_titles,keywords:a.search_keywords,countries,sectors:a.industries,source:'cv',auto_update_from_cv:true})});
    await rest(`user_cvs?id=eq.${cv.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'ready'})});
    await upsertProfile({target_roles:a.inferred_titles,target_countries:countries,preferred_sectors:a.industries,years_experience:a.years_experience});
    auth.analysis=analysis;auth.prefs=prefRows?.[0]||null;window.TheCareersAccount={user:auth.user,profile:auth.profile,analysis:auth.analysis,preferences:auth.prefs};
    setNote(status,'4/4 Ready — your job search is now personalized from this CV.','ok'); updateIdentity(); applyPersonalizedScores(); return analysis;
  }

  function analysisHtml(a){
    if(!a)return '';
    const chips=(arr)=>`<div class="tc-chips">${(arr||[]).slice(0,12).map(x=>`<span class="tc-chip">${esc(x)}</span>`).join('')}</div>`;
    return `<div class="tc-analysis"><div class="tc-analysis-card"><b>ATS readiness</b><strong>${Number(a.ats_score||0)}%</strong></div><div class="tc-analysis-card"><b>Experience</b><strong>${a.years_experience==null?'Not estimated':`${a.years_experience}+ years`}</strong></div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Target roles</b>${chips(a.inferred_titles)}</div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Detected skills</b>${chips(a.skills)}</div><div class="tc-analysis-card" style="grid-column:1/-1"><b>Search sectors</b>${chips(a.industries)}</div></div>`;
  }
  function cvPanel(){
    if(!auth.user){loginPanel('login');return;}
    const m=open('CV Center',`<p>Upload one CV to automatically extract your target roles, skills and sectors. Only your signed-in account can access the stored CV.</p><div class="tc-cv-box"><input id="tcCvInput" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"><div class="tc-cv-status">PDF, DOCX or TXT · max 10 MB</div></div><div class="tc-modal-row"><button class="tc-modal-btn green" id="tcAnalyze">Upload & analyze CV</button><button class="tc-modal-btn" id="tcAccount">My account</button></div><div class="tc-note" id="tcCvStatus">${auth.analysis?'A personalized CV profile is active. Uploading another CV will refresh it.':'Choose a CV to build your personalized job search profile.'}</div><div id="tcAnalysis">${analysisHtml(auth.analysis)}</div>`);
    m.querySelector('#tcAccount').addEventListener('click',accountPanel);
    m.querySelector('#tcAnalyze').addEventListener('click',async e=>{const file=m.querySelector('#tcCvInput').files?.[0],status=m.querySelector('#tcCvStatus'),btn=e.currentTarget;if(!file){setNote(status,'Choose a CV first.','err');return;}btn.disabled=true;try{const a=await uploadAndAnalyze(file,status);m.querySelector('#tcAnalysis').innerHTML=analysisHtml(a);}catch(err){setNote(status,err.message,'err');}finally{btn.disabled=false;}});
  }

  function settingsPanel(){
    const m=open('Settings',`<p>Live dashboard controls.</p><div class="tc-setting"><span>Account</span><button class="tc-modal-btn primary" id="tcAccountSettings">${auth.user?'My account':'Sign in'}</button></div><div class="tc-setting"><span>Refresh Supabase data now</span><button class="tc-modal-btn" id="tcRefresh">Refresh</button></div><div class="tc-setting"><span>Reset job tabs, sort and filters</span><button class="tc-modal-btn" id="tcResetFilters">Reset</button></div><div class="tc-setting"><span>Clear locally saved job bookmarks</span><button class="tc-modal-btn" id="tcClearSaved">Clear</button></div>`);
    m.querySelector('#tcAccountSettings').addEventListener('click',()=>auth.user?accountPanel():loginPanel());
    m.querySelector('#tcRefresh').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Refreshing…';try{await loadMe();await window.TheCareersLive?.refresh?.();b.textContent='Done';}catch{b.textContent='Retry';}setTimeout(()=>{b.disabled=false;b.textContent='Refresh';},900);});
    m.querySelector('#tcResetFilters').addEventListener('click',()=>{window.TheCareersLive?.resetFilters?.();window.pushActivity?.('Filters reset');});
    m.querySelector('#tcClearSaved').addEventListener('click',()=>{localStorage.removeItem('thecareers_saved_job_ids_v2');window.TheCareersLive?.refresh?.();window.pushActivity?.('Saved jobs cleared');});
  }

  function words(v){return new Set(String(v||'').toLowerCase().replace(/[^a-z0-9+#.\u0600-\u06ff ]/g,' ').split(/\s+/).filter(x=>x.length>2));}
  function personalizedScore(title,meta){
    if(!auth.analysis)return null; const hay=words(`${title} ${meta}`);let score=38; const reasons=[];
    for(const target of auth.analysis.inferred_titles||[]){const ws=[...words(target)],hits=ws.filter(w=>hay.has(w)).length;if(hits){score+=Math.min(28,hits*9);reasons.push('title');}}
    for(const s of (auth.analysis.skills||[]).slice(0,25)){const ws=[...words(s)];if(ws.some(w=>hay.has(w))){score+=3;reasons.push('skill');}}
    for(const s of auth.analysis.industries||[]){if([...words(s)].some(w=>hay.has(w))){score+=8;reasons.push('sector');}}
    if(/kuwait/i.test(meta))score+=7; return Math.max(0,Math.min(99,score));
  }
  function applyPersonalizedScores(){
    if(!auth.analysis)return;
    document.querySelectorAll('.backend-job').forEach(row=>{
      const title=row.querySelector('.title')?.textContent||'',meta=row.querySelector('.job-meta')?.textContent||'';const score=personalizedScore(title,meta);if(score==null)return;
      const pct=row.querySelector('.job-score .pct');if(pct)pct.textContent=`${score}%`;
      const lbl=row.querySelector('.job-score .lbl');if(lbl)lbl.textContent='CV Match';
      const badge=row.querySelector('.badge');if(badge&&score>=75){badge.textContent='CV High Match';badge.classList.add('high');}
    });
  }
  const mo=new MutationObserver(()=>applyPersonalizedScores());
  const attachObserver=()=>{const list=document.getElementById('jobList');if(list)mo.observe(list,{childList:true,subtree:true});};

  async function queuePersonalizedSearch(e){
    if(!auth.user||!auth.prefs)return;
    e.preventDefault();e.stopImmediatePropagation();
    const btn=e.currentTarget;btn.disabled=true;
    try{
      await rest('search_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'queued',requested_by:auth.user.id,meta:{personalized:true,user_id:auth.user.id,target_titles:auth.prefs.target_titles||[],keywords:(auth.prefs.keywords||[]).slice(0,40),countries:auth.prefs.countries||['Kuwait'],sectors:auth.prefs.sectors||[],source:'cv'}})});
      window.pushActivity?.('Personalized CV search queued');
      btn.textContent='CV Search Queued';setTimeout(()=>{btn.textContent='Search Now';btn.disabled=false;},1600);
    }catch(err){console.error('[TheCareers] personalized search',err);btn.textContent='Retry Search';btn.disabled=false;}
  }

  document.addEventListener('click',e=>{
    const item=e.target.closest('.nav-item[data-page]');
    if(item?.dataset.page==='cv'){e.preventDefault();e.stopImmediatePropagation();cvPanel();return;}
    if(item?.dataset.page==='settings'){e.preventDefault();e.stopImmediatePropagation();settingsPanel();return;}
    if(e.target.closest('.profile')){e.preventDefault();auth.user?accountPanel():loginPanel();}
  },true);

  const boot=async()=>{
    updateIdentity();attachObserver();
    const search=document.getElementById('searchNowBtn');if(search)search.addEventListener('click',queuePersonalizedSearch,true);
    await loadMe();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.TheCareersAuth={signIn:()=>loginPanel('login'),signUp:()=>loginPanel('signup'),account:accountPanel,cv:cvPanel,refresh:loadMe};
})();
