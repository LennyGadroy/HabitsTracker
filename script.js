const HABITS = [
  {id:'sleep',    name:'Sleep',             emoji:'💤', type:'good',    color:'#60A5FA', freq:'Everyday',        weekdayOnly:true},
  {id:'projets',  name:'Personal Projects', emoji:'🚀', type:'good',    color:'#A78BFA', freq:'Everyday',        weekdayOnly:false},
  {id:'work',     name:'Work',              emoji:'💼', type:'good',    color:'#FBBF24', freq:'5 days per week', weekdayOnly:true},
  {id:'gym',      name:'Gym',               emoji:'🏋️', type:'good',    color:'#4ADE80', freq:'5 days per week', weekdayOnly:true},
  {id:'running',  name:'Running',           emoji:'🏃', type:'counter', color:'#F97316', freq:'5 days per week', weekdayOnly:false, step:1, goal:5, max:15, unit:'km'},
  {id:'setp',     name:'Setps',             emoji:'👣', type:'counter', color:'#34D399', freq:'Everyday',        weekdayOnly:false, step:1000, goal:10000, max:20000, unit:'steps'},
  {id:'drink',    name:'Drink Water',       emoji:'💧', type:'drink',   color:'#38BDF8', freq:'Everyday',        weekdayOnly:false},
  {id:'read',     name:'Read',              emoji:'📚', type:'good',    color:'#A78BFA', freq:'Everyday',        weekdayOnly:false, optional:true},
  {id:'cleaning', name:'Cleaning',          emoji:'🧹', type:'weekly',  color:'#4ADE80', freq:'Once a week',     weekdayOnly:false, optional:true},
];

const DRINK_GOAL = 2000;
const DRINK_STEP = 250;
const DRINK_MAX  = 5000;

const LEVEL_THRESHOLDS = [0,100,250,500,800,1200,1700,2400,3200,4200];
const LEVEL_NAMES = ['Novice','Apprentice','Practitioner','Devotee','Disciplined','Focused','Master','Grandmaster','Legend','Transcendent'];

const MOOD_LABELS  = ['','Bad','Not Good','Okay','Good','Great'];
const MOOD_EMOJIS  = ['','😡','😢','😐','😊','😎'];
const MOOD_COLORS  = ['','#F76F6F','#FB923C','#FBBF24','#4BD08B','#7C6FF7'];

const FEELINGS_BY_MOOD = {
  5: ['Happy','Brave','Motivated','Creative','Confident','Calm','Grateful','Peaceful','Excited','Loved','Hopeful','Inspired','Proud','Euphoric','Nostalgic'],
  4: ['Joyful','Relaxed','Content','Grateful','Optimistic','Energized','Focused','Cheerful','Pleased','Refreshed'],
  3: ['Okay','Neutral','Calm','Indifferent','Steady','Fine','Normal','Balanced'],
  2: ['Tired','Anxious','Stressed','Worried','Overwhelmed','Sad','Lonely','Frustrated'],
  1: ['Angry','Exhausted','Hopeless','Miserable','Depressed','Irritated','Burnt out'],
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DAY_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const fmtDate = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const parseDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays   = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const today     = () => fmtDate(new Date());
const isWeekend = d => { const dow=d.getDay(); return dow===0||dow===6; };
const isDayActive = (habit, dateObj) => {
  if (habit.activeDays) return habit.activeDays.includes(dateObj.getDay());
  if (habit.weekdayOnly) return !isWeekend(dateObj);
  return true;
};

function getDrinkMl(k) { const v=DB.habits['drink'].logs[k]; return typeof v==='number'?v:v==='done'?DRINK_GOAL:0; }
function isDrinkDone(k) { return getDrinkMl(k)>=DRINK_GOAL; }
function isBadFail(id,k) { return DB.habits[id].logs[k]==='fail'; }
function getCounterVal(id,k) { const v=DB.habits[id].logs[k]; return typeof v==='number'?v:0; }
function isCounterDone(habit,k) { return getCounterVal(habit.id,k)>=habit.goal; }
function getWeekMonday(dateObj) { const d=new Date(dateObj); d.setHours(0,0,0,0); const dow=d.getDay()===0?6:d.getDay()-1; d.setDate(d.getDate()-dow); return fmtDate(d); }
function isWeeklyDoneForWeek(id,wk) { const logs=DB.habits[id].logs; const s=parseDate(wk); for(let i=0;i<7;i++){const k=fmtDate(addDays(s,i));if(logs[k]==='done')return true;} return false; }

function getHabitDayValue(habit,k,dateObj) {
  if(habit.type==='drink')   return isDrinkDone(k)?1:0;
  if(habit.type==='counter') return isCounterDone(habit,k)?1:getCounterVal(habit.id,k)/habit.goal;
  if(habit.type==='weekly')  { const wk=getWeekMonday(dateObj||parseDate(k)); return isWeeklyDoneForWeek(habit.id,wk)?1:0; }
  if(habit.type==='bad')     return isBadFail(habit.id,k)?0:1;
  return DB.habits[habit.id].logs[k]==='done'?1:0;
}

function isHabitDoneOn(habit,k,dateObj) {
  const v = getHabitDayValue(habit,k,dateObj);
  return v===1;
}

function loadData() {
  try { const raw=localStorage.getItem('ht-v2.6'); if(raw) return JSON.parse(raw); } catch(e){}
  const d={createdAt:today(),habits:{},profile:{name:''},xp:0,moods:{},unlockedAchievements:[],perfectDaysClaimed:[],penaltiesApplied:[]};
  HABITS.forEach(h=>d.habits[h.id]={logs:{}});
  return d;
}
function saveData() { localStorage.setItem('ht-v2.6',JSON.stringify(DB)); }

let DB = loadData();
HABITS.forEach(h=>{ if(!DB.habits[h.id]) DB.habits[h.id]={logs:{}}; });
if(!DB.createdAt) DB.createdAt=today();
if(!DB.profile) DB.profile={name:''};
if(DB.profile.soundEnabled===undefined) DB.profile.soundEnabled=true;
if(!DB.xp) DB.xp=0;
if(!DB.unlockedAchievements) DB.unlockedAchievements=[];
if(!DB.moods) DB.moods={};
if(!DB.perfectDaysClaimed) DB.perfectDaysClaimed=[];
if(!DB.penaltiesApplied) DB.penaltiesApplied=[];
if(DB.profile.notifsEnabled===undefined) DB.profile.notifsEnabled=false;
if(DB.profile.darkMode===undefined) DB.profile.darkMode=false;
if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};

function initTheme() {
  const dark = DB.profile.darkMode===true;
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  const btn=document.getElementById('themeToggle');
  if(btn){ btn.textContent=dark?'ON':'OFF'; btn.className=`pref-toggle ${dark?'on':'off'}`; }
}
function toggleTheme() {
  DB.profile.darkMode = !DB.profile.darkMode;
  saveData(); initTheme();
}
initTheme();

const audioCtx = (() => { try { return new (window.AudioContext||window.webkitAudioContext)(); } catch(e){ return null; } })();
function playSound(type) {
  if(!DB.profile.soundEnabled||!audioCtx) return;
  try {
    if(audioCtx.state==='suspended') audioCtx.resume();
    const play=(freq,dur,waveType='sine',startGain=0.2,endGain=0.001)=>{
      const osc=audioCtx.createOscillator(); const g=audioCtx.createGain();
      osc.connect(g); g.connect(audioCtx.destination);
      osc.type=waveType; osc.frequency.value=freq;
      g.gain.setValueAtTime(startGain,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(endGain,audioCtx.currentTime+dur);
      osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+dur);
    };
    if(type==='done')    { play(659,0.05); setTimeout(()=>play(880,0.2),50); }
    if(type==='undo')    { play(440,0.15); setTimeout(()=>play(330,0.2),80); }
    if(type==='fail')    { play(280,0.35,'sawtooth',0.18); }
    if(type==='drink')   { [523,659].forEach((f,i)=>setTimeout(()=>play(f,0.3),i*100)); }
    if(type==='fanfare') { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>play(f,0.5,'triangle',0.22),i*130)); }
    if(type==='levelup') { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>play(f,0.55,'sine',0.28),i*100)); }
  } catch(e){}
}

