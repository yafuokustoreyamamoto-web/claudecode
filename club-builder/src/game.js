'use strict';
/* ==========================================================
   CLUB BUILDER J — ゲームロジック（画面処理は ui.js）
   お金の単位はすべて「万円」。
   ========================================================== */

const DIVS = ['J1', 'J2', 'J3'];
const POS = ['GK', 'CB', 'SB', 'DM', 'CM', 'OM', 'WG', 'CF'];
const POS_NAME = { GK: 'ゴールキーパー', CB: 'センターバック', SB: 'サイドバック', DM: '守備的MF', CM: 'セントラルMF', OM: '攻撃的MF', WG: 'ウイング', CF: 'センターフォワード' };
const POS_GROUP = { GK: 'gk', CB: 'df', SB: 'df', DM: 'mf', CM: 'mf', OM: 'mf', WG: 'fw', CF: 'fw' };
const ADJ = { GK: [], CB: ['SB', 'DM'], SB: ['CB', 'WG'], DM: ['CB', 'CM'], CM: ['DM', 'OM'], OM: ['CM', 'WG', 'CF'], WG: ['OM', 'SB', 'CF'], CF: ['OM', 'WG'] };

const FORMS = {
  '4-4-2': { s: ['GK', 'SB', 'CB', 'CB', 'SB', 'WG', 'CM', 'CM', 'WG', 'CF', 'CF'],
    xy: [[50, 91], [13, 70], [37, 76], [63, 76], [87, 70], [13, 44], [37, 51], [63, 51], [87, 44], [36, 19], [64, 19]] },
  '4-3-3': { s: ['GK', 'SB', 'CB', 'CB', 'SB', 'DM', 'CM', 'CM', 'WG', 'CF', 'WG'],
    xy: [[50, 91], [13, 70], [37, 76], [63, 76], [87, 70], [50, 58], [29, 44], [71, 44], [15, 21], [50, 15], [85, 21]] },
  '4-2-3-1': { s: ['GK', 'SB', 'CB', 'CB', 'SB', 'DM', 'DM', 'WG', 'OM', 'WG', 'CF'],
    xy: [[50, 91], [13, 70], [37, 76], [63, 76], [87, 70], [37, 57], [63, 57], [15, 34], [50, 35], [85, 34], [50, 14]] },
  '3-5-2': { s: ['GK', 'CB', 'CB', 'CB', 'SB', 'CM', 'DM', 'CM', 'SB', 'CF', 'CF'],
    xy: [[50, 91], [25, 75], [50, 78], [75, 75], [10, 47], [32, 45], [50, 58], [68, 45], [90, 47], [36, 18], [64, 18]] },
  '3-4-3': { s: ['GK', 'CB', 'CB', 'CB', 'SB', 'CM', 'CM', 'SB', 'WG', 'CF', 'WG'],
    xy: [[50, 91], [25, 75], [50, 78], [75, 75], [10, 50], [37, 52], [63, 52], [90, 50], [15, 22], [50, 16], [85, 22]] },
};
const STYLES = {
  atk: { n: '攻撃的', a: 2.5, d: -2.0 },
  bal: { n: 'バランス', a: 0, d: 0 },
  def: { n: '守備的', a: -2.5, d: 2.5 },
};
const ATTW = { GK: 0, CB: .1, SB: .35, DM: .3, CM: .55, OM: .85, WG: .9, CF: 1 };
const DEFW = { GK: 1.4, CB: 1, SB: .75, DM: .8, CM: .45, OM: .2, WG: .15, CF: .05 };
const MIDW = { GK: 0, CB: 0, SB: .2, DM: .8, CM: 1, OM: .8, WG: .3, CF: 0 };

const PREFS = [['北海道', 522], ['青森', 124], ['岩手', 121], ['宮城', 230], ['秋田', 96], ['山形', 107], ['福島', 183], ['茨城', 287], ['栃木', 193], ['群馬', 194], ['埼玉', 734], ['千葉', 628], ['東京', 1404], ['神奈川', 924], ['新潟', 220], ['富山', 103], ['石川', 113], ['福井', 77], ['山梨', 81], ['長野', 204], ['岐阜', 198], ['静岡', 363], ['愛知', 754], ['三重', 177], ['滋賀', 141], ['京都', 258], ['大阪', 884], ['兵庫', 547], ['奈良', 133], ['和歌山', 92], ['鳥取', 55], ['島根', 66], ['岡山', 189], ['広島', 280], ['山口', 134], ['徳島', 72], ['香川', 95], ['愛媛', 133], ['高知', 69], ['福岡', 510], ['佐賀', 81], ['長崎', 131], ['熊本', 174], ['大分', 112], ['宮崎', 107], ['鹿児島', 159], ['沖縄', 147]];

const FAC = {
  stadium: { n: 'スタジアム', max: 6, cost: [0, 0, 20000, 50000, 120000, 250000, 450000], wk: [0, 0, 8, 12, 16, 20, 26],
    cap: [0, 5000, 10000, 15000, 25000, 40000, 60000], desc: '収容人数が増え、入場料収入とサポーターの伸びが上がる。J2は1万人、J1は1万5千人以上が必要。' },
  training: { n: '練習場', max: 5, cost: [0, 3000, 8000, 18000, 35000, 60000], wk: [0, 4, 6, 8, 10, 12], desc: '選手の成長が速くなる（1段階ごとに+10%）。' },
  clubhouse: { n: 'クラブハウス', max: 5, cost: [0, 2500, 6000, 14000, 28000, 50000], wk: [0, 4, 6, 8, 10, 12], desc: '試合後のコンディション回復が速くなる。' },
  medical: { n: 'メディカル', max: 5, cost: [0, 2000, 5000, 12000, 25000, 45000], wk: [0, 3, 5, 7, 9, 11], desc: 'けがをしにくくなり、治りも早くなる。' },
  youth: { n: 'ユースアカデミー', max: 5, cost: [0, 3000, 7000, 16000, 32000, 55000], wk: [0, 4, 6, 8, 10, 12], desc: '毎年の昇格候補が増え、素質の高い若手が育つ。' },
  shop: { n: 'グッズショップ', max: 5, cost: [0, 1500, 4000, 10000, 22000, 40000], wk: [0, 3, 4, 6, 8, 10], desc: 'サポーター1人あたりのグッズ収入が増える。' },
};
const STAFF = {
  coach: { n: '監督', desc: '試合で選手の力を引き出す', sal: 600 },
  trainer: { n: 'コーチ', desc: '選手の成長を早める', sal: 300 },
  scout: { n: 'スカウト', desc: '派遣期間が短く、有望な選手を見つけやすい', sal: 250 },
};
const CUP_AFTER = [4, 10, 16, 24, 30, 36];
const CUP_ROUNDS = ['1回戦', '2回戦', '3回戦', '準々決勝', '準決勝', '決勝'];
const DIST = { J1: 35000, J2: 15000, J3: 4000 };
const PRIZE = { J1: [30000, 12000, 6000], J2: [10000, 4000, 2000], J3: [3000, 1500, 800] };
const SPONSOR_BASE = { J1: 60000, J2: 20000, J3: 6000 };
const SEASON_WEEKS = 38;
const SQUAD_MAX = 32, SQUAD_MIN = 16;
const DIFF = {
  easy: { n: 'やさしい', money: 60000, fans: 3000 },
  normal: { n: 'ふつう', money: 30000, fans: 1500 },
  hard: { n: 'むずかしい', money: 12000, fans: 800 },
};

