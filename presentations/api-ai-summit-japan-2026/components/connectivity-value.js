/** P4: keep heterogeneous stacks fixed; reveal the missing common scope, then cover it. */
export function mountConnectivityValue(slide, onChange = () => {}) {
  const states = ['個別の導入', '接続も設定も個別', '横断できない', '全体を面でカバー', 'Konnectで企業全体を運用'];
  const captions = [
    '一つの導入から始まる。',
    'ランタイムも接続先も違い、制御をそれぞれに作っていく。',
    '点ごとの対応を重ねても、全体最適と横断ガバナンスには届かない。',
    'Kongは異なるスタックを残したまま、接続全体を面として捉える。',
    '共通のConnectivity基盤を、Konnectで企業全体の管理・運用につなぐ。'
  ];
  const stacks = [...slide.querySelectorAll('.v-stack')];
  const paths = [...slide.querySelectorAll('.v-local-route')];
  const cover = [...slide.querySelectorAll('.v-cover-route')];
  const packet = slide.querySelector('.v-packet');
  const plane = slide.querySelector('.v-plane');
  const shared = slide.querySelector('.v-shared');
  const caption = slide.querySelector('.v-caption');
  let step = 0, busy = false, generation = 0, frame = null, settle = null;
  const snapshot = () => ({step, busy, count: states.length, title: states[step]});
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render() {
    slide.dataset.step = String(step);
    slide.dataset.busy = String(busy);
    slide.classList.toggle('v-routes-ready', step >= 1);
    caption.textContent = captions[step];
    stacks.forEach(stack => stack.classList.remove('is-hot'));
    paths.forEach(path => path.classList.remove('is-hot'));
    packet.style.opacity = '0';
    plane.style.clipPath = '';
    shared.style.clipPath = '';
    cover.forEach(path => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; });
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
  async function pause(ms, token) { return animate(ms, token, () => {}); }
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
    slide.dataset.step = String(step);
    slide.dataset.busy = 'true';
    caption.textContent = captions[step];
    onChange(snapshot());
    let ok = true;
    if (!reduced() && step === 1) {
      ok = await pause(900, token);
      if (ok) slide.classList.add('v-routes-ready');
      for (let i = 0; i < paths.length && ok; i++) {
        stacks[i].classList.add('is-hot');
        paths[i].classList.add('is-hot');
        ok = await move(paths[i], token, 660);
        if (ok) ok = await pause(210, token);
        stacks[i].classList.remove('is-hot');
        paths[i].classList.remove('is-hot');
      }
    } else if (!reduced() && step === 2) {
      // The separated strips show that a policy or metric cannot cross the gaps.
      ok = await pause(680, token);
    } else if (!reduced() && step === 3) {
      plane.style.clipPath = 'inset(0 100% 0 0)';
      shared.style.clipPath = 'inset(0 100% 0 0)';
      ok = await animate(1300, token, t => {
        const inset = `inset(0 ${100 * (1 - t)}% 0 0)`;
        plane.style.clipPath = inset;
        shared.style.clipPath = inset;
      });
      for (const path of cover) {
        if (!ok) break;
        const length = path.getTotalLength();
        path.style.strokeDasharray = String(length);
        ok = await animate(320, token, t => { path.style.strokeDashoffset = String(length * (1 - t)); });
      }
    } else if (!reduced() && step === 4) {
      ok = await pause(700, token);
    }
    if (token !== generation || !ok) return false;
    busy = false;
    render();
    return true;
  }
  render();
  return {
    next: () => play(),
    previous() { if (step === 0) return false; jump(step - 1); return true; },
    replay: () => play(true), jump, cancel,
    getState: snapshot, states
  };
}