function showToast(msg, dur=3200) {
  const toast=document.getElementById('toast');
  toast.textContent=msg; toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), dur);
}

function calcLevel(xp) {
  xp=xp||0; let level=1;
  for(let i=0;i<LEVEL_THRESHOLDS.length;i++){ if(xp>=LEVEL_THRESHOLDS[i]) level=i+1; else break; }
  return Math.min(level,LEVEL_THRESHOLDS.length);
}
function xpProgress(xp) {
  xp=xp||0; const level=calcLevel(xp);
  if(level>=LEVEL_THRESHOLDS.length) return {pct:100,needed:0};
  const cur=LEVEL_THRESHOLDS[level-1]||0; const next=LEVEL_THRESHOLDS[level];
  return {pct:Math.round(((xp-cur)/(next-cur))*100),needed:next-xp};
}
function giveXP(amount) {
  const prev=calcLevel(DB.xp); DB.xp=(DB.xp||0)+amount;
  const nw=calcLevel(DB.xp); saveData();
  if(nw>prev){ const name=LEVEL_NAMES[nw-1]||`Level ${nw}`; setTimeout(()=>{ playSound('levelup'); showToast(`🎉 Level Up! You're now ${name} — Lv.${nw}`,4000); },300); }
}
function loseXP(amount) { DB.xp=Math.max(0,(DB.xp||0)-amount); saveData(); }

function calcWeeklyStreak(habit) {
  const cwm=getWeekMonday(new Date()); const cur=isWeeklyDoneForWeek(habit.id,cwm);
  const start=cur?0:1; let streak=0;
  for(let o=start;o<104;o++){ const wm=fmtDate(addDays(parseDate(cwm),-o*7)); if(wm<DB.createdAt) break; if(!isWeeklyDoneForWeek(habit.id,wm)) break; streak++; }
  return streak;
}
function calcStreak(habit) {
  if(habit.type==='weekly') { const s=calcWeeklyStreak(habit); return {current:s,longest:s}; }
  const logs=DB.habits[habit.id].logs; const todayKey=today(); const createdAt=DB.createdAt;
  if(habit.type==='bad') {
    let streak=0; let d=new Date();
    for(let i=0;i<730;i++){ const k=fmtDate(d); if(k<createdAt) break; if(!isDayActive(habit,d)){d=addDays(d,-1);continue;} if(isBadFail(habit.id,k)) break; if(k<=todayKey) streak++; d=addDays(d,-1); }
    return {current:streak,longest:streak};
  }
  const logDone=k=>{ if(habit.type==='drink') return isDrinkDone(k); if(habit.type==='counter') return isCounterDone(habit,k); return logs[k]==='done'; };
  const todayDone=logDone(todayKey); const todayObj=new Date(); const todayInactive=!isDayActive(habit,todayObj); const todayEffDone=todayDone||todayInactive;
  let d=new Date(); if(!todayEffDone) d=addDays(d,-1);
  let streak=0;
  for(let i=0;i<730;i++){ const k=fmtDate(d); if(k<createdAt) break; if(!isDayActive(habit,d)){d=addDays(d,-1);continue;} if(logDone(k)) streak++; else break; d=addDays(d,-1); }
  let best=0,run=0; let dd=new Date(parseDate(createdAt));
  while(fmtDate(dd)<=todayKey){ const k=fmtDate(dd); if(!isDayActive(habit,dd)){dd=addDays(dd,1);continue;} if(logDone(k)){run++;best=Math.max(best,run);}else run=0; dd=addDays(dd,1); }
  return {current:streak,longest:Math.max(streak,best)};
}

function countDoneToday() {
  const t=today(); const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  return HABITS.filter(h=>!h.optional && isDayActive(h,todayDate) && isHabitDoneOn(h,t,todayDate)).length;
}
function requiredToday() { const todayDate=new Date(); todayDate.setHours(0,0,0,0); return HABITS.filter(h=>!h.optional&&isDayActive(h,todayDate)).length; }

const ACHIEVEMENTS = [
  { id:'first_habit', emoji:'🌱', name:'First Step',       desc:'Complete your first habit',              check:()=>Object.values(DB.habits).some(h=>Object.keys(h.logs).length>0) },
  { id:'camel',       emoji:'🐫', name:'Camel',            desc:'7-day water goal streak',                check:()=>{const h=HABITS.find(x=>x.id==='drink');return h&&calcStreak(h).current>=7;} },
  { id:'perfect_wk',  emoji:'⭐', name:'Perfect Week',     desc:'100% success for a full week',           check:()=>checkPerfectWeek() },
  { id:'king',        emoji:'👑', name:'King',             desc:'No bad habit triggered for 14 days',     check:()=>{const b=HABITS.filter(h=>h.type==='bad');return b.length>0&&b.every(h=>calcStreak(h).current>=14);} },
  { id:'centurion',   emoji:'⚔️', name:'Centurion',        desc:'Accumulate 100 XP',                      check:()=>(DB.xp||0)>=100 },
  { id:'on_fire',     emoji:'🔥', name:'On Fire',          desc:'Reach Level 5',                          check:()=>calcLevel(DB.xp)>=5 },
  { id:'bookworm',    emoji:'📖', name:'Bookworm',         desc:'14-day reading streak',                  check:()=>{const h=HABITS.find(x=>x.id==='read');return h&&calcStreak(h).current>=14;} },
  { id:'ironwill',    emoji:'💪', name:'Iron Will',        desc:'20 gym sessions this month',             check:()=>checkGymMonth() },
  { id:'consistent',  emoji:'🌅', name:'Consistent',       desc:'30+ day streak on any habit',            check:()=>HABITS.some(h=>calcStreak(h).current>=30) },
  { id:'night_tmd',   emoji:'🌙', name:'Night Owl Tamed',  desc:'14-day sleep streak',                    check:()=>{const h=HABITS.find(x=>x.id==='sleep');return h&&calcStreak(h).current>=14;} },
  { id:'xp_500',      emoji:'💎', name:'XP Hoarder',       desc:'Accumulate 500 XP',                      check:()=>(DB.xp||0)>=500 },
  { id:'dedicated',   emoji:'🎯', name:'Dedicated',        desc:'60+ day streak on any habit',            check:()=>HABITS.some(h=>calcStreak(h).current>=60) },
  { id:'perfectist',  emoji:'💯', name:'Perfectionist',    desc:'5 Perfect Days',                         check:()=>(DB.perfectDaysClaimed||[]).length>=5 },
  { id:'hydration',   emoji:'🌊', name:'Hydration Master', desc:'30-day water goal streak',               check:()=>{const h=HABITS.find(x=>x.id==='drink');return h&&calcStreak(h).current>=30;} },
  { id:'transcend',   emoji:'🌌', name:'Transcendent',     desc:'Reach the maximum level',                check:()=>calcLevel(DB.xp)>=LEVEL_THRESHOLDS.length },
  { id:'walker',      emoji:'👣', name:'Walker',           desc:'10 000 steps streak for 7 days',         check:()=>{const h=HABITS.find(x=>x.id==='setp');return h&&calcStreak(h).current>=7;} },
  { id:'marathoner',  emoji:'🏅', name:'Marathoner',       desc:'10 000 steps streak for 30 days',        check:()=>{const h=HABITS.find(x=>x.id==='setp');return h&&calcStreak(h).current>=30;} },
];

