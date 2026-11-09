// ===== RUN LOOP: drop in, loot, call extraction, leave. Die and you lose everything you carried. =====
// PROF is the persistent profile (banked materials + upgrades). RUN is the state of the current run.
const PROF_KEY='labyrinthus_profile';
let PROF={mats:0,intel:0,up:{},runs:0,out:0,dead:0,best:0};
try{Object.assign(PROF,JSON.parse(localStorage.getItem(PROF_KEY)||'{}'))}catch(e){}
const profSave=()=>{try{localStorage.setItem(PROF_KEY,JSON.stringify(PROF))}catch(e){}};
const UPS=[
 {id:'speed',n:'SPRINT SHOES',d:'+3% MOVE SPEED PER LEVEL',max:5,cost:l=>8+l*7},
 {id:'carry',n:'LOAD BEARING',d:'+4 KG CARRY CAPACITY PER LEVEL',max:5,cost:l=>8+l*7},
 {id:'call',n:'FAST BEACON',d:'EXTRACTION CHARGES 4 S FASTER PER LEVEL',max:5,cost:l=>10+l*8},
 {id:'reload',n:'QUICK HANDS',d:'REVOLVER RELOADS 10% FASTER PER LEVEL',max:5,cost:l=>9+l*7},
 {id:'robots',n:'QUIET STEPS',d:'REINFORCEMENT WAVES 8% SMALLER PER LEVEL',max:5,cost:l=>12+l*9},
 {id:'hull',n:'REINFORCED HULL',d:'+10 MAX HULL PER LEVEL',max:5,cost:l=>10+l*8},
 {id:'loot',n:'SCAVENGER EYE',d:'+10% LOOT FROM CACHES PER LEVEL',max:5,cost:l=>10+l*8}];
const upL=id=>PROF.up[id]||0;
const ITEMS={scrap:{n:'SCRAP METAL',w:.6,v:1},circuit:{n:'CIRCUIT BOARD',w:.3,v:3},core:{n:'POWER CORE',w:1.5,v:9},medkit:{n:'MEDKIT',w:.5,v:4},disk:{n:'DATA DISK',w:.1,v:0,i:1}};
const RS={hp:100,hpMax:100,heat:0,ammo:{mag:6,res:12},on:false,seed:1,inv:{},wt:0,cap:20,caches:[],st:0,t:0,win:0,hold:0,done:false,lr:Math.random,near:null,msg:''};
const CALL_T=()=>40-4*upL('call'),WIN_T=150,HOLD_T=4;
function runPrep(i){RS.on=!!LEVELS[i].run;ROB.length&&rReset();RS.caches=[];RS.inv={};RS.wt=0;RS.st=0;RS.t=0;RS.hold=0;RS.done=false;RS.near=null;
  if(RS.on){RS.seed=1+(Math.random()*99999|0);RS.lr=rng(RS.seed+7);RS.cap=20+4*upL('carry');rReset()}else P.gun=false}
function runBuild(){const cfg=Object.assign({},SECTIONS.scrap,{seed:RS.seed,stages:7});buildSection(cfg,0,true)}
// loot cache: a glowing crate you search with the use key. rich caches sit in dead ends.
function lootAt(x,y,z,rich){const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,.8,.8),new THREE.MeshBasicMaterial({color:rich?0xffd24a:0xff7a2e}));
  m.position.set(x,y+.4,z);m.userData.keep=true;LVL.add(m);RS.caches.push({x,y,z,rich,open:false,mesh:m})}
function lootHub(x,y,z,rich,p){if(!RS.on)return;if(p<1&&RS.lr()>p)return;lootAt(x,y,z,rich)}
function runRoll(rich){const out=[],n=(rich?3:1)+(RS.lr()<.5?1:0),bonus=1+.1*upL('loot');
  for(let i=0;i<n;i++){const r=RS.lr()*(rich?.8:1);let id=r>.93?'disk':r>(rich?.55:.84)?'core':r>.55?'circuit':'scrap';out.push([id,RS.lr()<bonus-1?2:1])}if(RS.lr()<.35)out.push(['ammo',1]);if(RS.lr()<.2)out.push(['medkit',1]);return out}
function runWt(){let w=0;for(const k in RS.inv)w+=ITEMS[k].w*RS.inv[k];RS.wt=w}
function runVal(){let v=0,d=0;for(const k in RS.inv){v+=ITEMS[k].v*RS.inv[k];if(ITEMS[k].i)d+=RS.inv[k]}return{v,d}}
function runUse(){if(!RS.on||RS.done)return;const p=P.pos;let b=null,bd=3.4;
  for(const c of RS.caches){if(c.open)continue;const d=Math.hypot(p.x-c.x,p.z-c.z);if(d<bd&&Math.abs(p.y-c.y)<3){b=c;bd=d}}
  if(!b)return;b.open=true;b.mesh.material.color.set(0x303030);b.mesh.scale.y=.5;snd('checkpoint');
  const got=[];for(const[id,n]of runRoll(b.rich)){if(id==='ammo'){RS.ammo.res+=6*n;got.push('+'+6*n+' ROUNDS');continue}if(RS.wt+ITEMS[id].w*n>RS.cap*1.3){got.push('TOO HEAVY: '+ITEMS[id].n);continue}RS.inv[id]=(RS.inv[id]||0)+n;runWt();got.push('+'+n+' '+ITEMS[id].n)}
  toast(got.join('   '),2200)}
