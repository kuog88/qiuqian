/* 五甲港口宮 求籤推算引擎
 * 時令（節氣定四季、旺相休囚死）＋ 八字（年月日三柱、日主強弱、喜用）
 * ＋ 姓名學（康熙筆畫五格、三才、81數理）＋ 性別（大運順逆、夫妻星）
 * ＋ 當日（日柱、生肖合沖、月亮星座）＋ 搖籤神意 → 籤等 → 依「類別/性別/季節/籤等」取籤
 */
const QQ = (() => {
const STEMS = "甲乙丙丁戊己庚辛壬癸", BR = "子丑寅卯辰巳午未申酉戌亥", ANIMAL = "鼠牛虎兔龍蛇馬羊猴雞狗豬";
const WX = ["木", "火", "土", "金", "水"];
const BR_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const SIGNS = ["牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "摩羯", "水瓶", "雙魚"];
const TERMS = ["春分","清明","穀雨","立夏","小滿","芒種","夏至","小暑","大暑","立秋","處暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至","小寒","大寒","立春","雨水","驚蟄"];
const SEASONS = ["春", "夏", "秋", "冬"];
const SEASON_WX = [0, 1, 3, 4]; // 春木 夏火 秋金 冬水；四季末土
const STATE = ["旺", "相", "休", "囚", "死"];
const STATE_V = { 旺: 2, 相: 1, 休: 0, 囚: -1, 死: -2 };
const COMPOUND = ["歐陽","司馬","諸葛","上官","東方","皇甫","尉遲","公孫","慕容","長孫","宇文","司徒","令狐","澹臺","夏侯","西門","張簡","范姜","張廖","簡廖","周黃","江謝","陳李","劉張","徐辜","鄭黃"];
// 81 數理（熊崎式通行版）：1 吉、2 半吉、3 凶
const N81 = [0,1,3,1,3,1,1,1,1,3,3,1,3,1,3,1,1,1,1,3,3,1,3,1,1,1,3,2,3,1,2,1,1,1,3,1,3,1,2,1,2,1,2,2,3,1,3,1,1,2,2,2,1,2,3,2,3,1,2,3,3,1,3,1,3,1,3,1,1,3,3,2,3,2,3,2,3,2,2,3,3,1];
const N81_NAME = ["", "吉", "半吉", "凶"];

const gen = (a, b) => (b - a + 5) % 5 === 1;   // a 生 b
const ctl = (a, b) => (b - a + 5) % 5 === 2;   // a 剋 b
function relName(me, x) { // x 對 me 的十神大類
  if (me === x) return "比劫"; if (gen(x, me)) return "印"; if (gen(me, x)) return "食傷";
  if (ctl(me, x)) return "財"; return "官殺";
}

/* ---------- 天文 ---------- */
function jd(y, m, d, hUTC = 4) { return Date.UTC(y, m - 1, d, hUTC) / 864e5 + 2440587.5; }
function sunLon(y, m, d) { // 視黃經（台灣中午），精度約 0.01°
  const n = jd(y, m, d) - 2451545, g = (357.528 + 0.9856003 * n) * Math.PI / 180;
  const L = 280.460 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  return ((L % 360) + 360) % 360;
}
function moonSign(y, m, d) {
  const n = jd(y, m, d) - 2451545, M = (134.963 + 13.064993 * n) * Math.PI / 180;
  const L = ((218.316 + 13.176396 * n + 6.289 * Math.sin(M)) % 360 + 360) % 360;
  return Math.floor(L / 30);
}
function sunSign(m, d) { const cut = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]; const s = (m + 9) % 12; return d >= cut[m - 1] ? s : (s + 11) % 12; }
function seasonOf(lon) { // 立春315 立夏45 立秋135 立冬225
  const k = Math.floor((((lon - 315) % 360) + 360) % 360 / 90);
  const into = (((lon - 315) % 360) + 360) % 360 - k * 90;
  return { idx: k, name: SEASONS[k], earth: into >= 72, term: TERMS[Math.floor(lon / 15)] }; // 立X前18天（約18°）土旺用事
}
function states(season) { // 各五行在此時的旺相休囚死
  const w = season.earth ? 2 : SEASON_WX[season.idx], out = {};
  for (let e = 0; e < 5; e++) {
    out[e] = e === w ? "旺" : gen(w, e) ? "相" : gen(e, w) ? "休" : ctl(e, w) ? "囚" : "死";
  }
  return out;
}

/* ---------- 干支 ---------- */
const dayCycle = (y, m, d) => { const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1949, 9, 1)) / 864e5); return ((n % 60) + 60) % 60; };
function pillars(y, m, d) {
  const lon = sunLon(y, m, d);
  let yy = y; if (m <= 2 && lon >= 270 && lon < 315) yy--;      // 立春換年
  const yc = (((yy - 4) % 60) + 60) % 60, ys = yc % 10, yb = yc % 12;
  const mo = Math.floor((((lon - 315) % 360) + 360) % 360 / 30); // 0=寅月
  const ms = (((ys % 5) * 2 + 2) + mo) % 10, mb = (mo + 2) % 12;
  const dc = dayCycle(y, m, d), ds = dc % 10, db = dc % 12;
  return { lon, year: [ys, yb], month: [ms, mb], day: [ds, db] };
}
const pz = p => STEMS[p[0]] + BR[p[1]];
const stemWx = s => Math.floor(s / 2);