function checkPerfectWeek() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  for(let w=1;w<=12;w++){
    const ws=addDays(parseDate(getWeekMonday(todayDate)),-(w*7)); const wsk=fmtDate(ws);
    if(wsk<DB.createdAt) break;
    let perfect=true;
    for(let d=0;d<7;d++){
      const dt=addDays(ws,d); if(dt>todayDate) continue;
      const k=fmtDate(dt); if(k<DB.createdAt){perfect=false;break;}
      for(const h of HABITS){ if(h.optional) continue; if(!isDayActive(h,dt)) continue; if(getHabitDayValue(h,k,dt)!==1){perfect=false;break;} }
      if(!perfect) break;
    }
    if(perfect) return true;
  }
  return false;
}
function checkGymMonth() {
  const mk=today().slice(0,7);
  const cnt=Object.entries(DB.habits['gym'].logs).filter(([k,v])=>k.startsWith(mk)&&v==='done').length;
  return cnt>=20;
}
function checkAchievements() {
  let nu=0;
  ACHIEVEMENTS.forEach(a=>{ if(!DB.unlockedAchievements.includes(a.id)&&a.check()){ DB.unlockedAchievements.push(a.id); nu++; setTimeout(()=>{showToast(`🏆 Achievement: ${a.name} ${a.emoji}`,3500);playSound('done');},(nu*700)); } });
  if(nu>0) saveData();
}
function checkPerfectDayBonus() {
  const t=today(); if(DB.perfectDaysClaimed.includes(t)) return;
  if(countDoneToday()===requiredToday()){ DB.perfectDaysClaimed.push(t); giveXP(50); setTimeout(()=>showToast('🌟 Perfect Day! +50 XP bonus',3500),600); saveData(); }
}
function checkDailyPenalties() {}

function toggleHabit(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today();
  if(habit.type==='drink')   { addDrink();     return; }
  if(habit.type==='counter') { addCounter(id); return; }
  if(habit.type==='weekly') {
    const completing=DB.habits[id].logs[t]!=='done';
    if(completing) DB.habits[id].logs[t]='done'; else delete DB.habits[id].logs[t];
    completing?giveXP(20):playSound('undo'); if(!completing) playSound('undo');
    saveData(); checkAchievements(); afterToggle(id); return;
  }
  if(habit.type==='bad') {
    if(DB.habits[id].logs[t]==='fail'){delete DB.habits[id].logs[t];playSound('undo');}
    else{DB.habits[id].logs[t]='fail';playSound('fail');}
  } else {
    const completing=DB.habits[id].logs[t]!=='done';
    if(completing){DB.habits[id].logs[t]='done';giveXP(10);playSound('done');}
    else{delete DB.habits[id].logs[t];playSound('undo');}
  }
  saveData(); checkAchievements(); afterToggle(id);
}
function afterToggle(id) {
  if(countDoneToday()===requiredToday()){ launchConfetti(); playSound('fanfare'); checkPerfectDayBonus(); }
  renderActivePage();
  const el=document.querySelector(`[data-habit-id="${id}"]`);
  if(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function addDrink() { addDrinkAmount(DRINK_STEP); }
function addDrinkAmount(ml) {
  const t=today(); const cur=getDrinkMl(t);
  if(cur>=DRINK_MAX) return;
  const next=Math.min(DRINK_MAX, cur+ml);
  DB.habits['drink'].logs[t]=next;
  if(next>=DRINK_GOAL&&cur<DRINK_GOAL){playSound('drink');showToast('💧 Hydration goal reached! +10 XP');giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
}
function removeDrink() {
  const t=today(); const cur=getDrinkMl(t); if(cur<=0) return;
  const next=Math.max(0,cur-DRINK_STEP);
  if(next===0){delete DB.habits['drink'].logs[t];playSound('undo');}
  else{DB.habits['drink'].logs[t]=next; playSound('undo');}
  saveData(); renderActivePage();
}
function addCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur>=habit.max) return;
  const next=cur+habit.step;
  DB.habits[id].logs[t]=next;
  if(next>=habit.goal&&cur<habit.goal){playSound('done');showToast(`${habit.emoji} Goal reached! +10 XP`);giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
}
function removeCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur<=0) return;
  const next=Math.max(0,cur-habit.step);
  if(next===0){delete DB.habits[id].logs[t];}
  else{DB.habits[id].logs[t]=next;}
  playSound('undo'); saveData(); checkAchievements(); renderActivePage();
}
let _confParticles=[];
function launchConfetti() {
  const canvas=document.getElementById('confettiCanvas');
  if(!canvas) return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const colors=['#7C6FF7','#4BD08B','#F76F6F','#FBBF24','#60A5FA','#F9A8D4'];
  _confParticles=Array.from({length:90},()=>({x:Math.random()*canvas.width,y:-10,vy:2+Math.random()*3,vx:(Math.random()-0.5)*4,rot:Math.random()*360,size:6+Math.random()*8,color:colors[Math.floor(Math.random()*colors.length)],alpha:1}));
  animateConfetti();
}
function animateConfetti() {
  const canvas=document.getElementById('confettiCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  _confParticles=_confParticles.filter(p=>p.alpha>0.01);
  _confParticles.forEach(p=>{ p.y+=p.vy; p.x+=p.vx; p.rot+=3; p.alpha-=0.012; ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color; ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2); ctx.restore(); });
  if(_confParticles.length>0) requestAnimationFrame(animateConfetti);
}

let activePage = 'home';
let activeHomeTab = 'today';
let moodCalMonth = new Date();
moodCalMonth.setDate(1);

function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  document.getElementById(`page-${id}`).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`nav-${id}`).classList.add('active');
  activePage=id;
  renderActivePage();
}

function renderActivePage() {
  if(activePage==='home')         renderHome();
  if(activePage==='achievements') renderAchievements();
  if(activePage==='report')       renderReport();
  if(activePage==='myhabits')     renderMyHabits();
  if(activePage==='account')      renderAccount();
}

function switchHomeTab(tab) {
  activeHomeTab=tab;
  ['today','weekly','overall'].forEach(t=>{
    document.getElementById(`tab-${t}`).classList.toggle('hidden',t!==tab);
    document.getElementById(`tab-btn-${t}`).classList.toggle('active',t===tab);
  });
  renderHome();
}

function renderHome() {
  if(activeHomeTab==='today')   renderTodayTab();
  if(activeHomeTab==='weekly')  renderWeeklyTab();
  if(activeHomeTab==='overall') renderOverallTab();
  renderSleepSummary();
}

function renderTodayTab() {
  const container=document.getElementById('todayHabits'); if(!container) return;
  const t=today(); const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  container.innerHTML='';
  HABITS.forEach(habit=>{
    if(!isDayActive(habit,todayDate)) return;
    const card=document.createElement('div');
    card.className='habit-card today-card'; card.dataset.habitId=habit.id;
    const colorBg=habit.color+'22';
    const control=buildTodayControl(habit,t,todayDate);
    const isSimple=['good','bad','weekly'].includes(habit.type);
    card.innerHTML=`
      <div class="today-card-top">
        <div class="today-card-left">
          <div class="today-emoji-box" style="background:${colorBg}">${habit.emoji}</div>
          <div class="today-card-info">
            <div class="today-card-name">${habit.name}</div>
            <div class="today-card-sub">${buildTodaySubLabel(habit,t,todayDate)}</div>
          </div>
        </div>
        ${isSimple?control:""}
      </div>
      ${!isSimple?control:""}
    `;
    container.appendChild(card);
    if(DB.profile.zenMode) {
      const done=isHabitDoneOn(habit,t,todayDate)||(habit.type==='bad'&&!isBadFail(habit.id,t));
      if(done) setTimeout(()=>card.classList.add('zen-collapse'),10);
    }
  });
}

