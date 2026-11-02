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
        const progress = Math.min(1,(now-start)/(specification.packetDuration || 850));
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
  architecture: {
    states:['定義・配置・実行の全体像','Sourceを束ねる','Podを配置する','Podの中身を見る','AgentのMCP要求','API呼出しと結果返却'],
    captions:['管理はKonnect、配置はOperator、実行はGatewayとCode Mode MCPが担う。','OpenAPIと既存MCPをSourceとして束ね、MCP ServerをControl Planeに紐付ける。','Operatorが別Podを配置。Konnectの設定はWSSでData Planeへ直接届く。','Initが生成済みサーバーコードを取得。常駐Runnerが要求ごとの処理コードをSandboxで実行する。','AgentのMCP要求はGateway Data Planeを経由してCode Mode MCPへ届く。','Code Mode MCPがGateway経由でAPIを呼び、加工した結果だけを同じ経路で返す。'],
    packetDuration:500,
    paths:{
      1:[[[368,175],[490,175]],[[368,295],[490,295]],[[1058,235],[1150,235]]],
      2:[[[370,229],[370,58],[555,58]],[[724,108],[724,218]],[[378,286],[621,286],[621,249],[658,249]],[[378,315],[620,315],[620,365],[658,365]]],
      3:[[[460,235],[545,235]],[[830,235],[905,235]]],
      4:[[[272,235],[386,235]],[[666,235],[746,235]]],
      5:[[[746,318],[666,318]],[[526,344],[526,388],[1280,388],[1280,310]],[[1280,310],[1280,388],[526,388],[526,344]],[[666,235],[746,235]],[[746,235],[666,235]],[[386,235],[272,235]]]
    }
  }
};
