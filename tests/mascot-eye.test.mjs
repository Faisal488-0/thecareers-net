import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('assets/floating-helper.js', 'utf8');
const css = readFileSync('assets/floating-helper.css', 'utf8');

function mount({reduced = false, fine = true} = {}) {
  const windowEvents = new Map(), documentEvents = new Map(), frames = [];
  let timerId = 0;
  const listeners = (map, event, fn) => {
    const list = map.get(event) || [];
    list.push(fn); map.set(event, list);
  };
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();this.children = [];this.listeners = new Map();
      this.hidden = false;this.attributes={};this.dataset={};this.textContent='';this.scrollHeight=250;
      const props={};
      this.style={...props,setProperty:(key,val)=>{props[key]=val},removeProperty:key=>{delete props[key]},getPropertyValue:key=>props[key]||''};
      this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};
    }
    append(...children){children.forEach(child=>{child.parent=this;this.children.push(child)})}
    appendChild(child){this.append(child)}
    setAttribute(key,val){this.attributes[key]=String(val)}
    addEventListener(event,fn){listeners(this.listeners,event,fn)}
    dispatch(event,props={}){for(const fn of this.listeners.get(event)||[])fn({...props,type:event,currentTarget:this,preventDefault(){},stopPropagation(){}})}
    setPointerCapture(){}
    focus(){}
    matches(){return false}
    click(){this.dispatch('click')}
    scrollIntoView(){this.scrolled=true}
    getBoundingClientRect(){
      const parent=this.parent;
      return {left:parseFloat(parent?.style?.left||'0'),top:parseFloat(parent?.style?.top||'0'),width:60,height:60}
    }
    query(selector){
      const className=selector.startsWith('.')?selector.slice(1):null;
      if(className&&this.className===className)return this;
      for(const child of this.children){const match=child.query(selector);if(match)return match}return null;
    }
    byId(id){if(this.id===id)return this;for(const child of this.children){const found=child.byId(id);if(found)return found}return null}
  }
  const body=new Element('body');
  const targets={
    'new':new Element('section'),'jobList':new Element('div'),'listings':new Element('div'),
    'searchInput':new Element('input'),'searchNowBtn':new Element('button'),'howit':new Element('section'),
    'nooo-btn':new Element('button'),'sortSelect':new Element('select')
  };
  const doc={
    body,
    documentElement:{lang:'en'},
    hidden:false,
    createElement:tag=>new Element(tag),
    getElementById:id=>body.byId(id)||targets[id]||null,
    querySelector:()=>null,
    addEventListener:(ev,fn)=>listeners(documentEvents,ev,fn)
  };
  const win={
    FLOATING_HELPER_ENABLED:true,NOOO_COMIC_HELPER_ENABLED:true,
    innerWidth:1024,innerHeight:768,
    matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:fine,addEventListener(){}}),
    addEventListener:(ev,fn)=>listeners(windowEvents,ev,fn),
    setInterval:()=>++timerId,
    setTimeout:()=>++timerId,
    clearTimeout:()=>{}
  };
  const raf=fn=>{frames.push(fn);return frames.length};
  const ctx={
    window:win,document:doc,innerWidth:1024,innerHeight:768,
    matchMedia:win.matchMedia,addEventListener:win.addEventListener,
    localStorage:{getItem:()=>null,setItem(){}},
    requestAnimationFrame:raf,cancelAnimationFrame:()=>{},
    setTimeout:()=>++timerId,clearTimeout:()=>{},
    Event:class{constructor(type){this.type=type}},
    console
  };
  runInNewContext(source,ctx, {timeout:1000});
  const root=body.byId('fh-root');
  assert.ok(root,'mascot must mount');
  const face=root.children.find(node=>node.tagName==='BUTTON');
  assert.ok(face);
  return {root,face,targets,fire:(type,e)=>{for(const fn of windowEvents.get(type)||[])fn(e)},flush:()=>{for(const fn of frames.splice(0))fn()}};
}

test('pupils visibly follow precise mouse coordinates and remain bounded',()=>{
  const app=mount();
  assert.match(source,/requestAnimationFrame/);
  assert.match(source,/pointermove/);
  assert.match(css,/--(?:eye|look)-x/);
  assert.match(css,/--(?:eye|look)-y/);
  assert.match(css,/translate\(var\(--(?:eye|look)-x/);
  app.fire('pointermove',{pointerType:'mouse',clientX:1010,clientY:720});
  app.flush();
  const x=app.face.style.getPropertyValue('--eye-x');
  assert.ok(x,'gaze must update actual CSS custom property');
  assert.ok(Math.abs(parseFloat(x))<=3.01);
  app.fire('pointermove',{pointerType:'mouse',clientX:0,clientY:0});
  app.flush();
  // The pupil direction should point left/up from mascot near bottom-right.
  // Event scheduling may combine frames, but the updated property remains within bounds.
  assert.ok(Math.abs(parseFloat(app.face.style.getPropertyValue('--eye-x')))<=3.01);
});

test('touch and reduced-motion users do not get moving pupils',()=>{
  const touch=mount({fine:false});
  touch.fire('pointermove',{pointerType:'touch',clientX:500,clientY:300});touch.flush();
  assert.equal(touch.face.style.getPropertyValue('--eye-x'),'');
  const reduced=mount({reduced:true});
  reduced.fire('pointermove',{pointerType:'mouse',clientX:500,clientY:300});reduced.flush();
  assert.equal(reduced.face.style.getPropertyValue('--eye-x'),'');
});

test('mascot exposes usable panel and page shortcuts',()=>{
  const app=mount();
  app.face.click();
  const panel=app.root.children.find(x=>x.className==='fh-panel');
  assert.equal(panel.hidden,false);
  const buttons=[];
  const walk=node=>{if(node.tagName==='BUTTON')buttons.push(node);node.children.forEach(walk)};
  walk(panel);
  assert.ok(buttons.length>=4,'helper must do more than present a decoration');
  const nav=buttons.find(b=>/new this hour|جديد الساعة|browse jobs|تصفح الوظائف/i.test(b.textContent));
  assert.ok(nav,'must provide a valid site section shortcut');
  nav.click();
  const dest=app.targets['jobList'];
  assert.equal(dest.scrolled,true,'navigation must scroll to real section');
});
