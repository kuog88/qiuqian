(()=>{
const $=s=>document.querySelector(s);
const CAT={career:"事業",health:"健康",love:"感情",fortune:"運勢"};
const DEITY_SAY={"濟公師父":"濟公師父搖扇笑道","天上聖母":"天上聖母慈示","三太子":"三太子傳令","土地公":"土地公撫鬚指點"};
const GRID_NAME={tian:"天格",ren:"人格",di:"地格",wai:"外格",zong:"總格"};
let POEMS=null, state={profile:null,cat:null,deity:null,busy:false};
let db=null, uid=null;
function todayTW(){const t=new Date(Date.now()+8*3600e3);return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate()}}
const CN="〇一二三四五六七八九";
function cnNum(n){if(n<10)return CN[n];if(n===10)return "十";if(n<100){const t=Math.floor(n/10),o=n%10;return (t>1?CN[t]:"")+"十"+(o?CN[o]:"")}
  const h=Math.floor(n/100),r=n%100;return CN[h]+"百"+(r===0?"":r<10?"零"+CN[r]:r<20?"一十"+(r%10?CN[r%10]:""):cnNum(r))}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- 流程 ---------- */
const steps=["s1","s2","s3","s4","s5"];
function go(n){
  $("#sAdmin").hidden=true;
  steps.forEach((id,i)=>$("#"+id).hidden=i!==n-1);
  [...$("#rail").children].forEach((li,i)=>{li.className=i<n-1?"done":i===n-1?"on":""});
  if(n===4) resetTube();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g&&!state.busy)go(+g.dataset.go)});

