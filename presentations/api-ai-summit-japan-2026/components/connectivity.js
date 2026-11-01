/** Page 3: the agent stays fixed while its connected world expands. */
export function mountConnectivity(slide, onChange = () => {}) {
  const host = slide.querySelector('#connectivity-host');
  const root = host.attachShadow({mode:'open'});
  root.append(slide.querySelector('#connectivity-template').content.cloneNode(true));
  const scenes = [
    ['AIエージェント', 'まず、業務を進めるAgentを起点に見ていきます。'],
    ['LLMとの通信', '指示とルールを送り、LLMの処理結果を受け取ります。'],
    ['接続先が1つから4つへ', 'OpenAIに加え、Claude・Gemini・ローカルモデルへ広がります。'],
    ['LLMの外側にも接続がある', 'AgentからMCPへ、MCPからAPIへ接続が広がります。'],
    ['Agent同士もつながる', '通信相手に、別のAIエージェントが加わります。'],
    ['接続を、面で捉える', '増えた経路に、アクセス制御・観測・コスト管理が要ります。']
  ];
  const captions = [
    '接続を起点から捉える。',
    'AgentとLLMの間で、要求と結果が往復する。',
    'Agentを変えずに、複数のLLMへ接続する。',
    '接続はLLMからMCP・APIへ広がる。',
    'Agent同士の通信も同じ全体像に入る。',
    'すべての接続に制御・観測・コスト管理が必要になる。'
  ];
  const $ = id => root.querySelector('#' + id);
  const title = root.querySelector('.c-title');
  const sentence = root.querySelector('.c-sentence');
  const caption = root.querySelector('.c-caption');
  const packet = $('c-packet');
  const stages = {
    1: ['c-openai', 'c-route-openai'],
    2: ['c-claude', 'c-route-claude', 'c-gemini', 'c-route-gemini', 'c-local', 'c-route-local'],
    3: ['c-mcp', 'c-route-mcp', 'c-api', 'c-route-api'],
    4: ['c-peer', 'c-route-peer'],
    5: ['c-plane', 'c-control', 'c-observe', 'c-cost']
  };
  const allReveals = Object.values(stages).flat();
  const routes = [...root.querySelectorAll('.c-route')];
  let step = 0, busy = false, generation = 0, frame = null, settle = null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot = () => ({step, busy, count: scenes.length, title: scenes[step][0]});
  const show = (id, visible = true) => $(id).classList.toggle('c-visible', visible);
  const models = [['c-openai','c-route-openai'],['c-claude','c-route-claude'],['c-gemini','c-route-gemini'],['c-local','c-route-local']];
  function activeModel(id) {
    for (const [node, route] of models) {
      $(node).classList.toggle('c-active', node === id);
      $(route).classList.toggle('c-current', node === id);
    }
  }
  function shapeOpenAI(t) {
    const node = $('c-openai');
    node.style.top = `${280 + 95 * t}px`;
    node.style.height = `${250 - 178 * t}px`;
    node.style.borderRadius = `${22 - 14 * t}px`;
    node.style.paddingTop = `${25 - 7 * t}px`;
    node.querySelector('.c-openai-big-tag').style.opacity = String(1 - t);
    node.querySelector('.c-llm-role').style.opacity = String(1 - t);
    node.querySelector('.c-openai-small-tag').style.opacity = String(t);
  }
  function clearMotion() {
    packet.classList.remove('c-visible');
    routes.forEach(path => {
      path.classList.remove('is-drawing', 'is-travel');
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });
    root.querySelectorAll('.is-pulsing').forEach(node => node.classList.remove('is-pulsing'));
    host.classList.remove('is-request', 'is-result');
  }
  function render() {
    clearMotion();
    for (const id of allReveals) show(id, false);
    for (let n = 1; n <= step; n++) for (const id of stages[n]) show(id);
    shapeOpenAI(step >= 2 ? 1 : 0);
    activeModel(step === 1 ? 'c-openai' : step === 2 ? 'c-local' : null);
    if (step !== 1) show('c-flow-note', false);
    else { show('c-flow-note'); host.classList.add('is-result'); }
    title.textContent = scenes[step][0];
    sentence.textContent = scenes[step][1];
    caption.textContent = captions[step];
    host.classList.toggle('c-governed', step === 5);
    slide.dataset.step = String(step);
    slide.dataset.busy = String(busy);
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
  async function draw(id, token, duration = 440) {
    const path = $(id), length = path.getTotalLength();
    show(id);
    path.classList.add('is-drawing');
    path.style.strokeDasharray = String(length);
    const ok = await animate(duration, token, t => { path.style.strokeDashoffset = String(length * (1 - t)); });
    path.classList.remove('is-drawing');
    path.style.strokeDasharray = '';
    path.style.strokeDashoffset = '';
    return ok;
  }
  async function travel(id, token, reverse = false) {
    const path = $(id), length = path.getTotalLength();
    const duration = Math.max(420, length / 650 * 1000);
    path.classList.add('is-travel');
    packet.classList.add('c-visible');
    const ok = await animate(duration, token, t => {
      const point = path.getPointAtLength(length * (reverse ? 1 - t : t));
      packet.setAttribute('transform', `translate(${point.x} ${point.y})`);
    });
    packet.classList.remove('c-visible');
    path.classList.remove('is-travel');
    return ok;
  }
  async function pause(ms, token) { return animate(ms, token, () => {}); }
  async function arrive(id, route, token, {drawRoute = true, model = false} = {}) {
    show(id);
    if (drawRoute && !await draw(route, token)) return false;
    if (!await travel(route, token)) return false;
    if (model) activeModel(id);
    $(id).classList.add('is-pulsing');
    if (!await pause(170, token)) return false;
    $(id).classList.remove('is-pulsing');
    return true;
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
    step = Math.max(0, Math.min(scenes.length - 1, target));
    render();
  }
  async function play(replay = false) {
    if (busy || (!replay && step === scenes.length - 1) || (replay && step === 0)) return false;
    if (replay) { step--; render(); }
    step++;
    const token = ++generation;
    busy = true;
    title.textContent = scenes[step][0];
    sentence.textContent = scenes[step][1];
    caption.textContent = captions[step];
    slide.dataset.step = String(step);
    slide.dataset.busy = 'true';
    onChange(snapshot());
    let ok = true;
    if (reduced()) render();
    else if (step === 1) {
      show('c-openai'); show('c-flow-note');
      ok = await draw('c-route-openai', token, 550);
      if (ok) {
        host.classList.add('is-request');
        ok = await travel('c-route-openai', token);
      }
      if (ok) {
        host.classList.remove('is-request');
        activeModel('c-openai');
        $('c-openai').classList.add('is-pulsing');
        ok = await pause(180, token);
        $('c-openai').classList.remove('is-pulsing');
      }
      if (ok) {
        host.classList.add('is-result');
        ok = await travel('c-route-openai', token, true);
      }
    } else if (step === 2) {
      show('c-flow-note', false);
      host.classList.remove('is-result');
      activeModel(null);
      ok = await animate(700, token, shapeOpenAI);
      for (const [node, route, drawRoute] of [['c-openai','c-route-openai',false],['c-claude','c-route-claude',true],['c-gemini','c-route-gemini',true],['c-local','c-route-local',true]]) {
        if (!ok) break;
        ok = await arrive(node, route, token, {drawRoute, model:true});
      }
    } else if (step === 3) {
      activeModel(null);
      for (const [node, route] of [['c-mcp','c-route-mcp'],['c-api','c-route-api']]) {
        if (!ok) break;
        ok = await arrive(node, route, token);
      }
    } else if (step === 4) {
      ok = await arrive('c-peer', 'c-route-peer', token);
      if (ok) ok = await travel('c-route-peer', token, true);
    } else if (step === 5) {
      const plane = $('c-plane');
      plane.style.clipPath = 'inset(0 100% 0 0)';
      show('c-plane');
      ok = await animate(1000, token, t => { plane.style.clipPath = `inset(0 ${100 * (1 - t)}% 0 0)`; });
      plane.style.clipPath = '';
      if (ok) host.classList.add('c-governed');
      for (const id of ['c-control','c-observe','c-cost']) {
        if (!ok) break;
        show(id);
        ok = await pause(230, token);
      }
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
    replay: () => play(true),
    jump, cancel,
    getState: snapshot,
    states: scenes.map(([name]) => name)
  };
}
