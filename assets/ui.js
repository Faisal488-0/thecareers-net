/* TheCareers dashboard UI — interactive controls + live demo fallback */
const sources=[
{name:'Company Websites',base:58},{name:'Job Boards',base:42},{name:'LinkedIn',base:38},{name:'Government Portals',base:24},
{name:'Recruitment Agencies',base:36},{name:'University Career Portals',base:19},{name:'News & Media',base:18},{name:'Direct Company Careers',base:12}
];
const jobs=[
{title:'HR Generalist',company:'Kuwait Petroleum Corporation (KPC)',loc:'Kuwait City, Kuwait',type:'Full-time',cat:'HR',pct:92,badge:'high',time:'2 hours ago',ini:'KPC',color:'#1fb567'},
{title:'Operations Specialist',company:'Agility – Global Integrated Logistics',loc:'Kuwait City, Kuwait',type:'Full-time',cat:'Operations',pct:87,badge:'verified',time:'5 hours ago',ini:'A',color:'#2f6feb'},
{title:'Administrative Officer',company:'Ministry of Education – Kuwait',loc:'Kuwait City, Kuwait',type:'Full-time',cat:'Administration',pct:84,badge:'new',time:'7 hours ago',ini:'M',color:'#8a8f96'},
{title:'Recruitment Coordinator',company:'Talent World Group',loc:'Kuwait City, Kuwait',type:'Full-time',cat:'HR',pct:82,badge:'high',time:'9 hours ago',ini:'C',color:'#e0912b'},
{title:'HSE Officer',company:'Kuwait Energy',loc:'Ahmadi, Kuwait',type:'Full-time',cat:'Oil & Gas',pct:80,badge:'new',time:'10 hours ago',ini:'KE',color:'#0b0c0e'}
];
const sectors=[
{name:'Oil & Gas',pct:28,color:'#0b0c0e'},{name:'Administration',pct:18,color:'#2f6feb'},{name:'HR',pct:14,color:'#1fb567'},{name:'Operations',pct:12,color:'#e0912b'},
{name:'Engineering',pct:9,color:'#7c5cff'},{name:'Finance',pct:8,color:'#e15c7a'},{name:'IT & Technology',pct:7,color:'#17b8c4'},{name:'Others',pct:4,color:'#c7cbd1'}
];
const activityMsgs=['Searching companies in Kuwait','Scanning oil & gas sector jobs','Checking new government vacancies','Searching administration roles','Scanning HR opportunities','Analyzing company career pages','Fetching verified job postings','Searching operations positions','Checking university career portals','Monitoring new job alerts','Filtering and ranking results','Updating relevance scores','Cross-referencing salary bands','Deduplicating listings','Verifying company legitimacy','Indexing new employer pages','Matching skills to openings','Refreshing recruiter feeds'];
const dotClasses=['g','g','b','g','a','g'];
const toast=document.getElementById('toast'),toastText=document.getElementById('toastText');
function notify(msg){if(!toast||!toastText)return;toastText.textContent=msg;toast.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove('show'),2600);}

const srcList=document.getElementById('srcList');
function renderSources(){if(!srcList)return;srcList.innerHTML=sources.map(s=>`<div class="src-row"><div class="name"><span class="d"></span>${s.name}</div><div class="val">${s.count}</div></div>`).join('');}
sources.forEach(s=>s.count=s.base);renderSources();

const jobList=document.getElementById('jobList');
function badgeMeta(b){if(b==='high')return{cls:'high',label:'High Match'};if(b==='verified')return{cls:'verified',label:'Verified'};return{cls:'new',label:'New'};}
function renderJobs(rows=jobs){if(!jobList)return;jobList.innerHTML=rows.map((j,i)=>{const bm=badgeMeta(j.badge);return `<div class="job-row" data-local-job="${i}" data-category="${j.cat}" data-score="${j.pct}"><div class="job-logo" style="background:${j.color}">${j.ini}</div><div class="job-main"><div class="title">${j.title}</div><div class="company">${j.company}</div><div class="job-meta"><span>📍 ${j.loc}</span><span>🕐 ${j.type}</span><span>▤ ${j.cat}</span></div></div><div class="job-score"><div class="pct">${j.pct}%</div><div class="lbl">Relevance</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;"><span class="badge ${bm.cls}">${bm.label}</span><span class="job-time">${j.time}</span></div><div class="job-actions"><button class="icon-btn save-job" type="button" title="Save job" aria-label="Save job">🔖</button><button class="icon-btn job-more" type="button" title="Job details" aria-label="Job details">⋯</button></div></div>`;}).join('');}
renderJobs();
document.addEventListener('click',e=>{const save=e.target.closest('.save-job');if(save){save.classList.toggle('saved');save.textContent=save.classList.contains('saved')?'✓':'🔖';notify(save.classList.contains('saved')?'JOB SAVED':'REMOVED FROM SAVED');return;}const more=e.target.closest('.job-more');if(more){const row=more.closest('.job-row'),title=row?.querySelector('.title')?.textContent||'Job';notify(`${title} — DETAILS READY`);row?.scrollIntoView({behavior:'smooth',block:'center'});}});