const SURN = '佐藤 鈴木 高橋 田中 伊藤 渡辺 山本 中村 小林 加藤 吉田 山田 佐々木 山口 松本 井上 木村 林 斎藤 清水 山崎 森 池田 橋本 阿部 石川 山下 中島 石井 小川 前田 岡田 長谷川 藤田 後藤 近藤 村上 遠藤 青木 坂本 福田 太田 西村 藤井 金子 岡本 藤原 三浦 中野 中川 原田 松田 竹内 小野 田村 中山 和田 石田 森田 上田 柴田 酒井 工藤 横山 宮崎 宮本 内田 高木 安藤 島田 谷口 大野 高田 丸山 今井 河野 藤本 村田 武田 上野 杉山 増田 小山 大塚 平野 菅原 久保 松井 千葉 岩崎 桜井 木下 野口 松尾 菊地 野村 新井'.split(' ');
const GIVN = '翔太 蓮 大翔 悠真 湊 陽翔 樹 颯太 蒼 大和 悠斗 陸 海斗 颯 拓海 健太 大輝 優斗 翼 駿 瑛太 航 直樹 亮 隼人 智也 誠 圭 将 司 涼 匠 陽向 奏太 蒼空 朝陽 律 碧 晴 光 慎也 祐介 雄大 龍之介 啓太 和也 瞬 歩夢 遥斗 快 玲央 旭 岳 空 敦 剛 聡 達也 康平 恭平 修斗 昂 成 迅 凌 碧斗 晃 豪'.split(' ');
const BIZ = ['建設', '銀行', '電機', '食品', '製菓', '運輸', 'ガス', '酒造', '不動産', '自動車', '通信', '信用金庫', '製薬', '観光'];