/* ---------- 八字日主強弱與喜用 ---------- */
function chart(y, m, d) {
  const P = pillars(y, m, d), dm = stemWx(P.day[0]);
  const birthSeason = seasonOf(P.lon), st = states(birthSeason)[dm];
  let support = 0;
  const others = [stemWx(P.year[0]), BR_WX[P.year[1]], stemWx(P.month[0]), BR_WX[P.month[1]], BR_WX[P.day[1]]];
  for (const e of others) support += (e === dm || gen(e, dm)) ? 1 : -1;
  const strength = STATE_V[st] * 1.5 + support;
  const strong = strength >= 0;
  const fav = strong ? [0, 1, 2, 3, 4].filter(e => gen(dm, e) || ctl(dm, e) || ctl(e, dm))
                     : [0, 1, 2, 3, 4].filter(e => e === dm || gen(e, dm));
  return { P, dm, yang: P.day[0] % 2 === 0, birthSeason, birthState: st, strength, strong, fav };
}

/* ---------- 姓名學 ---------- */
let STROKES = null;
function loadStrokes(json) { STROKES = new Map(); for (const [k, chars] of Object.entries(json.g)) { const [n, w] = k.split("_").map(Number); for (const c of chars) STROKES.set(c, [n, w]); } }
const tail = n => [4, 0, 0, 1, 1, 2, 2, 3, 3, 4][n % 10]; // 數理五行：1,2木 3,4火 5,6土 7,8金 9,0水
const n81 = n => { const k = n > 81 ? ((n - 1) % 80) + 1 : n; return N81[k]; };
function nameGrids(name) {
  const chars = [...(name || "").replace(/\s/g, "")];
  if (chars.length < 2 || chars.length > 4 || !STROKES || chars.some(c => !STROKES.has(c))) return null;
  const s = chars.map(c => STROKES.get(c)[0]);
  const two = chars.length >= 3 && COMPOUND.includes(chars[0] + chars[1]);
  const sur = two ? s.slice(0, 2) : s.slice(0, 1), giv = two ? s.slice(2) : s.slice(1);
  if (!giv.length || giv.length > 2) return null;
  const sumS = sur.reduce((a, b) => a + b, 0), sumG = giv.reduce((a, b) => a + b, 0);
  const tian = sur.length === 2 ? sumS : sumS + 1;
  const ren = sur[sur.length - 1] + giv[0];
  const di = giv.length === 2 ? sumG : sumG + 1;
  const zong = sumS + sumG;
  let wai = zong - ren + 1; if (sur.length === 1 && giv.length === 1) wai = 2; if (wai < 2) wai = 2;
  const g = { tian, ren, di, wai, zong };
  const out = { chars, strokes: s, compound: two, grids: {} };
  for (const k in g) out.grids[k] = { n: g[k], wx: tail(g[k]), luck: n81(g[k]) };
  return out;
}
function sancaiRel(a, b) { if (a === b) return 2; if (gen(a, b)) return 3; if (gen(b, a)) return 1; return -3; }

