/* TheCareers mobile touch + clean-layout loader */
(() => {
  'use strict';
  if (!document.querySelector('link[data-tc-mobile-clean]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/mobile-clean-v3.css?v=20260916-2';
    link.dataset.tcMobileClean = '1';
    document.head.appendChild(link);
  }
  if (window.__TC_MOBILE_GLOBE_TOUCH__) return;
  window.__TC_MOBILE_GLOBE_TOUCH__ = true;
  const isTouchLayout=()=>window.innerWidth<=760||window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  if(!isTouchLayout())return;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const attach=()=>{
    const stage=document.getElementById('thecareers-globe-stage');
    const globe=document.getElementById('thecareers-ai-globe');
    const api=window.__theCareersGlobe; const chart=api?.chart;
    if(!stage||!globe||!chart)return false;
    stage.style.touchAction='pan-y'; globe.style.touchAction='pan-y';
    try{chart.setAll({panX:'none',panY:'none',pinchZoom:false,wheelY:'none',wheelX:'none'});}catch(_){}
    if(stage.dataset.tcTouchBound==='1')return true;
    stage.dataset.tcTouchBound='1'; let gesture=null,lastTapAt=0;
    const finish=e=>{if(!gesture)return;const wasRotate=gesture.mode==='rotate';const wasTap=gesture.mode==='pending'&&Math.abs((e?.clientX??gesture.x)-gesture.x)<7&&Math.abs((e?.clientY??gesture.y)-gesture.y)<7;if(wasRotate){try{api.startSpin?.();}catch(_){}}if(wasTap&&e?.pointerType==='touch'){const now=Date.now();if(now-lastTapAt<320){try{api.reset?.();}catch(_){}lastTapAt=0}else lastTapAt=now;}gesture=null;};
    stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,rotationX:Number(chart.get('rotationX')||-48),rotationY:Number(chart.get('rotationY')||-18),mode:'pending'};},{passive:true});
    stage.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,ax=Math.abs(dx),ay=Math.abs(dy);if(gesture.mode==='pending'&&Math.max(ax,ay)>=7){if(ay>ax*1.08){gesture.mode='scroll';return;}if(ax>=ay*.92){gesture.mode='rotate';try{stage.setPointerCapture(e.pointerId);}catch(_){}try{api.stopSpin?.();}catch(_){}}}if(gesture.mode==='rotate'){e.preventDefault();try{chart.set('rotationX',gesture.rotationX+dx*.34);chart.set('rotationY',clamp(gesture.rotationY-dy*.22,-78,78));}catch(_){}}},{passive:false});
    stage.addEventListener('pointerup',finish,{passive:true});stage.addEventListener('pointercancel',finish,{passive:true});return true;
  };
  if(attach())return;let tries=0;const timer=setInterval(()=>{tries++;if(attach()||tries>=160)clearInterval(timer);},100);window.addEventListener('pageshow',attach);window.addEventListener('resize',attach,{passive:true});
})();
