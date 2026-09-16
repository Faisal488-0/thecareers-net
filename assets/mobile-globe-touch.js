/* TheCareers mobile globe gestures — scroll-first controller */
(()=>{'use strict';if(window.__TC_MOBILE_GLOBE_TOUCH__)return;window.__TC_MOBILE_GLOBE_TOUCH__=true;
const mobile=()=>window.innerWidth<=760||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;if(!mobile())return;
const attach=()=>{const stage=document.getElementById('thecareers-globe-stage'),globe=document.getElementById('thecareers-ai-globe'),api=window.__theCareersGlobe,chart=api?.chart;if(!stage||!globe||!chart)return false;if(stage.dataset.tcTouchBound==='1')return true;stage.dataset.tcTouchBound='1';
/* Native page scroll owns all vertical touch movement. Globe only reacts to a clearly horizontal drag. */
stage.style.touchAction='pan-y';globe.style.touchAction='pan-y';try{chart.setAll({panX:'none',panY:'none',pinchZoom:false,wheelY:'none',wheelX:'none'});}catch(_){}
let g=null;stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;g={id:e.pointerId,x:e.clientX,y:e.clientY,rx:Number(chart.get('rotationX')||-48),ry:Number(chart.get('rotationY')||-18),rotate:false};},{passive:true});
stage.addEventListener('pointermove',e=>{if(!g||e.pointerId!==g.id)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.rotate){if(Math.abs(dy)>=6&&Math.abs(dy)>=Math.abs(dx)){g=null;return;}if(Math.abs(dx)>=12&&Math.abs(dx)>Math.abs(dy)*1.5){g.rotate=true;try{api.stopSpin?.();}catch(_){}}else return;}e.preventDefault();try{chart.set('rotationX',g.rx+dx*.32);chart.set('rotationY',Math.max(-75,Math.min(75,g.ry-dy*.16)));}catch(_){}},{passive:false});
const end=()=>{if(g?.rotate){try{api.startSpin?.();}catch(_){}}g=null};stage.addEventListener('pointerup',end,{passive:true});stage.addEventListener('pointercancel',end,{passive:true});return true};
if(attach())return;let n=0,t=setInterval(()=>{if(attach()||++n>120)clearInterval(t)},100);window.addEventListener('pageshow',attach,{passive:true});})();