const legend=document.getElementById('sectorLegend');if(legend)legend.innerHTML=sectors.map(s=>`<div class="leg-row" data-sector="${s.name}" role="button" tabindex="0"><div class="name"><span class="sw" style="background:${s.color}"></span>${s.name}</div><div class="pct">${s.pct}%</div></div>`).join('');
const donut=document.getElementById('donutCanvas');if(donut){const ctx=donut.getContext('2d');let p=0;function draw(v){const w=ctx.canvas.width,h=ctx.canvas.height;ctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,ro=100,ri=68;let a=-Math.PI/2;sectors.forEach(s=>{const ang=(s.pct/100)*v*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,ro,a,a+ang);ctx.arc(cx,cy,ri,a+ang,a,true);ctx.closePath();ctx.fillStyle=s.color;ctx.fill();a+=ang;});}function anim(){p=Math.min(1,p+.025);draw(p);if(p<1)requestAnimationFrame(anim);}requestAnimationFrame(anim);}

/* GLOBAL SEARCH NETWORK — animated 3D black hole, same interaction model as globe:
   auto motion, drag to rotate/tilt, wheel to zoom, double-click to reset. */
const netCanvas=document.getElementById('netCanvas');
if(netCanvas){
  const ctx=netCanvas.getContext('2d');
  const centerLabel=document.querySelector('.net-center');if(centerLabel)centerLabel.style.display='none';
  netCanvas.style.cursor='grab';netCanvas.style.touchAction='none';netCanvas.style.pointerEvents='auto';
  let particles=[],stars=[],flow=[],phase=0,tilt=.34,zoom=1,dragging=false,lastX=0,lastY=0,resumeAt=0,lastT=performance.now();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const nodePositions=[[.10,.14],[.90,.14],[.03,.5],[.97,.5],[.12,.90],[.88,.90]];
  function resetParticles(){
    particles=Array.from({length:150},(_,i)=>({a:Math.random()*Math.PI*2,r:.72+Math.random()*.75,w:.22+Math.random()*.5,s:.003+Math.random()*.006,c:i%4===0?'#69b7ff':i%5===0?'#ffffff':'#ffab45',z:Math.random()}));
    stars=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:.3+Math.random()*1.2,a:.08+Math.random()*.32}));
    flow=nodePositions.map(()=>({t:Math.random(),speed:.0028+Math.random()*.003}));
  }
  function resize(){const r=netCanvas.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);netCanvas.width=Math.max(1,Math.round(r.width*d));netCanvas.height=Math.max(1,Math.round(r.height*d));resetParticles();}
  function ellipsePath(cx,cy,rx,ry,rot=0){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rot,0,Math.PI*2);}
  function drawBlackHole(cx,cy,base){
    const s=base*zoom,ry=s*(.25+tilt*.45),rot=Math.sin(phase*.22)*.06;
    ctx.save();ctx.globalCompositeOperation='source-over';
    const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,s*1.6);halo.addColorStop(0,'rgba(255,177,76,.12)');halo.addColorStop(.34,'rgba(69,142,255,.08)');halo.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,s*1.6,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation='lighter';
    for(let k=0;k<7;k++){
      const rr=s*(.66+k*.11),yy=ry*(.72+k*.075),g=ctx.createLinearGradient(cx-rr,cy,cx+rr,cy);
      g.addColorStop(0,'rgba(80,165,255,0)');g.addColorStop(.20,`rgba(74,161,255,${.13+k*.015})`);g.addColorStop(.43,`rgba(255,148,46,${.22+k*.035})`);g.addColorStop(.50,'rgba(255,244,207,.95)');g.addColorStop(.57,`rgba(255,151,47,${.22+k*.035})`);g.addColorStop(.80,`rgba(73,158,255,${.14+k*.015})`);g.addColorStop(1,'rgba(80,165,255,0)');ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.2,s*.014);ellipsePath(cx,cy,rr,yy,rot+(k-3)*.005);ctx.stroke();
    }
    particles.forEach(p=>{p.a+=reduced?0:p.s;const rr=s*p.r,ex=Math.cos(p.a+phase)*rr,ey=Math.sin(p.a+phase)*ry*p.w;const warp=1+.18*Math.sin(p.a*2+phase);const x=cx+ex*warp,y=cy+ey;ctx.fillStyle=p.c;ctx.globalAlpha=.16+.58*p.z;ctx.shadowColor=p.c;ctx.shadowBlur=s*.035;ctx.beginPath();ctx.arc(x,y,Math.max(.5,s*.008*(.5+p.z)),0,Math.PI*2);ctx.fill();});
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    const lens=ctx.createRadialGradient(cx-s*.08,cy-s*.10,s*.02,cx,cy,s*.55);lens.addColorStop(0,'#11151b');lens.addColorStop(.58,'#020304');lens.addColorStop(.83,'#000');lens.addColorStop(.93,'rgba(0,0,0,.97)');lens.addColorStop(1,'rgba(255,174,66,.32)');ctx.fillStyle=lens;ctx.beginPath();ctx.ellipse(cx,cy,s*.47,s*.47,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,221,170,.76)';ctx.lineWidth=Math.max(1,s*.012);ctx.beginPath();ctx.ellipse(cx,cy,s*.49,s*.49,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  function frame(now){
    const dt=Math.min(48,now-lastT);lastT=now;if(!dragging&&now>resumeAt&&!reduced)phase+=dt*.00022;
    const w=netCanvas.width,h=netCanvas.height,cx=w/2,cy=h/2,base=Math.min(w,h)*.17;
    ctx.clearRect(0,0,w,h);
    stars.forEach(s=>{ctx.fillStyle=`rgba(60,100,155,${s.a})`;ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();});
    nodePositions.forEach((pos,i)=>{const nx=pos[0]*w,ny=pos[1]*h;ctx.save();ctx.setLineDash([5,7]);ctx.lineWidth=Math.max(1,(window.devicePixelRatio||1)*.7);ctx.strokeStyle=i%2?'rgba(239,150,49,.22)':'rgba(47,111,235,.22)';ctx.beginPath();ctx.moveTo(nx,ny);ctx.quadraticCurveTo((nx+cx)/2,cy+(i-2.5)*h*.015,cx,cy);ctx.stroke();ctx.restore();const p=flow[i];if(!reduced)p.t=(p.t+p.speed)%1;const q=1-p.t,px=q*nx+p.t*cx,py=q*ny+p.t*cy;ctx.fillStyle=i%2?'#f2a13b':'#2f6feb';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(px,py,3*(window.devicePixelRatio||1),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
    drawBlackHole(cx,cy,base);requestAnimationFrame(frame);
  }
  netCanvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;netCanvas.setPointerCapture?.(e.pointerId);netCanvas.style.cursor='grabbing';});
  netCanvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;phase+=dx*.012;tilt=Math.max(.08,Math.min(.78,tilt-dy*.004));});
  const end=e=>{dragging=false;resumeAt=performance.now()+900;netCanvas.style.cursor='grab';try{netCanvas.releasePointerCapture?.(e.pointerId);}catch{}};
  netCanvas.addEventListener('pointerup',end);netCanvas.addEventListener('pointercancel',end);
  netCanvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.72,Math.min(1.75,zoom*(e.deltaY>0?.92:1.08)));resumeAt=performance.now()+900;},{passive:false});
  netCanvas.addEventListener('dblclick',()=>{phase=0;tilt=.34;zoom=1;resumeAt=performance.now()+700;notify('BLACK HOLE VIEW RESET');});
  window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
}