/* ---------- 小道具 ---------- */
const rnd = Math.random;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sig = x => 1 / (1 + Math.exp(-x));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wpick(items, wf) {
  let t = 0; const ws = items.map(x => { const w = Math.max(0, wf(x)); t += w; return w; });
  let r = rnd() * t; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
const jpName = () => pick(SURN) + ' ' + pick(GIVN);

let G = null;              // セーブ対象の状態すべて
const SAVE_KEY = 'club-builder-j-save-v1';

/* ---------- 選手 ---------- */
function salaryFor(ovr, foreign) {
  return Math.max(240, Math.round(300 * Math.pow(1.12, ovr - 55) * (foreign ? 1.3 : 1) / 10) * 10);
}
function isForeign(p) { return p.nat && p.nat !== '日本'; }
function valueOf(p) {
  let v;
  if (p.fee) v = p.fee * Math.pow(1.27, p.ovr - p.fo);
  else {
    const am = p.age <= 20 ? 1.2 : p.age <= 29 ? 1 : p.age <= 32 ? .7 : .4;
    v = 10000 * Math.exp(-17.5 + .242 * p.ovr) * am * (isForeign(p) ? 2.3 : 1);
  }
  if (p.age >= 33) v *= .6;
  return Math.max(50, Math.round(v / 10) * 10);
}
function mkP(o) {
  const p = Object.assign({ id: G.P.length, sub: '', cond: 100, inj: 0, sus: 0, st: { g: 0, a: 0, ap: 0 }, tot: { g: 0, ap: 0 }, yrs: ri(1, 4), c: -1 }, o);
  p.ovr = +p.ovr; p.pot = Math.max(p.pot || p.ovr, p.ovr);
  if (!p.sal) p.sal = Math.round(salaryFor(p.ovr, isForeign(p)) * (0.85 + rnd() * .3) / 10) * 10;
  G.P.push(p);
  return p;
}
function genYouth(lvBonus, potMin, potMax) {
  const pos = wpick(POS, x => ({ GK: 1, CB: 2, SB: 1.5, DM: 1.2, CM: 1.5, OM: 1, WG: 1.2, CF: 1.6 })[x]);
  const age = ri(16, 18);
  return { n: jpName(), nat: '日本', age, pos, ovr: ri(40, 49) + lvBonus, pot: Math.min(94, ri(potMin, potMax)), sal: 240, yrs: 3, src: 'Y' };
}
function potGrade(pot) {
  return pot >= 85 ? 'S' : pot >= 78 ? 'A' : pot >= 71 ? 'B' : pot >= 64 ? 'C' : pot >= 57 ? 'D' : 'E';
}
const ovrI = p => Math.floor(p.ovr);
function fit(p, slot) {
  if (p.pos === slot) return 1;
  if (p.sub === slot) return .95;
  if (slot === 'GK' || p.pos === 'GK') return .35;
  if (ADJ[p.pos].includes(slot)) return .86;
  return .7;
}
const effOf = (p, slot) => p.ovr * fit(p, slot) * (.78 + .22 * p.cond / 100);
const available = p => p && !p.inj && !p.sus;

/* ---------- クラブ ---------- */
const me = () => G.C[G.me.cid];
const myDiv = () => me().div;
const players = c => c.pids.map(id => G.P[id]).filter(Boolean);
function clubStrength(c) {
  const a = players(c).map(p => p.ovr).sort((x, y) => y - x).slice(0, 14);
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 40;
}
function setClub(p, cid) {
  if (p.c >= 0) { const o = G.C[p.c]; o.pids = o.pids.filter(x => x !== p.id); }
  p.c = cid; p.ab = ''; p.lgn = ''; p.listed = false;
  if (cid >= 0) G.C[cid].pids.push(p.id);
  if (G.me && G.me.lineup) G.me.lineup = G.me.lineup.map(x => (x === p.id && cid !== G.me.cid) ? null : x);
}

/* 自動で先発を組む（貪欲法）。戻り値は [{p, slot}]、控えは bench */
function autoXI(c, formKey) {
  const slots = FORMS[formKey].s;
  const pool = players(c).filter(available);
  const used = new Set(), xi = new Array(slots.length).fill(null);
  const order = slots.map((s, i) => i).sort((a, b) => (slots[a] === 'GK' ? -1 : 0) - (slots[b] === 'GK' ? -1 : 0));
  for (const i of order) {
    let best = null, be = -1;
    for (const p of pool) { if (used.has(p.id)) continue; const e = effOf(p, slots[i]); if (e > be) { be = e; best = p; } }
    if (best) { used.add(best.id); xi[i] = best; }
  }
  // 入れ替えで改善できる組は交換（2周）
  for (let k = 0; k < 2; k++) for (let i = 0; i < xi.length; i++) for (let j = i + 1; j < xi.length; j++) {
    const a = xi[i], b = xi[j]; if (!a || !b) continue;
    if (effOf(a, slots[j]) + effOf(b, slots[i]) > effOf(a, slots[i]) + effOf(b, slots[j]) + .01) { xi[i] = b; xi[j] = a; }
  }
  const bench = pool.filter(p => !used.has(p.id)).sort((a, b) => b.ovr * (.78 + .22 * b.cond / 100) - a.ovr * (.78 + .22 * a.cond / 100)).slice(0, 7);
  return { xi: xi.map((p, i) => ({ p, slot: slots[i] })), bench };
}
function myXI() {
  const m = G.me, c = me();
  if (m.auto || !m.lineup) { const r = autoXI(c, m.form); m.lineup = r.xi.map(x => x.p ? x.p.id : null); return r; }
  const slots = FORMS[m.form].s;
  const xi = slots.map((slot, i) => { const p = G.P[m.lineup[i]]; return { p: (p && p.c === m.cid && available(p)) ? p : null, slot }; });
  // 空いた枠は自動で補う
  const used = new Set(xi.filter(x => x.p).map(x => x.p.id));
  const pool = players(c).filter(p => available(p) && !used.has(p.id));
  xi.forEach(x => { if (!x.p) { let best = null, be = -1; for (const p of pool) { if (used.has(p.id)) continue; const e = effOf(p, x.slot); if (e > be) { be = e; best = p; } } if (best) { x.p = best; used.add(best.id); } } });
  m.lineup = xi.map(x => x.p ? x.p.id : null);
  const bench = pool.filter(p => !used.has(p.id)).sort((a, b) => b.ovr - a.ovr).slice(0, 7);
  return { xi, bench };
}
function teamSetup(cid) {
  const c = G.C[cid];
  if (cid === G.me.cid) { const r = myXI(); return { ...r, style: G.me.style, press: G.me.press, coach: G.me.staff.coach.lv }; }
  const r = autoXI(c, c.form);
  return { ...r, style: c.style, press: false, coach: c.coach };
}
function power(ts, onField) {
  const s = STYLES[ts.style] || STYLES.bal;
  let a = 0, aw = 0, d = 0, dw = 0, m = 0, mw = 0;
  for (const x of onField) {
    const e = x.p ? effOf(x.p, x.slot) + ts.coach * .6 : 30;
    a += e * ATTW[x.slot]; aw += ATTW[x.slot];
    d += e * DEFW[x.slot]; dw += DEFW[x.slot];
    m += e * MIDW[x.slot]; mw += MIDW[x.slot];
  }
  return { att: a / aw + s.a, def: d / dw + s.d, mid: m / mw + (ts.press ? 1.5 : 0) };
}

/* ---------- 試合 ---------- */
const CHANCE_TXT = [
  n => `${n}のシュートはGKが好セーブ`, n => `${n}、ミドルシュートは枠の上`, n => `${n}のヘディングはポストに当たる`,
  n => `${n}が裏へ抜け出すもオフサイド`, n => `${n}のフリーキックは壁に当たる`, n => `${n}のシュートはわずかに左へ外れる`,
  n => `${n}の決定機、DFが体を投げ出してブロック`, n => `${n}のクロスに合わせきれない`,
];
function simMatch(hid, aid, opt = {}) {
  const T = [teamSetup(hid), teamSetup(aid)];
  const field = T.map(t => t.xi.map(x => ({ ...x })));
  const played = T.map(t => new Set(t.xi.filter(x => x.p).map(x => x.p.id)));
  const reds = [0, 0], goals = [0, 0], ev = [], sc = [], home = opt.neutral ? 0 : .1;
  const medF = cid => cid === G.me.cid ? 1 - G.me.fac.medical * .12 : 1;
  const nm = p => p ? p.n : '選手';
  const lam = () => {
    const P = field.map((f, i) => power(T[i], f));
    return [0, 1].map(i => {
      const o = 1 - i;
      let l = 1.25 * Math.exp((P[i].att - P[o].def) / 15 + (P[i].mid - P[o].mid) / 36 + (i === 0 ? home : -home));
      l *= Math.pow(.72, reds[i]) * Math.pow(1.15, reds[o]);
      return clamp(l, .12, 5.5);
    });
  };
  const scorer = i => {
    const cand = field[i].filter(x => x.p && x.slot !== 'GK');
    return cand.length ? wpick(cand, x => Math.pow(ATTW[x.slot] + .05, 1.4) * x.p.ovr).p : null;
  };
  const push = (m, side, t, text) => ev.push({ m, side, t, text });
  let L = lam();
  const play = (from, to) => {
    for (let m = from; m <= to; m++) {
      if (m === 65 || m === 78) doSubs(m);
      for (const i of [0, 1]) {
        if (rnd() < L[i] / 90) {
          goals[i]++;
          const s = scorer(i), aCand = field[i].filter(x => x.p && x.p !== s && x.slot !== 'GK');
          const a = aCand.length && rnd() < .72 ? wpick(aCand, x => ATTW[x.slot] + .3).p : null;
          sc.push({ m, side: i, s: s && s.id, a: a && a.id });
          push(m, i, 'goal', `ゴール！ ${nm(s)}` + (a ? `（アシスト ${a.n}）` : ''));
        } else if (opt.detail && rnd() < L[i] * 1.6 / 90) {
          push(m, i, 'chance', pick(CHANCE_TXT)(nm(scorer(i))));
        }
        if (rnd() < .0014) { // 一発退場
          const cand = field[i].filter(x => x.p && x.slot !== 'GK');
          if (cand.length) { const x = pick(cand); x.p.sus = 1; x.red = true; push(m, i, 'red', `${x.p.n}が一発退場`); field[i] = field[i].filter(y => y !== x); reds[i]++; L = lam(); }
        } else if (opt.detail && rnd() < .018) {
          const cand = field[i].filter(x => x.p); if (cand.length) push(m, i, 'yellow', `${pick(cand).p.n}にイエローカード`);
        }
      }
      if (m === 45 && opt.detail) push(45, -1, 'half', '前半終了');
    }
  };
  const doSubs = m => {
    for (const i of [0, 1]) {
      const bench = T[i].bench.filter(p => !played[i].has(p.id));
      const tired = field[i].filter(x => x.p && x.slot !== 'GK').sort((a, b) => a.p.cond - b.p.cond);
      const n = m === 65 ? 2 : 1;
      for (let k = 0; k < n && tired.length; k++) {
        const out = tired.shift();
        if (out.p.cond > 82 && m === 65) continue;
        let best = null, be = effOf(out.p, out.slot) * .98;
        for (const p of bench) { if (played[i].has(p.id)) continue; const e = effOf(p, out.slot); if (e > be) { be = e; best = p; } }
        if (!best) continue;
        played[i].add(best.id);
        if (opt.detail) push(m, i, 'sub', `交代 ${out.p.n} → ${best.n}`);
        out.p = best;
      }
    }
    L = lam();
  };
  play(1, 90);
  let et = false, pk = null;
  if (opt.cup && goals[0] === goals[1]) {
    et = true; if (opt.detail) push(90, -1, 'half', '延長戦へ');
    const L0 = L; L = L0.map(x => x / 3 * 1.0); play(91, 120); L = L0;
    if (goals[0] === goals[1]) {
      const gk = f => { const x = field[f].find(y => y.slot === 'GK'); return x && x.p ? x.p.ovr : 50; };
      const pH = clamp(.5 + (gk(0) - gk(1)) / 80, .3, .7);
      let a = 0, b = 0;
      for (let k = 0; k < 5; k++) { if (rnd() < .76 + (pH - .5) * .2) a++; if (rnd() < .76 - (pH - .5) * .2) b++; }
      while (a === b) { if (rnd() < .76) a++; if (rnd() < .76) b++; }
      pk = [a, b];
      if (opt.detail) push(120, -1, 'pk', `PK戦 ${a}-${b}`);
    }
  }
  // 試合後処理：出場・疲労・けが
  const inj = [];
  for (const i of [0, 1]) {
    const cid = i ? aid : hid, pressExtra = T[i].press ? 4 : 0;
    for (const id of played[i]) {
      const p = G.P[id];
      p.cond = clamp(p.cond - ri(9, 15) - pressExtra, 30, 100);
      if (!opt.cup) p.st.ap++;
      p.tot.ap++;
      if (rnd() < .018 * medF(cid)) { p.inj = Math.max(1, Math.round(ri(1, 6) * (cid === G.me.cid ? 1 - G.me.fac.medical * .1 : 1))); inj.push(p.id); if (opt.detail) push(90, i, 'inj', `${p.n}が負傷（全治${p.inj}週）`); }
    }
    // 出場停止の消化（今回の退場者以外）
    for (const p of players(G.C[cid])) if (p.sus && !field[i].some(x => x.red && x.p === p) && !played[i].has(p.id)) p.sus = 0;
  }
  for (const g of sc) {
    if (!opt.cup) { if (g.s != null) G.P[g.s].st.g++; if (g.a != null) G.P[g.a].st.a++; }
    if (g.s != null) G.P[g.s].tot.g++;
  }
  ev.sort((a, b) => a.m - b.m);
  let win = goals[0] > goals[1] ? 0 : goals[0] < goals[1] ? 1 : -1;
  if (pk) win = pk[0] > pk[1] ? 0 : 1;
  return {
    h: hid, a: aid, gh: goals[0], ga: goals[1], et, pk, win, ev, sc, cup: !!opt.cup,
    xi: opt.detail ? T.map((t, i) => t.xi.map(x => ({ id: x.p && x.p.id, slot: x.slot }))) : null,
    used: opt.detail ? played.map(s => [...s]) : null,
  };
}

/* ---------- 日程・順位 ---------- */
function roundRobin(ids) {
  const t = shuffle(ids.slice()); if (t.length % 2) t.push(-1);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a >= 0 && b >= 0) pairs.push((r + i) % 2 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    t.splice(1, 0, t.pop());
  }
  return rounds.concat(rounds.map(r => r.map(([a, b]) => [b, a])));
}
function divClubs(d) { return G.C.filter(c => c.div === d).map(c => c.id); }
function table(d) {
  return divClubs(d).map(id => ({ id, ...G.tb[id] })).sort((x, y) => (y.p - x.p) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (clubStrength(G.C[y.id]) - clubStrength(G.C[x.id])));
}
const rankOf = cid => table(G.C[cid].div).findIndex(r => r.id === cid) + 1;
function record(r) {
  const H = G.tb[r.h], A = G.tb[r.a];
  H.gf += r.gh; H.ga += r.ga; A.gf += r.ga; A.ga += r.gh;
  if (r.gh > r.ga) { H.w++; H.p += 3; A.l++; } else if (r.gh < r.ga) { A.w++; A.p += 3; H.l++; } else { H.d++; A.d++; H.p++; A.p++; }
  for (const [cid, res] of [[r.h, r.gh > r.ga ? 'W' : r.gh < r.ga ? 'L' : 'D'], [r.a, r.ga > r.gh ? 'W' : r.ga < r.gh ? 'L' : 'D']]) {
    const t = G.tb[cid]; t.f = (t.f + res).slice(-5);
  }
}

