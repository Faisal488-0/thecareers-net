/* TheCareers — original Three.js black-hole core for GLOBAL SEARCH NETWORK.
   Interaction mirrors the amCharts globe: auto motion, pointer drag, wheel zoom,
   double-click reset. This implementation is original and does not copy code
   from MisterPrada/singularity. */

const netBody = document.querySelector('.net-body');
const legacyCanvas = document.getElementById('netCanvas');
const legacyCenter = document.querySelector('.net-center');

if (netBody && !document.getElementById('tcBlackHoleStage')) {
  const style = document.createElement('style');
  style.textContent = `
    .net-body{position:relative;isolation:isolate;}
    #netCanvas{position:absolute;inset:0;z-index:0;pointer-events:none!important;}
    .net-node{z-index:6!important;}
    .workflow{position:relative;z-index:7;}
    #tcBlackHoleStage{
      position:absolute;
      left:50%;
      top:48%;
      transform:translate(-50%,-50%);
      width:clamp(360px,34vw,560px);
      height:clamp(230px,23vw,350px);
      z-index:4;
      cursor:grab;
      touch-action:none;
      user-select:none;
      -webkit-user-select:none;
      overflow:visible;
      filter:drop-shadow(0 18px 24px rgba(15,23,42,.12));
    }
    #tcBlackHoleStage::before{
      content:"";
      position:absolute;
      inset:-9% -6%;
      z-index:-1;
      pointer-events:none;
      background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.99) 0 36%,rgba(255,255,255,.94) 48%,rgba(255,255,255,.66) 61%,rgba(255,255,255,0) 78%);
    }
    #tcBlackHoleCanvas{width:100%;height:100%;display:block;outline:none;}
    #tcBlackHoleStage.dragging{cursor:grabbing;}
    #tcBlackHoleStatus{
      position:absolute;left:50%;bottom:-2px;transform:translate(-50%,100%);
      font:600 9px/1.2 'JetBrains Mono',monospace;letter-spacing:.06em;
      color:#8a8f96;white-space:nowrap;pointer-events:none;opacity:.9;
    }
    @media(max-width:1100px){
      #tcBlackHoleStage{width:clamp(320px,40vw,470px);height:clamp(210px,29vw,315px);}
    }
    @media(max-width:760px){
      #tcBlackHoleStage{width:min(82vw,390px);height:min(56vw,270px);top:47%;}
      #tcBlackHoleStatus{display:none;}
    }
    @media(prefers-reduced-motion:reduce){
      #tcBlackHoleStage{filter:drop-shadow(0 10px 18px rgba(15,23,42,.09));}
    }
  `;
  document.head.appendChild(style);

  const stage = document.createElement('div');
  stage.id = 'tcBlackHoleStage';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Interactive three-dimensional black hole representing TheCareers global search core');
  stage.innerHTML = '<canvas id="tcBlackHoleCanvas" aria-hidden="true"></canvas><div id="tcBlackHoleStatus">DRAG TO ROTATE · SCROLL TO ZOOM · DOUBLE-CLICK TO RESET</div>';
  netBody.appendChild(stage);
  if (legacyCenter) legacyCenter.style.display = 'none';
  if (legacyCanvas) legacyCanvas.style.pointerEvents = 'none';

  const canvas = document.getElementById('tcBlackHoleCanvas');
  const status = document.getElementById('tcBlackHoleStatus');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  (async () => {
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');

      const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.25, 7.4);

      const root = new THREE.Group();
      scene.add(root);

      // A separate tilted group carries the accretion disc and particles.
      const diskGroup = new THREE.Group();
      diskGroup.rotation.x = 1.03;
      diskGroup.rotation.z = -0.06;
      root.add(diskGroup);

      const uniforms = {
        uTime:{value:0},
        uWarm:{value:new THREE.Color('#ff9f38')},
        uHot:{value:new THREE.Color('#fff1c9')},
        uBlue:{value:new THREE.Color('#5eafff')}
      };

      const diskMaterial = new THREE.ShaderMaterial({
        uniforms,
        transparent:true,
        depthWrite:false,
        depthTest:true,
        side:THREE.DoubleSide,
        blending:THREE.AdditiveBlending,
        vertexShader:`
          varying vec2 vUv;
          void main(){
            vUv=uv;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
          }
        `,
        fragmentShader:`
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uWarm;
          uniform vec3 uHot;
          uniform vec3 uBlue;

          float hash(vec2 p){
            p=fract(p*vec2(123.34,456.21));
            p+=dot(p,p+45.32);
            return fract(p.x*p.y);
          }

          void main(){
            vec2 p=vUv*2.0-1.0;
            float r=length(p);
            float a=atan(p.y,p.x);
            if(r<0.29||r>0.99) discard;

            float core=exp(-pow((r-0.53)/0.235,2.0));
            float inner=exp(-pow((r-0.36)/0.075,2.0));
            float outer=exp(-pow((r-0.75)/0.22,2.0));
            float swirl1=0.5+0.5*sin(a*17.0-r*55.0-uTime*2.65);
            float swirl2=0.5+0.5*sin(a*37.0-r*93.0+uTime*4.15);
            float grain=hash(floor((p+uTime*0.014)*160.0));
            float streak=smoothstep(0.28,1.0,swirl1*0.68+swirl2*0.42+grain*0.25);
            float blueMix=smoothstep(0.55,0.92,abs(sin(a*2.0+r*7.0+uTime*0.42)))*outer;
            vec3 warm=mix(uWarm,uHot,clamp(inner*0.9+streak*0.34,0.0,1.0));
            vec3 color=mix(warm,uBlue,blueMix*0.68);
            color+=uHot*inner*0.72;
            float alpha=(core*0.50+inner*0.85+outer*0.24)*(0.34+streak*0.92);
            alpha*=smoothstep(0.99,0.86,r)*smoothstep(0.29,0.34,r);
            gl_FragColor=vec4(color,clamp(alpha,0.0,1.0));
          }
        `
      });

      const disc = new THREE.Mesh(new THREE.CircleGeometry(3.35, 256), diskMaterial);
      diskGroup.add(disc);

      // Soft secondary blue halo below the hot disc.
      const haloMaterial = new THREE.ShaderMaterial({
        uniforms:{uTime:uniforms.uTime},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:`
          varying vec2 vUv;uniform float uTime;
          void main(){vec2 p=vUv*2.-1.;float r=length(p);if(r<.33||r>.98)discard;
          float band=exp(-pow((r-.69)/.20,2.));float waves=.5+.5*sin(32.*r-1.45*uTime+atan(p.y,p.x)*9.);
          gl_FragColor=vec4(.19,.55,1.,band*waves*.11);}
        `
      });
      const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(3.55, 192), haloMaterial);
      haloDisc.position.z = -0.035;
      diskGroup.add(haloDisc);

      // Black event horizon.
      const horizon = new THREE.Mesh(
        new THREE.SphereGeometry(1.08, 96, 64),
        new THREE.MeshBasicMaterial({color:0x000000})
      );
      horizon.scale.set(1.0, 1.0, 0.96);
      root.add(horizon);

      // Photon ring and lensing rings.
      const photon = new THREE.Mesh(
        new THREE.TorusGeometry(1.13, 0.035, 20, 256),
        new THREE.MeshBasicMaterial({color:0xffd99a,transparent:true,opacity:0.96,blending:THREE.AdditiveBlending})
      );
      root.add(photon);

      const lens1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.29,0.018,12,256),
        new THREE.MeshBasicMaterial({color:0x8fc5ff,transparent:true,opacity:0.34,blending:THREE.AdditiveBlending})
      );
      lens1.scale.y = 1.08;
      root.add(lens1);

      const lens2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.37,0.012,12,256),
        new THREE.MeshBasicMaterial({color:0xffbd67,transparent:true,opacity:0.25,blending:THREE.AdditiveBlending})
      );
      lens2.scale.y = 1.11;
      root.add(lens2);

      // Procedural glow sprite texture.
      function makeGlowTexture(inner, outer){
        const c=document.createElement('canvas');c.width=c.height=128;
        const x=c.getContext('2d');const g=x.createRadialGradient(64,64,3,64,64,64);
        g.addColorStop(0,inner);g.addColorStop(.16,inner);g.addColorStop(.52,outer);g.addColorStop(1,'rgba(0,0,0,0)');
        x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
      }
      const warmGlowTex=makeGlowTexture('rgba(255,236,190,1)','rgba(255,139,35,.08)');
      const blueGlowTex=makeGlowTexture('rgba(180,220,255,.75)','rgba(52,132,255,.02)');
      const warmGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:warmGlowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.58}));
      warmGlow.scale.set(5.2,2.4,1);warmGlow.position.z=-.2;root.add(warmGlow);
      const blueGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:blueGlowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.34}));
      blueGlow.scale.set(6.6,3.2,1);blueGlow.position.z=-.35;root.add(blueGlow);

      // Accretion particles with warm and blue population.
      const particleCount = reducedMotion ? 650 : 1500;
      const positions = new Float32Array(particleCount*3);
      const colors = new Float32Array(particleCount*3);
      const warmC=new THREE.Color('#ffab49'), blueC=new THREE.Color('#65b6ff'), whiteC=new THREE.Color('#fff3d0');
      for(let i=0;i<particleCount;i++){
        const radius=1.28+Math.pow(Math.random(),.62)*2.05;
        const angle=Math.random()*Math.PI*2;
        const thickness=(Math.random()-.5)*(.035+.12*(radius-1.28));
        positions[i*3]=Math.cos(angle)*radius;
        positions[i*3+1]=Math.sin(angle)*radius;
        positions[i*3+2]=thickness;
        const chooser=Math.random();const c=chooser>.82?blueC:(chooser>.70?whiteC:warmC);
        colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
      }
      const particleGeo=new THREE.BufferGeometry();
      particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
      particleGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({size:.027,vertexColors:true,transparent:true,opacity:.76,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
      diskGroup.add(particles);

      // Six luminous data streams feed the core from the source nodes.
      const streamSpecs=[
        {start:new THREE.Vector3(-4.25, 1.58,.12),color:0x56aaff},
        {start:new THREE.Vector3( 4.25, 1.58,.12),color:0x56aaff},
        {start:new THREE.Vector3(-4.35, 0.02,.10),color:0xffa23e},
        {start:new THREE.Vector3( 4.35, 0.02,.10),color:0xffa23e},
        {start:new THREE.Vector3(-4.15,-1.55,.08),color:0x56aaff},
        {start:new THREE.Vector3( 4.15,-1.55,.08),color:0x56aaff}
      ];
      const streamTravelers=[];
      streamSpecs.forEach((spec,index)=>{
        const side=Math.sign(spec.start.x);
        const curve=new THREE.CatmullRomCurve3([
          spec.start,
          new THREE.Vector3(side*3.05,spec.start.y*.72,.16),
          new THREE.Vector3(side*2.02,spec.start.y*.35,.20),
          new THREE.Vector3(side*1.23,spec.start.y*.12,.16)
        ]);
        const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.010,6,false),new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false}));
        root.add(tube);
        const traveler=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:.95,blending:THREE.AdditiveBlending}));
        root.add(traveler);
        streamTravelers.push({curve,obj:traveler,t:(index*.17)%1,speed:.10+index*.008});
      });

      let targetRotX=0, targetRotY=0, targetRotZ=0;
      let currentRotX=0, currentRotY=0, currentRotZ=0;
      let targetZoom=1, currentZoom=1;
      let dragging=false,lastX=0,lastY=0,autoResume=0;
      const clock=new THREE.Clock();

      function resetView(){
        targetRotX=0;targetRotY=0;targetRotZ=0;targetZoom=1;autoResume=performance.now()+700;
        if(status)status.textContent='VIEW RESET · AUTO MOTION RESUMING';
        setTimeout(()=>{if(status)status.textContent='DRAG TO ROTATE · SCROLL TO ZOOM · DOUBLE-CLICK TO RESET';},1100);
      }

      stage.addEventListener('pointerdown',e=>{
        dragging=true;lastX=e.clientX;lastY=e.clientY;stage.classList.add('dragging');autoResume=Infinity;
        stage.setPointerCapture?.(e.pointerId);
      });
      stage.addEventListener('pointermove',e=>{
        if(!dragging)return;
        const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
        targetRotY+=dx*.008;targetRotX+=dy*.006;
        targetRotX=Math.max(-.55,Math.min(.55,targetRotX));
      });
      const release=e=>{
        dragging=false;stage.classList.remove('dragging');autoResume=performance.now()+950;
        try{stage.releasePointerCapture?.(e.pointerId);}catch{}
      };
      stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
      stage.addEventListener('wheel',e=>{
        e.preventDefault();targetZoom*=e.deltaY>0?.92:1.08;targetZoom=Math.max(.78,Math.min(1.48,targetZoom));autoResume=performance.now()+900;
      },{passive:false});
      stage.addEventListener('dblclick',resetView);

      function resize(){
        const rect=stage.getBoundingClientRect();
        if(rect.width<2||rect.height<2)return;
        renderer.setSize(rect.width,rect.height,false);
        camera.aspect=rect.width/rect.height;
        camera.updateProjectionMatrix();
      }
      const ro=new ResizeObserver(resize);ro.observe(stage);resize();

      let visible=true;
      const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;},{threshold:.02});
      io.observe(stage);

      function animate(){
        requestAnimationFrame(animate);
        if(!visible)return;
        const dt=Math.min(.04,clock.getDelta());
        const elapsed=clock.elapsedTime;
        uniforms.uTime.value=elapsed;

        if(!dragging&&performance.now()>autoResume&&!reducedMotion){
          targetRotZ+=dt*.115;
          targetRotY=Math.sin(elapsed*.18)*.065;
          targetRotX=Math.sin(elapsed*.13)*.028;
        }
        currentRotX+=(targetRotX-currentRotX)*.075;
        currentRotY+=(targetRotY-currentRotY)*.075;
        currentRotZ+=(targetRotZ-currentRotZ)*.055;
        currentZoom+=(targetZoom-currentZoom)*.09;
        root.rotation.set(currentRotX,currentRotY,currentRotZ);
        root.scale.setScalar(currentZoom);

        diskGroup.rotation.z+=reducedMotion?.00035:.0019;
        particles.rotation.z+=reducedMotion?.00020:.00115;
        photon.material.opacity=.82+.14*Math.sin(elapsed*2.1);
        warmGlow.material.opacity=.47+.12*Math.sin(elapsed*1.22);
        blueGlow.material.opacity=.26+.09*Math.sin(elapsed*.87+1.2);

        streamTravelers.forEach((s,i)=>{
          s.t=(s.t+dt*s.speed)%1;
          const point=s.curve.getPoint(s.t);
          s.obj.position.copy(point);
          const pulse=1+.33*Math.sin(elapsed*5+i);
          s.obj.scale.setScalar(pulse);
        });

        renderer.render(scene,camera);
      }
      animate();
      stage.dataset.ready='1';
      if(status)status.textContent='3D CORE LIVE · DRAG · ZOOM · DOUBLE-CLICK RESET';
      setTimeout(()=>{if(status)status.textContent='DRAG TO ROTATE · SCROLL TO ZOOM · DOUBLE-CLICK TO RESET';},1800);
      window.TheCareersBlackHole={renderer,scene,camera,root,resetView};
    } catch(err) {
      console.error('[TheCareers] Three.js black hole failed; keeping legacy canvas fallback.',err);
      stage.remove();
      if(legacyCenter)legacyCenter.style.display='';
      if(legacyCanvas)legacyCanvas.style.pointerEvents='auto';
    }
  })();
}
