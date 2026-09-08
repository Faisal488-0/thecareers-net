/* TheCareers dashboard UI — interactive controls + live demo fallback */
const sources = [
  {name:'Company Websites', base:58}, {name:'Job Boards', base:42}, {name:'LinkedIn', base:38},
  {name:'Government Portals', base:24}, {name:'Recruitment Agencies', base:36},
  {name:'University Career Portals', base:19}, {name:'News & Media', base:18}, {name:'Direct Company Careers', base:12}
];

const jobs = [
  {title:'HR Generalist', company:'Kuwait Petroleum Corporation (KPC)', loc:'Kuwait City, Kuwait', type:'Full-time', cat:'HR', pct:92, badge:'high', time:'2 hours ago', ini:'KPC', color:'#1fb567'},
  {title:'Operations Specialist', company:'Agility – Global Integrated Logistics', loc:'Kuwait City, Kuwait', type:'Full-time', cat:'Operations', pct:87, badge:'verified', time:'5 hours ago', ini:'A', color:'#2f6feb'},
  {title:'Administrative Officer', company:'Ministry of Education – Kuwait', loc:'Kuwait City, Kuwait', type:'Full-time', cat:'Administration', pct:84, badge:'new', time:'7 hours ago', ini:'M', color:'#8a8f96'},
  {title:'Recruitment Coordinator', company:'Talent World Group', loc:'Kuwait City, Kuwait', type:'Full-time', cat:'HR', pct:82, badge:'high', time:'9 hours ago', ini:'C', color:'#e0912b'},
  {title:'HSE Officer', company:'Kuwait Energy', loc:'Ahmadi, Kuwait', type:'Full-time', cat:'Oil & Gas', pct:80, badge:'new', time:'10 hours ago', ini:'KE', color:'#0b0c0e'}
];

const sectors = [
  {name:'Oil & Gas', pct:28, color:'#0b0c0e'}, {name:'Administration', pct:18, color:'#2f6feb'},
  {name:'HR', pct:14, color:'#1fb567'}, {name:'Operations', pct:12, color:'#e0912b'},
  {name:'Engineering', pct:9, color:'#7c5cff'}, {name:'Finance', pct:8, color:'#e15c7a'},
  {name:'IT & Technology', pct:7, color:'#17b8c4'}, {name:'Others', pct:4, color:'#c7cbd1'}
];

const activityMsgs = [
  'Searching companies in Kuwait','Scanning oil & gas sector jobs','Checking new government vacancies',
  'Searching administration roles','Scanning HR opportunities','Analyzing company career pages',
  'Fetching verified job postings','Searching operations positions','Checking university career portals',
  'Monitoring new job alerts','Filtering and ranking results','Updating relevance scores',
  'Cross-referencing salary bands','Deduplicating listings','Verifying company legitimacy',
  'Indexing new employer pages','Matching skills to openings','Refreshing recruiter feeds'
];
const dotClasses=['g','g','b','g','a','g'];
const toast=document.getElementById('toast');
const toastText=document.getElementById('toastText');
function notify(msg){ if(!toast||!toastText)return; toastText.textContent=msg; toast.classList.add('show'); clearTimeout(notify.t); notify.t=setTimeout(()=>toast.classList.remove('show'),2600); }

const srcList=document.getElementById('srcList');
function renderSources(){ if(!srcList)return; srcList.innerHTML=sources.map(s=>`<div class="src-row"><div class="name"><span class="d"></span>${s.name}</div><div class="val">${s.count}</div></div>`).join(''); }
sources.forEach(s=>s.count=s.base); renderSources();

const jobList=document.getElementById('jobList');
function badgeMeta(b){ if(b==='high')return{cls:'high',label:'High Match'}; if(b==='verified')return{cls:'verified',label:'Verified'}; return{cls:'new',label:'New'}; }
function renderJobs(rows=jobs){
  if(!jobList)return;
  jobList.innerHTML=rows.map((j,i)=>{const bm=badgeMeta(j.badge);return `<div class="job-row" data-local-job="${i}" data-category="${j.cat}" data-score="${j.pct}"><div class="job-logo" style="background:${j.color}">${j.ini}</div><div class="job-main"><div class="title">${j.title}</div><div class="company">${j.company}</div><div class="job-meta"><span>📍 ${j.loc}</span><span>🕐 ${j.type}</span><span>▤ ${j.cat}</span></div></div><div class="job-score"><div class="pct">${j.pct}%</div><div class="lbl">Relevance</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;"><span class="badge ${bm.cls}">${bm.label}</span><span class="job-time">${j.time}</span></div><div class="job-actions"><button class="icon-btn save-job" type="button" title="Save job" aria-label="Save job">🔖</button><button class="icon-btn job-more" type="button" title="Job details" aria-label="Job details">⋯</button></div></div>`;}).join('');
}
renderJobs();

