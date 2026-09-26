'use strict';
/* ==========================================================
   CLUB BUILDER J — 画面
   ========================================================== */
const $ = s => document.querySelector(s);
const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const COLORS = ['#C8102E', '#0033A0', '#F5A800', '#00843D', '#6A1B9A', '#E85D04', '#1B1B1B', '#00A3E0'];
const UI = {
  tab: 'home', squad: 'list', sort: 'pos', mkt: 'search', club: 'fac', lg: 'table', lgDiv: null,
  f: { src: 'J3', pos: '', sort: 'ovr', q: '' }, limit: 40,
  setup: { color: COLORS[0], diff: 'normal' },
  sheet: null, nego: null, queue: [], confirm: null,
};

/* ---------- 共通部品 ---------- */
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}
function clubName(cid) { return cid >= 0 ? G.C[cid].name : ''; }
function whereOf(p) {
  if (p.c === G.me.cid) return '';
  if (p.c >= 0) return `${G.C[p.c].div} ${G.C[p.c].name}`;
  if (p.c === -2) return p.ab;
  return 'フリー';
}
const knowsPot = p => p.c === G.me.cid || G.watch.includes(p.id);
function condBar(p) {
  const c = Math.round(p.cond), cls = c >= 75 ? '' : c >= 55 ? 'mid' : 'low';
  return `<span class="bar" title="コンディション${c}%"><i class="${cls}" style="width:${c}%"></i></span>`;
}
function prow(p, extra = '') {
  const tags = (p.inj ? `<span class="tag">負傷${p.inj}週</span>` : '') + (p.sus ? '<span class="tag">出場停止</span>' : '')
    + (p.legend ? '<span class="tag leg">レジェンド</span>' : '') + (p.listed ? '<span class="tag list">移籍リスト</span>' : '');
  const where = whereOf(p);
  const sub = `${p.age}歳${p.sub ? ' · ' + p.pos + '/' + p.sub : ''}${where ? ' · ' + h(where) : ''}${isForeign(p) ? ' · ' + h(p.nat) : ''}`;
  const side = extra || `${knowsPot(p) ? `<span class="grade" title="伸びしろ">${potGrade(p.pot)}</span>` : '<span class="grade">?</span>'}${p.c === G.me.cid ? condBar(p) : `<span class="num">${fmtMoney(valueOf(p))}</span>`}`;
  return `<button class="prow" data-a="player" data-id="${p.id}">
    <span class="pos pos-${POS_GROUP[p.pos]}">${p.pos}</span>
    <span class="pn"><b>${h(p.n)}${tags}</b><small>${sub}</small></span>
    <span class="side">${side}</span>
    <span class="ovr num">${ovrI(p)}</span></button>`;
}
function seg(key, cur, items) {
  return `<div class="sub" role="group">${items.map(([v, t]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${cur === v}">${t}</button>`).join('')}</div>`;
}
function chips(key, cur, items) {
  return `<div class="chips">${items.map(([v, t]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${cur === v}">${t}</button>`).join('')}</div>`;
}
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  squad: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.5c2.8 0 4.8 1.6 5.5 4.5"/>',
  market: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
  club: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M4 21h16"/>',
  league: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
};

/* ---------- 設立画面 ---------- */
function renderStart() {
  const saved = load();
  const s = UI.setup;
  $('#start').innerHTML = `<div class="start-in">
    <div class="brand"><span class="eyebrow">HOMETOWN FOOTBALL CLUB SIMULATOR</span>
      <h1>CLUB<br>BUILDER <span>J</span></h1>
      <p>ホームタウンに新しいクラブを立ち上げ、J3からJ1の頂点を目指す。スタジアムを広げ、選手を集め、育てるのはあなたです。</p></div>
    ${saved ? `<div class="field"><button class="btn amber wide" data-a="continue">続きから（${h(saved.C[saved.me.cid].name)} ${saved.year}年）</button></div>` : ''}
    <div class="field"><label for="cname">クラブ名</label><input id="cname" maxlength="16" value="FCホームタウン"></div>
    <div class="field"><label for="cshort">略称（エンブレムに表示・3文字まで）</label><input id="cshort" maxlength="3" value="FCH"></div>
    <div class="field"><label for="pref">ホームタウン</label><select id="pref">${PREFS.map(p => `<option value="${p[0]}" ${p[0] === '東京' ? 'selected' : ''}>${p[0]}（人口${p[1]}万人）</option>`).join('')}</select>
      <small style="opacity:.8">人口が多いほど、観客とサポーターを集めやすくなります。</small></div>
    <div class="field"><label>クラブカラー</label><div class="swatches">${COLORS.map(c => `<button class="sw" style="background:${c}" data-a="color" data-v="${c}" aria-label="${c}" aria-pressed="${s.color === c}"></button>`).join('')}</div></div>
    <div class="field"><label>難易度</label><div class="seg">${Object.entries(DIFF).map(([k, d]) => `<button data-a="diff" data-v="${k}" aria-pressed="${s.diff === k}">${d.n}（資金${fmtMoney(d.money)}）</button>`).join('')}</div></div>
    <button class="btn amber wide" data-a="found">クラブを設立する</button>
    ${saved ? '<small style="opacity:.8">新しく設立すると、いまのセーブデータは上書きされます。</small>' : ''}
    <div class="start-note"><b>遊び方</b>
      <span>1. プレシーズンにスポンサーを選び、選手をそろえる</span>
      <span>2. 「試合へ」で1節ずつ進める。38節でシーズン終了</span>
      <span>3. 上位3クラブが昇格。J2は1万人、J1は1万5千人のスタジアムが必要</span>
      <span>選手データ：Jリーグ${window.PLAYER_DATA.J.length}人、欧州${window.PLAYER_DATA.EU.length}人、レジェンド${window.PLAYER_DATA.JL.length + window.PLAYER_DATA.EL.length}人</span></div>
  </div>`;
}

/* ---------- 本体 ---------- */
function render() {
  if (!G) return;
  document.documentElement.style.setProperty('--club', me().color || COLORS[0]);
  const m = G.me;
  $('#top').innerHTML = `<div class="crest" style="background:${me().color}">${h(m.short)}</div>
    <div class="top-name"><b>${h(me().name)}</b><small>${G.year}年 ${myDiv()} · ${G.phase === 'pre' ? 'プレシーズン' : `第${G.md}節終了`}</small></div>
    <div class="top-money num"><small>資金</small><span style="${m.money < 0 ? 'color:#FF9C94' : ''}">${fmtMoney(m.money)}</span></div>`;
  const tabs = [['home', 'ホーム'], ['squad', '選手'], ['market', '移籍'], ['club', 'クラブ'], ['league', '順位']];
  $('#tabs').innerHTML = tabs.map(([k, t]) => `<button data-a="tab" data-v="${k}" ${UI.tab === k ? 'aria-current="page"' : ''}>
    <svg viewBox="0 0 24 24">${ICONS[k]}</svg>${k === 'market' && G.offers.length ? `<span class="badge">${G.offers.length}</span>` : ''}${t}</button>`).join('');
  $('#main').innerHTML = ({ home: vHome, squad: vSquad, market: vMarket, club: vClub, league: vLeague })[UI.tab]();
  renderSheet();
}

function vHome() {
  const m = G.me;
  let hero;
  if (G.phase === 'pre') {
    const probs = canStart();
    const items = [
      ['sponsor', 'メインスポンサーを選ぶ', m.sponsor ? h(m.sponsor.n) : '必須', !!m.sponsor, !m.sponsor],
      ['renew', '契約更改', m.renew.length ? `${m.renew.length}人が満了` : 'なし', !m.renew.length, false],
      ['youth', 'ユースからの昇格', m.youth.length ? `候補${m.youth.length}人` : 'なし', !m.youth.length, false],
      ['camp', 'キャンプ地', { none: '行かない', home: '国内', abroad: '海外' }[m.camp], m.camp !== 'none', false],
      ['staff', 'スタッフを補強', `候補${m.staffCands.length}人`, false, false],
      ['market', '選手を補強', `${me().pids.length}人在籍`, me().pids.length >= SQUAD_MIN, me().pids.length < SQUAD_MIN],
    ];
    hero = `<section class="fixture"><div class="fx-meta"><span>PRE-SEASON</span><span>${G.year}年 ${myDiv()}</span></div>
      <div class="fx-vs" style="grid-template-columns:1fr"><div class="fx-team"><b>開幕まであと少し</b><small>準備を整えてシーズンを始めよう</small></div></div>
      <button class="btn amber wide" data-a="kickoff" ${probs.length ? 'disabled' : ''}>シーズン開幕</button>
      ${probs.length ? `<small style="position:relative;opacity:.85">${probs.map(h).join(' / ')}</small>` : ''}</section>
      <section class="card"><h2>プレシーズンの準備</h2><div class="check">${items.map(([k, t, v, on, need]) => `<button data-a="pre" data-v="${k}"><span class="dot ${on ? 'on' : need ? 'need' : ''}"></span><span>${t}<br><small class="muted">${v}</small></span><span class="chev">›</span></button>`).join('')}</div></section>`;
  } else {
    const nf = nextFixture();
    const cn = cupNext();
    if (nf) {
      const opp = G.C[nf.opp];
      const H = nf.home ? me() : opp, A = nf.home ? opp : me();
      hero = `<section class="fixture"><div class="fx-meta"><span>${myDiv()} 第${nf.md}節</span><span>${nf.home ? 'HOME' : 'AWAY'}</span></div>
        <div class="fx-vs"><div class="fx-team"><b>${h(H.name)}</b><small>${rankOf(H.id)}位</small></div><div class="fx-mid">VS</div><div class="fx-team"><b>${h(A.name)}</b><small>${rankOf(A.id)}位</small></div></div>
        ${cn === nf.md ? `<small style="position:relative;opacity:.85">この節のあとに天皇杯${CUP_ROUNDS[G.cup.r]}があります</small>` : ''}
        <button class="btn amber wide" data-a="next">試合へ</button></section>`;
    } else hero = '';
  }
  const t = G.tb[m.cid], rk = rankOf(m.cid);
  const cap = FAC.stadium.cap[m.fac.stadium];
  return `${hero}
    <div class="stats">
      <div class="stat"><small>資金</small><b class="num" style="${m.money < 0 ? 'color:var(--bad)' : ''}">${fmtMoney(m.money)}</b></div>
      <div class="stat"><small>サポーター</small><b class="num">${m.fans.toLocaleString()}人</b></div>
      <div class="stat"><small>${myDiv()} 順位</small><b class="num">${G.phase === 'pre' ? '—' : rk + '位'}</b><small class="num">${t.w}勝${t.d}分${t.l}敗</small></div>
      <div class="stat"><small>スタジアム</small><b class="num">${cap.toLocaleString()}人</b><span class="pill ${windowOpen() ? 'good' : ''}">移籍市場 ${windowOpen() ? '開' : '閉'}</span></div>
    </div>
    ${G.offers.length ? `<section class="card"><h2>届いているオファー</h2>${G.offers.map((o, i) => offerRow(o, i)).join('')}</section>` : ''}
    <section class="card"><h2>ニュース</h2><ul class="news">${G.news.slice(0, 14).map(n => `<li class="${n.kind}"><span class="when num">${n.y}<br>${n.md ? n.md + '節' : 'オフ'}</span><span>${n.kind === 'big' ? `<b>${h(n.text)}</b>` : h(n.text)}</span></li>`).join('')}</ul></section>`;
}
function offerRow(o, i) {
  const p = G.P[o.pid]; if (!p) return '';
  return `<div class="fac-a" style="border-top:1px solid var(--line);padding-top:10px"><span><b>${h(p.n)}</b>（${ovrI(p)}）<br><small class="muted">${h(G.C[o.from].name)}から ${fmtMoney(o.fee)} · 期限あと${o.exp - G.wk + 1}週</small></span>
    <span class="btns"><button class="btn sm" data-a="offerOk" data-i="${i}">売却</button><button class="btn sm ghost" data-a="offerNg" data-i="${i}">断る</button></span></div>`;
}

/* ---------- 選手 ---------- */
function vSquad() {
  const list = players(me());
  const sal = list.reduce((s, p) => s + p.sal, 0);
  let body;
  if (UI.squad === 'list') {
    const ord = { pos: (a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos) || b.ovr - a.ovr, ovr: (a, b) => b.ovr - a.ovr, age: (a, b) => a.age - b.age, cond: (a, b) => a.cond - b.cond };
    const xi = new Set((G.me.lineup || []).filter(x => x != null));
    body = `${chips('sort', UI.sort, [['pos', 'ポジション順'], ['ovr', '評価順'], ['age', '若い順'], ['cond', '疲れている順']])}
      <div class="plist">${list.sort(ord[UI.sort]).map(p => prow(p, `${xi.has(p.id) ? '<span class="pill good">先発</span>' : ''}<span class="grade">${potGrade(p.pot)}</span>${condBar(p)}`)).join('')}</div>
      <small class="muted">右の英字は伸びしろ（S〜E）、バーはコンディションです。</small>`;
  } else body = vLineup();
  return `${seg('squad', UI.squad, [['list', '選手一覧'], ['xi', '布陣・戦術']])}
    <div class="stats"><div class="stat"><small>在籍</small><b class="num">${list.length} / ${SQUAD_MAX}人</b></div>
    <div class="stat"><small>年俸総額</small><b class="num">${fmtMoney(sal)}</b></div>
    <div class="stat"><small>平均評価（上位14人）</small><b class="num">${clubStrength(me()).toFixed(1)}</b></div>
    <div class="stat"><small>練習方針</small><b>${{ normal: '通常', youth: '若手育成', rest: '回復重視' }[G.me.policy]}</b></div></div>
    ${body}`;
}
function vLineup() {
  const m = G.me, F = FORMS[m.form];
  const { xi, bench } = myXI();
  const slots = xi.map((x, i) => {
    const [l, t] = F.xy[i], p = x.p;
    const poor = p && fit(p, x.slot) < .9;
    return `<button class="slot ${p ? '' : 'empty'} ${poor ? 'poor' : ''}" style="left:${l}%;top:${t}%" data-a="slot" data-i="${i}">
      <span class="sp">${x.slot}</span><span class="chip">${p ? `<b>${h(p.n.split(/[ 　]/).pop())}</b><span class="num">${Math.floor(effOf(p, x.slot))}</span>` : '<b>空き</b><span>—</span>'}</span></button>`;
  }).join('');
  return `<section class="card opts">
      <div class="opt-row"><small>フォーメーション</small>${chips('form', m.form, Object.keys(FORMS).map(k => [k, k]))}</div>
      <div class="opt-row"><small>戦い方</small>${chips('style', m.style, Object.entries(STYLES).map(([k, s]) => [k, s.n]))}</div>
      <div class="toggle"><span>前線からプレス<br><small class="muted">中盤で優位に立てるが、疲れやすい</small></span><button class="sw-t" role="switch" aria-checked="${m.press}" data-a="press" aria-label="前線からプレス"></button></div>
      <div class="toggle"><span>毎試合、自動で先発を選ぶ<br><small class="muted">コンディションとけがを見て最適な11人を組む</small></span><button class="sw-t" role="switch" aria-checked="${m.auto}" data-a="auto" aria-label="自動で先発を選ぶ"></button></div>
    </section>
    <div class="pitch"><span class="circle"></span><span class="box t"></span><span class="box b"></span>${slots}</div>
    <small class="muted" style="text-align:center">選手をタップして入れ替え。数字は適性とコンディションを反映した実力。枠が黄色いのはポジション違いです。</small>
    <section class="card"><h2>控え</h2><div class="plist" style="border:0">${bench.map(p => prow(p, condBar(p))).join('') || '<div class="empty">控えがいません</div>'}</div></section>`;
}

/* ---------- 移籍 ---------- */
function marketList() {
  const f = UI.f;
  let L;
  if (f.src === 'watch') L = G.watch.map(id => G.P[id]).filter(p => p && p.c !== G.me.cid);
  else if (f.src === 'FA') L = G.P.filter(p => p && p.c === -1);
  else L = G.P.filter(p => p && p.c >= 0 && p.c !== G.me.cid && G.C[p.c].div === f.src);
  if (f.pos) L = L.filter(p => p.pos === f.pos || p.sub === f.pos);
  if (f.q) L = L.filter(p => p.n.includes(f.q) || (p.c >= 0 && G.C[p.c].name.includes(f.q)) || (p.ab || '').includes(f.q));
  const ord = { ovr: (a, b) => b.ovr - a.ovr, age: (a, b) => a.age - b.age, cheap: (a, b) => valueOf(a) - valueOf(b), pot: (a, b) => (knowsPot(b) ? b.pot : 0) - (knowsPot(a) ? a.pot : 0) };
  return L.sort(ord[f.sort]);
}
function vMarket() {
  const open = windowOpen();
  const banner = `<div class="banner ${open ? 'open' : ''}">${open ? '移籍市場が開いています。クラブに所属する選手と交渉できます。' : '移籍市場は閉まっています（プレシーズンと第17〜20節のあとに開きます）。フリーの選手とはいつでも交渉できます。'}</div>`;
  let body = '';
  if (UI.mkt === 'search') {
    const L = marketList();
    body = `<div class="opts">
      ${chips('src', UI.f.src, [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['FA', 'フリー'], ['watch', `リスト(${G.watch.length})`]])}
      ${chips('pos', UI.f.pos, [['', '全員'], ...POS.map(p => [p, p])])}
      ${chips('fsort', UI.f.sort, [['ovr', '評価順'], ['pot', '伸びしろ順'], ['age', '若い順'], ['cheap', '安い順']])}
      <input id="q" type="search" placeholder="選手名・クラブ名でさがす" value="${h(UI.f.q)}"></div>
      <small class="muted">${L.length}人が見つかりました。伸びしろはスカウトがリストに入れた選手だけ分かります。欧州の選手はスカウトを派遣すると「リスト」に入ります。</small>
      <div class="plist">${L.slice(0, UI.limit).map(p => prow(p)).join('') || '<div class="empty">該当する選手はいません</div>'}
      ${L.length > UI.limit ? `<button class="more" data-a="more">さらに表示（残り${L.length - UI.limit}人）</button>` : ''}</div>`;
  } else if (UI.mkt === 'scout') {
    const s = G.scout, lv = G.me.staff.scout.lv;
    body = `<section class="card"><h2>スカウト派遣</h2>
      <p class="muted" style="margin:0;font-size:14px">スカウト ${h(G.me.staff.scout.n)}（Lv${lv}）。派遣先から有望な選手を${3 + lv}人見つけてリストに加えます。プレシーズン中はその場で戻ります。</p>
      ${s ? `<div class="banner">${h(s.n)}を視察中。あと${s.left}週で戻ります。</div>` : ''}
      <div>${scoutRegions().map(r => `<button class="region" data-a="scout" data-k="${h(r.k)}" ${s || r.lock ? 'disabled' : ''}><span><b>${h(r.n)}</b><br><small class="muted">${r.lock ? `スカウトLv${r.need}以上で派遣できます` : `${r.wk}週 · ${fmtMoney(r.cost)}`}</small></span><span class="chev muted">›</span></button>`).join('')}</div></section>`;
  } else {
    body = `<section class="card"><h2>届いているオファー</h2>${G.offers.length ? G.offers.map((o, i) => offerRow(o, i)).join('') : '<div class="empty">いまはオファーがありません。選手を移籍リストに載せると届きやすくなります。</div>'}</section>
      <section class="card"><h2>交渉の記録</h2>${G.log.length ? `<ul class="news">${G.log.slice(0, 15).map(l => `<li><span class="when num">${l.y}<br>${l.md ? l.md + '節' : 'オフ'}</span><span>${h(l.text)}</span></li>`).join('')}</ul>` : '<div class="empty">まだ交渉していません</div>'}</section>`;
  }
  return `${seg('mkt', UI.mkt, [['search', '選手をさがす'], ['scout', 'スカウト'], ['offers', `オファー${G.offers.length ? '(' + G.offers.length + ')' : ''}`]])}${banner}${body}`;
}

/* ---------- クラブ ---------- */
function vClub() {
  const m = G.me;
  let body = '';
  if (UI.club === 'fac') {
    body = `<section class="card"><h2>施設</h2>${Object.entries(FAC).map(([k, f]) => {
      const lv = m.fac[k], nx = lv + 1, b = m.build.find(x => x.k === k);
      const pips = Array.from({ length: f.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      const cur = k === 'stadium' ? `収容${f.cap[lv].toLocaleString()}人` : `Lv${lv}`;
      const act = b ? `<span class="pill amber">Lv${b.lv}へ工事中・あと${b.w}週</span>`
        : nx > f.max ? '<span class="pill good">最大レベル</span>'
          : `<button class="btn sm" data-a="build" data-k="${k}" ${m.money < f.cost[nx] ? 'disabled' : ''}>Lv${nx}へ ${fmtMoney(f.cost[nx])}・${f.wk[nx]}週</button>`;
      return `<div class="fac"><div class="fac-h"><b>${f.n}</b><span class="pips">${pips}</span></div><p>${f.desc}</p>
        <div class="fac-a"><small class="muted">いま：${cur}${k === 'stadium' && nx <= f.max ? ` → ${f.cap[nx].toLocaleString()}人` : ''}</small>${act}</div></div>`;
    }).join('')}</section>`;
  } else if (UI.club === 'staff') {
    body = `<section class="card"><h2>いまのスタッフ</h2><div class="rows">${Object.entries(STAFF).map(([k, s]) => `<div><span><b>${s.n}</b> ${h(m.staff[k].n)}<br><small class="muted">${s.desc}</small></span><span class="num">Lv${m.staff[k].lv}<br><small class="muted">${fmtMoney(m.staff[k].sal)}/年</small></span></div>`).join('')}</div></section>
      <section class="card"><h2>候補</h2>${G.phase !== 'pre' ? '<div class="empty">スタッフの入れ替えはプレシーズンにできます</div>' : m.staffCands.length ? `<div class="rows">${m.staffCands.map((s, i) => `<div><span><b>${STAFF[s.role].n}</b> ${h(s.n)}<br><small class="muted">Lv${s.lv} · 年俸${fmtMoney(s.sal)} · 契約金${fmtMoney(Math.round(s.sal * .5))}</small></span><button class="btn sm" data-a="hire" data-i="${i}" ${s.lv <= m.staff[s.role].lv ? 'disabled' : ''}>${s.lv <= m.staff[s.role].lv ? 'いまと同等以下' : '契約する'}</button></div>`).join('')}</div>` : '<div class="empty">候補はいません</div>'}</section>`;
  } else if (UI.club === 'money') {
    const f = G.fin, inn = Object.values(f.in).reduce((a, b) => a + b, 0), out = Object.values(f.out).reduce((a, b) => a + b, 0);
    const IN = { ticket: '入場料', merch: 'グッズ', sponsor: 'スポンサー', dist: 'リーグ分配金', prize: '賞金', sale: '選手売却' };
    const OUT = { salary: '選手年俸', staff: 'スタッフ年俸', maint: '施設維持費', build: '施設工事', buy: '移籍金', other: 'その他（キャンプ・スカウトなど）' };
    const att = f.att.length ? Math.round(f.att.reduce((a, b) => a + b, 0) / f.att.length) : 0;
    body = `<section class="card"><h2>${G.year}年の収支</h2><div class="rows">
        ${Object.entries(IN).map(([k, t]) => `<div><span>${t}</span><span class="num">${fmtMoney(f.in[k] || 0)}</span></div>`).join('')}
        <div class="total"><span>収入 計</span><span class="num">${fmtMoney(inn)}</span></div></div>
      <div class="rows">${Object.entries(OUT).map(([k, t]) => `<div><span>${t}</span><span class="num">−${fmtMoney(f.out[k] || 0)}</span></div>`).join('')}
        <div class="total"><span>支出 計</span><span class="num">−${fmtMoney(out)}</span></div>
        <div class="total"><span>収支</span><span class="num" style="color:var(--${inn - out >= 0 ? 'good' : 'bad'})">${fmtMoney(inn - out)}</span></div></div></section>
      <section class="card"><h2>チケット価格</h2>
        <div class="fac-a"><div class="stepper"><button data-a="price" data-v="-500" aria-label="下げる">−</button><b class="num">${m.price.toLocaleString()}円</b><button data-a="price" data-v="500" aria-label="上げる">＋</button></div>
        <small class="muted">平均観客 ${att.toLocaleString()}人 / 収容${FAC.stadium.cap[m.fac.stadium].toLocaleString()}人</small></div>
        <small class="muted">安いほど観客が増え、高いほど1人あたりの収入が増えます。</small></section>
      <section class="card"><h2>スポンサー</h2>${m.sponsor ? `<div class="rows"><div><span><b>${h(m.sponsor.n)}</b><br><small class="muted">${h(m.sponsor.note)}</small></span><span class="num">${fmtMoney(m.sponsor.amt)}/年</span></div></div>` : '<div class="empty">プレシーズンに選んでください</div>'}</section>
      <section class="card"><h2>練習方針</h2>${chips('policy', m.policy, [['normal', '通常'], ['youth', '若手育成'], ['rest', '回復重視']])}
        <small class="muted">若手育成：23歳以下が伸びやすいが疲れが抜けにくい。回復重視：コンディションが戻りやすいが成長は遅め。</small></section>`;
  } else {
    body = `<section class="card"><h2>タイトル</h2>${G.titles.length ? `<div class="rows">${G.titles.map(t => `<div><span>${h(t.t)}</span><span class="num">${t.y}年</span></div>`).join('')}</div>` : '<div class="empty">まだタイトルはありません</div>'}</section>
      <section class="card"><h2>歴代成績</h2>${G.hist.length ? `<div class="tbl-wrap" style="border:0"><table><thead><tr><th>年</th><th>リーグ</th><th>順位</th><th>勝-分-敗</th><th>天皇杯</th><th>サポーター</th></tr></thead><tbody>${G.hist.slice().reverse().map(r => `<tr><td>${r.y}</td><td>${r.div}</td><td>${r.rank}位</td><td>${r.w}-${r.d}-${r.l}</td><td>${h(r.cup)}</td><td>${r.fans.toLocaleString()}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">最初のシーズンが終わると記録されます</div>'}</section>
      <section class="card"><h2>設定</h2>
        <div class="toggle"><span>試合経過を表示する<br><small class="muted">オフにすると結果だけを表示します</small></span><button class="sw-t" role="switch" aria-checked="${m.watch !== false}" data-a="watchT" aria-label="試合経過を表示"></button></div>
        ${UI.confirm === 'reset' ? `<div class="confirm"><b>セーブデータを消して最初からやり直しますか？</b><span class="btns"><button class="btn sm bad" data-a="resetYes">消してやり直す</button><button class="btn sm ghost" data-a="confirmNo">やめる</button></span></div>` : '<button class="btn ghost" data-a="reset">最初からやり直す</button>'}
      </section>`;
  }
  return `${seg('club', UI.club, [['fac', '施設'], ['staff', 'スタッフ'], ['money', '経営'], ['rec', '記録・設定']])}${body}`;
}

/* ---------- 順位 ---------- */
function vLeague() {
  const d = UI.lgDiv || myDiv();
  let body = '';
  if (UI.lg === 'table') {
    const T = table(d);
    body = `<div class="tbl-wrap"><table><thead><tr><th></th><th>クラブ</th><th>試</th><th>勝</th><th>分</th><th>敗</th><th>得失</th><th>勝点</th><th>直近</th></tr></thead><tbody>${T.map((r, i) => {
      const zone = (d !== 'J1' && i < 3) ? 'up' : (d !== 'J3' && i >= T.length - 3) ? 'down' : '';
      return `<tr class="${r.id === G.me.cid ? 'mine' : ''}"><td class="num" style="text-align:left;position:relative;padding-left:10px"><span style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${zone === 'up' ? 'var(--good)' : zone === 'down' ? 'var(--bad)' : 'transparent'}"></span>${i + 1}</td><td>${h(G.C[r.id].name)}</td><td>${r.w + r.d + r.l}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.p}</b></td><td class="form">${r.f.split('').map(x => `<span class="${x}">${{ W: '○', D: '△', L: '●' }[x]}</span>`).join('')}</td></tr>`;
    }).join('')}</tbody></table></div>
    <small class="muted">${d === 'J1' ? '下位3クラブがJ2へ降格。' : d === 'J2' ? '上位3クラブがJ1へ昇格、下位3クラブがJ3へ降格。' : '上位3クラブがJ2へ昇格。'}</small>`;
  } else if (UI.lg === 'res') {
    const last = G.last[d] || [];
    const nxt = G.phase === 'season' && G.md < SEASON_WEEKS ? G.fx[d][G.md] : G.phase === 'pre' ? G.fx[d][0] : [];
    const row = (a, b, mid) => `<div class="fac-a" style="border-top:1px solid var(--line);padding:8px 0;flex-wrap:nowrap"><span style="flex:1;text-align:right;${a === G.me.cid ? 'font-weight:700' : ''}">${h(G.C[a].name)}</span><b class="num" style="min-width:56px;text-align:center">${mid}</b><span style="flex:1;${b === G.me.cid ? 'font-weight:700' : ''}">${h(G.C[b].name)}</span></div>`;
    body = `<section class="card"><h2>${G.md ? `第${G.md}節の結果` : '結果'}</h2>${last.length ? last.map(r => row(r.h, r.a, `${r.gh} - ${r.ga}`)).join('') : '<div class="empty">まだ試合がありません</div>'}</section>
      <section class="card"><h2>次の節の組み合わせ</h2>${nxt.length ? nxt.map(([a, b]) => row(a, b, 'vs')).join('') : '<div class="empty">今シーズンの日程は終わりました</div>'}</section>`;
  } else if (UI.lg === 'sc') {
    const L = G.P.filter(p => p && p.c >= 0 && G.C[p.c].div === d && p.st.g > 0).sort((a, b) => b.st.g - a.st.g || b.st.a - a.st.a).slice(0, 20);
    body = `<div class="tbl-wrap"><table><thead><tr><th></th><th>選手</th><th>得点</th><th>アシスト</th><th>出場</th></tr></thead><tbody>${L.map((p, i) => `<tr class="${p.c === G.me.cid ? 'mine' : ''}" data-a="player" data-id="${p.id}"><td>${i + 1}</td><td>${h(p.n)}<br><small class="muted">${h(G.C[p.c].name)}</small></td><td><b>${p.st.g}</b></td><td>${p.st.a}</td><td>${p.st.ap}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">まだ得点がありません</td></tr>'}</tbody></table></div>`;
  } else {
    const cup = G.cup, mine = G.me.cid;
    const status = cup.champ != null ? `優勝：${h(G.C[cup.champ].name)}` : cup.out[mine] ? `${h(me().name)}は${cup.out[mine]}で敗退` : `次は${CUP_ROUNDS[cup.r]}（第${CUP_AFTER[cup.r]}節のあと）`;
    const tie = cup.ties.find(t => t.includes(mine));
    const byRound = CUP_ROUNDS.map((n, r) => ({ n, list: cup.res.filter(x => x.r === r) })).filter(x => x.list.length);
    body = `<section class="card"><h2>天皇杯</h2><div class="banner">${status}${tie ? `<br>対戦相手：${h(G.C[tie[0] === mine ? tie[1] : tie[0]].name)}` : ''}${cup.r === 0 && cup.byes.includes(mine) ? '<br>シードのため2回戦から出場' : ''}</div>
      <small class="muted">全60クラブのトーナメント。優勝賞金1.5億円。第${CUP_AFTER.join('・')}節のあとに行われます。</small></section>
      ${byRound.reverse().map(r => `<section class="card"><h2>${r.n}</h2>${r.list.filter(x => r.list.length <= 8 || x.h === mine || x.a === mine || DIVS.indexOf(G.C[x.h].div) === 0).map(x => `<div class="fac-a" style="border-top:1px solid var(--line);padding:6px 0;flex-wrap:nowrap;font-size:14px"><span style="flex:1;text-align:right">${h(G.C[x.h].name)}</span><b class="num" style="min-width:70px;text-align:center">${x.gh}-${x.ga}${x.pk ? `<br><small>PK${x.pk[0]}-${x.pk[1]}</small>` : ''}</b><span style="flex:1">${h(G.C[x.a].name)}</span></div>`).join('')}</section>`).join('')}`;
  }
  return `${seg('lg', UI.lg, [['table', '順位表'], ['res', '結果・日程'], ['sc', '得点ランキング'], ['cup', '天皇杯']])}
    ${UI.lg !== 'cup' ? chips('lgDiv', d, DIVS.map(x => [x, x])) : ''}${body}`;
}

/* ---------- シート（下から出るパネル） ---------- */
function openSheet(s) { UI.sheet = s; renderSheet(); }
function closeSheet() { UI.sheet = null; UI.nego = null; UI.confirm = null; renderSheet(); }
function renderSheet() {
  const root = $('#sheetRoot');
  if (!UI.sheet) { root.innerHTML = ''; return; }
  const scroll = root.querySelector('.sheet') ? root.querySelector('.sheet').scrollTop : 0;
  const s = UI.sheet;
  const content = ({ player: shPlayer, slot: shSlot, sponsor: shSponsor, renew: shRenew, youth: shYouth, camp: shCamp, season: shSeason })[s.t](s);
  root.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true">${content}</div></div>`;
  root.querySelector('.sheet').scrollTop = scroll;
}
const sheetHead = (title, sub) => `<div class="sheet-h"><div><h3>${title}</h3>${sub ? `<small class="muted">${sub}</small>` : ''}</div><button class="x" data-a="close" aria-label="閉じる">×</button></div>`;

function shPlayer(s) {
  const p = G.P[s.id];
  if (!p) return sheetHead('選手') + '<div class="empty">この選手はもういません</div>';
  const mine = p.c === G.me.cid;
  const kp = knowsPot(p);
  const where = mine ? me().name : whereOf(p);
  let actions = '';
  if (mine) {
    actions = `<div class="btns"><button class="btn sm ghost" data-a="listT" data-id="${p.id}">${p.listed ? '移籍リストから外す' : '移籍リストに載せる'}</button>
      <button class="btn sm ghost" data-a="releaseAsk">契約を解除する</button></div>
      ${UI.confirm === 'release' ? `<div class="confirm"><b>${h(p.n)}との契約を解除しますか？</b><small>違約金として年俸の半分（${fmtMoney(Math.round(p.sal * .5))}）がかかります。</small><span class="btns"><button class="btn sm bad" data-a="release" data-id="${p.id}">解除する</button><button class="btn sm ghost" data-a="confirmNo">やめる</button></span></div>` : ''}`;
  } else {
    const n = UI.nego && UI.nego.pid === p.id ? UI.nego : null;
    if (n) {
      const od = negoOdds(p, n.fee, n.sal), tot = od.club * od.player;
      const lab = tot >= .7 ? ['good', '見込み：高い'] : tot >= .4 ? ['amber', '見込み：五分'] : tot >= .15 ? ['', '見込み：低い'] : ['bad', '見込み：かなり厳しい'];
      actions = `<section class="card"><h2>獲得交渉</h2>
        ${p.c !== -1 ? `<div class="fac-a"><span>移籍金<br><small class="muted">目安 ${fmtMoney(valueOf(p))}</small></span><div class="stepper"><button data-a="ng" data-k="fee" data-v="-1" aria-label="下げる">−</button><b class="num">${fmtMoney(n.fee)}</b><button data-a="ng" data-k="fee" data-v="1" aria-label="上げる">＋</button></div></div>` : '<small class="muted">フリーの選手なので移籍金はかかりません。</small>'}
        <div class="fac-a"><span>年俸<br><small class="muted">希望 ${fmtMoney(od.expect)}</small></span><div class="stepper"><button data-a="ng" data-k="sal" data-v="-1" aria-label="下げる">−</button><b class="num">${fmtMoney(n.sal)}</b><button data-a="ng" data-k="sal" data-v="1" aria-label="上げる">＋</button></div></div>
        <div class="fac-a"><span>契約年数</span>${chips('ngy', String(n.yrs), [['1', '1年'], ['2', '2年'], ['3', '3年'], ['4', '4年']])}</div>
        <div class="odds"><span class="pill ${lab[0]}">${lab[1]}</span><small class="muted">クラブ ${Math.round(od.club * 100)}% × 本人 ${Math.round(od.player * 100)}%</small></div>
        ${n.msg ? `<div class="msg ${n.ok ? 'ok' : 'ng'}">${h(n.msg)}</div>` : ''}
        <button class="btn amber wide" data-a="offer" ${n.ok ? 'disabled' : ''}>この条件で申し込む</button></section>`;
    } else {
      const canTalk = p.c === -1 || windowOpen();
      actions = `<div class="btns"><button class="btn" data-a="negoOpen" data-id="${p.id}">獲得交渉する</button>
        ${p.c >= 0 || p.c === -1 ? `<button class="btn ghost" data-a="watchP" data-id="${p.id}">${G.watch.includes(p.id) ? 'リストから外す' : 'リストに入れる'}</button>` : ''}</div>
        ${canTalk ? '' : '<small class="muted">移籍市場が閉まっているので、いまは交渉できません。</small>'}`;
    }
  }
  return `${sheetHead(h(p.n), `${POS_NAME[p.pos]}${p.sub ? '・' + POS_NAME[p.sub] : ''}`)}
    <div class="phead"><div class="big-ovr num">${ovrI(p)}<small>評価</small></div>
      <div><b>${h(where)}</b><br><small class="muted">${p.age}歳 · ${h(p.nat || '日本')}${p.lgn ? ' · ' + h(p.lgn) : ''}</small>
      ${p.legend ? `<br><span class="pill amber">レジェンド（${h(p.legend)}）</span>` : ''}</div></div>
    <div class="kv">
      <div><small>伸びしろ</small><b>${kp ? `${potGrade(p.pot)}（上限 ${Math.floor(p.pot)}）` : '？（スカウトで判明）'}</b></div>
      <div><small>市場価値</small><b class="num">${fmtMoney(valueOf(p))}</b></div>
      ${mine || p.c >= 0 ? `<div><small>年俸</small><b class="num">${fmtMoney(p.sal)}</b></div><div><small>契約</small><b>残り${p.yrs}年</b></div>` : ''}
      ${mine ? `<div><small>コンディション</small><b class="num">${Math.round(p.cond)}%</b></div><div><small>状態</small><b>${p.inj ? `負傷・あと${p.inj}週` : p.sus ? '出場停止' : '出場できる'}</b></div>` : ''}
      ${p.c >= 0 ? `<div><small>今季</small><b class="num">${p.st.ap}試合 ${p.st.g}得点 ${p.st.a}アシスト</b></div>` : ''}
      ${p.tot && p.tot.ap ? `<div><small>通算（このゲーム内）</small><b class="num">${p.tot.ap}試合 ${p.tot.g}得点</b></div>` : ''}
    </div>${actions}`;
}
function shSlot(s) {
  const m = G.me, slot = FORMS[m.form].s[s.i];
  const cur = m.lineup[s.i];
  const L = players(me()).sort((a, b) => effOf(b, slot) - effOf(a, slot));
  return `${sheetHead(`${slot}（${POS_NAME[slot]}）に入れる選手`, '数字は適性とコンディションを反映した、この位置での実力')}
    <div class="plist">${L.map(p => {
      const inXI = m.lineup.indexOf(p.id);
      const note = p.id === cur ? '<span class="pill good">いまの選手</span>' : inXI >= 0 ? `<span class="pill">${FORMS[m.form].s[inXI]}で先発</span>` : '';
      return `<button class="prow" data-a="pickSlot" data-i="${s.i}" data-id="${p.id}" ${available(p) ? '' : 'disabled style="opacity:.45"'}>
        <span class="pos pos-${POS_GROUP[p.pos]}">${p.pos}</span><span class="pn"><b>${h(p.n)}</b><small>${p.inj ? '負傷中' : p.sus ? '出場停止' : `評価${ovrI(p)} · 調子${Math.round(p.cond)}%`}</small></span>
        <span class="side">${note}</span><span class="ovr num">${Math.floor(effOf(p, slot))}</span></button>`;
    }).join('')}</div>`;
}
function shSponsor() {
  const m = G.me;
  return `${sheetHead('メインスポンサー', '1シーズン契約。開幕までに1社を選んでください')}
    <div class="plist">${m.sponsorCands.map((s, i) => `<button class="prow" style="grid-template-columns:1fr auto" data-a="sponsor" data-i="${i}">
      <span class="pn"><b>${h(s.n)}</b><small>${h(s.note)}${s.win ? ` · 1勝ごと+${fmtMoney(s.win)}` : ''}${s.rank ? ` · 3位以内で+${fmtMoney(s.rank)}` : ''}</small></span>
      <span class="side"><b class="num" style="color:var(--ink);font-size:15px">${fmtMoney(s.amt)}/年</b>${m.sponsor && m.sponsor.n === s.n ? '<span class="pill good">契約中</span>' : ''}</span></button>`).join('')}</div>`;
}
function shRenew() {
  const m = G.me;
  return `${sheetHead('契約更改', '更改しなかった選手は開幕時に退団します')}
    ${m.renew.length ? `<div class="plist">${m.renew.map(r => { const p = G.P[r.id]; if (!p) return ''; return `<div class="prow" style="grid-template-columns:36px 1fr"><span class="pos pos-${POS_GROUP[p.pos]}">${p.pos}</span>
      <span class="pn"><b>${h(p.n)}（${ovrI(p)}・${p.age}歳）</b><small>希望年俸 ${fmtMoney(r.sal)}（いま${fmtMoney(p.sal)}）</small>
      <span class="btns" style="margin-top:6px"><button class="btn sm" data-a="renew" data-id="${p.id}" data-y="1">1年</button><button class="btn sm" data-a="renew" data-id="${p.id}" data-y="2">2年</button><button class="btn sm" data-a="renew" data-id="${p.id}" data-y="3">3年</button><button class="btn sm ghost" data-a="letgo" data-id="${p.id}">放出</button></span></span></div>`; }).join('')}</div>` : '<div class="empty">契約満了の選手はいません</div>'}`;
}
function shYouth() {
  const m = G.me;
  return `${sheetHead('ユースからの昇格', `ユースアカデミーLv${m.fac.youth}。年俸240万円・3年契約。開幕までに決めないと他へ進みます`)}
    ${m.youth.length ? `<div class="plist">${m.youth.map((y, i) => `<div class="prow"><span class="pos pos-${POS_GROUP[y.pos]}">${y.pos}</span>
      <span class="pn"><b>${h(y.n)}</b><small>${y.age}歳 · 伸びしろ ${potGrade(y.pot)}</small></span>
      <span class="side"><button class="btn sm" data-a="youth" data-i="${i}">昇格させる</button></span><span class="ovr num">${y.ovr}</span></div>`).join('')}</div>` : '<div class="empty">候補はもういません</div>'}`;
}
function shCamp() {
  const m = G.me;
  const opts = [['none', '行かない', '費用なし'], ['home', '国内キャンプ', `${fmtMoney(1500)} · 若手が少し伸び、全員のコンディションが整う`], ['abroad', '海外キャンプ', `${fmtMoney(6000)} · 若手が大きく伸び、ベテランも少し伸びる`]];
  return `${sheetHead('キャンプ地', '開幕のときに費用を払い、効果が出ます')}
    <div class="plist">${opts.map(([k, t, d]) => `<button class="prow" style="grid-template-columns:1fr auto" data-a="camp" data-v="${k}"><span class="pn"><b>${t}</b><small>${d}</small></span><span class="side">${m.camp === k ? '<span class="pill good">選択中</span>' : ''}</span></button>`).join('')}</div>`;
}
function shSeason(s) {
  const r = s.sum, f = r.fin;
  const inn = Object.values(f.in).reduce((a, b) => a + b, 0), out = Object.values(f.out).reduce((a, b) => a + b, 0);
  if (r.over) return `${sheetHead(`${r.year}年シーズン終了`)}<div class="confirm"><b>資金が−3億円を下回ったため、クラブの経営から退くことになりました。</b><small>最終成績：${r.div} ${r.rank}位</small><button class="btn bad" data-a="resetYes">新しいクラブをつくる</button></div>`;
  return `${sheetHead(`${r.year}年シーズン終了`, `${r.div} ${r.rank}位`)}
    <div class="fixture"><div class="fx-vs" style="grid-template-columns:1fr"><div class="fx-team"><b>${r.div} ${r.rank}位</b><small>来季は${r.newDiv}で戦います</small></div></div></div>
    <section class="card"><div class="rows">${r.lines.map(l => `<div><span>${h(l)}</span></div>`).join('')}
      <div><span>シーズン収入</span><span class="num">${fmtMoney(inn)}</span></div><div><span>シーズン支出</span><span class="num">−${fmtMoney(out)}</span></div>
      <div class="total"><span>収支</span><span class="num" style="color:var(--${inn - out >= 0 ? 'good' : 'bad'})">${fmtMoney(inn - out)}</span></div></div></section>
    <small class="muted">選手が1歳年をとり、引退や契約満了が発生しました。プレシーズンの準備を始めましょう。</small>
    <button class="btn amber wide" data-a="close">プレシーズンへ</button>`;
}

/* ---------- 試合画面 ---------- */
function showNextMatch() {
  const r = UI.queue.shift();
  if (!r) { afterMatches(); return; }
  const el = $('#match'); el.hidden = false;
  const H = G.C[r.h], A = G.C[r.a];
  const col = c => c.me ? (c.color || COLORS[0]) : 'rgba(247,231,198,.35)';
  el.innerHTML = `<div class="mb"><div class="mb-label">${h(r.label)}${r.cup ? '' : r.h === G.me.cid ? ' · HOME' : ' · AWAY'}</div>
    <div class="mb-score"><div class="mb-team"><i style="background:${col(H)}"></i><b>${h(H.name)}</b></div>
      <div class="mb-digits num"><span id="sH">0</span><span class="sep">-</span><span id="sA">0</span></div>
      <div class="mb-team"><i style="background:${col(A)}"></i><b>${h(A.name)}</b></div></div>
    <div class="mb-clock num" id="clk">0'</div></div>
    <div class="feed" id="feed" aria-live="polite"><div class="ev half"><span class="t">キックオフ</span></div></div>
    <div class="mctl" id="mctl"><button class="btn ghost" data-a="mFast">早送り</button><button class="btn amber" data-a="mSkip">結果へ</button></div>`;
  const run = { r, i: 0, m: 0, gh: 0, ga: 0, end: r.et ? 120 : 90, speed: 110 };
  UI.run = run;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (G.me.watch === false || reduce) { finishMatch(); return; }
  tick();
}
function tick() {
  const run = UI.run; if (!run || run.done) return;
  run.m++;
  const feed = $('#feed');
  while (run.i < run.r.ev.length && run.r.ev[run.i].m <= run.m) addEv(run.r.ev[run.i++], feed);
  $('#clk').textContent = `${Math.min(run.m, run.end)}'`;
  if (run.m >= run.end) { finishMatch(); return; }
  run.t = setTimeout(tick, run.speed);
}
function addEv(e, feed) {
  const run = UI.run;
  if (e.t === 'goal') { if (e.side === 0) run.gh++; else run.ga++; $('#sH').textContent = run.gh; $('#sA').textContent = run.ga; }
  const cls = e.t === 'half' || e.t === 'pk' ? 'half' : e.t;
  feed.insertAdjacentHTML('beforeend', `<div class="ev new ${cls} ${e.side === 1 ? 'a' : ''}"><span class="m num">${e.m}'</span><span class="t">${h(e.text)}</span></div>`);
  feed.scrollTop = feed.scrollHeight;
}
function finishMatch() {
  const run = UI.run; if (!run || run.done) return;
  run.done = true; clearTimeout(run.t);
  const feed = $('#feed'), r = run.r;
  while (run.i < r.ev.length) addEv(r.ev[run.i++], feed);
  $('#sH').textContent = r.gh; $('#sA').textContent = r.ga; $('#clk').textContent = '試合終了';
  const mine = r.h === G.me.cid ? 0 : 1;
  const res = r.win === mine ? '勝利' : r.win === -1 ? '引き分け' : '敗戦';
  const div = G.C[G.me.cid].div;
  const others = !r.cup ? (G.last[div] || []).filter(x => x.h !== r.h) : [];
  feed.insertAdjacentHTML('beforeend', `<div class="sum"><h4>${res}${r.pk ? `（PK ${r.pk[0]}-${r.pk[1]}）` : r.et ? '（延長）' : ''}</h4>
    ${r.att ? `<div class="row"><span>観客数</span><b class="num">${r.att.toLocaleString()}人</b></div>` : ''}
    <div class="row"><span>サポーター</span><b class="num">${r.fansDelta >= 0 ? '+' : ''}${r.fansDelta.toLocaleString()}人</b></div>
    ${!r.cup ? `<div class="row"><span>${div} 順位</span><b class="num">${rankOf(G.me.cid)}位</b></div>` : ''}</div>
    ${others.length ? `<div class="sum"><h4>ほかの試合</h4>${others.map(x => `<div class="res"><span>${h(G.C[x.h].name)}</span><b class="num">${x.gh}-${x.ga}</b><span>${h(G.C[x.a].name)}</span></div>`).join('')}</div>` : ''}`);
  feed.scrollTop = 0;
  $('#mctl').innerHTML = `<button class="btn amber" data-a="mClose">${UI.queue.length ? '次の試合へ' : 'つづける'}</button>`;
}
function afterMatches() {
  $('#match').hidden = true; $('#match').innerHTML = ''; UI.run = null;
  if (G.phase === 'season' && G.md >= SEASON_WEEKS) {
    const sum = endSeason();
    save();
    UI.tab = 'home';
    render();
    openSheet({ t: 'season', sum });
    return;
  }
  render();
}

/* ---------- 操作 ---------- */
const ACT = {
  color: d => { UI.setup.color = d.v; renderStart(); },
  diff: d => { UI.setup.diff = d.v; renderStart(); },
  found: () => {
    const name = ($('#cname').value || '').trim() || 'FCホームタウン';
    const short = ($('#cshort').value || '').trim() || name.slice(0, 3);
    buildWorld({ name, short, pref: $('#pref').value, color: UI.setup.color, diff: UI.setup.diff });
    if (!save()) toast('この環境ではセーブできません。ページを閉じると進行が消えます');
    boot();
  },
  continue: () => { G = load(); boot(); },
  tab: d => { UI.tab = d.v; UI.confirm = null; render(); window.scrollTo(0, 0); },
  set: d => {
    const m = G.me;
    if (d.k === 'form') { m.form = d.v; m.lineup = null; }
    else if (d.k === 'style') m.style = d.v;
    else if (d.k === 'policy') m.policy = d.v;
    else if (d.k === 'src') { UI.f.src = d.v; UI.limit = 40; }
    else if (d.k === 'pos') { UI.f.pos = d.v; UI.limit = 40; }
    else if (d.k === 'fsort') UI.f.sort = d.v;
    else if (d.k === 'ngy') { UI.nego.yrs = +d.v; UI.nego.msg = null; renderSheet(); return; }
    else UI[d.k] = d.v;
    save(); render();
  },
  press: () => { G.me.press = !G.me.press; save(); render(); },
  auto: () => { G.me.auto = !G.me.auto; save(); render(); },
  watchT: () => { G.me.watch = G.me.watch === false; save(); render(); },
  more: () => { UI.limit += 60; render(); },
  pre: d => {
    if (d.v === 'market') { UI.tab = 'market'; render(); return; }
    if (d.v === 'staff') { UI.tab = 'club'; UI.club = 'staff'; render(); return; }
    openSheet({ t: d.v });
  },
  kickoff: () => { if (canStart().length) return; kickoff(); save(); render(); toast(`${G.year}年シーズン開幕！`); },
  next: () => {
    const shows = playRound();
    save();
    UI.queue = shows;
    showNextMatch();
  },
  mFast: () => { if (UI.run) UI.run.speed = 20; },
  mSkip: () => finishMatch(),
  mClose: () => showNextMatch(),
  player: d => { UI.nego = null; UI.confirm = null; openSheet({ t: 'player', id: +d.id }); },
  slot: d => openSheet({ t: 'slot', i: +d.i }),
  pickSlot: d => {
    const m = G.me, i = +d.i, id = +d.id;
    const j = m.lineup.indexOf(id);
    if (j >= 0) m.lineup[j] = m.lineup[i];
    m.lineup[i] = id; m.auto = false;
    save(); closeSheet(); render();
  },
  close: () => { closeSheet(); render(); },
  scrim: (d, t, e) => { if (e.target.classList.contains('scrim')) { closeSheet(); render(); } },
  sponsor: d => { G.me.sponsor = G.me.sponsorCands[+d.i]; save(); closeSheet(); render(); toast(`${G.me.sponsor.n}とスポンサー契約を結んだ`); },
  camp: d => { G.me.camp = d.v; save(); closeSheet(); render(); },
  renew: d => { renewContract(+d.id, +d.y); save(); render(); },
  letgo: d => {
    const p = G.P[+d.id];
    G.me.renew = G.me.renew.filter(x => x.id !== +d.id);
    if (p) { setClub(p, -1); addNews(`${p.n}が契約満了で退団した`); }
    save(); render();
  },
  youth: d => { const e = signYouth(+d.i); if (e) toast(e); save(); render(); },
  hire: d => { const e = hireStaff(+d.i); toast(e || 'スタッフと契約しました'); save(); render(); },
  build: d => { const e = buildFacility(d.k); toast(e || '工事を始めました'); save(); render(); },
  price: d => { G.me.price = clamp(G.me.price + +d.v, 1000, 6000); save(); render(); },
  scout: d => { sendScout(d.k); save(); render(); toast(G.scout ? 'スカウトを派遣しました' : 'スカウトが戻りました。リストを確認しましょう'); },
  offerOk: d => { const e = acceptOffer(+d.i); toast(e || '売却しました'); save(); render(); },
  offerNg: d => { G.offers.splice(+d.i, 1); save(); render(); },
  listT: d => { const p = G.P[+d.id]; p.listed = !p.listed; save(); render(); },
  releaseAsk: () => { UI.confirm = 'release'; renderSheet(); },
  confirmNo: () => { UI.confirm = null; render(); },
  release: d => { const e = release(+d.id); toast(e || '契約を解除しました'); save(); closeSheet(); render(); },
  watchP: d => { const id = +d.id; G.watch = G.watch.includes(id) ? G.watch.filter(x => x !== id) : [id].concat(G.watch); save(); render(); },
  negoOpen: d => {
    const p = G.P[+d.id];
    const fee = p.c === -1 ? 0 : valueOf(p);
    UI.nego = { pid: p.id, fee, sal: salaryFor(p.ovr, isForeign(p)), yrs: 3, msg: null };
    renderSheet();
  },
  ng: d => {
    const n = UI.nego, p = G.P[n.pid];
    if (d.k === 'fee') n.fee = Math.max(0, Math.round((n.fee + valueOf(p) * .1 * +d.v) / 10) * 10);
    else n.sal = Math.max(240, Math.round((n.sal + salaryFor(p.ovr, isForeign(p)) * .1 * +d.v) / 10) * 10);
    n.msg = null; renderSheet();
  },
  offer: () => {
    const n = UI.nego;
    const r = negotiate(n.pid, n.fee, n.sal, n.yrs);
    n.msg = r.msg; n.ok = r.ok;
    if (r.ok) toast(r.msg);
    save(); render();
  },
  reset: () => { UI.confirm = 'reset'; render(); },
  resetYes: () => { wipe(); G = null; UI.sheet = null; UI.confirm = null; $('#sheetRoot').innerHTML = ''; $('#app').hidden = true; $('#start').hidden = false; renderStart(); window.scrollTo(0, 0); },
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  const f = ACT[t.dataset.a];
  if (f) f(t.dataset, t, e);
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    UI.f.q = e.target.value.trim(); UI.limit = 40;
    clearTimeout(UI.qt);
    UI.qt = setTimeout(() => { render(); const q = $('#q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.sheet) { closeSheet(); render(); } });

function boot() {
  $('#start').hidden = true; $('#app').hidden = false;
  UI.f.src = myDiv() === 'J1' ? 'J2' : myDiv() === 'J2' ? 'J3' : 'J3';
  render();
  window.scrollTo(0, 0);
}
(function init() {
  $('#start').hidden = false;
  renderStart();
})();