/* ---------- 世界の生成 ---------- */
function buildWorld(opt) {
  const RAW = window.PLAYER_DATA;
  G = { v: 1, year: 2026, md: 0, phase: 'pre', wk: 0, diff: opt.diff, P: [], C: [], tb: {}, fx: {}, last: {}, cup: null,
    news: [], hist: [], titles: [], watch: [], tried: {}, offers: [], log: [], scout: null, usedLeg: [], fin: null, over: false };
  // クラブ
  const clubMap = {};
  for (const r of RAW.J) {
    if (!(r[1] in clubMap)) {
      const id = G.C.length;
      G.C.push({ id, name: r[1], div: r[2], pids: [], form: pick(Object.keys(FORMS)), style: pick(['atk', 'bal', 'bal', 'def']), coach: 0, color: '' });
      clubMap[r[1]] = id;
    }
    const cid = clubMap[r[1]];
    const p = mkP({ n: r[0], nat: r[8], age: r[3], pos: r[4], sub: r[5], ovr: r[6], pot: r[7], fee: Math.round(r[9] * 10000), fo: r[6], src: 'J' });
    if (!p.fee) delete p.fee;
    setClub(p, cid);
  }
  for (const c of G.C) c.coach = { J1: 3, J2: 2, J3: 1 }[c.div] + ri(0, 1);
  // 欧州・海外組（市場のみ。スカウト経由で獲得）
  for (const r of RAW.EU) {
    const age = r[3], ovr = r[6];
    mkP({ n: r[0], nat: r[7], age, pos: r[4], sub: r[5], ovr, pot: Math.min(99, ovr + (age < 24 ? ri(1, 3) * (24 - age) / 2 : 0)), fee: Math.round(r[8] * 10000) || 0, fo: ovr, src: 'EU', c: -2, ab: r[1], lgn: r[2] });
  }
  for (const r of RAW.AB) {
    const age = r[2], ovr = r[5];
    const m = /（(.+)）/.exec(r[1]);
    mkP({ n: r[0], nat: '日本', age, pos: r[3], sub: r[4], ovr, pot: Math.min(99, ovr + (age < 24 ? ri(1, 3) * (24 - age) / 2 : 0)), fo: ovr, src: 'AB', c: -2, ab: r[1].replace(/（.+）/, ''), lgn: '海外組・' + (m ? m[1] : '欧州') });
  }
  // 自クラブ：J3で最も戦力の低いクラブと入れ替わって参入
  const j3 = G.C.filter(c => c.div === 'J3').sort((a, b) => clubStrength(a) - clubStrength(b));
  const gone = j3[0];
  const goneName = gone.name;
  const pref = PREFS.find(p => p[0] === opt.pref) || PREFS[12];
  gone.name = opt.name; gone.me = true; gone.color = opt.color; gone.form = '4-4-2'; gone.style = 'bal';
  const inherited = players(gone).sort(() => rnd() - .5);
  // 引き継ぐのは24人まで。残りはフリーに
  inherited.slice(24).forEach(p => setClub(p, -1));
  G.me = {
    cid: gone.id, pref: pref[0], pop: pref[1], money: DIFF[opt.diff].money, fans: DIFF[opt.diff].fans,
    fac: { stadium: 1, training: 0, clubhouse: 0, medical: 0, youth: 0, shop: 0 }, build: [],
    staff: { coach: { n: jpName(), lv: 1, sal: 600 }, trainer: { n: jpName(), lv: 1, sal: 300 }, scout: { n: jpName(), lv: 1, sal: 250 } },
    price: 2000, sponsor: null, policy: 'normal', camp: 'none', form: '4-4-2', style: 'bal', press: false, auto: true, lineup: null,
    youth: [], staffCands: [], sponsorCands: [], renew: [], short: opt.short || opt.name.slice(0, 3),
  };
  // 期待の若手を4人
  for (let i = 0; i < 4; i++) { const y = mkP({ ...genYouth(4, 62, i === 0 ? 86 : 76), age: ri(17, 19) }); setClub(y, gone.id); }
  for (const p of players(gone)) { p.yrs = ri(1, 3); p.sal = Math.round(salaryFor(p.ovr, isForeign(p)) / 10) * 10; }
  addNews(`${opt.name}が誕生。${goneName}に代わってJ3に参入した`, 'big');
  addNews(`${goneName}から${Math.min(24, inherited.length)}人の選手が移籍してきた`);
  startSeason(true);
  return G;
}

function addNews(text, kind = '') { G.news.unshift({ y: G.year, md: G.md, text, kind }); if (G.news.length > 60) G.news.length = 60; }
function log(text) { G.log.unshift({ y: G.year, md: G.md, text }); if (G.log.length > 40) G.log.length = 40; }