function bindJobActions(){
  document.addEventListener('click',e=>{
    const save=e.target.closest('.save-job');
    if(save){ save.classList.toggle('saved'); save.textContent=save.classList.contains('saved')?'✓':'🔖'; notify(save.classList.contains('saved')?'JOB SAVED':'REMOVED FROM SAVED'); return; }
    const more=e.target.closest('.job-more');
    if(more){ const row=more.closest('.job-row'); const title=row?.querySelector('.title')?.textContent||'Job'; notify(`${title} — DETAILS READY`); row?.scrollIntoView({behavior:'smooth',block:'center'}); }
  });
}
bindJobActions();

const legend=document.getElementById('sectorLegend');
if(legend)legend.innerHTML=sectors.map(s=>`<div class="leg-row" data-sector="${s.name}" role="button" tabindex="0"><div class="name"><span class="sw" style="background:${s.color}"></span>${s.name}</div><div class="pct">${s.pct}%</div></div>`).join('');

const donut=document.getElementById('donutCanvas');
if(donut){
  const donutCtx=donut.getContext('2d'); let donutProgress=0;
  function drawDonut(progress){const cvs=donutCtx.canvas,w=cvs.width,h=cvs.height;donutCtx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,rOuter=100,rInner=68;let start=-Math.PI/2;sectors.forEach(s=>{const angle=(s.pct/100)*progress*Math.PI*2;donutCtx.beginPath();donutCtx.arc(cx,cy,rOuter,start,start+angle);donutCtx.arc(cx,cy,rInner,start+angle,start,true);donutCtx.closePath();donutCtx.fillStyle=s.color;donutCtx.fill();start+=angle;});}
  function animateDonut(){donutProgress=Math.min(1,donutProgress+.025);drawDonut(donutProgress);if(donutProgress<1)requestAnimationFrame(animateDonut);}requestAnimationFrame(animateDonut);
}

const netCanvas=document.getElementById('netCanvas'); let netParticles=[];
if(netCanvas){
  const netCtx=netCanvas.getContext('2d');
  function setupNet(){const rect=netCanvas.getBoundingClientRect();netCanvas.width=Math.max(1,rect.width*devicePixelRatio);netCanvas.height=Math.max(1,rect.height*devicePixelRatio);const nodeAngles=[-2.7,-.45,-Math.PI/2-.85,Math.PI/2+.85,2.7,.45];netParticles=nodeAngles.map(()=>({t:Math.random(),speed:.004+Math.random()*.003}));}
  function drawNet(){const w=netCanvas.width,h=netCanvas.height;netCtx.clearRect(0,0,w,h);const cx=w/2,cy=h/2;const positions=[[.10,.14],[.90,.14],[.03,.5],[.97,.5],[.12,.90],[.88,.90]];positions.forEach((pos,i)=>{const nx=pos[0]*w,ny=pos[1]*h;netCtx.beginPath();netCtx.moveTo(cx,cy);netCtx.lineTo(nx,ny);netCtx.setLineDash([4,5]);netCtx.strokeStyle='rgba(47,111,235,.18)';netCtx.lineWidth=1;netCtx.stroke();netCtx.setLineDash([]);const p=netParticles[i];p.t+=p.speed;if(p.t>1)p.t=0;const px=cx+(nx-cx)*p.t,py=cy+(ny-cy)*p.t;netCtx.beginPath();netCtx.arc(px,py,2.6,0,Math.PI*2);netCtx.fillStyle='#1fb567';netCtx.fill();});requestAnimationFrame(drawNet);}window.addEventListener('resize',setupNet);setupNet();requestAnimationFrame(drawNet);
}

const activityList=document.getElementById('activityList');
function timeStr(){return new Date().toTimeString().slice(0,8);}
function pushActivity(msg){if(!activityList)return;const row=document.createElement('div');row.className='activity-row';const dc=dotClasses[Math.floor(Math.random()*dotClasses.length)];row.innerHTML=`<span class="t">${timeStr()}</span><span class="m">${msg}</span><span class="d ${dc}"></span>`;activityList.insertBefore(row,activityList.firstChild);while(activityList.children.length>12)activityList.removeChild(activityList.lastChild);}
window.pushActivity=pushActivity;
for(let i=0;i<8;i++)pushActivity(activityMsgs[i%activityMsgs.length]);setInterval(()=>pushActivity(activityMsgs[Math.floor(Math.random()*activityMsgs.length)]),2600);