function buildTodaySubLabel(habit,t,todayDate) {
  const streak=calcStreak(habit).current;
  if(habit.type==='drink') {
    const ml=getDrinkMl(t); return `${ml}ml / ${DRINK_GOAL}ml${streak>0?` · 🔥 ${streak}d`:''}`;
  }
  if(habit.type==='counter') {
    const v=getCounterVal(habit.id,t); const u=habit.unit?` ${habit.unit}`:''; return `${v}${u} / ${habit.goal}${u}${streak>0?` · 🔥 ${streak}d`:''}`;
  }
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    return `${fail?'⚠ Slipped':'✓ Holding'} · 🔥 ${streak}d streak`;
  }
  return streak>0?`🔥 ${streak} day streak`:(habit.freq||'Everyday');
}

function buildTodayControl(habit,t,todayDate) {
  if(habit.type==='drink') {
    const ml=getDrinkMl(t); const pct=Math.min(100,Math.round((ml/DRINK_GOAL)*100));
    const atMax=ml>=DRINK_MAX;
    return `<div style="width:100%">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:.75rem;color:var(--text-2)">${ml}ml / ${DRINK_GOAL}ml</span>
        <button class="habit-toggle-btn${ml>=DRINK_GOAL?' done':''}" style="${ml>=DRINK_GOAL?`background:${habit.color}`:'border-color:'+habit.color}" onclick="removeDrink()">
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
        </button>
      </div>
      <div class="drink-bar-track"><div class="drink-bar-fill" style="width:${pct}%;background:${habit.color}"></div></div>
      ${atMax?'':`<div class="drink-btns">
        <button class="drink-btn" onclick="addDrinkAmount(250)">+250ml</button>
        <button class="drink-btn" onclick="addDrinkAmount(500)">+500ml</button>
      </div>`}
    </div>`;
  }
  if(habit.type==='counter') {
    const v=getCounterVal(habit.id,t); const done=v>=habit.goal; const atMax=v>=habit.max;
    const u=habit.unit?` ${habit.unit}`:'';
    return `<div class="counter-row" style="width:100%;justify-content:space-between;margin-top:0">
      <button class="counter-btn" onclick="removeCounter('${habit.id}')">−</button>
      <span class="counter-val">${v}${u} / ${habit.goal}${u}</span>
      ${atMax?'<div style="width:34px"></div>':`<button class="counter-btn" onclick="addCounter('${habit.id}')" style="${done?`background:${habit.color+'30'};color:${habit.color}`:''}">+</button>`}
    </div>`;
  }
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    return `<button class="habit-toggle-btn${fail?' done':''}"
      style="${fail?'background:#F76F6F;border-color:#F76F6F':'border-color:#4BD08B90'}"
      onclick="toggleHabit('${habit.id}')">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="20" height="20" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${fail?'<line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>':'<polyline points="4 10 8 14 16 6"/>'}
      </svg>
    </button>`;
  }
  const done=habit.type==='weekly'?isWeeklyDoneForWeek(habit.id,getWeekMonday(todayDate)):DB.habits[habit.id].logs[t]==='done';
  return `<button class="habit-toggle-btn${done?' done':''}" style="${done?`background:${habit.color};border-color:${habit.color}`:`border-color:${habit.color+'80'}`}" onclick="toggleHabit('${habit.id}')">
    <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
  </button>`;
}