function runCall(){if(!RS.on||RS.done||RS.st!==0)return;RS.st=1;RS.t=0;toast('EXTRACTION CALLED: HOLD OUT',2400);cineBars(2.5,'BEACON CHARGING  /  '+CALL_T()+' S')}
function runTick(dt){if(!RS.on||RS.done)return;const p=P.pos;rTick(dt);
  const r=RS.wt/RS.cap;P.wm=(1+.03*upL('speed'))*(1-Math.min(.35,Math.max(0,r-.5)*.6));
  RS.near=null;for(const c of RS.caches){if(!c.open&&Math.hypot(p.x-c.x,p.z-c.z)<3.4&&Math.abs(p.y-c.y)<3){RS.near=c;break}}
  if(RS.st===1){RS.t+=dt;if(RS.t>=CALL_T()){RS.st=2;RS.win=WIN_T;RS.hold=0;beacon(420);snd('win');toast('EXTRACTION OPEN: GET TO THE BEACON',3000);cineBars(3,'EXTRACTION OPEN')}}
  else if(RS.st===2){RS.win-=dt;const d=Math.hypot(p.x-GOAL.x,p.z-GOAL.z);
    if(d<5&&Math.abs(p.y-GOAL.y)<4){RS.hold+=dt;if(RS.hold>=HOLD_T)runEnd(true)}else RS.hold=Math.max(0,RS.hold-dt*2);
    if(RS.win<=0){RS.st=3;toast('EXTRACTION LOST',2500)}}}
function runEnd(ok){if(RS.done)return;RS.done=true;const{v,d}=runVal();PROF.runs++;
  if(ok){PROF.mats+=v;PROF.intel+=d;PROF.out++;PROF.best=Math.max(PROF.best,v)}else PROF.dead++;profSave();
  GS.state='win';touchOff();document.exitPointerLock();
  let lines=[];for(const k in RS.inv)lines.push(RS.inv[k]+' x '+ITEMS[k].n);
  $('winL').textContent=ok?'EXTRACTED':'SIGNAL LOST';
  $('winT').textContent=ok?('BANKED '+v+' MATERIALS'+(d?' + '+d+' INTEL':'')+'  /  TIME '+fmtT(P.time)+(lines.length?'  /  '+lines.join(', '):'')):('YOU LOST EVERYTHING YOU CARRIED ('+v+' MATERIALS)'+'  /  '+RS.msg);
  $('bAgain').innerHTML='<i>01</i>DROP AGAIN<em>&rarr;</em>';show('win');snd(ok?'win':'checkpoint')}
// ---- upgrades screen ----
let UPFROM='menu';
function buildUps(){$('upHead').innerHTML='<b>MATERIALS</b> '+PROF.mats+'&nbsp;&nbsp;&nbsp;<b>INTEL</b> '+PROF.intel+'&nbsp;&nbsp;&nbsp;<b>RUNS</b> '+PROF.runs+' ('+PROF.out+' EXTRACTED)';
  $('upList').innerHTML=UPS.map(u=>{const l=upL(u.id),mx=l>=u.max,c=u.cost(l);let pips='';for(let i=0;i<u.max;i++)pips+='<i class="'+(i<l?'on':'')+'"></i>';
    return`<div class="up"><div><b>${u.n}</b><small>${u.d}</small><span class="pips">${pips}</span></div><button data-u="${u.id}" ${mx||PROF.mats<c?'disabled':''}>${mx?'MAX':'BUY  '+c}</button></div>`}).join('')}
function openUps(from){UPFROM=from;buildUps();show('ups')}
$('upList').onclick=e=>{const b=e.target.closest('[data-u]');if(!b||b.disabled)return;const u=UPS.find(x=>x.id===b.dataset.u),l=upL(u.id),c=u.cost(l);
  if(l<u.max&&PROF.mats>=c){PROF.mats-=c;PROF.up[u.id]=l+1;profSave();snd('checkpoint');buildUps()}};
$('bUpBack').onclick=()=>{snd('click');show(UPFROM)};
// ---- HUD ----
function runHud(W,H){if(!RS.on)return;const rt=W-14;hx.textAlign='right';
  const over=RS.wt>RS.cap;txt('CARRY '+RS.wt.toFixed(1)+' / '+RS.cap+' KG',rt,H*.42,11,over?'#ff4a3a':INK);
  const{v,d}=runVal();txt('LOOT VALUE '+v+(d?'   DISKS '+d:''),rt,H*.42+16,9,'#9a968c');hx.textAlign='center';
  let m='',c=INK;const B=lab(S.binds.call);
  if(RS.st===0)m='PRESS '+B+': CALL EXTRACTION';else if(RS.st===1){m='BEACON CHARGING  '+Math.max(0,Math.ceil(CALL_T()-RS.t))+' S';c=ACC}
  else if(RS.st===2){const dx=GOAL.x-P.pos.x,dz=GOAL.z-P.pos.z,d2=Math.round(Math.hypot(dx,dz)),a=Math.atan2(-dx,-dz)-yaw,rel=Math.atan2(Math.sin(a),Math.cos(a));
    m='EXTRACTION OPEN  '+Math.ceil(RS.win)+' S  /  BEACON '+d2+' M  '+(Math.abs(rel)<.5?'^':rel>0?'<<':'>>');c='#b6ff4a';
    if(RS.hold>0)txt('HOLD POSITION  '+RS.hold.toFixed(1)+' / '+HOLD_T+' S',W/2,64,12,'#b6ff4a')}
  else m='EXTRACTION LOST';
  txt(m,W/2,48,11,c);
  robHud(W,H,rt);
  if(RS.near)txt('['+lab(S.binds.use)+'] SEARCH CACHE',W/2,H*.62,13,ACC);hx.textAlign='left'}
