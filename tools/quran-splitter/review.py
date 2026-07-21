# -*- coding: utf-8 -*-
"""
review.py — sura uchun o'zicha ishlaydigan (offline) tekshirish/tuzatish
sahifasini (review.html) yaratadi.

Sahifada: to'lqin (waveform), aniqlangan jimliklar, oyat chegaralari (suriladi),
har bir oyatning arabcha matni va uni tinglash tugmasi. Foydalanuvchi chegaralarni
to'g'rilab, tuzatilgan `SSS.cuts.json` faylini yuklab oladi. So'ng:
    python split.py <audio> --from-cuts SSS.cuts.json ...
buyrug'i bilan aniq `SSSAAA.mp3` fayllari qayta kesiladi.
"""

import json
import os

_HTML = r"""<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TARTIB — Oyatlarga bo'lishni tekshirish</title>
<style>
  :root { --bg:#0f1216; --panel:#171c22; --line:#2a323c; --ink:#e7edf3;
          --mut:#93a1b0; --acc:#3a9d78; --acc2:#e0a43b; --warn:#d9534f; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif; }
  header { padding:14px 18px; border-bottom:1px solid var(--line);
           display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; }
  h1 { font-size:17px; margin:0; font-weight:650; }
  .pill { font-size:12px; padding:3px 9px; border-radius:20px; background:#20272f;
          color:var(--mut); border:1px solid var(--line); }
  .pill.ok { color:#8fe0bd; border-color:#2f5b48; }
  .pill.warn { color:#f0b3b0; border-color:#5b3230; }
  .wrap { padding:14px 18px; }
  .bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:8px 0 12px; }
  button { background:#222a33; color:var(--ink); border:1px solid var(--line);
           border-radius:8px; padding:7px 12px; font-size:13px; cursor:pointer; }
  button:hover { border-color:#42505e; }
  button.primary { background:var(--acc); border-color:var(--acc); color:#06110c; font-weight:600; }
  button:disabled { opacity:.5; cursor:default; }
  label.file { display:inline-flex; align-items:center; gap:8px; }
  input[type=file] { font-size:12px; color:var(--mut); }
  .hint { color:var(--mut); font-size:12.5px; line-height:1.5; }
  .cv { position:relative; overflow-x:auto; overflow-y:hidden; border:1px solid var(--line);
        border-radius:10px; background:#0b0e12; }
  canvas { display:block; height:210px; }
  table { width:100%; border-collapse:collapse; margin-top:14px; font-size:14px; }
  th,td { padding:7px 9px; border-bottom:1px solid var(--line); text-align:left; }
  th { color:var(--mut); font-weight:500; font-size:12px; }
  td.ar { font-size:20px; line-height:1.7; font-family:"Amiri","Scheherazade New",serif; }
  tr.play td { background:#1b2a24; }
  .num { color:var(--mut); font-variant-numeric:tabular-nums; }
  .flag { color:var(--warn); font-size:12px; }
  .zoom { display:flex; align-items:center; gap:6px; color:var(--mut); font-size:12px; }
  .rowbtn { padding:3px 9px; font-size:12px; }
  a.dl { color:#8fe0bd; }
</style>
</head>
<body>
<header>
  <h1 id="ttl">Sura</h1>
  <span class="pill" id="mode"></span>
  <span class="pill" id="conf"></span>
  <span class="pill" id="cnt"></span>
</header>

<div class="wrap">
  <div class="hint" id="notes"></div>
  <div class="bar">
    <label class="file">🎵 Sura MP3'ini tanlang:
      <input type="file" id="file" accept="audio/*">
    </label>
    <button id="play">▶ Ijro</button>
    <button id="stop">⏹ To'xtat</button>
    <span class="zoom">Kattalashtirish
      <input type="range" id="zoom" min="6" max="120" value="24" step="1">
    </span>
    <label class="zoom"><input type="checkbox" id="snap" checked> jimlikka yopishsin</label>
    <button id="reset">↺ Boshiga</button>
    <button id="export" class="primary">⤓ cuts.json yuklab olish</button>
  </div>
  <div class="hint">
    Chegara chiziqlarini <b>sichqoncha bilan suring</b> — kerak bo'lsa oyat chegarasi
    to'g'ri jimlikka tushsin. To'lqindagi <b>rangli oraliqlar</b> — aniqlangan jimliklar.
    Har bir oyatni tinglash uchun jadvaldagi <b>▶</b> tugmasini bosing yoki to'lqinda
    o'sha oyat ustiga bosing. Hammasi to'g'ri bo'lgach, <b>cuts.json</b> ni yuklab oling.
  </div>

  <div class="cv" id="cvwrap"><canvas id="cv"></canvas></div>

  <table id="tbl">
    <thead><tr>
      <th>#</th><th>Matn</th><th>Boshi</th><th>Oxiri</th><th>Davomiylik</th><th></th><th></th>
    </tr></thead>
    <tbody id="tb"></tbody>
  </table>
</div>

<audio id="au"></audio>
<script id="data" type="application/json">__DATA__</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const au = document.getElementById('au');
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const cvwrap = document.getElementById('cvwrap');
const H = 210;
let pxPerSec = 24;
let edges = [];          // uzunligi N+1: [head, div1..div(N-1), tail]
const N = D.segments.length;
const dur = D.duration;

// —— boshlang'ich chegaralar ——
function initEdges(){
  edges = [];
  edges.push(D.segments[0].start);
  for(let i=0;i<N-1;i++) edges.push((D.segments[i].end + D.segments[i+1].start)/2);
  edges.push(D.segments[N-1].end);
}
initEdges();
const edges0 = edges.slice();

// —— sarlavha ——
document.getElementById('ttl').textContent = `${String(D.surah).padStart(3,'0')} — ${D.name} (${D.ayahs} oyat)`;
const modeTxt = {none:"Bismillah: yo'q/1-oyat", separate:"Bismillah: alohida→1-oyatga",
                 merged:"Bismillah: 1-oyat ichida", counted:"Bismillah: 1-oyat"};
document.getElementById('mode').textContent = modeTxt[D.bismillah_mode] || D.bismillah_mode;
const confEl = document.getElementById('conf');
confEl.textContent = `ishonch ${D.confidence}%`;
confEl.className = 'pill ' + (D.confidence>=75?'ok':'warn');
document.getElementById('cnt').textContent = `jimlik: ${D.candidates.length}`;
document.getElementById('notes').innerHTML = (D.notes||[]).map(n=>'⚠ '+n).join('<br>');

// —— o'lchov / chizish ——
function layout(){
  pxPerSec = +document.getElementById('zoom').value;
  const w = Math.max(cvwrap.clientWidth, Math.round(dur*pxPerSec));
  const dpr = window.devicePixelRatio||1;
  cv.width = w*dpr; cv.height = H*dpr; cv.style.width = w+'px'; cv.style.height = H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
const X = t => t/dur * (cv.width/(window.devicePixelRatio||1));
const T = x => x/(cv.width/(window.devicePixelRatio||1)) * dur;

function draw(){
  const w = cv.width/(window.devicePixelRatio||1);
  ctx.clearRect(0,0,w,H);
  // jimlik oraliqlari
  ctx.fillStyle = 'rgba(58,157,120,.16)';
  for(const c of D.candidates){ const x0=X(c.r0), x1=X(c.r1); ctx.fillRect(x0,0,Math.max(1,x1-x0),H); }
  // segment fon (navbatma-navbat)
  for(let i=0;i<N;i++){
    ctx.fillStyle = (i%2? 'rgba(255,255,255,.03)':'rgba(255,255,255,.06)');
    ctx.fillRect(X(edges[i]),0,X(edges[i+1])-X(edges[i]),H);
  }
  // to'lqin (envelope)
  const env=D.env, n=env.length;
  let lo=Infinity,hi=-Infinity; for(const v of env){ if(v<lo)lo=v; if(v>hi)hi=v; }
  lo=Math.max(lo,-75);
  ctx.strokeStyle='#4b6b5e'; ctx.lineWidth=1; ctx.beginPath();
  for(let i=0;i<n;i++){
    const t=i/(n-1)*dur, x=X(t);
    let h=(env[i]-lo)/Math.max(1,(hi-lo)); h=Math.max(0,Math.min(1,h));
    const y=H-6-h*(H-16);
    ctx.moveTo(x,H-6); ctx.lineTo(x,y);
  }
  ctx.stroke();
  // chegaralar
  for(let i=0;i<edges.length;i++){
    const x=X(edges[i]); const edge=(i===0||i===edges.length-1);
    ctx.strokeStyle = edge? '#6b7681' : (i===sel? '#e0a43b':'#e7edf3');
    ctx.lineWidth = i===sel?3:2; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    if(!edge){ ctx.fillStyle=i===sel?'#e0a43b':'#e7edf3'; ctx.beginPath();
      ctx.arc(x,10,5,0,7); ctx.fill(); }
  }
  // oyat raqamlari
  ctx.fillStyle='#9fb0bf'; ctx.font='11px system-ui'; ctx.textAlign='center';
  for(let i=0;i<N;i++){ const xm=(X(edges[i])+X(edges[i+1]))/2;
    ctx.fillText(D.segments[i].ayah, xm, H-10); }
  // playhead
  if(!au.paused){ const x=X(au.currentTime); ctx.strokeStyle='#d9534f'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
}

// —— chegarani surish ——
let sel=-1, drag=false;
function nearestEdge(x){ let bi=-1,bd=9; for(let i=0;i<edges.length;i++){
  const d=Math.abs(X(edges[i])-x); if(d<bd){bd=d;bi=i;} } return bi; }
cv.addEventListener('pointerdown',e=>{
  const r=cv.getBoundingClientRect(); const x=e.clientX-r.left;
  const bi=nearestEdge(x);
  if(bi>=0){ sel=bi; drag=true; cv.setPointerCapture(e.pointerId); draw(); }
  else { playAyahAt(T(x)); }
});
cv.addEventListener('pointermove',e=>{
  if(!drag) return;
  const r=cv.getBoundingClientRect(); let t=T(e.clientX-r.left);
  const lo = sel>0? edges[sel-1]+0.1 : 0;
  const hi = sel<edges.length-1? edges[sel+1]-0.1 : dur;
  t=Math.max(lo,Math.min(hi,t));
  if(document.getElementById('snap').checked && sel>0 && sel<edges.length-1){
    let best=null,bd=0.45; for(const c of D.candidates){ const d=Math.abs(c.t-t);
      if(d<bd && c.t>lo && c.t<hi){bd=d;best=c.t;} } if(best!==null) t=best;
  }
  edges[sel]=t; syncTable(); draw();
});
cv.addEventListener('pointerup',()=>{drag=false;});

// —— jadval ——
function fmt(t){ return t.toFixed(2); }
function buildTable(){
  const tb=document.getElementById('tb'); tb.innerHTML='';
  for(let i=0;i<N;i++){
    const s=D.segments[i];
    const tr=document.createElement('tr'); tr.dataset.i=i;
    tr.innerHTML = `<td class="num">${String(s.ayah).padStart(3,'0')}</td>`+
      `<td class="ar" dir="rtl">${s.text||''}</td>`+
      `<td class="num s"></td><td class="num e"></td><td class="num d"></td>`+
      `<td><button class="rowbtn play">▶</button></td>`+
      `<td class="flag">${s.flag?('⚠ '+s.flag):''}</td>`;
    tr.querySelector('.play').onclick=()=>playAyah(i);
    tb.appendChild(tr);
  }
  syncTable();
}
function syncTable(){
  const tb=document.getElementById('tb');
  for(let i=0;i<N;i++){ const tr=tb.children[i];
    tr.querySelector('.s').textContent=fmt(edges[i]);
    tr.querySelector('.e').textContent=fmt(edges[i+1]);
    tr.querySelector('.d').textContent=fmt(edges[i+1]-edges[i]);
  }
}

// —— ijro ——
let stopAt=null;
function playAyah(i){ playRange(edges[i],edges[i+1],i); }
function playAyahAt(t){ for(let i=0;i<N;i++) if(t>=edges[i]&&t<edges[i+1]){playAyah(i);return;} }
function playRange(a,b,i){
  if(!au.src){ alert("Avval sura MP3'ini tanlang."); return; }
  stopAt=b; au.currentTime=Math.max(0,a); au.play();
  const tb=document.getElementById('tb');
  for(const tr of tb.children) tr.classList.toggle('play', +tr.dataset.i===i);
}
au.addEventListener('timeupdate',()=>{ if(stopAt!==null && au.currentTime>=stopAt){ au.pause(); stopAt=null; }
  if(!au.paused) requestAnimationFrame(draw); });
au.addEventListener('play',()=>requestAnimationFrame(function f(){ if(!au.paused){draw();requestAnimationFrame(f);} }));
document.getElementById('play').onclick=()=>{ if(!au.src){alert("Avval sura MP3'ini tanlang.");return;}
  stopAt=null; if(au.paused) au.play(); else au.pause(); };
document.getElementById('stop').onclick=()=>{ au.pause(); stopAt=null;
  document.querySelectorAll('#tb tr').forEach(t=>t.classList.remove('play')); };

// —— fayl yuklash ——
document.getElementById('file').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  au.src=URL.createObjectURL(f); D.audio=f.name;
});

// —— boshqaruv ——
document.getElementById('zoom').addEventListener('input',layout);
document.getElementById('reset').onclick=()=>{ edges=edges0.slice(); sel=-1; syncTable(); draw(); };
window.addEventListener('resize',layout);

// —— eksport ——
document.getElementById('export').onclick=()=>{
  const segs=[]; for(let i=0;i<N;i++) segs.push({ayah:D.segments[i].ayah,
    start:+edges[i].toFixed(3), end:+edges[i+1].toFixed(3)});
  const out={surah:D.surah,name:D.name,bismillah_mode:D.bismillah_mode,
    audio:D.audio,confidence:D.confidence,edited:true,segments:segs};
  const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=String(D.surah).padStart(3,'0')+'.cuts.json'; a.click();
};

buildTable(); layout();
</script>
</body>
</html>"""


def render(plan, audio_path):
    a = plan["_analysis"]
    cands = [{"t": round((r[0] + r[1]) / 2, 3),
              "r0": round(r[0], 3), "r1": round(r[1], 3)} for r in a["runs"]]
    data = {
        "surah": plan["surah"],
        "name": plan["name"],
        "ayahs": plan["ayahs"],
        "duration": round(plan["duration"], 3),
        "bismillah_mode": plan["bismillah_mode"],
        "confidence": plan["confidence"],
        "notes": plan.get("notes", []),
        "thr": a["thr"],
        "vs": a["vs"], "ve": a["ve"],
        "env": a["env"],
        "candidates": cands,
        "audio": os.path.basename(audio_path),
        "segments": [{"ayah": s["ayah"],
                      "start": round(s["start"], 3),
                      "end": round(s["end"], 3),
                      "text": s.get("text", ""),
                      "flag": s.get("flag", "")} for s in plan["segments"]],
    }
    js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return _HTML.replace("__DATA__", js)