function renderWeeklyTab() {
  const container=document.getElementById('weeklyHabits'); if(!container) return;
  container.innerHTML='';
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  HABITS.forEach(habit=>{
    const card=document.createElement('div');
    card.className='habit-card'; card.dataset.habitId=habit.id;
    const bgAlpha='22';
    let daysHtml='';
    DAY_SHORT.forEach((dayLbl,i)=>{
      const dateObj=addDays(monday,i); const k=fmtDate(dateObj);
      const active=isDayActive(habit,dateObj);
      const done=active&&isHabitDoneOn(habit,k,dateObj);
      const isToday=i===todayDow;
      const isSun=i===6;
      const isFuture=dateObj>todayDate;
      daysHtml+=`<div class="week-day-cell">
        <div class="week-day-label${isToday?' today-label':isSun?' sunday-label':''}">${dayLbl}</div>
        <div class="week-day-dot${done?' done':''}${!active?' inactive':''}" 
          style="${done?`background:${habit.color};border-color:${habit.color}`:active?`border-color:${habit.color+'50'}`:'border-color:var(--border)'}"
          ${!isFuture&&active?`onclick="toggleHabitOnDate('${habit.id}','${k}',this)"`:''}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji" style="background:${habit.color+'22'}">${habit.emoji}</div>
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div class="habit-card-freq" style="font-size:.74rem;color:var(--text-2)">${habit.freq||'Everyday'}</div>
          </div>
        </div>
        <div style="font-size:.75rem;color:var(--text-2);font-weight:700">🔥 ${calcStreak(habit).current}d</div>
      </div>
      <div class="week-day-row">${daysHtml}</div>
    `;
    container.appendChild(card);
  });
}

function toggleHabitOnDate(id, dateKey, dotEl) {
  const habit=HABITS.find(h=>h.id===id);
  if(habit.type==='bad') {
    if(DB.habits[id].logs[dateKey]==='fail') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='fail';
  } else if(habit.type==='weekly') {
    if(DB.habits[id].logs[dateKey]==='done') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='done';
  } else {
    if(DB.habits[id].logs[dateKey]==='done') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='done';
  }
  saveData();
  renderWeeklyTab();
}

function renderOverallTab() {
  const container=document.getElementById('overallHabits'); if(!container) return;
  container.innerHTML='';
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const numWeeks=16;
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const lastSunday=addDays(todayDate,-todayDow-1);
  const monday=addDays(todayDate,-todayDow);
  const startDate=addDays(monday,-((numWeeks-1)*7));

  HABITS.forEach(habit=>{
    const card=document.createElement('div');
    card.className='habit-card'; card.dataset.habitId=habit.id;
    let gridHtml='';
    DAY_SHORT.forEach((dayLbl,dow)=>{
      gridHtml+=`<div class="overall-row-label">${dayLbl[0]}</div>`;
      for(let w=0;w<numWeeks;w++){
        const dateObj=addDays(startDate,w*7+dow);
        const k=fmtDate(dateObj);
        const isFuture=dateObj>todayDate;
        const active=isDayActive(habit,dateObj);
        let cls='overall-dot';
        let style='';
        if(!active||isFuture) { cls+=' inactive'; }
        else if(isHabitDoneOn(habit,k,dateObj)) { cls+=' done'; style=`background:${habit.color}`; }
        else if(k>=DB.createdAt) { cls+=' missed'; style=`background:${habit.color}20;border:1.5px solid ${habit.color}40`; }
        gridHtml+=`<div class="${cls}" style="${style}" title="${k}"></div>`;
      }
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji" style="background:${habit.color+'22'}">${habit.emoji}</div>
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div class="habit-card-freq" style="font-size:.74rem;color:var(--text-2)">${habit.freq||'Everyday'}</div>
          </div>
        </div>
        <div style="font-size:.75rem;color:var(--text-2);font-weight:700">🔥 ${calcStreak(habit).current}d</div>
      </div>
      <div class="overall-dot-grid">${gridHtml}</div>
    `;
    container.appendChild(card);
  });
}

function renderMoodStat() {
  const container=document.getElementById('moodStatContent'); if(!container) return;
  const year=moodCalMonth.getFullYear(); const month=moodCalMonth.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today();

  let headers=DAY_SHORT.map(d=>`<div class="mood-cal-header">${d[0]}${d[1]}</div>`).join('');
  let cells='';
  for(let i=0;i<startDow;i++) cells+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d);
    const k=fmtDate(dateObj); const mood=DB.moods[k];
    const isFuture=k>today_;
    if(mood!==undefined&&!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}</div>
        <div class="mood-cal-day-label">${MOOD_LABELS[mood]||'?'}</div>
        <div class="mood-cal-day-label" style="font-size:.55rem">${d}</div>
      </div>`;
    } else if(!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-empty" onclick="openMoodModal('${k}')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="7" y1="3" x2="7" y2="11"/><line x1="3" y1="7" x2="11" y2="7"/></svg>
        </div>
        <div class="mood-cal-day-label">${d}</div>
      </div>`;
    } else {
      cells+=`<div class="mood-cal-cell"><div class="mood-cal-day-label" style="opacity:.3">${d}</div></div>`;
    }
  }

  container.innerHTML=`
    <div class="mood-cal-card">
      <div class="mood-cal-nav">
        <button class="mood-cal-nav-btn" onclick="moodCalPrev()">
          <svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg>
        </button>
        <div class="mood-cal-month">${MONTH_NAMES[month]} ${year}</div>
        <button class="mood-cal-nav-btn" onclick="moodCalNext()">
          <svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg>
        </button>
      </div>
      <div class="mood-cal-grid">
        ${headers}
        ${cells}
      </div>
    </div>
  `;
}
function moodCalPrev() { moodCalMonth.setMonth(moodCalMonth.getMonth()-1); renderActivePage(); }
function moodCalNext() { const nm=new Date(moodCalMonth); nm.setMonth(nm.getMonth()+1); if(nm<=new Date()) moodCalMonth=nm; renderActivePage(); }

let currentMoodDate=null;
let selectedMoodValue=null;
let selectedFeelings=[];

function checkDailyMood() {
  if(sessionStorage.getItem('moodChecked')) return;
  sessionStorage.setItem('moodChecked','1');
  const t=today(); if(t<DB.createdAt) return;
  if(DB.moods[t]!==undefined) return;
  setTimeout(()=>openMoodModal(t),2000);
}

function openMoodManual() { openMoodModal(today()); }

function openMoodModal(dateKey) {
  currentMoodDate=dateKey; selectedMoodValue=null; selectedFeelings=[];
  document.getElementById('moodStep1').classList.remove('hidden');
  document.getElementById('moodStep2').classList.add('hidden');
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.remove('selected'));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=true; btn.textContent='I Feel…';
  document.getElementById('moodModal').classList.add('open');
}

function closeMoodModal() { currentMoodDate=null; document.getElementById('moodModal').classList.remove('open'); }

function selectMoodCard(value) {
  selectedMoodValue=value;
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.value)===value));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=false;
  btn.textContent=`I Feel ${MOOD_LABELS[value]}!`;
}

function goToMoodStep2() {
  if(!selectedMoodValue) return;
  selectedFeelings=[];
  const title=document.getElementById('moodStep2Title');
  title.textContent=`${MOOD_LABELS[selectedMoodValue]}! How would you describe your feelings?`;
  const feelings=FEELINGS_BY_MOOD[selectedMoodValue]||[];
  const grid=document.getElementById('feelingsGrid');
  grid.innerHTML=feelings.map(f=>`<button class="feeling-tag" onclick="selectFeeling('${f}',this)">${f}</button>`).join('');
  document.getElementById('feelingsConfirmBtn').textContent='Confirm my choice';
  document.getElementById('moodStep1').classList.add('hidden');
  document.getElementById('moodStep2').classList.remove('hidden');
}

function selectFeeling(feeling, btn) {
  btn.classList.toggle('selected');
  if(btn.classList.contains('selected')) {
    if(!selectedFeelings.includes(feeling)) selectedFeelings.push(feeling);
  } else {
    selectedFeelings=selectedFeelings.filter(f=>f!==feeling);
  }
}

function saveMoodWithFeelings() {
  if(!currentMoodDate||!selectedMoodValue) return;
  DB.moods[currentMoodDate]=selectedMoodValue;
  if(selectedFeelings.length>0){
    if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};
    DB.profile.moodFeelings[currentMoodDate]=selectedFeelings.join(',');
  }
  saveData();
  closeMoodModal();
  if(activePage==='report') renderReport();
  showToast(`${MOOD_EMOJIS[selectedMoodValue]} Mood logged!`,2000);
}

function buildMoodCalHtml() {
  const year=moodCalMonth.getFullYear(); const month=moodCalMonth.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today();
  let headers=DAY_SHORT.map(d=>`<div class="mood-cal-header">${d[0]}${d[1]}</div>`).join('');
  let cells='';
  for(let i=0;i<startDow;i++) cells+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d); const k=fmtDate(dateObj); const mood=DB.moods[k];
    const isFuture=k>today_;
    if(mood!==undefined&&!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}</div>
        <div class="mood-cal-day-label" style="font-size:.55rem">${d}</div>
      </div>`;
    } else if(!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-empty" onclick="openMoodModal('${k}')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="7" y1="3" x2="7" y2="11"/><line x1="3" y1="7" x2="11" y2="7"/></svg>
        </div>
        <div class="mood-cal-day-label">${d}</div>
      </div>`;
    } else {
      cells+=`<div class="mood-cal-cell"><div class="mood-cal-day-label" style="opacity:.3">${d}</div></div>`;
    }
  }
  return `<div class="mood-cal-nav" style="margin-bottom:16px">
    <button class="mood-cal-nav-btn" onclick="moodCalPrev()"><svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg></button>
    <div class="mood-cal-month">${MONTH_NAMES[month]} ${year}</div>
    <button class="mood-cal-nav-btn" onclick="moodCalNext()"><svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg></button>
  </div>
  <div class="mood-cal-grid">${headers}${cells}</div>`;
}

function renderReport() {
  const container=document.getElementById('reportContent'); if(!container) return;

  const maxStreak=HABITS.reduce((m,h)=>Math.max(m,calcStreak(h).current),0);
  const last30=getLast30Completion();
  const completionRate=Math.round(last30*100);
  const totalCompleted=Object.values(DB.habits).reduce((s,h)=>s+Object.values(h.logs).filter(v=>v==='done').length,0);
  const perfectDays=(DB.perfectDaysClaimed||[]).length;

  const barData=buildBarData();
  const calHtml=buildCalStats();

  container.innerHTML=`
    <div class="report-wrap">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${maxStreak}</div>
          <div class="stat-label">Current streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${completionRate}%</div>
          <div class="stat-label">Completion rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${totalCompleted.toLocaleString()}</div>
          <div class="stat-label">Habits completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${perfectDays}</div>
          <div class="stat-label">Total perfect days</div>
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Habits Completed</div>
          <div class="report-period-badge">This Week
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <div class="bar-chart" id="barChart">
          ${barData.map((b,i)=>`
            <div class="bar-col">
              <div class="bar-fill${b.isToday?' active':''}" style="height:${b.pct}%;background:${b.isToday?'var(--accent)':'var(--accent-bg)'}">
                ${b.isToday?`<div class="bar-tooltip">${b.count} habits</div>`:''}
              </div>
              <div class="bar-label">${b.label}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Habit Completion Rate</div>
          <div class="report-period-badge">Last 6 Months
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <canvas id="lineChartReport" height="160"></canvas>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendar Stats</div>
          <div class="report-period-badge">This Month
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <div class="cal-stats-grid">
          ${DAY_SHORT.map(d=>`<div class="cal-stats-header">${d[0]}${d[1]}</div>`).join('')}
          ${calHtml}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Mood Calendar</div>
          <div class="report-period-badge" style="cursor:pointer" onclick="openMoodManual()">+ Log mood</div>
        </div>
        ${buildMoodCalHtml()}
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Mood Chart</div>
          <div class="report-period-badge">This Week
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <canvas id="moodChartReport" height="100"></canvas>
      </div>
    </div>
  `;

  requestAnimationFrame(()=>{
    drawLineChart('lineChartReport');
    drawMoodChart('moodChartReport');
  });
}

function getLast30Completion() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  let total=0, done=0;
  for(let i=0;i<30;i++){
    const d=addDays(todayDate,-i); const k=fmtDate(d);
    if(k<DB.createdAt) break;
    HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,d)) return; total++; if(isHabitDoneOn(h,k,d)) done++; });
  }
  return total>0?done/total:0;
}

function buildBarData() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  return DAY_SHORT.map((lbl,i)=>{
    const d=addDays(monday,i); const k=fmtDate(d);
    const isFuture=d>todayDate;
    if(isFuture) return {label:lbl,count:0,pct:0,isToday:false};
    let cnt=0,req=0;
    HABITS.forEach(h=>{ if(!isDayActive(h,d)) return; req++; if(isHabitDoneOn(h,k,d)) cnt++; });
    const pct=req>0?Math.max(5,Math.round((cnt/req)*100)):0;
    return {label:lbl,count:cnt,pct,isToday:i===todayDow};
  });
}

function buildCalStats() {
  const now=new Date(); const year=now.getFullYear(); const month=now.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today(); let html='';
  for(let i=0;i<startDow;i++) html+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d); const k=fmtDate(dateObj);
    const isFuture=k>today_;
    if(isFuture){ html+=`<div class="cal-stats-cell future">${d}</div>`; continue; }
    if(k<DB.createdAt){ html+=`<div class="cal-stats-cell">${d}</div>`; continue; }
    let done=0,req=0;
    HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,dateObj)) return; req++; if(isHabitDoneOn(h,k,dateObj)) done++; });
    const rate=req>0?done/req:0;
    let cls='cal-stats-cell'; if(rate>=1) cls+=' perfect'; else if(rate>=0.7) cls+=' good'; else if(req>0) cls+=' missed';
    html+=`<div class="${cls}" title="${done}/${req}">${d}</div>`;
  }
  return html;
}