/* ---------- シーズン ---------- */
function startSeason(first) {
  G.phase = 'pre'; G.md = 0; G.tb = {}; G.last = {}; G.tried = {};
  for (const c of G.C) G.tb[c.id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, f: '' };
  for (const d of DIVS) G.fx[d] = roundRobin(divClubs(d));
  for (const p of G.P) if (p && p.c >= 0) p.st = { g: 0, a: 0, ap: 0 };
  G.fin = { in: { ticket: 0, merch: 0, sponsor: 0, dist: 0, prize: 0, sale: 0 }, out: { salary: 0, staff: 0, maint: 0, build: 0, buy: 0, other: 0 }, att: [] };
  // 天皇杯の抽選
  const all = G.C.map(c => c.id);
  const seeds = first ? shuffle(divClubs('J1')).slice(0, 4) : (G.lastTop || shuffle(divClubs('J1')).slice(0, 4));
  G.cup = { r: 0, ties: [], byes: seeds, alive: all.slice(), out: {}, res: [], champ: null };
  const r1 = shuffle(all.filter(id => !seeds.includes(id)));
  for (let i = 0; i < r1.length; i += 2) G.cup.ties.push(cupHome(r1[i], r1[i + 1]));
  // 分配金
  const d = myDiv();
  earn('dist', DIST[d]);
  // オフの準備
  const m = G.me;
  m.sponsor = null;
  m.sponsorCands = sponsorOffers();
  m.staffCands = staffOffers();
  m.youth = [];
  const nY = 1 + Math.floor(m.fac.youth * .7);
  for (let i = 0; i < nY; i++) m.youth.push(genYouth(m.fac.youth, 55 + m.fac.youth * 3, 72 + m.fac.youth * 4));
  m.camp = 'none';
  if (!first) spawnLegends();
  else spawnLegends(3);
  G.offers = G.offers.filter(o => o.exp > G.wk);
}
function cupHome(a, b) {
  const da = DIVS.indexOf(G.C[a].div), db = DIVS.indexOf(G.C[b].div);
  return db > da ? [b, a] : [a, b];
}
function sponsorOffers() {
  const d = myDiv(), base = SPONSOR_BASE[d] * (.8 + Math.min(G.me.fans / 20000, 1.6) * .3);
  const out = [];
  const names = shuffle(BIZ.slice()).slice(0, 3).map(b => `${G.me.pref}${b}`);
  out.push({ n: names[0], amt: Math.round(base / 10) * 10, win: 0, note: '固定額の安定型' });
  out.push({ n: names[1], amt: Math.round(base * .7 / 10) * 10, win: Math.round(base * .035 / 10) * 10, note: '勝利ごとにボーナス' });
  out.push({ n: names[2], amt: Math.round(base * .55 / 10) * 10, win: 0, rank: Math.round(base * .9 / 10) * 10, note: '3位以内でボーナス' });
  return out;
}
function staffOffers() {
  const out = [], d = myDiv(), top = { J1: 5, J2: 4, J3: 3 }[d];
  for (const k of Object.keys(STAFF)) for (let i = 0; i < 2; i++) {
    const lv = ri(Math.max(1, top - 2), top);
    out.push({ role: k, n: jpName(), lv, sal: STAFF[k].sal * lv * lv });
  }
  return out;
}
function spawnLegends(n = 4) {
  const RAW = window.PLAYER_DATA;
  const free = RAW.JL.map((r, i) => i).filter(i => !G.usedLeg.includes('J' + i));
  for (let k = 0; k < n && free.length; k++) {
    const i = free.splice(ri(0, free.length - 1), 1)[0], r = RAW.JL[i];
    G.usedLeg.push('J' + i);
    const p = mkP({ n: r[0], nat: '日本', age: ri(24, 31), pos: r[3], ovr: r[4], pot: r[4] + ri(0, 2), src: 'JL', legend: r[1], yrs: 2 });
    setClub(p, -1);
    addNews(`往年の名手 ${r[0]}（${r[1]}ゆかり）がフリーで移籍先を探している`);
  }
  const efree = RAW.EL.map((r, i) => i).filter(i => !G.usedLeg.includes('E' + i));
  for (let k = 0; k < 2 && efree.length; k++) {
    const i = efree.splice(ri(0, efree.length - 1), 1)[0], r = RAW.EL[i];
    G.usedLeg.push('E' + i);
    mkP({ n: r[0], nat: r[5], age: ri(25, 31), pos: r[3], ovr: r[4], pot: r[4], src: 'EL', legend: r[1], c: -2, ab: r[1], lgn: 'レジェンド・' + r[2], yrs: 2 });
  }
}
function earn(k, v) { G.me.money += v; G.fin.in[k] = (G.fin.in[k] || 0) + v; }
function spend(k, v) { G.me.money -= v; G.fin.out[k] = (G.fin.out[k] || 0) + v; }

function canStart() {
  const probs = [];
  if (!G.me.sponsor) probs.push('メインスポンサーを選んでください');
  const n = me().pids.length;
  if (n < SQUAD_MIN) probs.push(`選手が${SQUAD_MIN}人以上必要です（いま${n}人）`);
  if (n > SQUAD_MAX) probs.push(`選手は${SQUAD_MAX}人までです（いま${n}人）`);
  return probs;
}
function kickoff() {
  const m = G.me;
  // 契約更改しなかった選手は退団
  for (const r of m.renew) { const p = G.P[r.id]; if (p && p.c === m.cid) { setClub(p, -1); p.yrs = 1; addNews(`${p.n}が契約満了で退団した`); } }
  m.renew = [];
  m.youth = [];
  // キャンプ
  if (m.camp !== 'none') {
    const big = m.camp === 'abroad';
    spend('other', big ? 6000 : 1500);
    for (const p of players(me())) {
      const room = p.pot - p.ovr;
      if (room > 0) p.ovr = Math.min(p.pot, p.ovr + (p.age <= 24 ? (big ? 1.2 : .6) : (big ? .5 : .2)));
      p.cond = 100;
    }
    addNews(big ? '海外キャンプで選手たちが大きく成長した' : '国内キャンプで調整を終えた');
  }
  G.phase = 'season';
}

const windowOpen = () => G.phase === 'pre' || (G.md >= 17 && G.md <= 20);

/* 1節すすめる。戻り値は表示用の自クラブの試合 */
function playRound() {
  G.md++; G.wk++;
  const shows = [];
  for (const d of DIVS) {
    const res = [];
    for (const [h, a] of G.fx[d][G.md - 1]) {
      const r = simMatch(h, a, { detail: h === G.me.cid || a === G.me.cid });
      record(r); res.push({ h, a, gh: r.gh, ga: r.ga });
      if (r.xi) { r.label = `${d} 第${G.md}節`; shows.push(r); afterMyMatch(r); }
    }
    G.last[d] = res;
  }
  if (CUP_AFTER.includes(G.md) && G.cup && !G.cup.champ) {
    const r = playCupRound();
    if (r) shows.push(r);
  }
  weekly();
  return shows;
}
function afterMyMatch(r) {
  const mine = r.h === G.me.cid ? 0 : 1;
  const gf = mine ? r.ga : r.gh, ga = mine ? r.gh : r.ga;
  const won = r.win === mine, draw = r.win === -1;
  const m = G.me;
  const cap = 5000 + m.pop * 120;
  let df = won ? Math.max(25, m.fans * .015) : draw ? m.fans * .004 : -m.fans * .008;
  df *= 1 + m.fac.stadium * .05;
  m.fans = Math.round(clamp(m.fans + df, 300, cap));
  if (!r.cup && r.h === G.me.cid) {
    const att = attendance(G.C[r.a]);
    r.att = att;
    G.fin.att.push(att);
    earn('ticket', Math.round(att * m.price / 10000));
  }
  if (won && m.sponsor && m.sponsor.win) earn('sponsor', m.sponsor.win);
  r.fansDelta = Math.round(df);
  r.gfMine = gf; r.gaMine = ga;
}
function attendance(opp) {
  const m = G.me, t = G.tb[m.cid];
  const games = t.w + t.d + t.l, wr = games ? (t.w + t.d * .4) / games : .4;
  const priceF = Math.pow(2000 / m.price, 1.1);
  const divF = { J1: 3, J2: 1.8, J3: 1 }[myDiv()];
  const big = opp && opp.div === 'J1' ? 1.15 : 1;
  const base = (m.fans * .6 * (.85 + .4 * wr) + m.pop * 1.2 * divF) * priceF * big;
  return Math.round(clamp(base * (.9 + rnd() * .2), 200, FAC.stadium.cap[m.fac.stadium]));
}
function playCupRound() {
  const cup = G.cup, next = [], nm = CUP_ROUNDS[cup.r];
  let show = null;
  for (const [h, a] of cup.ties) {
    const r = simMatch(h, a, { cup: true, neutral: cup.r === 5, detail: h === G.me.cid || a === G.me.cid });
    const w = r.win === 0 ? h : a, l = w === h ? a : h;
    cup.out[l] = nm; next.push(w);
    cup.res.push({ r: cup.r, h, a, gh: r.gh, ga: r.ga, pk: r.pk });
    if (r.xi) { r.label = `天皇杯 ${nm}`; show = r; afterMyMatch(r); }
  }
  cup.r++;
  const alive = next.concat(cup.r === 1 ? cup.byes : []);
  if (alive.length === 1) {
    cup.champ = alive[0];
    addNews(`天皇杯は${G.C[alive[0]].name}が優勝`, alive[0] === G.me.cid ? 'big' : '');
    if (alive[0] === G.me.cid) { earn('prize', 15000); G.titles.push({ y: G.year, t: '天皇杯' }); }
    const fin = cup.res[cup.res.length - 1]; const ru = fin.h === alive[0] ? fin.a : fin.h;
    if (ru === G.me.cid) earn('prize', 5000);
    cup.ties = [];
  } else {
    shuffle(alive); cup.ties = [];
    for (let i = 0; i < alive.length; i += 2) cup.ties.push(cupHome(alive[i], alive[i + 1]));
    if (!alive.includes(G.me.cid) && cup.out[G.me.cid] === nm) addNews(`天皇杯は${nm}で敗退`);
  }
  return show;
}

