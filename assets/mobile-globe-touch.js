/* TheCareers mobile globe — native page touch owns phone gestures */
(()=>{'use strict';if(window.__TC_MOBILE_GLOBE_TOUCH__)return;window.__TC_MOBILE_GLOBE_TOUCH__=true;
const mobile=()=>window.innerWidth<=760||window.matchMedia?.('(pointer:coarse)').matches||navigator.maxTouchPoints>0;if(!mobile())return;
const attach=()=>{const stage=document.getElementById('thecareers-globe-stage'),globe=document.getElementById('thecareers-ai-globe'),api=window.__theCareersGlobe,chart=api?.chart;if(!stage||!globe)return false;
/* Do not intercept pointer/touch events on phones. The globe remains visual/animated,
   while taps and swipes pass through to normal page scrolling and controls. */
stage.style.touchAction='pan-y';globe.style.touchAction='pan-y';stage.style.pointerEvents='none';globe.style.pointerEvents='none';
try{chart?.setAll?.({panX:'none',panY:'none',pinchZoom:false,wheelY:'none',wheelX:'none'});}catch(_){}
return true};if(attach())return;let n=0,t=setInterval(()=>{if(attach()||++n>120)clearInterval(t)},100);window.addEventListener('pageshow',attach,{passive:true});})();
