const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- HERO MATCHER ---------- */
const DATA = {
  "Getting customers": {
    said: "I'm stuck on getting customers…",
    count: 4,
    members: [
      {init:"P", role:"Ex-partnerships lead, Fortune 50 tech", loc:"United States",
       offer:"I spent years opening partnership doors at one of the world's biggest tech companies. I'll help you map exactly who to reach and what to say."},
      {init:"B", role:"Consumer brand builder", loc:"Southeast Asia",
       offer:"I build brands people remember. Bring me your story and we'll shape it into the reason customers say yes."}
    ]
  },
  "Building the business": {
    said: "I'm stuck on actually building this…",
    count: 5,
    members: [
      {init:"S", role:"Founder of five businesses", loc:"United States",
       offer:"I've launched businesses across e-commerce and services. Whatever stage is scaring you, I've survived it and can show you the shortcuts."},
      {init:"O", role:"A decade in logistics & operations", loc:"United States",
       offer:"A decade moving products around the world. I'll help you turn your overwhelming to-do list into a system that runs without you."}
    ]
  },
  "Strategy": {
    said: "I'm stuck on strategy…",
    count: 3,
    members: [
      {init:"H", role:"People-strategy & governance consultant", loc:"North America",
       offer:"I've guided organizations through their messiest decisions. Bring me the problem you can't untangle and leave with your next three steps."},
      {init:"R", role:"Design researcher & strategist", loc:"United States",
       offer:"Research and strategy are my trade. I'll help you find the customer need hiding in plain sight."}
    ]
  },
  "Doing this alone": {
    said: "Honestly… I'm tired of doing this alone.",
    count: 11,
    members: [
      {init:"T", role:"Trauma-informed care expert & founder", loc:"United States",
       offer:"I've spent my career helping people through heavy things. Here, you don't have to perform okay-ness."},
      {init:"A", role:"Your accountability circle", loc:"6 countries",
       offer:"Eleven of us, six countries, all building too. We'll remember what you said you'd do, and ask how it went."}
    ]
  }
};

const convo = document.getElementById("convo");
const chipsEl = document.getElementById("chips");
Object.keys(DATA).forEach(k => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = k; b.setAttribute("aria-pressed","false");
  b.addEventListener("click", () => run(k));
  chipsEl.appendChild(b);
});
function clearFlow(){convo.querySelectorAll(".bubble,.member,.typing,.after").forEach(n=>n.remove())}
function run(key){
  clearFlow();
  chipsEl.querySelectorAll(".chip").forEach(c=>
    c.setAttribute("aria-pressed", c.textContent===key ? "true":"false"));
  const d = DATA[key];
  const you = document.createElement("div");
  you.className = "bubble you"; you.textContent = d.said;
  convo.appendChild(you);
  const typing = document.createElement("div");
  typing.className = "typing"; typing.innerHTML = "<b></b><b></b><b></b>";
  typing.setAttribute("aria-label","Searching the directory");
  convo.appendChild(typing);
  setTimeout(()=>{
    typing.remove();
    d.members.forEach((m,i)=>{
      setTimeout(()=>{
        const card = document.createElement("div");
        card.className = "member";
        card.innerHTML = `
          <div class="mhead">
            <div class="avatar">${m.init}</div>
            <div class="mwho"><b>${m.role}</b><span>${m.loc}</span></div>
          </div>
          <div class="moffer">&ldquo;${m.offer}&rdquo;</div>`;
        convo.appendChild(card);
        if(i === d.members.length-1) showAfter(d.count);
      }, reduced ? 0 : i*700);
    });
  }, reduced ? 0 : 900);
}
function showAfter(count){
  setTimeout(()=>{
    const a = document.createElement("div");
    a.className = "after";
    a.innerHTML = `<p class="count"><b>${count} members</b> can help with this</p>
      <a class="cta" href="https://tally.so/r/QK9bQG">Join the next circle</a>
      <button class="switch" onclick="resetFlow()">Try another</button>`;
    convo.appendChild(a);
  }, reduced ? 0 : 500);
}
function resetFlow(){
  clearFlow();
  chipsEl.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed","false"));
}