function drawLineChart(canvasId) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth; const H=160; canvas.width=W; canvas.height=H;
  const isDark=DB.profile.darkMode===true;
  const accent=isDark?'#7C6FF7':'#7C6FF7';
  const gridC=isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)';
  const textC=isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';

  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const mn=d.getMonth(); const yr=d.getFullYear();
    let done=0,req=0;
    const daysInMonth=new Date(yr,mn+1,0).getDate();
    for(let day=1;day<=daysInMonth;day++){
      const dt=new Date(yr,mn,day); const k=fmtDate(dt);
      if(k>fmtDate(now)||k<DB.createdAt) continue;
      HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,dt)) return; req++; if(isHabitDoneOn(h,k,dt)) done++; });
    }
    months.push({label:MONTH_SHORT[mn],rate:req>0?Math.round((done/req)*100):0});
  }

  const pad={l:36,r:16,t:20,b:28};
  const cW=W-pad.l-pad.r; const cH=H-pad.t-pad.b;

  ctx.strokeStyle=gridC; ctx.lineWidth=1;
  [0,20,40,60,80,100].forEach(v=>{
    const y=pad.t+cH-(v/100)*cH;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.fillStyle=textC; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='right';
    ctx.fillText(`${v}%`,pad.l-6,y+4);
  });

  const points=months.map((m,i)=>({x:pad.l+(i/(months.length-1||1))*cW,y:pad.t+cH-(m.rate/100)*cH,rate:m.rate,label:m.label}));

  const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
  grad.addColorStop(0,'rgba(124,111,247,0.2)'); grad.addColorStop(1,'rgba(124,111,247,0)');
  ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y);
  points.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
  ctx.lineTo(points[points.length-1].x,pad.t+cH); ctx.lineTo(points[0].x,pad.t+cH);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();

  ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y);
  points.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
  ctx.strokeStyle=accent; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();

  points.forEach(p=>{
    ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle=accent; ctx.fill();
    ctx.fillStyle=textC; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.label,p.x,H-4);
  });
}

function drawMoodChart(canvasId) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth; const H=100; canvas.width=W; canvas.height=H;
  const isDark=DB.profile.darkMode===true;
  const textC=isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';

  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  const days=DAY_SHORT.map((lbl,i)=>({label:lbl,k:fmtDate(addDays(monday,i))}));
  const moods=days.map(d=>DB.moods[d.k]||null);

  const pad={l:16,r:16,t:16,b:24};
  const cW=W-pad.l-pad.r; const cH=H-pad.t-pad.b;
  const validPoints=[];
  days.forEach((d,i)=>{
    const m=moods[i]; if(m===null) return;
    const x=pad.l+(i/6)*cW; const y=pad.t+cH-((m-1)/4)*cH;
    validPoints.push({x,y,m,label:d.label});
  });

  if(validPoints.length>1){
    const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
    grad.addColorStop(0,'rgba(124,111,247,0.2)'); grad.addColorStop(1,'rgba(124,111,247,0)');
    ctx.beginPath(); ctx.moveTo(validPoints[0].x,validPoints[0].y);
    validPoints.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
    ctx.lineTo(validPoints[validPoints.length-1].x,pad.t+cH); ctx.lineTo(validPoints[0].x,pad.t+cH);
    ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(validPoints[0].x,validPoints[0].y);
    validPoints.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='#7C6FF7'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke();
  }

  days.forEach((d,i)=>{
    const m=moods[i]; const x=pad.l+(i/6)*cW;
    ctx.fillStyle=textC; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(d.label[0],x,H-4);
    if(m!==null){
      const y=pad.t+cH-((m-1)/4)*cH;
      ctx.font='14px serif'; ctx.fillText(MOOD_EMOJIS[m],x,y-6);
    }
  });
}