function animateCount(el,target,opts={}){if(!el)return;const dur=opts.dur||1400,suffix=opts.suffix||'',start=performance.now();function step(now){const p=Math.min(1,(now-start)/dur),eased=1-Math.pow(1-p,3),val=Math.round(target*eased);el.textContent=val.toLocaleString()+suffix;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
animateCount(document.getElementById('metricPages'),1248931);animateCount(document.getElementById('metricOpps'),3472);animateCount(document.getElementById('statJobs'),3472);animateCount(document.getElementById('statHigh'),1028);animateCount(document.getElementById('statApps'),12);
const uptime=document.getElementById('metricUptime');if(uptime){const start=performance.now();(function step(now){const p=Math.min(1,(now-start)/1400),e=1-Math.pow(1-p,3);uptime.textContent=(98.6*e).toFixed(1)+'%';if(p<1)requestAnimationFrame(step);})(start);}
setInterval(()=>{sources.forEach(s=>{if(Math.random()<.6)s.count+=Math.random()<.5?1:0;});renderSources();const total=247+Math.floor(Math.random()*3);const scan=document.getElementById('scanCount');const bar=document.getElementById('scanBar');if(scan)scan.innerHTML=total+'<span>/ 300</span>';if(bar)bar.style.width=Math.min(100,total/300*100)+'%';},3000);

// Tabs now actually filter the visible job list.
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');
  const mode=t.dataset.tab;let rows=jobs;
  if(mode==='high')rows=jobs.filter(j=>j.pct>=85);
  if(mode==='new')rows=jobs.filter(j=>j.badge==='new');
  if(mode==='saved')rows=[];
  renderJobs(rows); notify(`${t.textContent.trim()} SELECTED`);
}));

// Sidebar navigation maps to actual sections in the current single-page dashboard.
const navTargets={dashboard:'.content',jobs:'.row-opps',search:'.row-core',companies:'.sources-scan',cv:'.workflow',settings:'.sidebar'};
document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',e=>{
  e.preventDefault();document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');
  const page=item.dataset.page;const target=document.querySelector(navTargets[page]||'.content');target?.scrollIntoView({behavior:'smooth',block:'start'});
  if(page==='search')document.getElementById('searchNowBtn')?.focus();
  if(page==='cv')notify('CV CENTER — READY FOR PROFILE WORKFLOW');
  if(page==='settings')notify('SETTINGS — DASHBOARD CONTROLS ACTIVE');
}));

// Source chips are live search shortcuts.
document.querySelectorAll('.source-chip').forEach(chip=>{chip.setAttribute('role','button');chip.setAttribute('tabindex','0');const run=()=>{const label=chip.querySelector('b')?.textContent||'SOURCE';notify(`${label} SEARCH SELECTED`);pushActivity(`Priority scan: ${label}`);document.getElementById('searchNowBtn')?.click();};chip.addEventListener('click',run);chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});});

// Toolbar controls are now buttons in behavior even though original markup used divs.
const sortCtl=document.querySelector('.select-like');
if(sortCtl){sortCtl.setAttribute('role','button');sortCtl.setAttribute('tabindex','0');let sortMode=0;const sorts=['Relevance','Newest','Company'];const run=()=>{sortMode=(sortMode+1)%sorts.length;sortCtl.textContent='Sort by: '+sorts[sortMode];notify(`SORT: ${sorts[sortMode].toUpperCase()}`);};sortCtl.addEventListener('click',run);sortCtl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});}
const filterCtl=document.querySelector('.filter-btn');
if(filterCtl){filterCtl.setAttribute('role','button');filterCtl.setAttribute('tabindex','0');const run=()=>{document.querySelector('.sector-body')?.scrollIntoView({behavior:'smooth',block:'center'});notify('SECTOR FILTERS OPEN');};filterCtl.addEventListener('click',run);filterCtl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});}

// Search Now still gives immediate UI feedback; backend-bridge intercepts it when Supabase is configured.
const searchSeq=['INITIALIZING AI SEARCH CORE...','CONNECTING TO SOURCES...','SCANNING COMPANY WEBSITES...','SCANNING JOB BOARDS...','SCANNING SCHOOLS...','SCANNING OIL & GAS COMPANIES...','ANALYZING RESULTS...','REMOVING DUPLICATES...','CALCULATING MATCH SCORES...','NEW OPPORTUNITIES FOUND.'];
let searching=false;const searchBtn=document.getElementById('searchNowBtn');
if(searchBtn)searchBtn.addEventListener('click',()=>{if(searching)return;searching=true;searchBtn.style.opacity='.7';let i=0;const iv=setInterval(()=>{pushActivity(searchSeq[i]);i++;if(i>=searchSeq.length){clearInterval(iv);searchBtn.style.opacity='1';searching=false;notify('SEARCH REQUEST SENT');}},420);});

// Profile card gives visible feedback instead of being dead.
document.querySelector('.profile')?.addEventListener('click',()=>notify('PROFILE PANEL READY'));
document.querySelectorAll('.net-node').forEach(n=>n.addEventListener('click',()=>{pushActivity(`Network source selected: ${n.querySelector('b')?.textContent||'Source'}`);notify('NETWORK SOURCE ACTIVE');}));
