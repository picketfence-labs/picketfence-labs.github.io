/** Page 12: one agent connection, two Context Mesh functions, and visible data reduction. */
export function mountContextCode(slide, onChange = () => {}) {
  const states = ['Context Meshの全体像','Search ToolがToolを返す','Code Mode MCPへコードを渡す','複数APIからデータを取得','Code Mode MCPで集約・加工','加工結果だけを返す'];
  const captions = [
    'AgentはContext Meshの1つの入口から、必要なToolと処理結果を受け取る。',
    'Search Toolは、必要かつアクセス可能なToolを返す。',
    'LLMが申込・契約・商品を集計するコードをCode Mode MCPへ渡す。',
    'Code Mode MCPが各APIを呼び、取得データを自分の側に集める。',
    '商品IDで集計し、成立率を計算して上位5商品に絞る。',
    'Agent / LLMへは、必要な加工を適用した結果だけを1本の接続で返す。'
  ];
  const svg=slide.querySelector('.code-diagram');
  const motion=svg.querySelector('.code-motion');
  const motionLabel=motion.querySelector('text');
  const activeRoute=svg.querySelector('.code-active-route');
  const returnRoute=svg.querySelector('.code-return-route');
  const chips=[...svg.querySelectorAll('.code-tool-chips rect,.code-tool-chips text')];
  const raw=[...svg.querySelectorAll('.code-raw rect,.code-raw text')];
  const $=s=>svg.querySelector(s);
  let step=0,busy=false,generation=0,frame=null,resolveFrame=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot=()=>({step,busy,count:states.length,title:states[step]});
  function stop(){generation++;if(frame!==null)cancelAnimationFrame(frame);frame=null;resolveFrame?.(false);resolveFrame=null;motion.style.opacity='0';}
  function render(){
    slide.dataset.step=String(step);slide.dataset.busy=String(busy);
    slide.querySelectorAll('.step-list span').forEach((e,i)=>e.classList.toggle('current',i===step-1));
    slide.querySelector('.scene-caption').textContent=captions[step];
    svg.querySelectorAll('[data-part]').forEach(e=>e.classList.toggle('active',step===1&&e.dataset.part==='search'||step>=2&&step<=5&&e.dataset.part==='runtime'));
    svg.querySelectorAll('.code-api').forEach(e=>e.classList.toggle('active',step>=3));
    $('.code-tool-chips').style.opacity=step>=1?'1':'0';chips.forEach(e=>e.style.opacity='1');
    $('.code-snippet').style.opacity=step===2?'1':'0';
    $('.code-raw').style.opacity=step>=3&&step<5?'1':'0';raw.forEach(e=>{e.style.opacity='1';e.removeAttribute('transform');});
    $('.code-processed').style.opacity=step>=4?'1':'0';
    $('.code-agent-answer').style.opacity=step===5?'1':'0';
    activeRoute.style.opacity='0';returnRoute.style.opacity='0';activeRoute.classList.remove('is-flowing');returnRoute.classList.remove('is-flowing');
    onChange(snapshot());
  }
  function animate(ms, token, draw){
    if(reduced()){draw?.(1);return Promise.resolve(true);}
    return new Promise(resolve=>{
      let start;
      resolveFrame=resolve;
      const tick=now=>{
        if(token!==generation){resolveFrame=null;resolve(false);return;}
        start??=now;const t=Math.min(1,(now-start)/ms);draw?.(t);
        if(t<1)frame=requestAnimationFrame(tick);
        else{frame=null;resolveFrame=null;resolve(true);}
      };
      frame=requestAnimationFrame(tick);
    });
  }
  async function move(points,label,ms,token){
    motionLabel.textContent=label;motion.dataset.kind=label;motion.style.opacity='1';
    const ok=await animate(ms,token,t=>{
      const pos=t*(points.length-1),i=Math.min(points.length-2,Math.floor(pos)),u=pos-i;
      const x=points[i][0]+(points[i+1][0]-points[i][0])*u;
      const y=points[i][1]+(points[i+1][1]-points[i][1])*u;
      motion.setAttribute('transform',`translate(${x} ${y})`);
    });
    motion.style.opacity='0';return ok;
  }
  async function flow(s,token){
    if(s===1){
      $('.code-tool-chips').style.opacity='1';chips.forEach(e=>e.style.opacity='0');
      if(!await move([[300,230],[378,230],[406,230],[406,150],[430,150]],'FIND',780,token))return;
      for(let i=0;i<3;i++){chips.slice(i*2,i*2+2).forEach(e=>e.style.opacity='1');if(!await animate(380,token))return;}
      await move([[430,150],[406,150],[406,230],[378,230],[300,230]],'TOOL',820,token);
    }
    if(s===2){$('.code-snippet').style.opacity='0';if(!await move([[300,230],[378,230],[406,230],[406,290],[430,290]],'CODE',950,token))return;await animate(560,token,t=>$('.code-snippet').style.opacity=String(t));}
    if(s===3){
      $('.code-raw').style.opacity='1';raw.forEach(e=>e.style.opacity='0');
      svg.querySelectorAll('.code-api').forEach(e=>e.classList.remove('active'));
      const ys=[96,201,309];
      for(let i=0;i<3;i++){
        svg.querySelectorAll('.code-api').forEach(e=>e.classList.toggle('active',+e.dataset.api===i));
        activeRoute.setAttribute('d',`M955 296H1050V${ys[i]}H1127`);activeRoute.style.opacity='1';activeRoute.classList.add('is-flowing');
        if(!await move([[955,296],[1050,296],[1050,ys[i]],[1127,ys[i]]],'CALL',720,token))return;
        if(!await move([[1127,ys[i]],[1050,ys[i]],[1050,296],[955,296]],'DATA',900,token))return;
        raw.slice(i*2,i*2+2).forEach(e=>e.style.opacity='1');
        if(!await animate(260,token))return;
      }
      activeRoute.style.opacity='0';activeRoute.classList.remove('is-flowing');
    }
    if(s===4){
      $('.code-raw').style.opacity='1';$('.code-processed').style.opacity='0';
      await animate(1250,token,t=>{
        raw.forEach((e,n)=>e.setAttribute('transform',`translate(${[175,55,-65][Math.floor(n/2)]*t} ${34*t})`));
        $('.code-raw').style.opacity=String(1-t);$('.code-processed').style.opacity=String(t);
      });
    }
    if(s===5){
      $('.code-agent-answer').style.opacity='0';
      returnRoute.style.opacity='1';returnRoute.classList.add('is-flowing');
      if(!await move([[430,340],[406,340],[406,230],[378,230],[300,230]],'TOP 5',1100,token))return;
      returnRoute.style.opacity='0';returnRoute.classList.remove('is-flowing');
      await animate(420,token,t=>$('.code-agent-answer').style.opacity=String(t));
    }
  }
  function jump(target){stop();busy=false;step=Math.max(0,Math.min(states.length-1,target));render();}
  async function play(replay=false){
    if(busy||!replay&&step===states.length-1||replay&&step===0)return false;
    if(!replay)step++;const token=++generation;busy=true;render();
    if(!reduced())await flow(step,token);
    if(token!==generation)return false;
    busy=false;render();return true;
  }
  render();
  return {next:()=>play(),previous(){if(step===0)return false;jump(step-1);return true;},replay:()=>play(true),jump,cancel:()=>jump(step),getState:snapshot,states};
}