/* ---------- VOICE NOTE DEMO ---------- */
const bars = document.getElementById("bars");
const NBARS = 34;
const VN_SECONDS = 120; /* the sample ask is presented as a 2:00 voice note */
for(let i=0;i<NBARS;i++){
  const b = document.createElement("i");
  b.style.height = (6 + Math.abs(Math.sin(i*1.7))*16) + "px";
  bars.appendChild(b);
}
const playBtn = document.getElementById("playBtn");
const vnTime = document.getElementById("vnTime");
const vnReplies = document.getElementById("vnReplies");
let playTimer = null, pos = 0, played = false;
function fmtTime(secs){
  return Math.floor(secs/60) + ":" + String(secs%60).padStart(2,"0");
}
playBtn.addEventListener("click", ()=>{
  if(playTimer){ stopVn(); return; }
  playBtn.classList.add("playing");
  playBtn.setAttribute("aria-label","Pause the sample ask");
  document.getElementById("vnScript").classList.add("show");
  const barEls = bars.children;
  const total = reduced ? 1 : 60;
  playTimer = setInterval(()=>{
    pos++;
    const lit = Math.floor((pos/total)*NBARS);
    for(let i=0;i<NBARS;i++) barEls[i].classList.toggle("lit", i<lit);
    vnTime.textContent = fmtTime(Math.min(VN_SECONDS, Math.floor(pos/total*VN_SECONDS)));
    if(pos>=total){ stopVn(true); }
  }, reduced ? 10 : 50);
});
function stopVn(finished){
  clearInterval(playTimer); playTimer = null; pos = 0;
  playBtn.classList.remove("playing");
  playBtn.setAttribute("aria-label","Play a sample ask");
  if(!finished){
    for(const b of bars.children) b.classList.remove("lit");
    vnTime.textContent = "0:00";
    return;
  }
  vnTime.textContent = fmtTime(VN_SECONDS);
  if(!played){
    played = true;
    const lead = document.createElement("p");
    lead.className = "vn-lead";
    lead.innerHTML = "Within two days, her circle replied &mdash; and one answer came from beyond it:";
    vnReplies.appendChild(lead);
    const HELPS = [
      ["M","Founder of five businesses","First Customers Circle",
       "exp","Been there",
       "&ldquo;Big retailers said no to me for a year. Independent caf&eacute;s and studios said yes in weeks &mdash; start there, and bring samples, not a pitch deck.&rdquo;"],
      ["D","Consumer brand builder","First Customers Circle",
       "idea","A new idea",
       "&ldquo;Go where tired moms already are: daycare pickups, pediatric waiting rooms, prenatal classes. Daycares hand things to every parent at the door.&rdquo;"],
      ["J","Ex-partnerships lead, Fortune 50 tech","From the wider BeHeld community",
       "intro","An intro",
       "&ldquo;A friend from my corporate days runs buying for a small grocery chain. Want an intro this week?&rdquo;"]
    ];
    HELPS.forEach((h,i)=>{
      setTimeout(()=>{
        const d = document.createElement("div");
        d.className = "help";
        d.innerHTML = `
          <div class="hhead">
            <div class="avatar">${h[0]}</div>
            <div class="hwho"><b>${h[1]}</b><span>${h[2]}</span></div>
            <span class="htag ${h[3]}">${h[4]}</span>
          </div>
          <div>${h[5]}</div>`;
        vnReplies.appendChild(d);
      }, reduced ? 0 : (i+0.5)*700);
    });
  }
}

/* ---------- COMMITMENT DEMO ---------- */
const MOVES = ["Email 20 local shops","Book 3 discovery calls","Ship the pricing page","Send the first investor update"];
const commitChips = document.getElementById("commitChips");
const commitOut = document.getElementById("commitOut");
MOVES.forEach(m=>{
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = m; b.setAttribute("aria-pressed","false");
  b.addEventListener("click", ()=>commit(m,b));
  commitChips.appendChild(b);
});
function commit(move, btn){
  commitChips.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed", c===btn ? "true":"false"));
  commitOut.innerHTML = "";
  const card = document.createElement("div");
  card.className = "commit-card";
  card.innerHTML = `<b>Your commitment:</b> &ldquo;${move}&rdquo; by Friday. Your check-in partner this cycle: the founder of five businesses. The whole circle knows.`;
  commitOut.appendChild(card);
  setTimeout(()=>{
    const n = document.createElement("div");
    n.className = "nudge";
    n.innerHTML = `<div class="from">Day 5 &middot; your check-in partner</div>&ldquo;Hey, how did &lsquo;${move.toLowerCase()}&rsquo; go? Rooting for you either way.&rdquo;`;
    commitOut.appendChild(n);
    showOutcome(move);
  }, reduced ? 0 : 1200);
}
function showOutcome(move){
  setTimeout(()=>{
    const o = document.createElement("div");
    o.className = "outcome";
    const yes = document.createElement("button");
    yes.className = "chip"; yes.textContent = "It's done ✓";
    const no = document.createElement("button");
    no.className = "chip"; no.textContent = "Not yet";
    yes.addEventListener("click", ()=>graduate(o));
    no.addEventListener("click", ()=>regroup(o));
    o.appendChild(yes); o.appendChild(no);
    commitOut.appendChild(o);
  }, reduced ? 0 : 900);
}
function graduate(o){
  o.remove();
  const g = document.createElement("div");
  g.className = "grad";
  g.innerHTML = `
    <div class="gtitle">First customers: done. 🎉</div>
    <div class="gsub">You've moved past the issue you came with. Circles end when the problem does &mdash; then you choose what's next:</div>
    <div class="outcome" style="margin-top:0">
      <button class="chip" data-n="next">Join the Fundraising Circle</button>
      <button class="chip" data-n="stay">Stay &amp; sponsor the next founder</button>
    </div>`;
  commitOut.appendChild(g);
  g.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{
    g.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed", c===b ? "true":"false"));
    let f = g.querySelector(".final"); if(f) f.remove();
    f = document.createElement("div"); f.className="final";
    f.textContent = b.dataset.n==="next"
      ? "Matched. New problem, new circle — and people already rooting for you."
      : "You're now the one who's been there. The next founder gets you.";
    g.appendChild(f);
  }));
}
function regroup(o){
  o.remove();
  const g = document.createElement("div");
  g.className = "grad";
  g.style.borderLeftColor = "var(--berry)";
  g.innerHTML = `
    <div class="gtitle">Then the circle leans in.</div>
    <div class="gsub">A new angle, another intro, and a smaller next step. Being stuck isn't a verdict here &mdash; it's just where the circle starts working.</div>`;
  commitOut.appendChild(g);
}

/* ---------- CITY ROTATOR ---------- */
const CITIES = ["New York","Nairobi","Singapore","Melbourne","Sicily","Denver","Philadelphia","Boston"];
let ci = 0;
if(!reduced){
  setInterval(()=>{
    ci = (ci+1) % CITIES.length;
    document.getElementById("cities").textContent = CITIES[ci];
  }, 1800);
}