const today=todayTW();$("#fBirth").max=`${today.y}-${String(today.m).padStart(2,"0")}-${String(today.d).padStart(2,"0")}`;
/* 出生年月日：年（附民國）／月／日下拉選單，組合成 YYYY-MM-DD 存進隱藏欄位 */
(()=>{
  const Y=$("#bY"),M=$("#bM"),D=$("#bD"),add=(sel,v,t)=>{const o=document.createElement("option");o.value=v;o.textContent=t;sel.appendChild(o)};
  for(let y=1920;y<=today.y;y++) add(Y,y,y>=1912?`民國${y-1911}年（${y}年）`:`${y}年`);
  for(let m=1;m<=12;m++) add(M,m,`${m} 月`);
  const fillDays=()=>{const y=+Y.value||2000,m=+M.value||1,n=new Date(y,m,0).getDate(),keep=+D.value;
    D.length=1;for(let d=1;d<=n;d++) add(D,d,`${d} 日`);if(keep&&keep<=n)D.value=keep;};
  const sync=()=>{$("#fBirth").value=(Y.value&&M.value&&D.value)?`${Y.value}-${String(M.value).padStart(2,"0")}-${String(D.value).padStart(2,"0")}`:"";};
  Y.addEventListener("change",()=>{fillDays();sync()});M.addEventListener("change",()=>{fillDays();sync()});D.addEventListener("change",sync);
  fillDays();
})();
$("#profileForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("#fName").value.trim(), birth=$("#fBirth").value, phone=$("#fPhone").value.trim();
  const g=document.querySelector("input[name=gender]:checked");
  let err="";
  if(!name) err="請填寫姓名。";
  else if(!birth) err="請選擇出生的年、月、日。";
  else if(birth>$("#fBirth").max) err="出生日期不能晚於今天，請重新選擇。";
  else if(!/^[0-9+\-\s()]{8,20}$/.test(phone)) err="請填寫正確的電話號碼（8 碼以上數字）。";
  else if(!g) err="請選擇性別。";
  else if(!$("#fConsent").checked) err="請勾選同意資料紀錄。";
  $("#formErr").textContent=err; if(err) return;
  state.profile={name,birth,phone,gender:g.value}; go(2);
});
$("#catGrid").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;state.cat=b.dataset.cat;go(3)});
$("#deityGrid").addEventListener("click",e=>{const b=e.target.closest("[data-deity]");if(!b)return;state.deity=b.dataset.deity;
  const g=$("#deityText");g.innerHTML="";const chars=[...state.deity],step=chars.length===3?44:36,start=255-(chars.length-1)*step/2+10;
  chars.forEach((c,i)=>{const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x","120");t.setAttribute("y",String(start+i*step));t.textContent=c;g.appendChild(t)});
  const p=state.profile,[y,m,d]=p.birth.split("-").map(Number), s=QQ.seasonOf(QQ.sunLon(today.y,today.m,today.d));
  $("#s4Title").textContent=`向${state.deity}求${CAT[state.cat]}籤`;
  $("#prayLine").textContent=`時值${s.name}季${s.term}，弟子${p.name}，${y}年${m}月${d}日生，誠心請示${state.deity}，${CAT[state.cat]}之事，請賜靈籤。`;
  go(4)});

/* ---------- 籤筒動畫 ---------- */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let actx=null;
function clack(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const n=actx.currentTime;
  for(let k=0;k<3;k++){const o=actx.createOscillator(),g=actx.createGain();o.type="triangle";o.frequency.value=900+Math.random()*700;
    g.gain.setValueAtTime(.0001,n+k*.035);g.gain.exponentialRampToValueAtTime(.22,n+k*.035+.004);g.gain.exponentialRampToValueAtTime(.0001,n+k*.035+.06);
    o.connect(g).connect(actx.destination);o.start(n+k*.035);o.stop(n+k*.035+.07)}}catch(_){}}
function resetTube(){
  ["#lid","#stick","#tubeAll"].forEach(s=>{const el=$(s);el.getAnimations().forEach(a=>a.cancel());el.style.transform="";el.style.opacity=""});
  $("#stickNo").textContent="";$("#shakeCount").textContent=POEMS?"":"籤詩庫載入中…";$("#s4Back").hidden=false;$("#shakeBtn").hidden=false;state.busy=false;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const shake=async()=>{
  if(state.busy||!POEMS) return; state.busy=true; $("#s4Back").hidden=true; $("#shakeBtn").hidden=true;
  const svg=$("#tubeBtn svg"), N=5+(Math.random()<.5?0:1), D=reduce?120:340;
  for(let i=1;i<=N;i++){
    $("#shakeCount").innerHTML=`搖籤中 <b>${i}</b> / ${N}`; clack();
    const dir=i%2?1:-1;
    await svg.animate([{transform:"rotate(0) translate(0,0)"},{transform:`rotate(${9*dir}deg) translate(${6*dir}px,-10px)`},{transform:`rotate(${-5*dir}deg) translate(${-3*dir}px,2px)`},{transform:"rotate(0) translate(0,0)"}],
      {duration:D,easing:"cubic-bezier(.3,.6,.4,1)"}).finished;
  }
  const a=QQ.divine(state.profile,state.cat,todayTW());
  const poem=QQ.pick(POEMS.poems,state.cat,state.profile.gender,a.season.name,a.level);
  const sn=$("#stickNo");sn.textContent="";[...cnNum(poem.no)].forEach((c,i)=>{const t=document.createElementNS("http://www.w3.org/2000/svg","tspan");t.setAttribute("x","120");if(i)t.setAttribute("dy","17");t.textContent=c;sn.appendChild(t)});
  $("#shakeCount").textContent="開蓋…";
  await $("#lid").animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:"translate(0,-34px) rotate(-4deg)",opacity:1,offset:.4},{transform:"translate(90px,-60px) rotate(24deg)",opacity:0}],
    {duration:reduce?200:900,easing:"ease-in-out",fill:"forwards"}).finished;
  await $("#stick").animate([{transform:"translateY(0)"},{transform:"translateY(-76px)"}],{duration:reduce?200:900,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"}).finished;
  $("#shakeCount").innerHTML=`得 <b>第${cnNum(poem.no)}籤</b>`;
  await wait(reduce?300:1100);
  renderResult(poem,a); go(5); state.busy=false;
  saveRecord(poem,a);
};
$("#tubeBtn").addEventListener("click",shake);
$("#shakeBtn").addEventListener("click",shake);

/* ---------- 結果 ---------- */
function renderResult(poem,a){
  const p=state.profile, title=p.gender==="男"?"信士":"信女";
  const lvClass=a.level.startsWith("上")?"":a.level==="中下"?" low":" mid";
  const st=a.now, seasonChips=[0,1,2,3,4].sort((x,y)=>QQ.STATE.indexOf(st[x])-QQ.STATE.indexOf(st[y]))
    .map(e=>`<li class="${st[e]==="旺"?"hot":st[e]==="相"?"warm":""}">${QQ.WX[e]}${st[e]}</li>`).join("");
  const n=a.names;
  const nameBlock=n?`<div class="sec"><h3>姓名五格</h3>
      <div class="grid5">${["tian","ren","di","wai","zong"].map(k=>{const g=n.grids[k];return `<div><small>${GRID_NAME[k]}</small><b>${g.n}</b><em class="ji${g.luck}">${QQ.WX[g.wx]}・${QQ.N81_NAME[g.luck]}</em></div>`}).join("")}</div>
      <p>${esc(a.notes.name)}</p></div>`
    :`<div class="sec"><h3>姓名五格</h3><p class="note">「${esc(p.name)}」無法以康熙筆畫推算五格（需為 2–4 字中文姓名），本次略過姓名學。</p></div>`;
  const L=QQ.lifeReading(p,todayTW());
  const stageBlock=L.stages?`<div class="sec"><h3>姓名一生運程</h3>
      <div class="stages">${L.stages.map(s=>`<div class="stage-card l${s.luck}">
        <div class="stage-top"><b>${s.label}</b><span>${s.range}</span></div>
        <div class="stage-num">${s.grid} ${s.n} 劃・${s.wx}・<em>${s.luckName}</em></div>
        <p class="stage-desc">${s.desc}</p><p>${s.advice}</p></div>`).join("")}</div>
      <p>${L.extra.tian}${L.extra.wai}${L.extra.sancai}</p></div>`:"";
  const yearBlock=`<div class="sec"><h3>未來十二年流年提醒</h3>
      ${L.years.length?`<ul class="years">${L.years.map(y=>`<li class="${y.good?"good":""}">
        <div class="yr"><b>${y.year}</b><span>${y.gz}年・虛歲${y.age}</span></div>
        <div class="ytags">${y.tags.map(t=>`<i>${t}</i>`).join("")}</div>
        <p>${y.advice}</p></li>`).join("")}</ul>`:`<p>未來十二年沒有特別需要留意的太歲或破財年，平穩為主。</p>`}
      <p class="note">依生肖與太歲的沖、刑、害，及流年天干與日主的關係推算。以上為民俗命理參考，用來提醒自己多一分準備，不代表必然發生。</p></div>`;
  $("#slip").innerHTML=`
    <div class="slip-head">
      <div class="slip-no">第${cnNum(poem.no)}籤・${CAT[poem.cat]}
        <small>${esc(p.name)}${title}・${esc(state.deity)}所賜・${a.season.name}季${a.season.term}・${a.today.y}/${a.today.m}/${a.today.d}</small></div>
      <div class="level${lvClass}">${a.level}</div>
    </div>
    <div class="poem"><div>${poem.lines.map(l=>`<p>${[...l].map(c=>`<span>${c}</span>`).join("")}</p>`).join("")}</div></div>
    <div class="sec"><h3>籤意白話</h3><p>${poem.meaning}</p></div>
    <div class="sec"><h3>${esc(state.deity)}示下</h3>
      <p>${DEITY_SAY[state.deity]}：${a.notes.season}${a.notes.star}${a.notes.day}${a.notes.gender}</p></div>
    <div class="sec"><h3>時令旺衰</h3><ul class="season">${seasonChips}</ul>
      <p class="note">${a.season.name}季${a.season.earth?"末土旺用事":""}：當令者旺、令生者相、生令者休、剋令者囚、令剋者死。</p></div>
    <div class="sec"><h3>生辰八字</h3>
      <div class="pillars">
        <div><small>年柱</small><b>${a.pillars.year}</b></div><div><small>月柱</small><b>${a.pillars.month}</b></div>
        <div class="dm"><small>日柱・日主</small><b>${a.pillars.day}</b></div><div><small>時柱</small><b>－</b></div>
      </div>
      <p>日主${a.dmStem}屬${a.dm}，生於${a.birthSeason}季（${a.birthState}），${a.chart.strong?"身強":"身弱"}，喜用${a.favNames}。屬${a.animal}，${a.sun}座。${a.notes.branch}${a.notes.moon}</p></div>
    ${nameBlock}
    ${stageBlock}
    ${yearBlock}
    <div class="meter"><span>本籤氣數</span><span class="bar"><i style="width:${a.score}%"></i></span><b>${a.score}</b></div>
    <div class="yiji">
      <div class="yi"><h4>宜</h4><ul>${poem.yi.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="ji"><h4>忌</h4><ul>${poem.ji.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    </div>
    <span class="saved" id="savedMsg"></span>`;
}
$("#againBtn").addEventListener("click",()=>go(2));

/* ---------- 紀錄（內建資料庫） ---------- */
async function initStore(){
  try{
    const [d,u]=await Promise.all([claude.use("db"),claude.use("user")]);
    if(!d||!u) return; db=d; uid=await u.id();
    if(await u.isOwner()) $("#adminBtn").hidden=false;
  }catch(_){db=null}
}
function sendToSheet(poem,a){
  const url=(window.QIUQIAN_CONFIG||{}).SHEET_ENDPOINT;
  if(!url||!/^https:\/\/script\.google\.com\//.test(url)) return;
  const p=state.profile;
  const rec={name:p.name,birth:p.birth,gender:p.gender,phone:p.phone,category:CAT[poem.cat],deity:state.deity,
    season:a.season.name+"季"+a.season.term,poemNo:poem.no,level:a.level,score:a.score,
    bazi:`${a.pillars.year} ${a.pillars.month} ${a.pillars.day}`,renGe:a.names?a.names.grids.ren.n:""};
  // text/plain 避免跨網域預檢；Apps Script 收到後寫入試算表
  fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(rec)})
    .then(()=>{const m=$("#savedMsg");if(m)m.textContent="已登錄於宮方紀錄"}).catch(()=>{});
}
async function saveRecord(poem,a){
  sendToSheet(poem,a);
  if(!db||!uid) return;
  const p=state.profile, at=new Date().toISOString();
  try{
    await db.doc(`draws/${uid}`).set({name:p.name,phone:p.phone,lastAt:at});
    await db.collection(`draws/${uid}/log`).add({createdAt:at,name:p.name,birth:p.birth,gender:p.gender,phone:p.phone,
      category:CAT[poem.cat],deity:state.deity,season:a.season.name+"季"+a.season.term,poemNo:poem.no,level:a.level,score:a.score,
      bazi:`${a.pillars.year} ${a.pillars.month} ${a.pillars.day}`,renGe:a.names?a.names.grids.ren.n:null});
    const m=$("#savedMsg"); if(m) m.textContent="已登錄於宮方紀錄";
  }catch(_){}
}
let rows=[];
async function loadAdmin(){
  const body=$("#adminBody"); body.innerHTML=`<tr><td colspan="10" class="empty">讀取中…</td></tr>`;
  try{
    const users=await db.collection("draws").get(); rows=[];
    for(const u of users.docs){const logs=await db.collection(`draws/${u.id}/log`).get();logs.docs.forEach(l=>rows.push(l.data()))}
    rows.sort((x,y)=>String(y.createdAt).localeCompare(String(x.createdAt)));
    if(!rows.length){body.innerHTML=`<tr><td colspan="10" class="empty">還沒有人求籤。信眾求籤後，紀錄會出現在這裡。</td></tr>`;$("#csvBtn").hidden=true;return}
    const fmt=s=>{const d=new Date(s);return isNaN(d)?"":d.toLocaleString("zh-TW",{timeZone:"Asia/Taipei",hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})};
    body.innerHTML=rows.map(r=>`<tr><td class="num">${fmt(r.createdAt)}</td><td>${esc(r.name)}</td><td class="num">${esc(r.birth)}</td><td>${esc(r.gender)}</td><td class="num">${esc(r.phone)}</td><td>${esc(r.category)}</td><td>${esc(r.deity)}</td><td>${esc(r.season||"")}</td><td class="num">${esc(r.poemNo)}</td><td>${esc(r.level)}</td></tr>`).join("");
    $("#adminInfo").textContent=`共 ${rows.length} 筆紀錄。只有您（本頁擁有者）看得到這份表格。`;
    $("#csvBtn").hidden=false;
  }catch(_){body.innerHTML=`<tr><td colspan="10" class="empty">讀取失敗，請稍後重新開啟。</td></tr>`}
}
$("#adminBtn").addEventListener("click",()=>{if(state.busy)return;steps.forEach(id=>$("#"+id).hidden=true);$("#sAdmin").hidden=false;loadAdmin()});
$("#adminClose").addEventListener("click",()=>{$("#sAdmin").hidden=true;const n=[...$("#rail").children].findIndex(li=>li.className==="on")+1||1;$("#"+steps[n-1]).hidden=false});
$("#csvBtn").addEventListener("click",async()=>{
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const head=["時間","姓名","出生日期","性別","電話","類別","神明","時令","籤號","籤等","氣數","八字（年月日）","人格"];
  const csv="﻿"+[head.map(q).join(","),...rows.map(r=>[r.createdAt,r.name,r.birth,r.gender,r.phone,r.category,r.deity,r.season,r.poemNo,r.level,r.score,r.bazi,r.renGe].map(q).join(","))].join("\r\n");
  try{const dl=await claude.use("downloads");if(!dl){$("#csvMsg").textContent="此檢視無法下載檔案。";return}
    const t=todayTW();await dl.save({filename:`求籤紀錄_${t.y}${String(t.m).padStart(2,"0")}${String(t.d).padStart(2,"0")}.csv`,data:csv});
    $("#csvMsg").textContent="已下載";}catch(e){$("#csvMsg").textContent=e&&e.code==="declined"?"已取消下載":"下載失敗，請再試一次。"}
});

/* ---------- 啟動 ---------- */
Promise.all([fetch("poems.json").then(r=>r.json()),fetch("strokes.json").then(r=>r.json())])
  .then(([p,s])=>{POEMS=p;QQ.loadStrokes(s);if(!$("#s4").hidden&&!state.busy)$("#shakeCount").textContent=""})
  .catch(()=>{$("#shakeCount").textContent="籤詩庫載入失敗，請重新整理頁面。"});
go(1);
if(window.claude&&claude.use) initStore();
})();
