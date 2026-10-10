/* TheCareers original no-dependency guide. No AI, tracking, applicant data or network calls. */
(() => {
  'use strict';
  if (window.FLOATING_HELPER_ENABLED === false || !document.body || document.getElementById('fh-root')) return;
  const ar = document.documentElement.lang.toLowerCase().startsWith('ar');
  const labels = ar ? {
    name: 'مساعد الوظائف', intro: 'أساعدك في الوصول للوظائف والبحث والمعلومات. لا أرسل طلبات توظيف ولا أقرأ بياناتك.',
    jobs: 'تصفح الوظائف', search: 'ابحث عن وظيفة', newest: 'الأحدث أولًا',
    more: 'كيف أتحقق من الإعلان؟', tips: 'تحقق من تاريخ نشر الوظيفة الأصلي ورابط الشركة قبل التقديم. لا ترسل بيانات شخصية إلى جهة غير موثوقة.',
    cv: 'مركز السيرة الذاتية', how: 'طريقة عمل الموقع',
    roam: 'تفعيل الحركة الهادئة', stop: 'إيقاف الحركة', hide: 'تصغير المساعد',
    show: 'إظهار مساعد الوظائف', close: 'إغلاق', badge: 'مساعدة الوظائف'
  } : {
    name: 'Career guide', intro: 'Jump to jobs and tools. I do not read your data or submit applications.',
    jobs: 'Browse jobs', search: 'Find positions', newest: 'View newest jobs',
    more: 'How do I verify a job?', tips: 'Check the original posting date, employer and source link before applying. Never share sensitive information with unverified contacts.',
    cv: 'CV Centre', how: 'How this works',
    roam: 'Enable gentle movement', stop: 'Stop movement', hide: 'Minimize guide',
    show: 'Show career guide', close: 'Close', badge: 'CAREER GUIDE'
  };
  const key = ar ? 'thecareers-org-floating-helper-v2' : 'thecareers-floating-helper-v2';
  const oldKey = ar ? 'thecareers-org-floating-helper-v1' : 'thecareers-floating-helper-v1';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const size = 60;
  const clamp = (n,lo,hi) => Math.min(Math.max(n,lo),Math.max(lo,hi));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || localStorage.getItem(oldKey) || '{}') || {}; } catch (_) {}
  let x = Number.isFinite(saved.x) ? saved.x : innerWidth - size - 18;
  let y = Number.isFinite(saved.y) ? saved.y : innerHeight - size - 112;
  let hidden = saved.hidden === true, roam = saved.roam === true, open = false, dragging = null, moved = false;
  const host = document.createElement('aside'); host.id = 'fh-root'; host.className = 'fh-root';
  host.dir = ar ? 'rtl' : 'ltr';
  const face = document.createElement('button'); face.type = 'button'; face.className = 'fh-trigger';
  face.setAttribute('aria-label', labels.name + (ar ? '، اضغط للخيارات أو اسحب لتحريكها' : '. Open tools or drag to move.'));
  face.innerHTML = '<span class="fh-eyes" aria-hidden="true"><i><b></b></i><i><b></b></i></span><span class="fh-mouth" aria-hidden="true"></span><span class="fh-sparkle" aria-hidden="true">✦</span>';
  const tag = document.createElement('span'); tag.className = 'fh-tag'; tag.textContent = labels.badge; tag.setAttribute('aria-hidden', 'true');
  const panel = document.createElement('section'); panel.className = 'fh-panel'; panel.id = 'fh-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', labels.name);
  const heading = document.createElement('strong'); heading.textContent = labels.name;
  const info = document.createElement('p'); info.textContent = labels.intro;
  const actions = document.createElement('div'); actions.className = 'fh-actions';
  const makeAction = (title, fn) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = title;
    b.addEventListener('click', fn); actions.append(b); return b;
  };
  const reveal = target => {
    if (!target) { message.textContent = ar ? 'هذا القسم غير متاح الآن.' : 'This section is not available right now.'; return; }
    open = false; draw();
    target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    if (target.matches('input, select, button')) target.focus({preventScroll:true});
  };
  const isArabic = ar;
  const message = document.createElement('p'); message.className = 'fh-tip'; message.hidden = true; message.setAttribute('role','status');
  makeAction(labels.jobs, () => reveal(isArabic ? document.getElementById('listings') : document.getElementById('jobList')));
  makeAction(labels.search, () => reveal(isArabic ? document.getElementById('searchInput') : document.getElementById('searchNowBtn')));
  if (ar) {
    makeAction(labels.newest, () => {
      const select = document.getElementById('sortSelect');
      if (select) { select.value = 'newest'; select.dispatchEvent(new Event('change',{bubbles:true})); }
      reveal(document.getElementById('listings'));
    });
    makeAction(labels.how, () => reveal(document.getElementById('howit')));
  } else {
    makeAction(labels.cv, () => {
      const nav = document.querySelector('.nav-item[data-page="cv"]');
      if (nav) { nav.click(); open = false; draw(); } else { message.hidden = false; message.textContent = 'CV Centre is not available right now.'; }
    });
  }
  makeAction(labels.more, () => { message.textContent = labels.tips; message.hidden = false; });
  const controls = document.createElement('div'); controls.className = 'fh-controls';
  const motion = document.createElement('button'); motion.type = 'button';
  const minimize = document.createElement('button'); minimize.type = 'button'; minimize.textContent = labels.hide;
  const close = document.createElement('button'); close.type = 'button'; close.textContent = labels.close;
  controls.append(motion, minimize, close);
  panel.append(heading, info, actions, message, controls);
  host.append(face, tag, panel); document.body.append(host);
  const save = () => { try { localStorage.setItem(key,JSON.stringify({x,y,hidden,roam})); } catch(_) {} };
  const draw = () => {
    x = clamp(x,12,innerWidth-size-12); y = clamp(y,12,innerHeight-size-12);
    host.style.left = x+'px'; host.style.top = y+'px'; host.classList.toggle('fh-minimized', hidden);
    face.hidden = hidden; tag.hidden = hidden;
    face.setAttribute('aria-expanded',String(open && !hidden));
    face.setAttribute('aria-controls','fh-panel');
    panel.hidden = !open || hidden;
    motion.textContent = roam ? labels.stop : labels.roam;
    motion.disabled = reduced.matches;
    if (!panel.hidden) {
      const w = Math.min(310,innerWidth-24);
      const h = Math.min(panel.scrollHeight,Math.max(80,innerHeight-24));
      panel.style.width = w+'px';
      panel.style.left = clamp(x + size/2 - w/2,12,innerWidth-w-12)+'px';
      panel.style.top = clamp(y+size+9+h > innerHeight-12 ? y-h-9 : y+size+9,12,innerHeight-h-12)+'px';
    }
    save();
  };
  const restore = document.createElement('button'); restore.type='button';restore.className='fh-restore';
  restore.setAttribute('aria-label',labels.show); restore.textContent='◉';
  host.append(restore);
  restore.addEventListener('click',()=>{hidden=false;draw();face.focus()});
  face.addEventListener('pointerdown',e=>{ if(e.button!==0)return;dragging={id:e.pointerId,px:e.clientX,py:e.clientY,x,y};moved=false;face.setPointerCapture(e.pointerId) });
  face.addEventListener('pointermove',e=>{if(!dragging||dragging.id!==e.pointerId)return;const dx=e.clientX-dragging.px,dy=e.clientY-dragging.py;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;if(moved){x=dragging.x+dx;y=dragging.y+dy;draw()}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])face.addEventListener(type,()=>{dragging=null});
  face.addEventListener('click',()=>{if(moved){moved=false;return}open=!open;message.hidden=true;draw()});
  face.addEventListener('keydown',e=>{const deltas={ArrowUp:[0,-24],ArrowDown:[0,24],ArrowLeft:[-24,0],ArrowRight:[24,0]};const d=deltas[e.key];if(d){e.preventDefault();x+=d[0];y+=d[1];draw()}else if(e.key==='Escape'){open=false;draw()}});
  motion.addEventListener('click',()=>{roam=!roam;draw()});
  minimize.addEventListener('click',()=>{open=false;hidden=true;draw();restore.focus()});
  close.addEventListener('click',()=>{open=false;draw();face.focus()});
  window.addEventListener('resize',draw,{passive:true});
  window.setInterval(()=>{if(!roam||hidden||open||dragging||document.hidden||reduced.matches)return;
    x=x>innerWidth/2?innerWidth-size-18:18; y=y>innerHeight/2?96:innerHeight-size-130;draw();
  },20000);
  // The moving pupils are inside each eye. Do not animate the whole button to the cursor.
  let raf=0;const gaze=(e)=>{
    if(hidden||reduced.matches||!fine.matches||e.pointerType!=='mouse')return;
    const px=e.clientX,py=e.clientY;
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;const box=face.getBoundingClientRect();const dx=px-box.left-box.width/2,dy=py-box.top-box.height/2;
      const len=Math.hypot(dx,dy)||1;const distance=Math.min(3,len/35);
      face.style.setProperty('--eye-x',(dx/len*distance).toFixed(2)+'px');
      face.style.setProperty('--eye-y',(dy/len*distance).toFixed(2)+'px');
    });
  };
  const neutral=()=>{if(raf)cancelAnimationFrame(raf);raf=0;face.style.removeProperty('--eye-x');face.style.removeProperty('--eye-y')};
  window.addEventListener('pointermove',gaze,{passive:true});
  window.addEventListener('blur',neutral);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)neutral()});
  reduced.addEventListener('change',()=>{neutral();draw()});
  draw();
})();