/* 毎週の処理：お金・成長・回復・工事・スカウト・オファー */
function weekly() {
  const m = G.me, c = me();
  const sal = players(c).reduce((s, p) => s + p.sal, 0);
  spend('salary', Math.round(sal / SEASON_WEEKS));
  spend('staff', Math.round((m.staff.coach.sal + m.staff.trainer.sal + m.staff.scout.sal) / SEASON_WEEKS));
  const maint = m.fac.stadium * 1500 + (m.fac.training + m.fac.clubhouse + m.fac.medical + m.fac.youth + m.fac.shop) * 500;
  spend('maint', Math.round(maint / SEASON_WEEKS));
  earn('merch', Math.round(m.fans * (.004 + m.fac.shop * .004)));
  if (m.sponsor) earn('sponsor', Math.round(m.sponsor.amt / SEASON_WEEKS));
  // 成長・回復
  const lastPlayed = new Set();
  const trMult = (.85 + m.staff.trainer.lv * .08) * (1 + m.fac.training * .1);
  const pol = { normal: [1, 1, 0], youth: [1.3, .8, -2], rest: [.7, .7, 6] }[m.policy];
  for (const p of G.P) {
    if (!p || p.c === -2) continue;
    let mult = 1, rec = 9;
    if (p.c === m.cid) { mult = trMult * (p.age <= 23 ? pol[0] : pol[1]); rec += m.fac.clubhouse * 2 + pol[2]; }
    else if (p.c >= 0) mult = { J1: 1.1, J2: 1, J3: .9 }[G.C[p.c].div];
    else mult = .6;
    grow(p, mult);
    p.cond = clamp(p.cond + rec, 30, 100);
    if (p.inj) p.inj--;
  }
  // 工事
  for (const b of m.build) b.w--;
  for (const b of m.build.filter(b => b.w <= 0)) { m.fac[b.k] = b.lv; addNews(`${FAC[b.k].n}がレベル${b.lv}に完成した`, 'big'); }
  m.build = m.build.filter(b => b.w > 0);
  // スカウト
  if (G.scout) { G.scout.left--; if (G.scout.left <= 0) scoutReturn(); }
  // オファー
  G.offers = G.offers.filter(o => o.exp >= G.wk);
  if (windowOpen() || G.phase === 'pre') makeOffers();
  if (m.money < 0) addNews(`資金がマイナスです（${fmtMoney(m.money)}）。シーズン終了時に−3億円を下回ると解任されます`, 'warn');
}
function grow(p, mult) {
  const a = p.age;
  if (a <= 29 && p.ovr < p.pot) {
    const rate = a <= 21 ? .011 : a <= 24 ? .008 : a <= 27 ? .004 : .0015;
    p.ovr = Math.min(p.pot, p.ovr + (p.pot - p.ovr) * rate * mult + (rnd() < .02 * mult ? .3 : 0));
  } else if (a >= 31) {
    p.ovr = Math.max(35, p.ovr - .014 * (a - 30) * (.7 + rnd() * .6));
  }
}
function makeOffers() {
  const mine = players(me());
  for (const p of mine) {
    const pr = p.listed ? .3 : (p.ovr >= clubStrength(me()) + 4 ? .03 : .006);
    if (rnd() > pr || G.offers.some(o => o.pid === p.id)) continue;
    const buyers = G.C.filter(c => !c.me && DIVS.indexOf(c.div) <= DIVS.indexOf(myDiv()) && clubStrength(c) - 6 < p.ovr);
    if (!buyers.length) continue;
    const b = pick(buyers), v = valueOf(p);
    const fee = Math.round(v * (p.listed ? .75 + rnd() * .35 : 1 + rnd() * .5) / 10) * 10;
    G.offers.push({ pid: p.id, from: b.id, fee, exp: G.wk + 3 });
    addNews(`${b.name}から${p.n}に${fmtMoney(fee)}のオファーが届いた`, 'offer');
  }
}
function acceptOffer(i) {
  const o = G.offers[i], p = G.P[o.pid];
  if (!p || p.c !== G.me.cid) { G.offers.splice(i, 1); return '選手はもういません'; }
  if (me().pids.length <= SQUAD_MIN && G.phase === 'season') return `シーズン中は${SQUAD_MIN}人を下回れません`;
  earn('sale', o.fee); setClub(p, o.from); p.yrs = ri(2, 4);
  G.offers = G.offers.filter(x => x.pid !== p.id);
  addNews(`${p.n}を${G.C[o.from].name}へ${fmtMoney(o.fee)}で売却した`);
  return null;
}

/* ---------- スカウト ---------- */
function scoutRegions() {
  const lv = G.me.staff.scout.lv;
  const leagues = [...new Set(G.P.filter(p => p && p.src === 'EU').map(p => p.lgn))];
  const r = [
    { k: 'J1', n: 'J1のクラブ', wk: 2 }, { k: 'J2', n: 'J2のクラブ', wk: 2 }, { k: 'J3', n: 'J3のクラブ', wk: 2 },
    { k: 'FA', n: 'フリーの選手', wk: 1 }, { k: 'AB', n: '欧州でプレーする日本人', wk: 3 },
    ...leagues.map(l => ({ k: 'EU:' + l, n: l, wk: 4 })),
    { k: 'LEG', n: '欧州のレジェンド', wk: 5, need: 3 },
  ];
  return r.map(x => ({ ...x, wk: Math.max(1, x.wk - Math.floor((lv - 1) / 2)), cost: x.wk * 100 * (x.k.startsWith('EU') || x.k === 'LEG' ? 3 : 1), lock: x.need && lv < x.need }));
}
function sendScout(k) {
  const reg = scoutRegions().find(r => r.k === k);
  if (!reg || reg.lock || G.scout) return;
  spend('other', reg.cost);
  G.scout = { k, n: reg.n, left: reg.wk };
  if (G.phase === 'pre') { G.scout.left = 0; scoutReturn(); }
}
function scoutReturn() {
  const s = G.scout, lv = G.me.staff.scout.lv;
  let pool;
  if (s.k === 'FA') pool = G.P.filter(p => p && p.c === -1);
  else if (s.k === 'AB') pool = G.P.filter(p => p && p.src === 'AB');
  else if (s.k === 'LEG') pool = G.P.filter(p => p && p.src === 'EL' && p.c === -2);
  else if (s.k.startsWith('EU:')) pool = G.P.filter(p => p && p.c === -2 && p.lgn === s.k.slice(3));
  else pool = G.P.filter(p => p && p.c >= 0 && !G.C[p.c].me && G.C[p.c].div === s.k);
  pool = pool.filter(p => !G.watch.includes(p.id));
  const n = 3 + lv;
  const found = pool.map(p => ({ p, sc: p.pot * (.6 + lv * .08) + p.ovr * .3 - Math.max(0, p.age - 27) * 1.5 + rnd() * 22 }))
    .sort((a, b) => b.sc - a.sc).slice(0, n).map(x => x.p.id);
  G.watch = found.concat(G.watch).slice(0, 60);
  addNews(`スカウトが${s.n}から戻り、${found.length}人の選手をリストに加えた`, 'scout');
  G.scout = null;
}

