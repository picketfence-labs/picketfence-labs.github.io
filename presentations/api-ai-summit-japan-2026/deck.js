import {mountP1} from './components/p1.js';
import {mountSequence, sequences} from './components/sequence.js';
import {mountConnectivity} from './components/connectivity.js';
import {mountGateway} from './components/gateway.js';
import {mountContextCode} from './components/context-code.js';

const $ = s => document.querySelector(s);
const slides = [...document.querySelectorAll('.slide')];
const components = new Map();
const menu = $('#menu'), help = $('#help'), select = $('#step-select');
const storageKey = 'api-ai-summit-2026-draft01';
let page = 0, paused = false, flip = null, lastFocus = null;
let saved = {};
try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch {}
function resize() { const v = $('#viewport'); document.documentElement.style.setProperty('--scale', Math.min(v.clientWidth/1600,v.clientHeight/900)); }
window.addEventListener('resize',resize); resize();

for (const [i, slide] of slides.entries()) {
  slide.setAttribute('aria-label',`${i+1}. ${slide.dataset.title}`);
  slide.inert = true;
  if (i > 0) {
    const img = new Image(); img.src = './images/event-logo.png'; img.alt = "API + AI Summit '26"; img.className='footer-logo'; slide.append(img);
    const n = document.createElement('span'); n.className='page-number';n.textContent=String(i+1).padStart(2,'0');slide.append(n);
  }
  if (slide.classList.contains('divider')) {
    for (const side of ['left','right']) { const img=new Image();img.src='./images/divider-pattern.png';img.alt='';img.className='pattern '+side;slide.prepend(img); }
  }
  if (slide.dataset.component === 'p1') components.set(i,mountP1($('#p1-host'),()=>queueMicrotask(update)));
  else if (slide.dataset.component === 'connectivity') components.set(i,mountConnectivity(slide,()=>queueMicrotask(update)));
  else if (slide.dataset.component === 'gateway') components.set(i,mountGateway(slide,()=>queueMicrotask(update)));
  else if (slide.dataset.component === 'code') components.set(i,mountContextCode(slide,()=>queueMicrotask(update)));
  else if (sequences[slide.dataset.component]) {
    const svg = slide.querySelector('svg');
    if(slide.dataset.component!=='ecosystem'){
      const packet=document.createElementNS('http://www.w3.org/2000/svg','circle');packet.classList.add('payload','sequence-packet');packet.setAttribute('r','8');packet.setAttribute('opacity','0');svg.append(packet);
    }
    components.set(i,mountSequence(slide,sequences[slide.dataset.component],()=>queueMicrotask(update)));
  }
  const button=document.createElement('button');button.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>`;button.append(document.createTextNode(slide.dataset.title));button.dataset.page=i;
  button.onclick=()=>{closeDialog(menu);go(i);};$('#slide-menu').append(button);
}
function current() { return components.get(page); }
function state() { return current()?.getState() || {step:0,busy:false,count:1,title:slides[page].dataset.title}; }
function persist() {
  const s=state();saved.page=slides[page].id;saved.steps ||= {};saved.steps[slides[page].id]=s.step;
  try {sessionStorage.setItem(storageKey,JSON.stringify(saved));} catch {}
  history.replaceState(null,'',`#${slides[page].id}/${s.step}`);
}
function update() {
  const s=state();$('#position').textContent=`${String(page+1).padStart(2,'0')} / ${slides.length}`;
  select.hidden=s.count===1;$('#replay').hidden=s.count===1;
  if(s.count>1){if(select.dataset.page!==String(page)){select.replaceChildren(...current().states.map((title,i)=>new Option(`${i+1} / ${s.count}　${title}`,i)));select.dataset.page=String(page);}select.value=String(s.step);}
  $('#previous').disabled=page===0&&s.step===0;$('#next').disabled=s.busy||page===slides.length-1&&s.step===s.count-1;
  $('#next').textContent=s.step<s.count-1?'次の状態 ↓':'次ページ ↓';$('#replay').disabled=s.busy||s.step===0;
  $('#status').textContent=s.busy?'動作中 · 戻る／一覧で中断可':s.count>1?`${s.step+1}/${s.count} · ${s.title}`:slides[page].dataset.title;
  $('#progress').style.width=`${(page+1)/slides.length*100}%`;
  document.querySelectorAll('#slide-menu button').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.page===page)));
  $('#stage').dataset.page=slides[page].id;$('#stage').dataset.step=s.step;$('#stage').dataset.busy=String(s.busy);
  persist();
}
function go(target, step, animate=true) {
  target=Math.max(0,Math.min(slides.length-1,target));
  current()?.cancel();persist();
  const previous=page;flip?.cancel();page=target;
  slides.forEach((slide,i)=>{slide.classList.toggle('active',i===page);slide.inert=i!==page;slide.setAttribute('aria-hidden',String(i!==page));});
  if(step!==undefined)current()?.jump(step);
  else if(saved.steps?.[slides[page].id]!==undefined)current()?.jump(saved.steps[slides[page].id]);
  if(animate&&previous!==page&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const sign=page>previous?1:-1;
    flip=slides[page].animate([{transform:`translateY(${sign*130}px) rotateX(${-sign*8}deg)`,opacity:.15},{transform:'translateY(0) rotateX(0)',opacity:1}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  update();$('#live').textContent=`${page+1}ページ。${slides[page].dataset.title}`;
}
function next(){if(paused||state().busy||flip?.playState==='running')return;const s=state();if(s.step<s.count-1)current().next();else go(page+1);}
function previous(){if(paused)return;if(state().step>0)current().previous();else go(page-1);}
function pause(){current()?.cancel();paused=true;$('#pause-screen').hidden=false;$('#resume').focus();persist();}
function resume(){paused=false;$('#pause-screen').hidden=true;$('#next').focus();}
function openDialog(dialog){current()?.cancel();lastFocus=document.activeElement;dialog.showModal();}
function closeDialog(dialog){dialog.close();lastFocus?.focus();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#status').textContent='全画面はブラウザのメニューから選択してください';}}
$('#next').onclick=next;$('#previous').onclick=previous;$('#replay').onclick=()=>current()?.replay();$('#menu-button').onclick=()=>openDialog(menu);$('#help-button').onclick=()=>openDialog(help);$('#pause-button').onclick=pause;$('#resume').onclick=resume;$('#fullscreen').onclick=fullscreen;
select.onchange=()=>current()?.jump(+select.value);
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(paused){if(['b','B','Escape'].includes(e.key)){e.preventDefault();resume();}return;}
  if(menu.open||help.open||e.target.closest('select,input,textarea')||([' ','Enter'].includes(e.key)&&e.target.closest('button,a')))return;
  if(e.repeat)return;
  if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();next();}
  else if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();previous();}
  else if(e.key.toLowerCase()==='r'){e.preventDefault();current()?.replay();}
  else if(e.key.toLowerCase()==='m')openDialog(menu);
  else if(e.key.toLowerCase()==='b')pause();
  else if(e.key.toLowerCase()==='f')fullscreen();
  else if(e.key==='?')openDialog(help);
});
let wheelLast=0,wheelTotal=0,wheelUsed=false;
$('#viewport').addEventListener('wheel',e=>{e.preventDefault();if(menu.open||help.open||paused)return;const now=performance.now();if(now-wheelLast>240){wheelTotal=0;wheelUsed=false;}wheelLast=now;wheelTotal+=e.deltaY*(e.deltaMode===1?16:1);if(!wheelUsed&&Math.abs(wheelTotal)>=65){wheelUsed=true;wheelTotal>0?next():previous();}},{passive:false});
let touch=null;$('#viewport').addEventListener('touchstart',e=>{if(e.touches.length===1)touch=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});
$('#viewport').addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dy=touch[1]-t.clientY,dx=touch[0]-t.clientX;touch=null;if(Math.abs(dy)>60&&Math.abs(dy)>Math.abs(dx))dy>0?next():previous();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)current()?.cancel();});
window.addEventListener('blur',()=>current()?.cancel());
window.addEventListener('hashchange',()=>{const [id,s]=location.hash.slice(1).split('/');const n=slides.findIndex(x=>x.id===id);if(n>=0)go(n,Number.isFinite(+s)?+s:0);});
const [hashId,hashStep]=location.hash.slice(1).split('/');
const initialId=hashId||saved.page||slides[0].id;const initial=slides.findIndex(x=>x.id===initialId);
const initialSteps={...saved.steps};
go(initial<0?0:initial,hashId?Number(hashStep)||0:initialSteps[initialId]||0,false);
// Read-only inspection for validation; controls use the same public UI handlers.
window.summit={getState:()=>({page:slides[page].id,...state(),paused}),version:'draft-02'};