/* ---------- 主推算 ---------- */
const W = { // 類別對各項的權重
  career:  { season: 1.0, day: 1.0, branch: 0.8, moon: 0.4, name: { ren: 1.2, tian: 0.8, zong: 0.6, di: 0.3, wai: 0.4 }, star: "官殺" },
  health:  { season: 1.2, day: 0.8, branch: 0.6, moon: 0.6, name: { ren: 0.8, tian: 0.4, zong: 0.4, di: 0.6, wai: 0.2 }, star: "日主" },
  love:    { season: 0.8, day: 0.6, branch: 1.3, moon: 1.0, name: { ren: 0.6, tian: 0.2, zong: 0.4, di: 1.0, wai: 1.0 }, star: "配偶" },
  fortune: { season: 1.0, day: 1.0, branch: 1.0, moon: 0.6, name: { ren: 0.8, tian: 0.4, zong: 1.2, di: 0.4, wai: 0.4 }, star: "財" },
};
const LUCK_V = { 1: 4, 2: 1, 3: -4 };

function divine(profile, cat, today, rnd = Math.random) {
  const [by, bm, bd] = profile.birth.split("-").map(Number);
  const C = chart(by, bm, bd), w = W[cat];
  const tLon = sunLon(today.y, today.m, today.d), season = seasonOf(tLon), now = states(season);
  const T = pillars(today.y, today.m, today.d);
  const parts = [], notes = {};

  // 1. 時令：喜用神在當令季節的旺衰
  const favV = C.fav.reduce((a, e) => a + STATE_V[now[e]], 0) / C.fav.length; // -2..2
  const sSeason = favV * 7 * w.season;
  parts.push(["時令", sSeason]);
  const favNames = C.fav.map(e => WX[e]).join("、");
  const favHot = C.fav.filter(e => now[e] === "旺" || now[e] === "相").map(e => WX[e]);
  notes.season = favHot.length
    ? `時值${season.name}季（${season.term}）${season.earth ? "，正逢土旺用事" : ""}，您命中所喜的${favHot.join("、")}正當${favHot.map(x => now[WX.indexOf(x)]).join("、")}，天時助您。`
    : `時值${season.name}季（${season.term}）${season.earth ? "，正逢土旺用事" : ""}，您命中所喜的${favNames}此時休囚，天時未全，宜順勢而為。`;

  // 2. 類別專屬：用神星在當令
  const dmEl = C.dm; let starEl, starName;
  if (w.star === "官殺") { starEl = [0,1,2,3,4].find(e => ctl(e, dmEl)); starName = "官星"; }
  else if (w.star === "財") { starEl = [0,1,2,3,4].find(e => ctl(dmEl, e)); starName = "財星"; }
  else if (w.star === "配偶") { starEl = profile.gender === "男" ? [0,1,2,3,4].find(e => ctl(dmEl, e)) : [0,1,2,3,4].find(e => ctl(e, dmEl)); starName = profile.gender === "男" ? "妻星（財）" : "夫星（官）"; }
  else { starEl = dmEl; starName = "日主"; }
  const starSt = now[starEl], sStar = STATE_V[starSt] * 3;
  parts.push([starName, sStar]);
  notes.star = `${{career:"論事業看",health:"論健康看",love:"論感情看",fortune:"論運勢看"}[cat]}${starName}，屬${WX[starEl]}，此季${starSt}${STATE_V[starSt] > 0 ? "，氣勢有力" : STATE_V[starSt] < 0 ? "，力量較弱" : "，平穩"}。`;

  // 3. 當日日柱
  const tdEl = stemWx(T.day[0]);
  const sDay = (C.fav.includes(tdEl) ? 6 : (relName(dmEl, tdEl) === "官殺" && !C.strong) ? -6 : -2) * w.day;
  parts.push(["日柱", sDay]);
  notes.day = `今日${pz(T.day)}日，日干屬${WX[tdEl]}，${C.fav.includes(tdEl) ? "正是您的喜用，今日求籤得天時之助" : "非您喜用，宜多一分謹慎"}。`;

  // 4. 生肖與日支合沖
  const uB = C.P.year[1], dB = T.day[1];
  let bv, bt;
  if ((uB + dB) % 12 === 1) { bv = 8; bt = "六合"; }
  else if (Math.abs(uB - dB) === 6) { bv = -8; bt = "相沖"; }
  else if (uB % 4 === dB % 4 && uB !== dB) { bv = 6; bt = "三合"; }
  else if (uB === dB) { bv = 2; bt = "值日"; }
  else { bv = 0; bt = "無合無沖"; }
  parts.push(["生肖", bv * w.branch]);
  notes.branch = `您屬${ANIMAL[uB]}（${BR[uB]}），與今日${BR[dB]}${bt}${bv > 0 ? "，人和事順" : bv < 0 ? "，宜放慢腳步" : ""}。`;

  // 5. 月亮星座
  const sun = sunSign(bm, bd), moon = moonSign(today.y, today.m, today.d), md = (moon - sun + 12) % 12;
  const mv = md === 0 ? 5 : (md === 4 || md === 8) ? 4 : (md === 2 || md === 10) ? 2 : (md === 3 || md === 9) ? -4 : md === 6 ? -2 : 0;
  parts.push(["星座", mv * w.moon]);
  const mrel = md === 0 ? "同宮，直覺敏銳" : (md === 4 || md === 8) ? "三合，心情和順" : (md === 2 || md === 10) ? "六合，利於溝通"
    : (md === 3 || md === 9) ? "相刑，易有摩擦" : md === 6 ? "對沖，人際易拉扯" : "無明顯相位，影響平和";
  notes.moon = `今日月亮行經${SIGNS[moon]}座，與您的${SIGNS[sun]}座${mrel}。`;

  // 6. 姓名學
  const NG = nameGrids(profile.name);
  if (NG) {
    let nv = 0; for (const k in w.name) nv += LUCK_V[NG.grids[k].luck] * w.name[k];
    const g = NG.grids;
    const sc = sancaiRel(g.tian.wx, g.ren.wx) + sancaiRel(g.ren.wx, g.di.wx);
    nv += sc * 0.6 + (C.fav.includes(g.ren.wx) ? 3 : -1);
    parts.push(["姓名", nv]);
    notes.name = `姓名五格人格${g.ren.n}劃屬${WX[g.ren.wx]}（${N81_NAME[g.ren.luck]}），總格${g.zong.n}劃（${N81_NAME[g.zong.luck]}）；三才${WX[g.tian.wx]}${WX[g.ren.wx]}${WX[g.di.wx]}${sc >= 3 ? "相生順暢" : sc >= 0 ? "大致平和" : "略有相剋"}${C.fav.includes(g.ren.wx) ? "，人格五行恰為喜用，名字助運" : ""}。`;
  } else notes.name = "";

  // 7. 性別：大運順逆
  const yangYear = C.P.year[0] % 2 === 0, forward = (profile.gender === "男") === yangYear;
  parts.push(["大運", forward ? 3 : -1]);
  notes.gender = `${yangYear ? "陽" : "陰"}年生${profile.gender}命，大運${forward ? "順行，宜積極進取" : "逆行，宜穩中求進"}。`;

  // 8. 神意（搖籤）
  const divineV = Math.round((rnd() * 2 - 1) * 8);
  parts.push(["神意", divineV]);

  const raw = 50 + parts.reduce((a, p) => a + p[1], 0);
  const score = Math.max(5, Math.min(97, Math.round(raw)));
  const level = score >= 76 ? "上上" : score >= 66 ? "上吉" : score >= 56 ? "中吉" : score >= 46 ? "中平" : "中下";

  return {
    score, level, season, now, parts, notes, chart: C, names: NG,
    pillars: { year: pz(C.P.year), month: pz(C.P.month), day: pz(C.P.day) },
    today: { ...today, pillar: pz(T.day) },
    dm: (C.yang ? "陽" : "陰") + WX[C.dm], dmStem: STEMS[C.P.day[0]],
    animal: ANIMAL[uB], sun: SIGNS[sun], moon: SIGNS[moon],
    favNames, birthSeason: C.birthSeason.name, birthState: C.birthState,
  };
}
/* ---------- 一生運程與流年提醒 ---------- */
const N81_DESC = ["",
"萬象開泰，根基穩固","混沌未定，進退易猶豫","天地人和，才智顯達","起步較難，宜先求穩","五行相生，福祿平順",
"天賦德厚，家業漸興","剛毅果決，宜柔中帶剛","意志堅定，努力有成","才高而際遇起伏，需防虛耗","告一段落後重新開局，宜守成",
"旱苗逢雨，穩步回升","根基較薄，宜量力而為","才藝多能，智慧出眾","人緣較疏，宜多經營家庭","慈祥有德，福壽雙全",
"寬厚得人望，貴人相助","意志剛強，能突破難關","有志竟成，事業有權","風雲蔽月，成敗起伏較大","外表平穩、內多波折，宜防虛耗",
"獨立有權威，能領導眾人","秋草逢霜，宜養精蓄銳","旭日東昇，聲勢漸壯","白手成家，財源漸豐","資性英敏，宜修涵養",
"波瀾重疊，宜沉著應對","志大慾多，宜知足自守","漂泊多變，宜穩定根基","智謀過人，財力可聚","浮沉不定，吉凶參半",
"智勇得志，名利可期","時來運轉，多得助力","鸞鳳相會，聲名顯達","辛勞較多，宜謹慎理財","溫和平靜，安穩有成",
"豪俠仗義，一生起伏","權威顯達，忠誠可靠","刻意經營，技藝有成","富貴可期，盛極需防衰","進取心強，宜謹慎保安",
"德望高大，前途寬廣","博識多能，宜專一致志","外祥內苦，宜防散財","多勞多慮，宜放寬心","順風揚帆，新生泰和",
"載寶行舟，宜步步為營","點石成金，開花結果","智謀兼備，可為人師","吉凶難分，宜隨機應變","吉凶互見，宜量力守成",
"盛衰交替，宜居安思危","先見之明，能成大業","外祥內憂，宜表裡如一","辛苦多勞，宜廣結善緣","外美內苦，宜踏實經營",
"歷經艱辛，堅忍可成","寒雪青松，晚來亨通","先苦後甘，晚運轉佳","時運較緩，宜積蓄實力","方向易迷，宜先定目標",
"名利雙收，宜謙和處世","基礎較弱，宜穩紮穩打","萬物化育，富貴榮華","浮沉不定，宜重親情","富貴長壽，家運隆昌",
"進退兩難，宜多請教","天賦幸運，順風通達","智慮周密，善於創造","精神易緊繃，宜調適身心","清靜寡合，宜廣交朋友",
"內心勞苦，宜貫徹始終","外吉內憂，宜未雨綢繆","志高力微，宜循序漸進","秋葉寂寞，宜培養興趣","退守保吉，宜安分守成",
"易有離散，宜重家庭","半吉半凶，先甘後苦需防","先盛後平，宜早作規劃","力有未逮，宜保養身心","辛勞不絕，宜修身養性",
"還原復始，萬物回春"];
const n81desc = n => N81_DESC[n > 81 ? ((n - 1) % 80) + 1 : n];
const STAGE_ADV = {
  young:  { 1: "求學與家庭助力足，適合多方嘗試、打好基礎。", 2: "求學過程有起伏，貴在持之以恆。", 3: "早年環境較辛苦，宜培養一技之長與獨立能力，家人多陪伴引導。" },
  middle: { 1: "事業與家庭可望有成，宜積極進取、累積資產。", 2: "成敗參半，宜穩健經營、分散風險。", 3: "中年壓力較大，宜量力而為，避免高風險投資與替人作保，並注意身心保養。" },
  old:    { 1: "晚景安穩、福壽綿長，宜分享經驗、享受天倫。", 2: "晚年以平穩為主，宜提早規劃退休與健康。", 3: "晚運較需經營，宜及早儲蓄、規劃保險與健康，多維繫親友關係。" },
};
const YEAR_ADV = {
  "值太歲": "本命年，宜穩不宜變，重大決定多斟酌，可安太歲求心安。",
  "沖太歲": "變動較多，注意交通安全、合約細節與搬遷換工作的時機。",
  "刑太歲": "易有是非糾紛，凡事依規矩辦理，文件仔細確認。",
  "害太歲": "防小人與口舌，人際上多一分保留。",
  "防破財": "比劫奪財之年，慎防借貸、替人作保、合夥投資，財不露白。",
  "壓力大": "七殺攻身之年，工作壓力與競爭較大，注意作息與健康，避免與人正面衝突。",
  "機運年": "喜用到位、太歲相合，機運佳，可規劃升遷、置產、進修或成家。",
};
function lifeReading(profile, today) {
  const [by, bm, bd] = profile.birth.split("-").map(Number);
  const C = chart(by, bm, bd), NG = nameGrids(profile.name);
  const out = { stages: null, extra: null, years: [] };
  if (NG) {
    const g = NG.grids;
    const st = (key, label, range, adv) => ({ label, range, grid: { tian: "天格", ren: "人格", di: "地格", wai: "外格", zong: "總格" }[key], n: g[key].n,
      wx: WX[g[key].wx], luck: g[key].luck, luckName: N81_NAME[g[key].luck], desc: n81desc(g[key].n), advice: STAGE_ADV[adv][g[key].luck] });
    out.stages = [st("di", "少年運", "約 1–24 歲", "young"), st("ren", "中年運", "約 25–48 歲", "middle"), st("zong", "晚年運", "約 49 歲以後", "old")];
    const sc = (a, b, A, B) => a === b ? `${A}${B}比和` : gen(a, b) ? `${A}生${B}` : gen(b, a) ? `${B}生${A}` : ctl(a, b) ? `${A}剋${B}` : `${B}剋${A}`;
    const anyCtl = [[g.tian.wx, g.ren.wx], [g.ren.wx, g.di.wx]].some(([a, b]) => ctl(a, b) || ctl(b, a));
    out.extra = {
      tian: `天格${g.tian.n}劃（${WX[g.tian.wx]}），代表祖蔭與長輩緣：${n81desc(g.tian.n)}。`,
      wai: `外格${g.wai.n}劃（${WX[g.wai.wx]}），代表人際與外援：${n81desc(g.wai.n)}。`,
      sancai: `三才${WX[g.tian.wx]}・${WX[g.ren.wx]}・${WX[g.di.wx]}：${sc(g.tian.wx, g.ren.wx, "天", "人")}、${sc(g.ren.wx, g.di.wx, "人", "地")}。` +
        (anyCtl ? "配置中有相剋，遇事宜多溝通協調，壓力來時別獨自承擔。" : "配置大致順暢，內外協調。"),
    };
  }
  // 流年（以立春為歲首）
  const lon = sunLon(today.y, today.m, today.d);
  const Y0 = today.y - (today.m <= 2 && lon >= 270 && lon < 315 ? 1 : 0);
  const bl = sunLon(by, bm, bd), birthY = by - (bm <= 2 && bl >= 270 && bl < 315 ? 1 : 0);
  const uB = C.P.year[1], dmS = C.P.day[0], dm = C.dm;
  for (let Y = Y0; Y < Y0 + 12; Y++) {
    const yc = (((Y - 4) % 60) + 60) % 60, s = yc % 10, b = yc % 12, se = stemWx(s), tags = [];
    if (b === uB) tags.push("值太歲");
    else if (Math.abs(b - uB) === 6) tags.push("沖太歲");
    else if ((b + uB) % 12 === 7) tags.push("害太歲");
    else {
      const xing = (x, y) => (x === 0 && y === 3) || (x === 3 && y === 0) || ([2, 5, 8].includes(x) && [2, 5, 8].includes(y)) || ([1, 10, 7].includes(x) && [1, 10, 7].includes(y));
      if (xing(b, uB)) tags.push("刑太歲");
    }
    if (se === dm && s % 2 !== dmS % 2) tags.push("防破財");
    if (ctl(se, dm) && s % 2 === dmS % 2 && !C.strong) tags.push("壓力大");
    const goodB = (b + uB) % 12 === 1 || (b % 4 === uB % 4 && b !== uB);
    if (!tags.length && C.fav.includes(se) && goodB) tags.push("機運年");
    if (tags.length) out.years.push({ year: Y, gz: STEMS[s] + BR[b], animal: ANIMAL[b], age: Y - birthY + 1, tags,
      good: tags[0] === "機運年", advice: tags.map(t => YEAR_ADV[t]).join("") });
  }
  return out;
}
function pick(poems, cat, gender, seasonName, level) {
  return poems.find(p => p.cat === cat && p.gender === gender && p.season === seasonName && p.level === level);
}
return { divine, pick, lifeReading, loadStrokes, nameGrids, sunLon, seasonOf, pillars, chart, WX, STATE, N81_NAME };
})();
if (typeof module !== "undefined") module.exports = QQ;
