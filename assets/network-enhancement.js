/* TheCareers Global Search Network enhancement
   - Uses the exact approved black-hole artwork as the visual texture.
   - Keeps the object locked to the existing center while adding smooth 3D motion.
   - Adds animated source-to-core data lines and sequential workflow click feedback.
   - Leaves the rest of the dashboard untouched. */
(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const style = document.createElement('style');
  style.id = 'thecareers-network-reference-match-v3';
  style.textContent = `
    .tc-network-title{align-items:flex-start!important;flex-direction:column!important;gap:2px!important;line-height:1.05!important}
    .tc-network-sub{font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:600;letter-spacing:.13em;color:#8a96a6;white-space:nowrap;margin-top:3px}

    .net-body{perspective:1100px!important;transform-style:preserve-3d!important;overflow:hidden!important;background:radial-gradient(ellipse at center,rgba(82,151,237,.035) 0%,rgba(255,255,255,0) 64%)!important}
    .net-body .tc-black-hole{
      left:50%!important;top:50%!important;
      width:clamp(430px,55vw,760px)!important;max-width:73%!important;
      transform-origin:50% 50%!important;backface-visibility:visible!important;
      filter:saturate(1.035) contrast(1.025) drop-shadow(0 18px 30px rgba(25,67,116,.11))!important;
      will-change:transform,filter!important;
      z-index:2!important;
      animation:tcBlackHoleReferenceOrbit 22s cubic-bezier(.37,0,.63,1) infinite!important;
    }
    @keyframes tcBlackHoleReferenceOrbit{
      0%{transform:translate(-50%,-50%) perspective(1050px) rotateX(2deg) rotateY(-3deg) rotateZ(0deg) scale(1.015)}
      12.5%{transform:translate(-50%,-50%) perspective(1050px) rotateX(10deg) rotateY(5deg) rotateZ(42deg) scale(1.008)}
      25%{transform:translate(-50%,-50%) perspective(1050px) rotateX(18deg) rotateY(8deg) rotateZ(90deg) scale(.995)}
      37.5%{transform:translate(-50%,-50%) perspective(1050px) rotateX(9deg) rotateY(4deg) rotateZ(138deg) scale(1.005)}
      50%{transform:translate(-50%,-50%) perspective(1050px) rotateX(1deg) rotateY(-3deg) rotateZ(180deg) scale(1.015)}
      62.5%{transform:translate(-50%,-50%) perspective(1050px) rotateX(-9deg) rotateY(-6deg) rotateZ(228deg) scale(1.008)}
      75%{transform:translate(-50%,-50%) perspective(1050px) rotateX(-18deg) rotateY(-8deg) rotateZ(270deg) scale(.995)}
      87.5%{transform:translate(-50%,-50%) perspective(1050px) rotateX(-8deg) rotateY(-4deg) rotateZ(318deg) scale(1.006)}
      100%{transform:translate(-50%,-50%) perspective(1050px) rotateX(2deg) rotateY(-3deg) rotateZ(360deg) scale(1.015)}
    }
    .net-body #netCanvas{opacity:.055!important;pointer-events:none!important;z-index:1!important}
    .net-body .tc-flow-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none}

    .net-body .net-node{
      display:flex!important;align-items:center!important;gap:9px!important;
      min-height:58px!important;padding:8px 10px!important;
      border:1px solid #e2e8f0!important;border-radius:12px!important;
      background:rgba(255,255,255,.94)!important;backdrop-filter:blur(7px)!important;
      box-shadow:0 8px 22px -16px rgba(31,69,112,.35)!important;
      overflow:visible!important;z-index:9!important;
      transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease!important;
    }
    .net-body .net-node:hover,.net-body .net-node.tc-source-pulse{transform:translateY(-1px) scale(1.018)!important;border-color:#cfe2f8!important;box-shadow:0 12px 26px -16px rgba(31,92,164,.42)!important}
    .tc-node-icon{width:34px;height:34px;flex:0 0 34px;border-radius:9px;display:grid;place-items:center;background:#f5f8fc;border:1px solid #edf1f5;color:#3f5268;overflow:hidden}
    .tc-node-icon svg{width:22px;height:22px}
    .tc-brand-linkedin{background:#0a66c2;color:white;border-radius:5px;font-size:19px;font-weight:800;line-height:1;padding:3px 5px;letter-spacing:-.05em}
    .tc-brand-indeed{color:#2468d8;font-size:25px;font-weight:800;line-height:1;font-family:Georgia,serif;transform:translateY(-1px)}
    .tc-node-copy{min-width:0;line-height:1.15}
    .tc-node-title{display:block;font-size:11.5px;font-weight:800;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tc-node-sub{display:block;margin-top:2px;font-size:8.7px;color:#708097;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tc-node-live{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:8.8px;font-weight:700;color:#108a51}
    .tc-node-live .d{width:6px;height:6px;border-radius:50%;background:#0db45e;box-shadow:0 0 0 3px rgba(13,180,94,.08)}

    .workflow .wf-step{position:relative!important;overflow:hidden!important;transition:color .45s ease,background .45s ease,border-color .45s ease,box-shadow .45s ease,transform .45s cubic-bezier(.2,.8,.2,1)!important}
    .workflow .wf-step.tc-auto-active{color:#168555!important;background:linear-gradient(180deg,#fbfffd,#effbf5)!important;border-color:#bfe7d1!important;box-shadow:0 0 0 1px rgba(31,181,103,.08),0 9px 22px -16px rgba(31,181,103,.45)!important;transform:translateY(-1px) scale(1.018)!important}
    .workflow .wf-step.tc-auto-active::after{content:'';position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:50%;background:rgba(31,181,103,.18);transform:translate(-50%,-50%) scale(0);animation:tcWorkflowRipple 1.15s ease-out forwards;pointer-events:none}
    @keyframes tcWorkflowRipple{0%{transform:translate(-50%,-50%) scale(0);opacity:.65}100%{transform:translate(-50%,-50%) scale(18);opacity:0}}

    @media(max-width:980px){.net-body .tc-black-hole{width:clamp(390px,67vw,650px)!important;max-width:76%!important}.tc-node-sub{display:none}}
    @media(max-width:760px){.net-body .tc-black-hole{width:min(94vw,540px)!important;max-width:94%!important}.tc-network-sub{font-size:7.4px;letter-spacing:.09em}.net-body .net-node{min-height:50px!important;padding:7px 8px!important}.tc-node-icon{width:28px;height:28px;flex-basis:28px}.tc-node-icon svg{width:18px;height:18px}.tc-node-title{font-size:10px}.tc-node-live{font-size:8px;margin-top:3px}}
    @media(max-width:560px){.net-body .net-node{display:none!important}.net-body .tc-black-hole{width:min(112vw,500px)!important;max-width:112%!important}.tc-network-sub{display:none}}
    @media(prefers-reduced-motion:reduce){.net-body .tc-black-hole{animation:none!important}.workflow .wf-step.tc-auto-active::after{animation:none!important}}
  `;
  document.head.appendChild(style);

  const nodeData = [
    {title:'LinkedIn',sub:'Jobs · People · Companies',kind:'linkedin'},
    {title:'Government',sub:'Public Sector Jobs',kind:'government'},
    {title:'Indeed',sub:'Jobs · Salaries · Reviews',kind:'indeed'},
    {title:'Universities',sub:'Academic Opportunities',kind:'university'},
    {title:'Company Sites',sub:'Direct Career Pages',kind:'company'},
    {title:'Recruiters',sub:'Agencies · Headhunters',kind:'recruiters'}
  ];
  const icons = {
    linkedin:`<span class="tc-brand-linkedin">in</span>`,
    indeed:`<span class="tc-brand-indeed">i</span>`,
    government:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9h18M5 9V19M9 9V19M15 9V19M19 9V19M3 19h18M12 3l9 4H3l9-4z"/></svg>`,
    university:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 8l10-5 10 5-10 5L2 8z"/><path d="M6 10.5V16c3.5 2.7 8.5 2.7 12 0v-5.5M22 8v7"/></svg>`,
    company:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4h10v17M15 10h4v11M8 8h2M8 12h2M8 16h2M12 8h1M12 12h1M12 16h1M3 21h18"/></svg>`,
    recruiters:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6M14 15c3.5-.5 6 1.7 6 5"/></svg>`
  };

  function findNetworkTitle(){return Array.from(document.querySelectorAll('.panel-title')).find(el=>el.textContent.includes('GLOBAL SEARCH NETWORK'));}
  function enrichHeader(){
    const title=findNetworkTitle(); if(!title) return;
    title.classList.add('tc-network-title');
    if(!title.querySelector('.tc-network-sub')){
      const sub=document.createElement('span');sub.className='tc-network-sub';sub.textContent='REAL SOURCES · REAL OPPORTUNITIES · WORLDWIDE';title.appendChild(sub);
    }
  }

  function enrichNodes(){
    const body=document.querySelector('.net-body'); if(!body) return [];
    const nodes=Array.from(body.querySelectorAll(':scope > .net-node'));
    nodes.forEach((node,i)=>{
      const d=nodeData[i]; if(!d) return;
      if(node.dataset.tcRich==='1') return;
      node.dataset.tcRich='1';
      node.setAttribute('role','button');node.setAttribute('tabindex','0');node.setAttribute('aria-label',`${d.title}: ${d.sub}`);
      node.innerHTML=`<span class="tc-node-icon">${icons[d.kind]}</span><span class="tc-node-copy"><span class="tc-node-title">${d.title}</span><span class="tc-node-sub">${d.sub}</span><span class="tc-node-live"><span class="d"></span>Live</span></span>`;
      const pulse=()=>{node.classList.add('tc-source-pulse');setTimeout(()=>node.classList.remove('tc-source-pulse'),650);};
      node.addEventListener('click',pulse);
      node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pulse();}});
    });
    return nodes;
  }

  function layoutNodes(){
    const body=document.querySelector('.net-body'); if(!body) return;
    const nodes=Array.from(body.querySelectorAll(':scope > .net-node'));if(nodes.length!==6)return;
    const w=body.clientWidth,h=body.clientHeight;if(!w||!h)return;
    if(w<=560){nodes.forEach(n=>n.style.setProperty('display','none','important'));return;}
    const cardW=w<760?112:(w<1180?138:158);
    const side=w<760?10:Math.max(18,Math.min(48,Math.round(w*.035)));
    const topGap=Math.max(14,Math.round(h*.055));
    const y=[topGap,Math.round((h-58)/2),Math.max(topGap+116,h-topGap-58)];
    const xL=side,xR=Math.max(side,w-side-cardW);
    const positions=[[xL,y[0]],[xR,y[0]],[xL,y[1]],[xR,y[1]],[xL,y[2]],[xR,y[2]]];
    nodes.forEach((n,i)=>{
      n.style.setProperty('display','flex','important');
      n.style.setProperty('width',`${cardW}px`,'important');n.style.setProperty('min-width',`${cardW}px`,'important');n.style.setProperty('max-width',`${cardW}px`,'important');
      n.style.setProperty('left',`${positions[i][0]}px`,'important');n.style.setProperty('top',`${positions[i][1]}px`,'important');
      n.style.setProperty('right','auto','important');n.style.setProperty('bottom','auto','important');n.style.setProperty('transform','none','important');
    });
  }

  function ensureFlowCanvas(){
    const body=document.querySelector('.net-body');if(!body)return null;
    let c=body.querySelector('.tc-flow-canvas');if(!c){c=document.createElement('canvas');c.className='tc-flow-canvas';c.setAttribute('aria-hidden','true');body.appendChild(c);}return c;
  }

  let flowStarted=false;
  function startFlow(){
    if(flowStarted)return;const body=document.querySelector('.net-body'),canvas=ensureFlowCanvas();if(!body||!canvas)return;flowStarted=true;
    const ctx=canvas.getContext('2d');let phase=0,last=performance.now();
    function resize(){const r=body.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));canvas.style.width=`${r.width}px`;canvas.style.height=`${r.height}px`;ctx.setTransform(d,0,0,d,0,0);}
    function pointOnCurve(t,p0,p1,p2){const q=1-t;return{x:q*q*p0.x+2*q*t*p1.x+t*t*p2.x,y:q*q*p0.y+2*q*t*p1.y+t*t*p2.y};}
    function draw(now){
      const dt=Math.min(40,now-last);last=now;if(!reduceMotion)phase=(phase+dt*.00016)%1;
      const w=body.clientWidth,h=body.clientHeight;ctx.clearRect(0,0,w,h);
      const br=body.getBoundingClientRect();const nodes=Array.from(body.querySelectorAll(':scope > .net-node'));
      const cx=w/2,cy=h/2;
      nodes.forEach((node,i)=>{
        if(getComputedStyle(node).display==='none')return;
        const nr=node.getBoundingClientRect();const left=i%2===0;
        const row=Math.floor(i/2);
        const p0={x:left?nr.right-br.left:nr.left-br.left,y:nr.top-br.top+nr.height/2};
        const p2={x:cx+(left?-55:55),y:cy+(row-1)*34};
        const p1={x:left?(p0.x+cx)*.52:(p0.x+cx)*.48,y:cy+(row-1)*18};
        const color=left?'47,159,242':'244,157,52';
        ctx.save();ctx.strokeStyle=`rgba(${color},.48)`;ctx.lineWidth=1.45;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.quadraticCurveTo(p1.x,p1.y,p2.x,p2.y);ctx.stroke();ctx.restore();
        for(let k=0;k<3;k++){
          const t=reduceMotion?(.35+k*.18):((phase*(.85+i*.035)+k/3+i*.055)%1);
          const p=pointOnCurve(t,p0,p1,p2);const r=2.5+(k===0?1.2:0);
          ctx.save();ctx.fillStyle=`rgba(${color},${k===0?.98:.65})`;ctx.shadowColor=`rgb(${color})`;ctx.shadowBlur=k===0?12:6;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.restore();
        }
      });
      requestAnimationFrame(draw);
    }
    resize();window.addEventListener('resize',resize,{passive:true});requestAnimationFrame(draw);
  }

  let workflowTimer=null,manualTimer=null,workflowIndex=-1;
  function activateWorkflow(index,manual=false){
    const steps=Array.from(document.querySelectorAll('.workflow .wf-step'));if(!steps.length)return;
    steps.forEach((s,i)=>{s.classList.toggle('tc-auto-active',i===index);s.setAttribute('aria-current',i===index?'step':'false');});
    workflowIndex=index;
    if(manual){clearInterval(workflowTimer);clearTimeout(manualTimer);manualTimer=setTimeout(startWorkflow,2600);}
  }
  function startWorkflow(){
    const steps=Array.from(document.querySelectorAll('.workflow .wf-step'));if(!steps.length)return;
    clearInterval(workflowTimer);activateWorkflow((workflowIndex+1+steps.length)%steps.length,false);
    workflowTimer=setInterval(()=>activateWorkflow((workflowIndex+1)%steps.length,false),1450);
    steps.forEach((step,i)=>{
      if(step.dataset.tcAutoBound==='1')return;step.dataset.tcAutoBound='1';step.setAttribute('role','button');step.setAttribute('tabindex','0');
      step.addEventListener('click',()=>activateWorkflow(i,true));step.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateWorkflow(i,true);}});
    });
  }

  function init(){
    const body=document.querySelector('.net-body');if(!body)return;
    let img=body.querySelector('.tc-black-hole');
    if(!img){img=document.createElement('img');img.className='tc-black-hole';img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';img.loading='eager';body.insertBefore(img,body.firstChild);}
    img.src='./assets/global-search-blackhole.webp?v=20260909c';img.draggable=false;
    const oldCenter=body.querySelector('.net-center');if(oldCenter)oldCenter.style.display='none';
    enrichHeader();enrichNodes();layoutNodes();startFlow();startWorkflow();
    const scheduleLayout=()=>requestAnimationFrame(()=>requestAnimationFrame(layoutNodes));
    window.addEventListener('resize',scheduleLayout,{passive:true});
    if('ResizeObserver' in window){const ro=new ResizeObserver(scheduleLayout);ro.observe(body);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(init),{once:true});
  else requestAnimationFrame(init);
})();