/* ---------- 移籍交渉 ---------- */
function rep() {
  let r = { J1: 68, J2: 56, J3: 46 }[myDiv()];
  r += Math.min(10, G.me.fans / 8000) + Math.min(8, G.titles.length * 2);
  return r;
}
function negoOdds(p, fee, sal) {
  const expect = salaryFor(p.ovr, isForeign(p));
  const s = sal / expect;
  let lp = (rep() + 12 - p.ovr) / 4 + (s - 1) * 4;
  if (p.c === -1) lp += 1;
  if (p.c === -2) lp -= 1.5;
  if (p.c >= 0 && DIVS.indexOf(G.C[p.c].div) > DIVS.indexOf(myDiv())) lp += 1.5;
  if (p.legend && p.src === 'JL') lp += .5;
  let ls = 10;
  if (p.c !== -1) {
    const v = valueOf(p);
    ls = (fee / v - 1) * 7;
    if (p.c >= 0) { const top = players(G.C[p.c]).sort((a, b) => b.ovr - a.ovr).slice(0, 3); if (top.includes(p)) ls -= 1; }
  }
  return { player: sig(lp), club: sig(ls), expect };
}
function negotiate(pid, fee, sal, yrs) {
  const p = G.P[pid], m = G.me;
  if (!p) return { ok: false, msg: '選手が見つかりません' };
  const needWindow = p.c !== -1;
  if (needWindow && !windowOpen()) return { ok: false, msg: '移籍市場が閉まっています（プレシーズンと第17〜20節のあとに開きます）' };
  if (G.tried[pid] === G.wk) return { ok: false, msg: 'この選手とは今週すでに交渉しました。次の週にもう一度どうぞ' };
  if (me().pids.length >= SQUAD_MAX) return { ok: false, msg: `選手は${SQUAD_MAX}人までです` };
  if (p.c === -1) fee = 0;
  if (m.money < fee) return { ok: false, msg: '資金が足りません' };
  G.tried[pid] = G.wk;
  const od = negoOdds(p, fee, sal);
  const from = p.c >= 0 ? G.C[p.c].name : p.c === -2 ? p.ab : 'フリー';
  if (rnd() > od.club) {
    const hint = Math.round(valueOf(p) * (1.05 + rnd() * .25) / 10) * 10;
    log(`${p.n}：${from}が移籍金${fmtMoney(fee)}を拒否`);
    return { ok: false, msg: `${from}が拒否しました。${fmtMoney(hint)}前後なら応じるかもしれません` };
  }
  if (rnd() > od.player) {
    log(`${p.n}：本人が年俸${fmtMoney(sal)}を拒否`);
    return { ok: false, msg: `${p.n}本人が断りました。年俸を上げるか、クラブの評価を上げてから再挑戦しましょう` };
  }
  spend('buy', fee);
  setClub(p, m.cid);
  p.sal = sal; p.yrs = yrs; p.cond = Math.max(p.cond || 80, 80); p.inj = 0; p.sus = 0; p.st = { g: 0, a: 0, ap: 0 };
  if (!p.tot) p.tot = { g: 0, ap: 0 };
  G.watch = G.watch.filter(x => x !== pid);
  addNews(`${p.n}（${from}）の獲得が決まった` + (fee ? `。移籍金${fmtMoney(fee)}` : ''), 'big');
  return { ok: true, msg: `${p.n}が加入しました` };
}
function release(pid) {
  const p = G.P[pid];
  if (!p || p.c !== G.me.cid) return 'この選手はいません';
  if (me().pids.length <= SQUAD_MIN && G.phase === 'season') return `シーズン中は${SQUAD_MIN}人を下回れません`;
  const pay = Math.round(p.sal * .5 / 10) * 10;
  spend('other', pay); setClub(p, -1);
  addNews(`${p.n}との契約を解除した（違約金${fmtMoney(pay)}）`);
  return null;
}
function signYouth(i) {
  const y = G.me.youth[i];
  if (!y) return;
  if (me().pids.length >= SQUAD_MAX) return `選手は${SQUAD_MAX}人までです`;
  const p = mkP(y); setClub(p, G.me.cid);
  G.me.youth.splice(i, 1);
  addNews(`ユースの${p.n}がトップチームに昇格した`);
  return null;
}
function renewContract(pid, yrs) {
  const r = G.me.renew.find(x => x.id === pid), p = G.P[pid];
  if (!r || !p) return;
  p.sal = r.sal; p.yrs = yrs;
  G.me.renew = G.me.renew.filter(x => x.id !== pid);
  addNews(`${p.n}と${yrs}年契約を結んだ（年俸${fmtMoney(r.sal)}）`);
}
function hireStaff(i) {
  const s = G.me.staffCands[i];
  if (!s) return '候補がいません';
  const fee = Math.round(s.sal * .5 / 10) * 10;
  if (G.me.money < fee) return '資金が足りません';
  spend('other', fee);
  G.me.staff[s.role] = { n: s.n, lv: s.lv, sal: s.sal };
  G.me.staffCands = G.me.staffCands.filter(x => x.role !== s.role);
  addNews(`${STAFF[s.role].n}に${s.n}（Lv${s.lv}）を迎えた`);
  return null;
}
function buildFacility(k) {
  const m = G.me, f = FAC[k], lv = m.fac[k] + 1;
  if (lv > f.max) return 'これ以上は拡張できません';
  if (m.build.some(b => b.k === k)) return '工事中です';
  if (m.money < f.cost[lv]) return '資金が足りません';
  spend('build', f.cost[lv]);
  m.build.push({ k, lv, w: f.wk[lv] });
  addNews(`${f.n}のレベル${lv}への工事を始めた（${f.wk[lv]}週）`);
  return null;
}