const activityList=document.getElementById('activityList');
function timeStr(){return new Date().toTimeString().slice(0,8);}function pushActivity(msg){if(!activityList)return;const row=document.createElement('div');row.className='activity-row';const dc=dotClasses[Math.floor(Math.random()*dotClasses.length)];row.innerHTML=`<span class="t">${timeStr()}</span><span class="m">${msg}</span><span class="d ${dc}"></span>`;activityList.insertBefore(row,activityList.firstChild);while(activityList.children.length>12)activityList.removeChild(activityList.lastChild);}window.pushActivity=pushActivity;for(let i=0;i<8;i++)pushActivity(activityMsgs[i%activityMsgs.length]);setInterval(()=>pushActivity(activityMsgs[Math.floor(Math.random()*activityMsgs.length)]),2600);
function animateCount(el,target,opts={}){if(!el)return;const dur=opts.dur||1400,suffix=opts.suffix||'',start=performance.now();function step(now){const p=Math.min(1,(now-start)/dur),e=1-Math.pow(1-p,3),v=Math.round(target*e);el.textContent=v.toLocaleString()+suffix;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}animateCount(document.getElementById('metricPages'),1248931);animateCount(document.getElementById('metricOpps'),3472);animateCount(document.getElementById('statJobs'),3472);animateCount(document.getElementById('statHigh'),1028);animateCount(document.getElementById('statApps'),12);
const uptime=document.getElementById('metricUptime');if(uptime){const start=performance.now();(function step(now){const p=Math.min(1,(now-start)/1400),e=1-Math.pow(1-p,3);uptime.textContent=(98.6*e).toFixed(1)+'%';if(p<1)requestAnimationFrame(step);})(start);}
setInterval(()=>{sources.forEach(s=>{if(Math.random()<.6)s.count+=Math.random()<.5?1:0;});renderSources();const total=247+Math.floor(Math.random()*3),scan=document.getElementById('scanCount'),bar=document.getElementById('scanBar');if(scan)scan.innerHTML=total+'<span>/ 300</span>';if(bar)bar.style.width=Math.min(100,total/300*100)+'%';},3000);

document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');const mode=t.dataset.tab;let rows=jobs;if(mode==='high')rows=jobs.filter(j=>j.pct>=85);if(mode==='new')rows=jobs.filter(j=>j.badge==='new');if(mode==='saved')rows=[];renderJobs(rows);notify(`${t.textContent.trim()} SELECTED`);}));
const navTargets={dashboard:'.content',jobs:'.row-opps',search:'.row-core',companies:'.sources-scan',cv:'.workflow',settings:'.sidebar'};
document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const page=item.dataset.page,target=document.querySelector(navTargets[page]||'.content');target?.scrollIntoView({behavior:'smooth',block:'start'});if(page==='search')document.getElementById('searchNowBtn')?.focus();if(page==='cv')notify('CV CENTER — READY FOR PROFILE WORKFLOW');if(page==='settings')notify('SETTINGS — DASHBOARD CONTROLS ACTIVE');}));
document.querySelectorAll('.source-chip').forEach(chip=>{chip.setAttribute('role','button');chip.setAttribute('tabindex','0');const run=()=>{const label=chip.querySelector('b')?.textContent||'SOURCE';notify(`${label} SEARCH SELECTED`);pushActivity(`Priority scan: ${label}`);document.getElementById('searchNowBtn')?.click();};chip.addEventListener('click',run);chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});});
const sortCtl=document.querySelector('.select-like');if(sortCtl){sortCtl.setAttribute('role','button');sortCtl.setAttribute('tabindex','0');let sortMode=0;const sorts=['Relevance','Newest','Company'];const run=()=>{sortMode=(sortMode+1)%sorts.length;sortCtl.textContent='Sort by: '+sorts[sortMode];notify(`SORT: ${sorts[sortMode].toUpperCase()}`);};sortCtl.addEventListener('click',run);sortCtl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});}
const filterCtl=document.querySelector('.filter-btn');if(filterCtl){filterCtl.setAttribute('role','button');filterCtl.setAttribute('tabindex','0');const run=()=>{document.querySelector('.sector-body')?.scrollIntoView({behavior:'smooth',block:'center'});notify('SECTOR FILTERS OPEN');};filterCtl.addEventListener('click',run);filterCtl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});}
const searchSeq=['INITIALIZING AI SEARCH CORE...','CONNECTING TO SOURCES...','SCANNING COMPANY WEBSITES...','SCANNING JOB BOARDS...','SCANNING SCHOOLS...','SCANNING OIL & GAS COMPANIES...','ANALYZING RESULTS...','REMOVING DUPLICATES...','CALCULATING MATCH SCORES...','NEW OPPORTUNITIES FOUND.'];let searching=false;const searchBtn=document.getElementById('searchNowBtn');if(searchBtn)searchBtn.addEventListener('click',()=>{if(searching)return;searching=true;searchBtn.style.opacity='.7';let i=0;const iv=setInterval(()=>{pushActivity(searchSeq[i]);i++;if(i>=searchSeq.length){clearInterval(iv);searchBtn.style.opacity='1';searching=false;notify('SEARCH REQUEST SENT');}},420);});
document.querySelector('.profile')?.addEventListener('click',()=>notify('PROFILE PANEL READY'));document.querySelectorAll('.net-node').forEach(n=>n.addEventListener('click',()=>{pushActivity(`Network source selected: ${n.querySelector('b')?.textContent||'Source'}`);notify('NETWORK SOURCE ACTIVE');}));