/** A finite, manually advanced sequence. Navigation remains owned by the deck. */
export function mountSequence(slide, specification, onChange = () => {}) {
  let step = 0, busy = false, generation = 0;
  const packet = slide.querySelector('.sequence-packet');
  let frame = null, settle = null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot = () => ({step, busy, count: specification.states.length, title: specification.states[step]});
  function cancelAnimations() {
    generation++;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; settle?.(); settle = null;
    packet?.setAttribute('opacity','0');
  }
  // Keep moving packets in SVG coordinates; cancellation clears a single frame
  // and resolves the in-flight segment before another sequence can start.
  function move(path, token) {
    return new Promise(resolve => {
      settle = resolve;
      let start;
      const tick = now => {
        if (token !== generation) { settle = null; resolve(); return; }
        start ??= now;
        const progress = Math.min(1,(now-start)/850);
        const position = progress*(path.length-1);
        const index = Math.min(path.length-2,Math.floor(position));
        const fraction = position-index;
        const [a,b] = [path[index],path[index+1]];
        packet.setAttribute('cx',String(a[0]+(b[0]-a[0])*fraction));
        packet.setAttribute('cy',String(a[1]+(b[1]-a[1])*fraction));
        packet.setAttribute('opacity','1');
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { frame = null; settle = null; packet.setAttribute('opacity','0'); resolve(); }
      };
      frame = requestAnimationFrame(tick);
    });
  }
  function render() {
    slide.querySelectorAll('[data-reveal]').forEach(el => el.classList.toggle('dim', step < +el.dataset.reveal));
    slide.querySelectorAll('[data-part]').forEach(el => el.classList.toggle('highlight', (specification.highlights?.[step] || []).includes(el.dataset.part)));
    slide.querySelectorAll('.step-list span').forEach((el, i) => el.classList.toggle('current', i === step));
    slide.querySelector('.scene-caption').textContent = specification.captions[step];
    slide.dataset.step = step;
    slide.dataset.busy = String(busy);
    onChange(snapshot());
  }
  function jump(target) { cancelAnimations(); busy = false; step = Math.max(0, Math.min(specification.states.length - 1, target)); render(); }
  async function play(replay = false) {
    if (busy || (!replay && step === specification.states.length - 1) || (replay && step === 0)) return false;
    if (!replay) step++;
    const token = ++generation;
    busy = true; render();
    const paths = specification.paths?.[step] || [];
    if (!reduced() && packet) {
      for (const path of paths) {
        if (token !== generation) return false;
        await move(path,token);
      }
    }
    if (token !== generation) return false;
    busy = false; render(); return true;
  }
  render();
  return {next:()=>play(),previous(){if(step===0)return false;jump(step-1);return true;},replay:()=>play(true),jump,cancel:()=>jump(step),getState:snapshot,states:specification.states};
}

export const sequences = {
  connectivityValue: {
    states:['点ごとの対応','全経路を面で捉える','Kong + Konnect'],
    captions:['接続ごとの個別対応は、増えるほど部分最適になる。','KongはAgent・LLM・MCP・APIをまたぐConnectivityを支える。','KongのConnectivity基盤を、Konnectで企業全体の運用へつなぐ。'],
    highlights:[['points'],['plane'],['plane','konnect']],
    paths:{
      1:[[[765,179],[1180,179]],[[765,256],[1180,256]],[[765,333],[970,333],[1100,333],[1210,333]]],
      2:[[[990,68],[990,90],[990,125]]]
    }
  },
  architecture: {
    states:['Konnectが構成を管理','Operatorが2種類のPodを管理','AgentのMCP要求','MCP ServerからAPIを呼ぶ','加工した結果を返す'],
    captions:['Konnectが構成を管理し、Data Planeへ設定を直接同期する。','Kong OperatorがGatewayとMCP Serverを別々のPodとして管理する。','AgentのMCP要求はData PlaneからCode Mode MCPへ届く。','Code ModeのAPI呼出しもData Planeを経由する。','加工済みの結果だけが、同じ経路でAgentへ戻る。'],
    highlights:[['control'],['operator','gateway','server'],['agent','gateway','server'],['server','gateway','apis'],['server','gateway','agent']],
    paths:{
      1:[[[505,93],[505,174]],[[482,247],[482,306]],[[615,210],[773,210],[773,284],[810,284]],[[740,93],[740,282],[625,282],[625,306]]],
      2:[[[225,364],[370,364],[505,364],[640,346],[810,346]]],
      3:[[[810,346],[640,346],[640,390],[640,430],[1185,430],[1185,364],[1210,364]],[[1210,364],[1185,364],[1185,430],[640,430],[640,390],[640,346],[810,346]]],
      4:[[[810,346],[640,346],[505,364],[370,364],[225,364]]]
    }
  }
};