/* ---------- シーズン終了 ---------- */
function endSeason() {
  const m = G.me, summary = { year: G.year, lines: [] };
  const T = {}; for (const d of DIVS) T[d] = table(d).map(r => r.id);
  const myD = myDiv(), myRank = T[myD].indexOf(m.cid) + 1;
  summary.div = myD; summary.rank = myRank;
  // 賞金
  const pz = PRIZE[myD][myRank - 1]; if (pz) earn('prize', pz);
  if (m.sponsor && m.sponsor.rank && myRank <= 3) earn('sponsor', m.sponsor.rank);
  for (const d of DIVS) {
    const champ = G.C[T[d][0]];
    addNews(`${G.year}年の${d}は${champ.name}が優勝`, champ.me ? 'big' : '');
    const sc = G.P.filter(p => p && p.c >= 0 && G.C[p.c].div === d).sort((a, b) => b.st.g - a.st.g)[0];
    if (sc) summary.lines.push(`${d}得点王：${sc.n}（${G.C[sc.c].name}）${sc.st.g}点`);
  }
  if (myRank === 1) G.titles.push({ y: G.year, t: `${myD}優勝` });
  G.hist.push({ y: G.year, div: myD, rank: myRank, cup: G.cup.champ === m.cid ? '優勝' : (G.cup.out[m.cid] || '—'), fans: m.fans, money: m.money,
    w: G.tb[m.cid].w, d: G.tb[m.cid].d, l: G.tb[m.cid].l });
  // 昇格・降格（ライセンス：J2は1万人、J1は1万5千人）
  const lic = (cid, d) => cid !== m.cid || FAC.stadium.cap[m.fac.stadium] >= (d === 'J1' ? 15000 : 10000);
  const up = (d, to) => { const out = []; for (const id of T[d]) { if (out.length === 3) break; if (lic(id, to)) out.push(id); else if (T[d].indexOf(id) < 3) summary.lines.push(`スタジアムの収容人数が足りず、${to}ライセンスが下りなかった`); } return out; };
  const up2 = up('J2', 'J1'), up3 = up('J3', 'J2');
  const down1 = T.J1.slice(-3), down2 = T.J2.filter(id => !up2.includes(id)).slice(-3);
  up2.forEach(id => G.C[id].div = 'J1'); down1.forEach(id => G.C[id].div = 'J2');
  up3.forEach(id => G.C[id].div = 'J2'); down2.forEach(id => G.C[id].div = 'J3');
  const newD = myDiv();
  if (newD !== myD) {
    const upM = DIVS.indexOf(newD) < DIVS.indexOf(myD);
    summary.lines.unshift(upM ? `${newD}昇格が決まった！` : `${newD}へ降格…`);
    addNews(upM ? `${me().name}、${newD}昇格！` : `${me().name}は${newD}へ降格`, 'big');
    m.fans = Math.round(m.fans * (upM ? 1.2 : .9));
  }
  G.lastTop = T.J1.slice(0, 4).filter(id => G.C[id].div === 'J1');
  summary.fin = JSON.parse(JSON.stringify(G.fin));
  summary.newDiv = newD;
  // 加齢・引退・契約
  G.year++;
  for (const p of G.P) {
    if (!p) continue;
    p.age++;
    if (p.c === -2) {
      if (p.age <= 24) p.ovr = Math.min(p.pot, p.ovr + (p.pot - p.ovr) * .3);
      if (p.age >= 31) p.ovr -= (p.age - 30) * .6;
      if (p.age >= 36) G.P[p.id] = null;
      continue;
    }
    const retire = (p.age >= 33 && rnd() < (p.age - 32) * .16) || p.age >= 39 || (p.ovr < 45 && p.age > 27 && rnd() < .5);
    if (retire) {
      if (p.c === m.cid) addNews(`${p.n}（${p.age - 1}歳）が現役を引退した`);
      if (p.c >= 0) setClub(p, -1);
      G.P[p.id] = null;
      continue;
    }
    if (p.c >= 0) {
      p.yrs--;
      if (p.yrs <= 0) {
        if (p.c === m.cid) {
          const sal = Math.round(salaryFor(p.ovr, isForeign(p)) * (.9 + rnd() * .3) / 10) * 10;
          m.renew.push({ id: p.id, sal });
        } else if (rnd() < .78) { p.yrs = ri(1, 3); p.sal = salaryFor(p.ovr, isForeign(p)); }
        else setClub(p, -1);
      }
    }
    p.cond = 100; p.inj = 0; p.sus = 0;
  }
  G.watch = G.watch.filter(id => G.P[id]);
  if (m.lineup) m.lineup = m.lineup.map(id => (id != null && G.P[id] && G.P[id].c === m.cid) ? id : null);
  aiOffseason();
  if (m.money < -30000) { G.over = true; summary.over = true; }
  startSeason(false);
  if (m.renew.length) addNews(`${m.renew.length}人の選手が契約満了を迎えた。プレシーズン中に更改しないと退団する`, 'warn');
  return summary;
}
function aiOffseason() {
  const free = () => G.P.filter(p => p && p.c === -1);
  // 上位カテゴリのクラブが下位から主力を引き抜く
  for (const c of shuffle(G.C.filter(c => !c.me && c.div !== 'J3'))) {
    if (rnd() > .5) continue;
    const need = clubStrength(c);
    const cands = G.P.filter(p => p && p.c >= 0 && p.c !== c.id && !G.C[p.c].me && DIVS.indexOf(G.C[p.c].div) > DIVS.indexOf(c.div) && p.ovr > need && p.age < 30);
    if (!cands.length) continue;
    const p = pick(cands), from = G.C[p.c];
    setClub(p, c.id); p.yrs = ri(2, 4); p.sal = salaryFor(p.ovr, isForeign(p));
    if (rnd() < .2) addNews(`${p.n}が${from.name}から${c.name}へ移籍`);
  }
  for (const c of G.C) {
    if (c.me) continue;
    // 若手を2人
    for (let i = 0; i < 2; i++) { const y = mkP(genYouth(0, 56, { J1: 86, J2: 80, J3: 76 }[c.div])); setClub(y, c.id); }
    // 24人になるまでフリーから補強
    let guard = 0;
    while (c.pids.length < 24 && guard++ < 20) {
      const s = clubStrength(c);
      const fa = free().filter(p => p.ovr <= s + 3).sort((a, b) => b.ovr - a.ovr);
      const p = fa.length ? fa[ri(0, Math.min(4, fa.length - 1))] : mkP({ n: jpName(), nat: '日本', age: ri(20, 29), pos: pick(POS), ovr: s - ri(3, 8), pot: s });
      setClub(p, c.id); p.yrs = ri(1, 3); p.sal = salaryFor(p.ovr, isForeign(p));
    }
    // 多すぎる場合は放出
    while (c.pids.length > 32) { const p = players(c).sort((a, b) => a.ovr - b.ovr)[0]; setClub(p, -1); }
    // GKは最低2人
    while (players(c).filter(p => p.pos === 'GK').length < 2) { const p = mkP({ n: jpName(), nat: '日本', age: ri(20, 30), pos: 'GK', ovr: clubStrength(c) - 6, pot: clubStrength(c) - 3 }); setClub(p, c.id); }
    c.form = rnd() < .2 ? pick(Object.keys(FORMS)) : c.form;
    c.coach = { J1: 3, J2: 2, J3: 1 }[c.div] + ri(0, 1);
  }
  // フリー市場に新しい顔ぶれを
  for (let i = 0; i < 40; i++) { const p = mkP({ n: jpName(), nat: '日本', age: ri(18, 31), pos: pick(POS), ovr: ri(45, 63), pot: 0, yrs: 1 }); p.pot = p.ovr + (p.age < 24 ? ri(2, 14) : 0); }
  // フリーで長く残る高齢選手は引退
  for (const p of free()) if (p.age >= 32 && rnd() < .5) G.P[p.id] = null;
}

/* ---------- 表示用 ---------- */
function fmtMoney(v) {
  const s = v < 0 ? '−' : '', a = Math.abs(v);
  if (a >= 10000) return s + (a / 10000).toFixed(a >= 100000 ? 1 : 2).replace(/\.?0+$/, '') + '億円';
  return s + Math.round(a).toLocaleString() + '万円';
}
function nextFixture() {
  if (G.phase !== 'season' || G.md >= SEASON_WEEKS) return null;
  const pair = G.fx[myDiv()][G.md].find(x => x.includes(G.me.cid));
  if (!pair) return null;
  const home = pair[0] === G.me.cid;
  return { home, opp: home ? pair[1] : pair[0], md: G.md + 1 };
}
const cupNext = () => G.cup && !G.cup.champ && G.cup.ties.some(t => t.includes(G.me.cid)) ? CUP_AFTER[G.cup.r] : null;

/* ---------- 保存 ---------- */
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; } catch (e) { return false; }
}
function load() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const g = JSON.parse(s); return g && g.v === 1 ? g : null; } catch (e) { return null; }
}
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 保存できない環境 */ } }
