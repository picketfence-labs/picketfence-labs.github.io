/** P4: local point integrations become shared connection capabilities. */
export function mountConnectivityValue(slide, onChange = () => {}) {
  const states = ['一つのプロジェクト', '点ごとの接続', '個別最適の限界', '接続先を抽象化', '横断的なガバナンス', '既存構成を活かして展開'];
  const captions = [
    '一つのプロジェクトが、自分の接続先を選んで始まる。',
    'プロジェクトごとにLLMとMCPへの接続を作っていく。',
    '接続と制御が点在すると、横断的な可視化と全体最適が難しい。',
    'Agentを活かしたまま、LLMとMCPへの接続先を共通の層で整理する。APIへはMCPから接続する。',
    '共通の接続を軸に、アクセス制御・観測・コスト管理を横断して適用する。',
    '既存の接続先を再利用し、新しいAgentも柔軟に加えられる。'
  ];
  const localPaths = [...slide.querySelectorAll('.v2-local-routes path')];
  const networkPaths = [...slide.querySelectorAll('.v2-network-routes path:not(.v2-new-route)')];
  const newPath = slide.querySelector('.v2-new-route');
  const plane = slide.querySelector('.v2-plane');
  const packet = slide.querySelector('.v2-packet');
  const caption = slide.querySelector('.v-caption');
  let step = 0, busy = false, generation = 0, frame = null, settle = null;
  const snapshot = () => ({step, busy, count: states.length, title: states[step]});
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(ready = true) {
    slide.dataset.step = String(step);
    slide.dataset.busy = String(busy);
    slide.classList.toggle('is-expanded', step >= 1);
    slide.classList.toggle('is-network', step >= 3);
    slide.classList.toggle('v2-network-ready', step >= 3 && ready);
    slide.classList.toggle('is-governed', step >= 4);
    slide.classList.toggle('is-flex', step >= 5);
    caption.textContent = captions[step];
    plane.style.clipPath = step >= 3 && ready ? 'inset(0 0 0 0)' : '';
    for (const path of [...networkPaths, newPath]) {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    }
    packet.style.opacity = '0';
    onChange(snapshot());
  }
  function animate(duration, token, paint) {
    return new Promise(resolve => {
      let start;
      settle = resolve;
      function tick(now) {
        if (token !== generation) { frame = null; settle = null; resolve(false); return; }
        start ??= now;
        const t = Math.min(1, (now - start) / duration);
        paint(t);
        if (t < 1) frame = requestAnimationFrame(tick);
        else { frame = null; settle = null; resolve(true); }
      }
      frame = requestAnimationFrame(tick);
    });
  }
  const pause = (ms, token) => animate(ms, token, () => {});
  async function move(path, token, duration) {
    const length = path.getTotalLength();
    packet.style.opacity = '1';
    const ok = await animate(duration, token, t => {
      const point = path.getPointAtLength(length * t);
      packet.setAttribute('cx', point.x);
      packet.setAttribute('cy', point.y);
    });
    packet.style.opacity = '0';
    return ok;
  }
  function cancel() {
    generation++;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (settle) { settle(false); settle = null; }
    busy = false;
    render();
  }
  function jump(target) {
    cancel();
    step = Math.max(0, Math.min(states.length - 1, target));
    render();
  }
  async function play(replay = false) {
    if (busy || (!replay && step === states.length - 1) || (replay && step === 0)) return false;
    if (replay) { step--; render(); void slide.offsetWidth; }
    step++;
    const token = ++generation;
    busy = true;
    render(step !== 3);
    let ok = true;
    if (!reduced() && step === 1) {
      ok = await pause(550, token);
      for (const path of localPaths.slice(2)) {
        if (!ok) break;
        ok = await move(path, token, 430);
      }
    } else if (!reduced() && step === 2) {
      ok = await pause(850, token);
    } else if (step === 3) {
      if (!reduced()) ok = await pause(1120, token);
      if (ok) {
        slide.classList.add('v2-network-ready');
        if (!reduced()) {
          plane.style.clipPath = 'inset(0 100% 0 0)';
          ok = await animate(850, token, t => {
            plane.style.clipPath = `inset(0 ${100 * (1 - t)}% 0 0)`;
          });
          const lengths = networkPaths.map(path => path.getTotalLength());
          networkPaths.forEach((path, i) => { path.style.strokeDasharray = String(lengths[i]); });
          if (ok) ok = await animate(1050, token, t => {
            networkPaths.forEach((path, i) => { path.style.strokeDashoffset = String(lengths[i] * (1 - t)); });
          });
        }
      }
    } else if (!reduced() && step === 4) {
      ok = await pause(650, token);
    } else if (!reduced() && step === 5) {
      ok = await pause(550, token);
      if (ok) ok = await move(newPath, token, 850);
    }
    if (token !== generation || !ok) return false;
    busy = false;
    render();
    return true;
  }
  slide.classList.add('v2-initializing');
  render();
  requestAnimationFrame(() => slide.classList.remove('v2-initializing'));
  return {
    next: () => play(),
    previous() { if (step === 0) return false; jump(step - 1); return true; },
    replay: () => play(true), jump, cancel,
    getState: snapshot, states
  };
}