function renderMyHabits() {
  const container=document.getElementById('myHabitsContent'); if(!container) return;
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const t=today();
  container.innerHTML=`<div class="my-habits-list">
    ${HABITS.map(h=>{
      const streak=calcStreak(h).current;
      const done=isHabitDoneOn(h,t,todayDate);
      return `<div class="my-habit-row" data-habit-id="${h.id}">
        <div class="my-habit-emoji" style="background:${h.color+'22'}">${h.emoji}</div>
        <div class="my-habit-info">
          <div class="my-habit-name">${h.name}</div>
          <div class="my-habit-meta">${h.freq||'Everyday'} · ${h.type}</div>
        </div>
        <div class="my-habit-streak">🔥 ${streak}d</div>
        <div class="habit-toggle-btn${done?' done':''}" style="${done?`background:${h.color};border-color:${h.color}`:`border-color:${h.color+'60'}`}" onclick="toggleHabit('${h.id}')">
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function openAddHabit() { showToast('💡 Habit management coming soon!',2500); }

function renderAchievements() {
  const container=document.getElementById('achievementsContent'); if(!container) return;
  const unlocked=DB.unlockedAchievements.length;
  const total=ACHIEVEMENTS.length;
  const pct=Math.round((unlocked/total)*100);

  const categories=[
    { label:'Streaks & Consistency', ids:['consistent','dedicated','camel','hydration','bookworm','digital','night_tmd','plant_pwr','phonefree','king','sugarfree','ice_king'] },
    { label:'Milestones & XP',       ids:['first_habit','centurion','xp_500','on_fire','transcend'] },
    { label:'Perfect Days',          ids:['perfect_wk','perfectist','ironwill'] },
  ];

  const renderBadge=(a,i)=>{
    const isUnlocked=DB.unlockedAchievements.includes(a.id);
    return `<div class="achievement-badge ${isUnlocked?'unlocked':'locked'}" style="animation-delay:${i*.04}s">
      ${isUnlocked?'<div class="ach-unlocked-badge">✓</div>':''}
      <div class="ach-emoji">${a.emoji}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`;
  };

  const sectionsHtml=categories.map(cat=>{
    const badges=cat.ids.map((id,i)=>{
      const a=ACHIEVEMENTS.find(x=>x.id===id); if(!a) return '';
      return renderBadge(a,i);
    }).join('');
    return `<div class="ach-section">
      <div class="account-section-title">${cat.label}</div>
      <div class="achievements-grid">${badges}</div>
    </div>`;
  }).join('');

  const categorised=categories.flatMap(c=>c.ids);
  const otherBadges=ACHIEVEMENTS.filter(a=>!categorised.includes(a.id)).map(renderBadge).join('');
  const otherSection=otherBadges?`<div class="ach-section"><div class="account-section-title">Other</div><div class="achievements-grid">${otherBadges}</div></div>`:'';

  container.innerHTML=`<div class="account-wrap">
    <div class="xp-card" style="margin-bottom:0">
      <div class="xp-card-row">
        <span class="xp-label">🏆 Achievements Unlocked</span>
        <span class="xp-value">${unlocked} / ${total}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
    </div>
    ${sectionsHtml}
    ${otherSection}
  </div>`;
}

function renderAccount() {
  const container=document.getElementById('accountContent'); if(!container) return;
  const level=calcLevel(DB.xp); const prog=xpProgress(DB.xp);
  const name=DB.profile.name||'Habit Builder';
  const soundOn=DB.profile.soundEnabled!==false;
  const zenOn=!!DB.profile.zenMode;
  const darkOn=DB.profile.darkMode===true;
  const notifsOn=!!DB.profile.notifsEnabled;

  const achCount=DB.unlockedAchievements.length;
  const achTotal=ACHIEVEMENTS.length;

  container.innerHTML=`<div class="account-wrap">
    <div class="account-profile-card">
      <div class="account-avatar">👤</div>
      <div class="account-name">${name}</div>
      <div class="account-level-badge">Lv.${level} — ${LEVEL_NAMES[level-1]||'Novice'}</div>
    </div>

    <div class="xp-card">
      <div class="xp-card-row">
        <span class="xp-label">Experience Points</span>
        <span class="xp-value">${DB.xp} XP · ${prog.needed} to next level</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${prog.pct}%"></div></div>
    </div>

    <div>
      <div class="account-section-title">Preferences</div>
      <div class="pref-card">
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">✏️</span><div><div class="pref-label-text">Display name</div><div class="pref-hint">${name}</div></div></div>
          <button class="pref-toggle on" onclick="openProfile()" style="padding:0 12px;font-size:.75rem">Edit</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🌙</span><div><div class="pref-label-text">Dark mode</div><div class="pref-hint">Switch theme</div></div></div>
          <button class="pref-toggle ${darkOn?'on':'off'}" id="themeToggleAcc" onclick="toggleTheme()">${darkOn?'ON':'OFF'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🔊</span><div><div class="pref-label-text">Sound effects</div><div class="pref-hint">Auditory feedback</div></div></div>
          <button class="pref-toggle ${soundOn?'on':'off'}" onclick="togglePref('sound')">${soundOn?'ON':'OFF'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🧘</span><div><div class="pref-label-text">Zen mode</div><div class="pref-hint">Completed habits collapse</div></div></div>
          <button class="pref-toggle ${zenOn?'on':'off'}" onclick="togglePref('zen')">${zenOn?'ON':'OFF'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🔔</span><div><div class="pref-label-text">Notifications</div><div class="pref-hint">Daily reminders</div></div></div>
          <button class="pref-toggle ${notifsOn?'on':'off'}" onclick="toggleNotifications()">${notifsOn?'ON':'OFF'}</button>
        </div>
      </div>
    </div>

    <div class="danger-zone-card">
      <div class="account-section-title" style="color:var(--danger);margin-bottom:8px">⚠ Danger Zone</div>
      <div class="pref-hint" style="margin-bottom:12px">Permanently erases all data. Cannot be undone.</div>
      <button class="modal-reset-btn" onclick="confirmReset()">🗑 Reset all data</button>
    </div>
  </div>`;
}

function openProfile() {
  document.getElementById('pseudoInput').value=DB.profile.name||'';
  const dark=DB.profile.darkMode===true;
  const sound=DB.profile.soundEnabled!==false;
  const zen=!!DB.profile.zenMode;
  const notifs=!!DB.profile.notifsEnabled;
  updateToggleBtn('themeToggle',dark);
  updateToggleBtn('soundToggle',sound);
  updateToggleBtn('zenToggle',zen);
  updateToggleBtn('notifsToggle',notifs);
  document.getElementById('profileModal').classList.add('open');
  setTimeout(()=>document.getElementById('pseudoInput').focus(),80);
}
function closeProfile() { document.getElementById('profileModal').classList.remove('open'); }
function updateToggleBtn(id,on) {
  const btn=document.getElementById(id); if(!btn) return;
  btn.textContent=on?'ON':'OFF'; btn.className=`pref-toggle ${on?'on':'off'}`;
}
function saveProfileName() {
  DB.profile.name=document.getElementById('pseudoInput').value.trim();
  saveData(); closeProfile();
  if(activePage==='account') renderAccount();
}
function togglePref(pref) {
  if(pref==='sound')    { DB.profile.soundEnabled=DB.profile.soundEnabled===false; }
  if(pref==='zen')      { DB.profile.zenMode=!DB.profile.zenMode; if(!DB.profile.zenMode) document.querySelectorAll('.habit-card.zen-collapse').forEach(el=>el.classList.remove('zen-collapse')); }
  saveData();
  openProfile();
  closeProfile();
  if(activePage==='account') renderAccount();
}

const NOTIF_SCHEDULE = [
  {id:'work',   title:'💼 Work mode — 08:30',body:"Deep Focus activé.",hour:8,minute:30,days:[1,2,3,4,5]},
  {id:'running',title:'🏃 Running time — 17:30',body:"Enfile tes baskets!",hour:17,minute:30,days:[1,2,3,4,5]},
  {id:'sleep',  title:'💤 Lights out — 21:00',body:"Ton lit te réclame.",hour:21,minute:0,days:[1,2,3,4,5]},
  {id:'phone',  title:'📵 Phone down — 21:00',body:"Branche ton téléphone loin.",hour:21,minute:0,days:[0,1,2,3,4,5,6]},
];
let _notifTimers=[];

function initNotifications() {
  const on=!!DB.profile.notifsEnabled;
  ['notifsToggle'].forEach(id=>{ const btn=document.getElementById(id); if(btn){btn.textContent=on?'ON':'OFF';btn.className=`pref-toggle ${on?'on':'off'}`;} });
  if(on&&'Notification' in window&&Notification.permission==='granted') scheduleLocalNotifications();
}

async function toggleNotifications() {
  if(!('Notification' in window)){ alert('Notifications not supported.'); return; }
  if(DB.profile.notifsEnabled){
    DB.profile.notifsEnabled=false; _notifTimers.forEach(id=>clearTimeout(id)); _notifTimers=[]; saveData();
    showToast('🔕 Notifications disabled',2500);
    if(activePage==='account') renderAccount(); return;
  }
  let perm=Notification.permission;
  if(perm==='default') perm=await Notification.requestPermission();
  if(perm==='granted'){
    DB.profile.notifsEnabled=true; saveData(); scheduleLocalNotifications();
    showToast(`✅ ${NOTIF_SCHEDULE.length} reminders scheduled`,3000);
  } else { showToast('❌ Notifications blocked — check browser settings',3500); }
  if(activePage==='account') renderAccount();
}

function scheduleLocalNotifications() {
  _notifTimers.forEach(id=>clearTimeout(id)); _notifTimers=[];
  if(!DB.profile.notifsEnabled||!('Notification' in window)||Notification.permission!=='granted') return;
  NOTIF_SCHEDULE.forEach(n=>{
    const now=new Date(); const target=new Date(); target.setHours(n.hour,n.minute,0,0);
    if(target<=now) target.setDate(target.getDate()+1);
    const ms=target-now;
    if(ms>0&&ms<25*3600*1000) _notifTimers.push(setTimeout(()=>{ try{new Notification(n.title,{body:n.body,icon:'./assets/icon-192.png'});}catch(e){} },ms));
  });
}

function confirmReset() {
  if(confirm('⚠️ This will permanently delete ALL data. Cannot be undone.\n\nAre you sure?')){
    localStorage.removeItem('ht-v2.6'); location.reload();
  }
}

const BREATHING_PATTERNS = {
  box:  { name:'Box Breathing', phases:['Inhale','Hold','Exhale','Hold'], durations:[4,4,4,4], desc:'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s' },
  '478':{ name:'4-7-8',         phases:['Inhale','Hold','Exhale'],        durations:[4,7,8],   desc:'Inhale 4s · Hold 7s · Exhale 8s' },
  calm: { name:'Calm',          phases:['Inhale','Hold','Exhale'],        durations:[5,2,5],   desc:'Inhale 5s · Hold 2s · Exhale 5s' },
};

let breath = {
  active: false,
  pattern: 'box',
  phaseIdx: 0,
  secondsLeft: 0,
  rounds: 0,
  timer: null,
};

function openBreathing() {
  document.getElementById('breathingOverlay').classList.add('open');
  resetBreathDisplay();
}
function closeBreathing() {
  stopBreathing();
  document.getElementById('breathingOverlay').classList.remove('open');
}

function selectBreathPattern(p) {
  breath.pattern = p;
  document.querySelectorAll('.breath-pattern-btn').forEach(b => b.classList.toggle('active', b.dataset.pattern===p));
  document.getElementById('breathPatternDesc').textContent = BREATHING_PATTERNS[p].desc;
  if(breath.active) stopBreathing();
  resetBreathDisplay();
}

function resetBreathDisplay() {
  breath.rounds = 0;
  document.getElementById('breathRoundsCount').textContent = '0';
  document.getElementById('breathPhaseLabel').textContent = 'Prêt';
  document.getElementById('breathCountdown').textContent = BREATHING_PATTERNS[breath.pattern].durations[0];
  document.getElementById('breathPatternDesc').textContent = BREATHING_PATTERNS[breath.pattern].desc;
  const circle = document.getElementById('breathCircle');
  circle.className = 'breath-circle-inner';
  circle.style.animationDuration = '';
  document.getElementById('breathStartBtn').textContent = '▶ Start';
  document.getElementById('breathStartBtn').classList.remove('active');
}

function toggleBreathing() {
  if(breath.active) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  breath.active = true;
  breath.phaseIdx = 0;
  breath.rounds = 0;
  document.getElementById('breathStartBtn').textContent = '■ Stop';
  document.getElementById('breathStartBtn').classList.add('active');
  runBreathPhase();
}

function stopBreathing() {
  breath.active = false;
  clearTimeout(breath.timer);
  document.getElementById('breathStartBtn').textContent = '▶ Start';
  document.getElementById('breathStartBtn').classList.remove('active');
  document.getElementById('breathPhaseLabel').textContent = 'Terminé';
  const circle = document.getElementById('breathCircle');
  circle.className = 'breath-circle-inner';
  circle.style.animationDuration = '';
}

function runBreathPhase() {
  if(!breath.active) return;
  const pat = BREATHING_PATTERNS[breath.pattern];
  const phase = pat.phases[breath.phaseIdx];
  const dur = pat.durations[breath.phaseIdx];
  breath.secondsLeft = dur;

  const labels = { 'Inhale':'Inspirez', 'Hold':'Retenez', 'Exhale':'Expirez', 'Hold out':'Retenez' };
  document.getElementById('breathPhaseLabel').textContent = labels[phase] || phase;

  const circle = document.getElementById('breathCircle');
  const cssPhase = phase==='Inhale'?'phase-inhale': phase==='Exhale'?'phase-exhale': phase==='Hold'?'phase-hold':'phase-hold-out';
  circle.className = 'breath-circle-inner ' + cssPhase;
  circle.style.animationDuration = dur + 's';

  document.getElementById('breathCountdown').textContent = dur;
  let elapsed = 0;
  const tick = () => {
    if(!breath.active) return;
    elapsed++;
    const remaining = dur - elapsed;
    document.getElementById('breathCountdown').textContent = remaining > 0 ? remaining : 0;
    if(elapsed < dur) {
      breath.timer = setTimeout(tick, 1000);
    } else {
      breath.phaseIdx = (breath.phaseIdx + 1) % pat.phases.length;
      if(breath.phaseIdx === 0) {
        breath.rounds++;
        document.getElementById('breathRoundsCount').textContent = breath.rounds;
      }
      breath.timer = setTimeout(runBreathPhase, 100);
    }
  };
  breath.timer = setTimeout(tick, 1000);
}

function openMeditation() {
  document.getElementById('meditationOverlay').classList.add('open');
}
function closeMeditation() {
  document.getElementById('meditationOverlay').classList.remove('open');
}

function openSleepEntry() {
  const t = today();
  const existing = (DB.sleepLog || {})[t] || {};
  const modal = document.getElementById('sleepEntryModal');

  document.getElementById('sleepHours').value = existing.hours !== undefined ? existing.hours : '';
  document.getElementById('sleepMinutes').value = existing.minutes !== undefined ? String(existing.minutes).padStart(2,'0') : '';
  document.getElementById('sleepBedtime').value = existing.bedtime || '';
  document.getElementById('sleepWakeTime').value = existing.wakeTime || '';
  document.getElementById('sleepDate').value = t;

  modal.classList.add('open');
}

function closeSleepEntry() {
  document.getElementById('sleepEntryModal').classList.remove('open');
}

function saveSleepEntry() {
  const hours = parseInt(document.getElementById('sleepHours').value);
  const minutes = parseInt(document.getElementById('sleepMinutes').value) || 0;
  const bedtime = document.getElementById('sleepBedtime').value;
  const wakeTime = document.getElementById('sleepWakeTime').value;
  const date = document.getElementById('sleepDate').value || today();

  if(isNaN(hours) || hours < 0 || hours > 23) {
    showToast('⚠️ Please enter valid hours (0–23)');
    return;
  }

  if(!DB.sleepLog) DB.sleepLog = {};
  DB.sleepLog[date] = { hours, minutes, bedtime, wakeTime };

  if(DB.habits['sleep']) DB.habits['sleep'].logs[date] = 'done';

  saveData();
  closeSleepEntry();
  showToast(`💤 Sleep logged: ${hours}h ${minutes}min`);
  renderSleepSummary();
  if(activePage === 'home') renderActivePage();
}

function renderSleepSummary() {
  const el = document.getElementById('sleepSummaryDisplay');
  if(!el) return;
  const t = today();
  const log = (DB.sleepLog || {})[t];

  if(!log) {
    el.innerHTML = `<span style="color:var(--text-3);font-size:.85rem">Aucune donnée — appuyez sur "Enter" pour saisir</span>`;
    return;
  }

  const { hours, minutes, bedtime, wakeTime } = log;
  let html = `<div>
    <span class="sleep-big-value">${hours}</span><span class="sleep-big-unit">h</span>
    <span class="sleep-big-value" style="margin-left:4px">${String(minutes).padStart(2,'0')}</span><span class="sleep-big-unit">min</span>
  </div>`;

  if(bedtime || wakeTime) {
    html += `<div class="sleep-meta-row">`;
    if(bedtime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Coucher</span><span class="sleep-meta-value">${bedtime}</span></div>`;
    if(wakeTime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Réveil</span><span class="sleep-meta-value">${wakeTime}</span></div>`;
    html += `</div>`;
  }
  el.innerHTML = html;
}

function init() {
  checkDailyPenalties();
  if(!DB.sleepLog) { DB.sleepLog = {}; saveData(); }
  showPage('home');
  checkDailyMood();
  initNotifications();
  renderSleepSummary();
}


document.addEventListener('DOMContentLoaded', init);