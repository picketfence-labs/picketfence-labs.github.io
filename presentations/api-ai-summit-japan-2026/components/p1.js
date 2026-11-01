/* P1 review v0.3: per-server discovery, manual processing return, accumulating context. */
export function mountP1(host, onChange = () => {}) {
  const root=host.attachShadow({mode:"open"});
  root.innerHTML="<style>\n    :host{--bg:#001408;--fg:#FFFFFF;--muted:#CDD4CB;--surface:#1A1F1B;--line:#4A4D49;--accent:#CCFF00;font-family:'Funnel Sans','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif;color:var(--fg);background:var(--bg);color-scheme:dark}\n    *{box-sizing:border-box}body{margin:0}button,select{font:inherit;font-size:14px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:10px 15px;cursor:pointer}button:disabled{opacity:.35;cursor:default}button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:3px}\n    header{max-width:1500px;margin:auto;padding:22px 32px 12px;display:flex;align-items:center;justify-content:space-between;gap:20px}header p{margin:0;font-size:14px;color:var(--muted)}header strong{color:var(--fg);font-size:16px}.header-actions{display:flex;gap:10px}\n    #canvas{max-width:1500px;margin:auto;padding:0 12px}svg{display:block;width:100%;font-family:inherit}#canvas svg{max-height:calc(100vh - 180px);min-height:300px}.bg{fill:var(--bg)}.guide{stroke:var(--line);stroke-width:1;opacity:.45}.scene-title{fill:var(--fg);font-size:38px;font-weight:700}.sentence{fill:var(--muted);font-size:22px}.node-title{font-size:24px;font-weight:700;fill:var(--fg)}.small{font-size:16px;fill:var(--muted)}.data-label{font-size:17px;fill:var(--fg)}.agent-box{fill:var(--surface);stroke:var(--line);stroke-width:2}.client-box{fill:var(--bg);stroke:var(--accent);stroke-width:2}.client-label{font-size:21px;font-weight:700;fill:var(--fg)}.llm-box{fill:var(--surface);stroke:var(--accent);stroke-width:2}.tool-box{fill:var(--bg);stroke:var(--line)}.data-box{fill:var(--bg);stroke:var(--line)}.server-box,.api-box{fill:var(--surface);stroke:var(--line);stroke-width:2}.route{fill:none;stroke-width:2;stroke-dasharray:7 7}.llm-route{stroke:var(--muted)}.mcp-route{stroke:var(--accent)}.route.active{stroke:var(--accent);stroke-width:4;stroke-dasharray:none;opacity:1!important}.route-label{font-size:18px;fill:var(--muted)}.context-note{fill:var(--fg);font-size:22px}.processing-bg{fill:var(--surface);fill-opacity:.86;stroke:var(--accent)}.process-line{font-family:'Roboto Mono','Hiragino Kaku Gothic ProN',monospace;fill:var(--fg);font-size:16px}.process-line.op-active{fill:var(--accent);font-weight:700}.bloat-bg{fill:var(--surface);stroke:var(--accent);stroke-width:2}.data-lines{stroke:var(--muted);stroke-width:4;opacity:.7}.sensitive{font-size:16px;fill:var(--fg);font-weight:700}.impact-rule{stroke:var(--accent);stroke-width:3}.impact-label{font-size:22px;fill:var(--fg);font-weight:700}.packet circle{fill:var(--accent)}.packet rect{fill:var(--surface);stroke:var(--line)}.packet text{font-size:14px;font-weight:700;fill:var(--fg)}.footnote{font-size:13px;fill:var(--muted)}\n    .selected-api{stroke:var(--accent);stroke-width:4}#controls{max-width:1500px;margin:auto;padding:14px 32px 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid var(--line);flex-wrap:wrap}#controls>div{display:flex;align-items:center;gap:10px}#next{background:var(--accent);color:#001408;border-color:var(--accent)}#position{font:14px 'Roboto Mono',monospace;color:var(--muted);white-space:nowrap}#status{font-size:14px;color:var(--muted);min-width:200px}.review-note{max-width:1500px;margin:auto;padding:8px 32px 26px;color:var(--muted);font-size:14px;line-height:1.8}.review-note summary{cursor:pointer}.review-note p{max-width:1000px}#note{font-size:16px;color:var(--fg)}\n    .internal-route{stroke:transparent;opacity:0}.server-label{font-size:19px;fill:var(--fg);font-weight:700}.extra-label{font-size:16px;fill:var(--fg);font-weight:700}.tool-chip{fill:var(--surface);stroke:var(--line);transition:stroke .22s,fill .22s}.tool-name{font-size:13px;fill:var(--fg)}.candidate .tool-chip{stroke:var(--accent);stroke-width:2}.candidate .tool-name{fill:var(--fg);font-weight:700}.choice-note{font-size:15px;fill:var(--fg)}.choice-arrow{fill:var(--accent);font-weight:800}.result-label{font-size:15px;fill:var(--fg);font-weight:700}.data-label{font-size:14px}.process-line{font-size:13px}.sensitive{font-size:14px}\n    .list-result-label{font-size:12px;fill:var(--muted)}.raw-card{fill:var(--bg);stroke:var(--line)}.reading .raw-card{stroke:var(--accent);stroke-width:2;fill:var(--surface)}.raw-lines{stroke:var(--line);stroke-width:2}.meter-track,.meter-cell{fill:var(--surface);stroke:var(--line)}.meter-fill,.meter-cell.lit{fill:var(--accent);stroke:var(--accent)}.data-packet{display:none}svg[data-payload=\"bulk\"] .data-packet{display:block}svg[data-payload=\"bulk\"] .packet>circle{display:none}.packet .data-packet rect{fill:var(--accent);stroke:var(--bg)}.packet .data-packet text{fill:var(--bg);font-size:9px;font-weight:700}\n    #gallery{max-width:1500px;margin:auto;padding:12px 32px 32px;display:grid;grid-template-columns:1fr 1fr;gap:24px}#gallery article{border:1px solid var(--line);padding:18px;border-radius:8px}#gallery h2{font-size:18px;margin:0 0 10px}#gallery button{margin-top:10px}#gallery svg{border:1px solid var(--line)}[hidden]{display:none!important}\n    @media(max-width:800px){header,#controls{padding:16px}#controls>div{flex-wrap:wrap}#gallery{grid-template-columns:1fr;padding:16px}.header-actions{flex-direction:column}#canvas svg{min-height:220px}select{max-width:260px}}\n    \n:host{display:block;width:100%;height:100%;--bg:#000;--surface:#111713;--fg:#fff;--muted:#cdd4cb;--line:#4a4d49;--accent:#ccff00}#canvas{padding:0;max-width:none;width:100%;height:100%}#canvas svg{width:100%;height:100%;max-height:none;min-height:0}.chrome{display:none!important}</style><div id=\"app\"><div id=\"canvas\"></div><div class=\"chrome\"><select id=\"state\"></select><span id=\"position\"></span><button id=\"prev\"></button><button id=\"next\"></button><button id=\"replay\"></button><span id=\"status\"></span><span id=\"note\"></span></div></div>";
  root.querySelector('style').textContent += '.scene-summary{fill:#ccff00;font-size:23px;font-weight:700}';
  'use strict';
  // v0.1 Client→Server was 978 units / 650 ms ≈ 1505 units/s; use ~17% slower.
  const NS='http://www.w3.org/2000/svg', SPEED=1250;
  const codes=[0,1,2,3,4,6,7,8,9,10.1,10.2,11,11.1,12];
  const ids=['initial','agent-llm','external-data','mcp-components','tool-discovery','tool-request','tool-result','tool-loop','refocus','llm-processing','llm-result','sprawl-servers','sprawl-search','bloat'];
  const titles=['AIエージェント','AIエージェントとLLM','処理に必要な外部データ','APIごとのMCP Server','各ServerのTool一覧を取得','LLMからAPI実行を依頼','取得結果をLLMへ渡す','複数のAPIからデータを取得','取得後の処理へ注目','LLMによるデータの集計・加工','処理結果をエージェントへ返す','Context Sprawl — MCP Serverが増える','Context Sprawl — LLMがToolを探す','Context Bloat'];
  const descriptions=[
    '業務処理を進めるAIエージェントから見ていきます。',
    'エージェントが入力を渡し、LLMが判断・データ取得・処理を進めます。',
    '必要な情報の多くは外部にあり、APIの実行結果を参照する必要があります。',
    'APIごとのMCP Serverへ、エージェント内のMCP Clientから接続します。',
    'Clientが各Serverへtools/listを送り、集めたTool定義をLLMへ渡します。',
    'LLMからの依頼が、エージェント内のClientを経て、Server・APIへ伝わります。',
    'APIの結果が同じ経路を戻り、エージェントからLLMへ渡されます。',
    'LLMの判断とAPI実行を繰り返し、必要なデータを集めます。',
    '接続の詳細を外し、取得したデータを扱うLLMとエージェントへ注目します。',
    '取得データを選別・突合・並べ替えます。処理後に停止し、次の操作で結果を返します。',
    'LLMで集計・加工した結果を、エージェントへ返します。',
    'MCP Serverが次々と追加されます。ここで停止し、次のフリップでLLM側を見ます。',
    'LLMは増えたTool定義から、必要なものを選びます。',
    'Tool定義に取得データが積み上がり、LLMが扱う情報量と処理の負担が増えます。'
  ];
  const captions=[
    'AIエージェントを起点に、接続の流れを追う。',
    'AgentとLLMの間で、要求と結果が往復する。',
    '業務に必要な情報は、外部のAPIにある。',
    'MCP ServerがAgentとAPIをつなぐ。',
    'Toolの定義がAgentを通ってLLMへ集まる。',
    'LLMの判断からAPIの実行へ進む。',
    'APIの結果は同じ経路でLLMへ戻る。',
    '複数APIの実行を重ねて、必要なデータを集める。',
    '取得したデータを、LLMが処理する。',
    'LLMがデータを選び、結び、並べる。',
    '加工した結果をAgentへ返す。',
    '接続先が増えるほど、Toolの定義も増える。',
    '増えたToolから、LLMが必要なものを探す。',
    '取得データまで積み重なると、LLMの負担が増える。'
  ];
  const toolNames=['顧客検索','顧客詳細','契約一覧','契約更新','利用履歴','利用集計','請求一覧','拠点検索','在庫照会','申請登録','履歴検索','案件一覧'];
  const $=s=>root.querySelector(s),app=$('#app'),canvas=$('#canvas'),selector=$('#state');
  let index=0,busy=false,generation=0,current;
  const state=i=>{
    const c=codes[i],intro=c<2,focus=[9,10.1,10.2,12].includes(c),processing=c===10.1||c===10.2;
    return {
      agent:c===0?[560,200,1,1]:intro?[850,200,1,1]:c===12?[950,180,1,1]:focus?[910,180,1.05,1]:[446,200,1,1],
      llm:intro?[180,200,1.25,c?1:0]:c===12?[70,180,1,1]:focus?[100,180,1.45,1]:[36,200,1,1],
      servers:[836,347,1,c>=3&&!focus?1:0],apis:[1126,347,1,c>=2&&!focus?1:0],
      client:c>=3&&!focus?1:0,links:c>=3&&!focus?1:0,tools:c>=4&&c!==11&&c!==11.1&&c!==12?1:0,
      data:c>=8?3:c>=7?1:0,extra:c===11||c===11.1?1:0,cloud:c===11.1||c===12?1:0,
      process:processing?1:0,result:c===10.2?1:0,ready:processing?1:0,opCount:processing?3:0,
      listed:c>=4?3:0,context:c===12?1:0,reshape:c===12?1:0,bloat:c===12?1:0,load:c===12?1:0,work:c===12?1:0,impacts:c===12?4:processing?2:0,selectionComplete:c===11.1?1:0,
    };
  };
  function makeScene(){
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1400 760');svg.setAttribute('role','img');
    svg.innerHTML=`<title></title><rect width="1400" height="760" class="bg"/>
       <path d="M36 140H1366M36 690H1366" class="guide"/>
       <text x="36" y="62" class="scene-title"></text><text x="36" y="108" class="sentence"></text><text x="36" y="729" class="scene-summary"></text>
      <g class="routes"><path data-path="llm" class="route llm-route"/><path data-path="handoff" class="route internal-route"/>
      ${[0,1,2].map(n=>`<path data-path="mcp${n}" class="route mcp-route"/><path data-path="server-handoff${n}" class="route internal-route"/><path data-path="api${n}" class="route mcp-route"/>`).join('')}</g>
      <g data-node="agent"><rect width="260" height="310" rx="8" class="agent-box"/>
        <text x="24" y="45" class="node-title">AIエージェント</text><text x="24" y="78" class="small">LLMの呼出し・実行制御</text>
        <g data-el="client"><rect x="20" y="110" width="220" height="110" rx="6" class="client-box"/>
          <text x="130" y="140" text-anchor="middle" class="client-label">MCP Client</text>
          <text x="130" y="166" text-anchor="middle" class="small">接続先ごとに保持</text></g>
        <g data-el="list-results">${['顧客用','利用実績用','契約用'].map((t,n)=>`<g data-listed="${n}"><rect x="20" y="${232+n*22}" width="220" height="18" rx="3" class="data-box"/><text x="30" y="${245+n*22}" class="list-result-label">${t}のTool定義</text></g>`).join('')}</g>
        <g data-el="input-queue">${['顧客データ','利用実績データ','契約データ'].map((t,n)=>`<g><rect x="20" y="${110+n*44}" width="220" height="34" rx="4" class="data-box"/><text x="33" y="${133+n*44}" class="data-label">${t}</text></g>`).join('')}</g>
        <g data-el="agent-result"><rect x="20" y="118" width="220" height="90" rx="6" class="client-box"/>
          <text x="130" y="152" text-anchor="middle" class="client-label">処理結果を受領</text>
          <text x="130" y="181" text-anchor="middle" class="small">集計・加工後の結果</text></g>
      </g>
      <g data-node="llm"><rect width="280" height="310" rx="22" class="llm-box"/>
        <text x="24" y="44" class="node-title">LLM</text><text x="24" y="72" class="small">判断・データ取得・処理</text>
        <g data-el="tools"><rect x="24" y="90" width="232" height="40" rx="4" class="tool-box"/>
          <text x="35" y="115" class="data-label">Tool名 / 引数 / 返却情報</text></g>
        <g data-el="discovered-tools">${['顧客用','利用実績用','契約用'].map((t,n)=>`<g><rect x="24" y="${94+n*60}" width="232" height="52" rx="4" class="tool-box"/><text x="35" y="${115+n*60}" class="data-label">${t}のTool定義</text><text x="35" y="${135+n*60}" class="list-result-label">名前・説明・引数</text></g>`).join('')}</g>
        ${['顧客データ','利用実績データ','契約データ'].map((t,n)=>`<g data-row="${n}"><rect x="24" y="${146+n*38}" width="232" height="32" rx="3" class="data-box"/><text x="35" y="${168+n*38}" class="data-label">${t}</text></g>`).join('')}
        <g data-el="processing"><rect x="12" y="136" width="256" height="132" rx="6" class="processing-bg"/>
          <text x="25" y="165" class="process-line" data-op="0">Filter — 必要な行を選ぶ</text>
          <text x="25" y="203" class="process-line" data-op="1">JOIN — データを突き合わせる</text>
          <text x="25" y="241" class="process-line" data-op="2">ORDER BY — 順に並べる</text></g>
        <g data-el="llm-result"><text x="24" y="291" class="result-label">集計・加工した結果を返す</text></g>
        <g data-el="tool-cloud">${toolNames.map((t,n)=>`<g data-tool="${n}" transform="translate(${24+(n%2)*120} ${98+Math.floor(n/2)*27})"><rect width="112" height="23" rx="3" class="tool-chip"/><text x="10" y="16" class="tool-name">${t}</text></g>`).join('')}
          <text x="24" y="288" class="choice-note">Tool選択の精度と負荷<tspan dx="5" class="choice-arrow">↑</tspan></text></g>
        <g data-el="bloat"><rect x="18" y="94" width="170" height="272" rx="5" class="bloat-bg"/>
          <text x="30" y="119" class="data-label">Tool定義</text>
          <rect data-data-panel x="210" y="94" width="440" height="272" rx="5" class="bloat-bg"/>
          <text x="224" y="119" class="data-label">取得データ</text>
          ${['顧客データ','利用実績データ','契約データ','取得データの続き','さらに取得データ','機微情報を含む場合も'].map((t,n)=>`<g data-raw="${n}" transform="translate(224 ${136+n*36})"><rect width="412" height="28" rx="3" class="raw-card"/><text x="12" y="19" class="data-label">${t}</text><path d="M296 9H394M296 16H382M296 23H394" class="raw-lines"/></g>`).join('')}
          <text x="24" y="390" class="data-label">LLMが扱う情報量</text><rect data-context-track x="24" y="402" width="626" height="12" rx="3" class="meter-track"/><rect data-context-fill x="24" y="402" width="0" height="12" rx="3" class="meter-fill"/>
        </g>
      </g>
       <g data-node="servers">${[0,1,2].map(n=>`<g data-server="${n}" transform="translate(0 ${n*112})"><rect width="160" height="96" rx="8" class="server-box"/><text x="80" y="32" text-anchor="middle" class="server-label">MCP Server</text><text x="80" y="76" text-anchor="middle" class="small">${['顧客用','利用実績用','契約用'][n]}</text></g>`).join('')}</g>
       <g data-node="apis">${['顧客 API','利用実績 API','契約 API'].map((t,n)=>`<g data-api="${n}" transform="translate(0 ${n*112})"><rect width="220" height="96" rx="8" class="api-box"/><text x="110" y="38" text-anchor="middle" class="node-title">${t}</text><text x="110" y="68" text-anchor="middle" class="small">外部の業務データ</text></g>`).join('')}</g>
      <g data-el="discovery-note"><text x="1126" y="318" class="data-label">一覧取得ではAPI実行なし</text></g>
      <g data-el="extra"><g class="extra-routes">${[0,1,2,3,4,5].map(n=>`<path data-path="extra${n}" class="route mcp-route"/>`).join('')}</g>
        ${[0,1,2,3,4,5].map(n=>`<g data-extra-server="${n}" transform="translate(${760+n%3*202} ${175+Math.floor(n/3)*85})"><rect width="160" height="64" rx="6" class="server-box"/><text x="80" y="27" text-anchor="middle" class="extra-label">MCP Server ${n+4}</text><text x="80" y="49" text-anchor="middle" class="small">Tool / Tool / …</text></g>`).join('')}</g>
      <g data-el="bloat-effects" transform="translate(950 515)"><text y="22" class="data-label">トークン消費</text>${[0,1,2,3,4,5].map(n=>`<rect data-cost="${n}" x="${n*38}" y="35" width="30" height="15" rx="2" class="meter-cell"/>`).join('')}<text y="85" class="data-label">処理待ち</text>${[0,1,2,3,4,5].map(n=>`<rect data-wait="${n}" x="${n*38}" y="98" width="30" height="15" rx="2" class="meter-cell"/>`).join('')}</g>
      <g class="packet" visibility="hidden"><circle r="8"/><g class="data-packet"><rect x="-25" y="-19" width="44" height="27" rx="3"/><rect x="-22" y="-15" width="44" height="27" rx="3"/><rect x="-19" y="-11" width="44" height="27" rx="3"/><text x="3" y="7" text-anchor="middle">DATA</text></g></g>
      `;
    // Retain the Tool chips from Sprawl above the expanding context background.
    svg.querySelector('[data-el="bloat"]').after(svg.querySelector('[data-el="tool-cloud"]'));
    return svg;
  }
  const svg=makeScene();canvas.append(svg);
  const el=(s,root=svg)=>root.querySelector(s);
  const anchor=(s,n,x,y)=>[s[n][0]+x*s[n][2],s[n][1]+y*s[n][2]];
  const path=points=>points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
  function routes(s,root){
    // Shared Y makes the top communication chain horizontal in both directions.
    const y=s.agent[1]+195*s.agent[2],ll=[s.llm[0]+(280+400*s.reshape)*s.llm[2],y];
    const left=anchor(s,'agent',s.client>.05?20:0,195),right=anchor(s,'agent',240,195);
    el('[data-path="llm"]',root).setAttribute('d',path([ll,left]));
    el('[data-path="handoff"]',root).setAttribute('d',path([left,right]));
    for(let n=0;n<3;n++){
       const b=anchor(s,'servers',0,n*112+48),end=anchor(s,'servers',160,n*112+48),a=anchor(s,'apis',0,n*112+48),mid=(right[0]+b[0])/2;
      el(`[data-path="mcp${n}"]`,root).setAttribute('d',path([right,[mid,right[1]],[mid,b[1]],b]));
      el(`[data-path="server-handoff${n}"]`,root).setAttribute('d',path([b,end]));
      el(`[data-path="api${n}"]`,root).setAttribute('d',path([end,a]));
    }
    for(let n=0;n<6;n++){
      const x=760+n%3*202+80,top=175+Math.floor(n/3)*85,corridor=top-20;
      el(`[data-path="extra${n}"]`,root).setAttribute('d',path([right,[725,right[1]],[725,corridor],[x,corridor],[x,top]]));
    }
  }
  function candidate(indices,root=svg){root.querySelectorAll('[data-tool]').forEach((e,n)=>e.classList.toggle('candidate',indices.includes(n)));}
  function render(s,root=svg,i=index){
    const c=codes[i],processing=c===10.1||c===10.2;
    for(const n of ['agent','llm','servers','apis']){const [x,y,z,o]=s[n],node=el(`[data-node="${n}"]`,root);node.setAttribute('transform',`translate(${x} ${y}) scale(${z})`);node.style.opacity=c===12&&(n==='servers'||n==='apis')?o*o*o:c===4&&n==='apis'?o*.35:o;}
    const llmWidth=280+400*s.reshape,box=el('[data-node="llm"] > rect',root);box.setAttribute('width',llmWidth);box.setAttribute('height',310+120*s.context);
    const visible={client:s.client,tools:c===4?0:s.tools*(1-s.cloud),extra:c===12?s.extra**3:s.extra,processing:s.process,'agent-result':s.result,'llm-result':Math.max(s.ready,s.result),'tool-cloud':s.cloud,bloat:s.bloat,'list-results':c===4?1:0,'discovered-tools':c===4?s.tools:0,'discovery-note':c===4?1:0,'input-queue':s.bloat,'bloat-effects':s.bloat};
    for(const [k,v] of Object.entries(visible))el(`[data-el="${k}"]`,root).style.opacity=v;
    root.querySelectorAll('[data-row]').forEach((e,n)=>e.style.opacity=n<s.data?(1-s.process)*(1-s.bloat)*(1-s.cloud):0);
    root.querySelectorAll('[data-listed]').forEach((e,n)=>e.style.opacity=n<s.listed?1:0);
    root.querySelectorAll('[data-op]').forEach((e,n)=>e.style.opacity=n<s.opCount?1:0);
    el('[data-el="llm-result"] text',root).textContent=c===10.1?'集計・加工した結果を返す':'集計・加工した結果を返す';
    el('[data-el="tool-cloud"]',root).setAttribute('transform',`translate(${8*s.context} ${80*s.context}) scale(${1-.37*s.context})`);
    root.querySelectorAll('.choice-note').forEach(e=>e.style.opacity=1-s.context);
    el('[data-data-panel]',root).setAttribute('width',Math.max(40,llmWidth-240));
    root.querySelectorAll('[data-raw]').forEach((e,n)=>{e.style.opacity=Math.max(0,Math.min(1,s.load*6-n));e.classList.toggle('reading',s.work>0&&s.work<1&&Math.floor(s.work*12)%6===n);el('rect',e).setAttribute('width',Math.max(30,llmWidth-268));el('.raw-lines',e).style.opacity=Math.max(0,(s.reshape-.7)/.3);el('.raw-lines',e).setAttribute('transform',`translate(${llmWidth-680} 0)`);});
    el('[data-context-track]',root).setAttribute('width',llmWidth-54);el('[data-context-fill]',root).setAttribute('width',(llmWidth-54)*(.15+.85*s.load));
    root.querySelectorAll('[data-cost]').forEach((e,n)=>e.classList.toggle('lit',n<Math.ceil(s.load*6)));
    root.querySelectorAll('[data-wait]').forEach((e,n)=>e.classList.toggle('lit',n<Math.ceil((s.load*.4+s.work*.6)*6)));
    root.dataset.payload=c===12?'bulk':'point';
    root.querySelectorAll('.llm-route').forEach(e=>e.style.opacity=c>=1?.65:0);
    root.querySelectorAll('.mcp-route').forEach(e=>e.style.opacity=c===12?s.links**3:c===4&&e.dataset.path.startsWith('api')?s.links*.2:s.links);
    el('[data-path="handoff"]',root).style.opacity=0;
    el('[data-el="tools"] text',root).textContent=processing?'取得済み: 顧客 / 実績 / 契約':'Tool名 / 引数 / 返却情報';
    el('.scene-title',root).textContent=titles[i];el('title',root).textContent=titles[i];el('.sentence',root).textContent=descriptions[i];el('.scene-summary',root).textContent=captions[i];
    candidate(c===11.1&&s.selectionComplete?[2,7,10]:[],root);routes(s,root);
  }
  function interpolate(a,b,t){const s={};for(const k of Object.keys(b))s[k]=Array.isArray(b[k])?b[k].map((v,n)=>a[k][n]+(v-a[k][n])*t):a[k]+(b[k]-a[k])*t;return s;}
  const animate=(ms,token,draw)=>new Promise(resolve=>{
    const start=performance.now();function frame(now){if(token!==generation){resolve(false);return;}const t=Math.min(1,(now-start)/ms);if(draw)draw(t);if(t<1)requestAnimationFrame(frame);else resolve(true);}requestAnimationFrame(frame);
  });
  const hop=(name,reverse)=>({name,reverse});
  const request=n=>[hop('llm',false),hop('handoff',false),hop(`mcp${n}`,false),hop(`server-handoff${n}`,false),hop(`api${n}`,false)];
  const response=n=>[hop(`api${n}`,true),hop(`server-handoff${n}`,true),hop(`mcp${n}`,true),hop('handoff',true),hop('llm',true)];
  async function travel(hops,token,speedMultiplier=1){
    if(token!==generation)return false;
    const segments=hops.map(h=>({...h,element:el(`[data-path="${h.name}"]`)}));
    let total=0;for(const h of segments){h.start=total;h.length=h.element.getTotalLength();total+=h.length;}
    const dot=el('.packet');dot.setAttribute('visibility','visible');let active;
    const ok=await animate(total/SPEED*1000/speedMultiplier,token,t=>{
      const distance=t*total,h=segments.find(h=>distance<h.start+h.length)||segments.at(-1);
      if(active!==h){if(active)active.element.classList.remove('active');h.element.classList.add('active');active=h;}
      const local=Math.max(0,Math.min(h.length,distance-h.start)),point=h.element.getPointAtLength(h.reverse?h.length-local:local);
      dot.setAttribute('transform',`translate(${point.x} ${point.y})`);
      app.dataset.route=h.name;app.dataset.direction=h.reverse?'reverse':'forward';
    });
    if(token===generation){dot.setAttribute('visibility','hidden');if(active)active.element.classList.remove('active');}
    return ok;
  }
  const showData=n=>svg.querySelectorAll('[data-row]').forEach((e,k)=>e.style.opacity=k<n?1:0);
  async function flow(i,token){
    const c=codes[i];
    if(c===1)await travel([hop('llm',true),hop('llm',false)],token);
    if(c===4){
      const base={...state(i),tools:0,listed:0};render(base);
      if(!await travel([hop('llm',false),hop('handoff',false)],token))return;
      for(let n=0;n<3;n++){
        if(!await travel([hop(`mcp${n}`,false),hop(`mcp${n}`,true)],token))return;
        base.listed=n+1;render(base);
      }
      if(!await travel([hop('handoff',true),hop('llm',true)],token))return;
      await animate(250,token,t=>render({...base,tools:t}));
    }
    if(c===6)await travel(request(0),token);
    if(c===7){showData(0);if(await travel(response(0),token))showData(1);}
    if(c===8){showData(1);for(let n=1;n<=2;n++){if(!await travel([...request(n),...response(n)],token))return;showData(n+1);}}
    if(c===10.1){
      for(let n=0;n<3;n++){render({...state(i),opCount:n+1,ready:0});svg.querySelectorAll('[data-op]').forEach((e,k)=>e.classList.toggle('op-active',k===n));if(!await animate(2000,token))return;}
    }
    if(c===10.2){
      el('[data-el="agent-result"]').style.opacity=0;
      if(await travel([hop('llm',false)],token))el('[data-el="agent-result"]').style.opacity=1;
    }
    if(c===11){
      const base={...state(i),cloud:0,extra:0,tools:1,data:3};
      if(!await animate(500,token,t=>render({...base,extra:t})))return;
      await animate(950,token);
    }
    if(c===11.1){
      const base={...state(i),cloud:1,extra:1,tools:0,data:0,selectionComplete:0};
      svg.querySelectorAll('[data-tool]').forEach(e=>e.style.opacity=0);render(base);candidate([]);
      if(!await animate(2600,token,t=>svg.querySelectorAll('[data-tool]').forEach((e,n)=>e.style.opacity=t*12>n?1:0)))return;
      for(const n of [1,7,3,10,4]){candidate([n]);if(!await animate(800,token))return;}
      candidate([2,7,10]);await animate(700,token);
    }
    if(c===12){
      const base={...state(i),reshape:.5,bloat:0,load:0,work:0,impacts:0};
      const paint=s=>{render({...base,...s});};
      if(!await animate(300,token,t=>paint({bloat:t})))return;
      let load=0;
      for(let n=0;n<3;n++){
        if(!await travel([hop('llm',true)],token,1/3))return;
        const next=(n+1)/3;
        if(!await animate(1500,token,t=>paint({bloat:1,load:load+(next-load)*t,reshape:.5+(load+(next-load)*t)*.5,impacts:n+1})))return;
        load=next;
      }
      if(!await animate(3000,token,t=>paint({bloat:1,load:1,reshape:1,work:t,impacts:t>.8?4:3})))return;
    }
  }
  function clean(){svg.querySelectorAll('.packet').forEach(e=>e.setAttribute('visibility','hidden'));svg.querySelectorAll('.active,.op-active').forEach(e=>e.classList.remove('active','op-active'));svg.querySelectorAll('[data-tool]').forEach(e=>e.style.opacity=1);delete app.dataset.route;delete app.dataset.direction;}
  function update(){
    app.dataset.step=ids[index];app.dataset.code=String(codes[index]).padStart(2,'0');app.dataset.busy=String(busy);selector.value=String(index);
    $('#position').textContent=`P1 / ${app.dataset.code} · ${index+1}/${codes.length}`;
    $('#prev').disabled=index===0;$('#next').disabled=index===codes.length-1||busy;$('#replay').disabled=index===0||busy;
    $('#next').textContent=codes[index]===10.1?'結果を返す ↓':'次へ ↓';
    $('#status').textContent=busy?'動作中 — 終了後に停止します':codes[index]===10.1?'結果を確認 — 次の操作で返却':index===codes.length-1?'P1の最終状態':'停止中 — 下矢印で次へ';$('#note').textContent=descriptions[index];
    onChange({step:index,busy,count:codes.length,title:titles[index],code:codes[index]});
  }
  function jump(i){generation++;busy=false;clean();index=Math.max(0,Math.min(codes.length-1,i));current=state(index);render(current);update();}
  async function advance(replay=false){
    if(busy||!replay&&index===codes.length-1||replay&&index===0)return;
    const from=replay?state(index-1):current;if(!replay)index++;
    const target=state(index),token=++generation,c=codes[index];busy=true;clean();update();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,visual={...target};
    if(!reduced){if(c===4){visual.tools=0;visual.listed=0;}if(c===7||c===8)visual.data=from.data;if(c===10.1){visual.ready=0;visual.opCount=0;}if(c===10.2)visual.result=0;if(c===11){visual.extra=0;visual.cloud=0;visual.tools=1;visual.data=3;}if(c===11.1){visual.extra=1;visual.cloud=0;visual.tools=0;visual.data=0;visual.selectionComplete=0;}if(c===12){visual.reshape=.5;visual.bloat=0;visual.load=0;visual.work=0;visual.impacts=0;}}
    const moving=JSON.stringify(from.agent)!==JSON.stringify(target.agent)||JSON.stringify(from.llm)!==JSON.stringify(target.llm);
    const ok=await animate(reduced?1:moving?750:220,token,t=>render(interpolate(from,visual,t*t*(3-2*t))));if(!ok)return;
    current=target;if(!reduced)await flow(index,token);if(token!==generation)return;
    busy=false;clean();render(current);update();
  }
  titles.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=t;selector.append(o);});
  jump(0);
  return {
    next(){if(busy)return false;if(index===codes.length-1)return false;advance();return true;},
    previous(){if(index===0)return false;jump(index-1);return true;},
    replay(){advance(true);},
    jump,
    cancel(){jump(index);},
    getState(){return {step:index,busy,count:codes.length,title:titles[index],code:codes[index]};},
    states:titles
  };
}
