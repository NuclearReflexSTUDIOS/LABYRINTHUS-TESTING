// ===== ROBOTS: drones (fast swarm), scavengers (run away and sound the alarm), sentries (turrets); heat + director; revolver + melee; player health =====
// Everything is boxes so your own models can replace them later (types are looked up in ROBT).
const RM={body:new THREE.MeshLambertMaterial({color:0xb4bac4,emissive:0x3a3d44}),dark:new THREE.MeshLambertMaterial({color:0x5a5e66,emissive:0x16171a}),strip:new THREE.MeshBasicMaterial({color:0xff7a2e}),eye:new THREE.MeshBasicMaterial({color:0xff3a2e}),eye2:new THREE.MeshBasicMaterial({color:0xffd24a}),
  bolt:new THREE.MeshBasicMaterial({color:0xff5a3a}),drop:new THREE.MeshBasicMaterial({color:0x7be3ff}),tr:new THREE.MeshBasicMaterial({color:0xfff2c0})};
const bx=(g,w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
const ROBT={
 drone:{hp:20,r:.55,range:40,mk(){const g=new THREE.Group();bx(g,.55,.22,.55,0,0,0,RM.body);bx(g,.58,.06,.58,0,.0,0,RM.strip);bx(g,.26,.26,.12,0,0,-.3,RM.eye);for(const[x,z]of[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]])bx(g,.4,.04,.4,x,.16,z,RM.dark);return g}},
 scav:{hp:30,r:.65,range:32,mk(){const g=new THREE.Group();bx(g,.8,.8,.55,0,1.0,0,RM.body);bx(g,.84,.1,.6,0,1.0,0,RM.strip);bx(g,.5,.4,.5,0,1.65,0,RM.dark).name='head';bx(g,.3,.12,.1,0,1.68,-.27,RM.eye2);for(const x of[-.22,.22])bx(g,.2,.7,.2,x,.35,0,RM.dark);bx(g,.06,.6,.06,.25,2.1,.1,RM.dark);bx(g,.5,.5,.3,0,1.05,.4,RM.dark);return g}},
 sentry:{hp:80,r:.8,range:46,mk(){const g=new THREE.Group();bx(g,1.2,.5,1.2,0,.25,0,RM.dark);const h=new THREE.Group();h.name='head';h.position.y=1.0;bx(h,.9,.7,.9,0,0,0,RM.body);bx(h,.94,.1,.94,0,0,0,RM.strip);bx(h,.2,.2,1.0,0,0,-.8,RM.dark);bx(h,.3,.12,.1,0,.2,-.46,RM.eye).name='lamp';g.add(h);return g}}};
const BOLTS=[],DROPS=[],ROB=[];
function rReset(){ROB.length=0;BOLTS.length=0;DROPS.length=0;RS.hp=RS.hpMax=100+10*upL('hull');RS.heat=0;RS.seen=0;RS.noiseT=0;RS.dirT=6;RS.hitM=0;RS.flash=0;RS.kills=0;RS.ammo={mag:6,res:12};RS.rl=0;RS.cd=0;P.gun=true}
function robAdd(t,x,y,z,o={}){const T=ROBT[t],m=T.mk();m.position.set(x,y,z);m.userData.keep=true;LVL.add(m);
  const r={t,m,x,y,z,hp:T.hp,st:'idle',cd:1+Math.random()*2,vx:0,vy:0,vz:0,los:false,lt:Math.random()*.3,home:{x,y,z},ph:Math.random()*6.28,warn:0,...o};ROB.push(r);return r}
function robHub(t,x,y,z,o){if(RS.on)robAdd(t,x,y,z,o)}
const eyeP=()=>({x:P.pos.x,y:P.pos.y+1.6,z:P.pos.z}),ctr=()=>({x:P.pos.x,y:P.pos.y+P.h*.5,z:P.pos.z});
function clear(ax,ay,az,bx2,by,bz){const dx=bx2-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz),n=Math.ceil(L/1.2);for(let i=1;i<n;i++){const t=i/n;if(hitAt(ax+dx*t,ay+dy*t,az+dz*t,.1))return false}return true}
function heatAdd(n){RS.heat=Math.min(100,RS.heat+n)}
function hurt(n){if(RS.done)return;RS.hp-=n;RS.flash=.45;P.shake=Math.max(P.shake,.5);snd('hurt',.8);if(RS.hp<=0){RS.hp=0;RS.msg='DESTROYED';runEnd(false)}}
function bolt(r,dmg,spd=20,spread=.03){const e=ctr(),dx=e.x-r.x,dy=e.y-(r.y+.4),dz=e.z-r.z,L=Math.hypot(dx,dy,dz)||1;
  const m=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.5),RM.bolt);m.position.set(r.x,r.y+.4,r.z);m.userData.keep=true;LVL.add(m);
  const v={x:dx/L+(Math.random()-.5)*spread*2,y:dy/L+(Math.random()-.5)*spread*2,z:dz/L+(Math.random()-.5)*spread*2};
  const b={m,x:r.x,y:r.y+.4,z:r.z,vx:v.x*spd,vy:v.y*spd,vz:v.z*spd,life:4,dmg};m.lookAt(m.position.x+b.vx,m.position.y+b.vy,m.position.z+b.vz);BOLTS.push(b);snd('bolt',.45,.8+Math.random()*.4)}
function drop(r){const T={drone:[['scrap',.7],['ammo',.25],['circuit',.2]],scav:[['scrap',1],['scrap',.6],['circuit',.5],['ammo',.4],['core',.1]],sentry:[['core',.7],['circuit',1],['circuit',.5],['ammo',.8]]}[r.t];
  for(const[id,p]of T)if(Math.random()<p){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),RM.drop);m.userData.keep=true;LVL.add(m);const a=Math.random()*6.28;DROPS.push({m,id,x:r.x+Math.cos(a)*.8,y:r.y+(r.t==='drone'?-.5:.3),z:r.z+Math.sin(a)*.8,life:90,vy:0})}}
function kill(r){LVL.remove(r.m);ROB.splice(ROB.indexOf(r),1);drop(r);RS.kills++;heatAdd(2);snd('boom',.7,r.t==='sentry'?.7:1.1)}
function dmgRob(r,n){r.hp-=n;RS.hitM=.18;if(r.st==='idle'){r.st='hunt';r.alert=10}if(r.hp<=0){kill(r);return true}snd('hit',.6,1+Math.random()*.2);return false}
function alertAll(x,z,R){for(const r of ROB)if(r.t!=='scav'&&Math.hypot(r.x-x,r.z-z)<R){r.st='hunt';r.alert=14}}
// ---- player weapons ----
function rFire(){if(!RS.on||RS.done||RS.rl>0||RS.cd>0||INV.open)return;if(RS.ammo.mag<=0){snd('dry',.5);if(RS.ammo.res>0)rReload();return}
  RS.ammo.mag--;RS.cd=.34;RS.noiseT=.7;heatAdd(1.5);snd('shot',.9,.95+Math.random()*.1);P.shake=Math.max(P.shake,.9);pitch+=.025;
  const o=cam.position,d=new THREE.Vector3();cam.getWorldDirection(d);
  let wall=90;for(let t=1;t<90;t+=.8)if(hitAt(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t,.1)){wall=t;break}
  let best=null,bt=wall;for(const r of ROB){const c=r.t==='scav'?r.y+1.1:r.t==='sentry'?r.y+.9:r.y,T=ROBT[r.t],rx=r.x-o.x,ry=c-o.y,rz=r.z-o.z,t=rx*d.x+ry*d.y+rz*d.z;if(t<0||t>bt)continue;
    const px=o.x+d.x*t-r.x,py=o.y+d.y*t-c,pz=o.z+d.z*t-r.z;if(px*px+py*py+pz*pz<T.r*T.r){bt=t;best={r,head:py>T.r*.35}}}
  const tr=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,bt),RM.tr);tr.position.set(o.x+d.x*bt*.5,o.y+d.y*bt*.5-.1,o.z+d.z*bt*.5);tr.lookAt(o.x+d.x*bt,o.y+d.y*bt-.1,o.z+d.z*bt);tr.userData.keep=true;LVL.add(tr);setTimeout(()=>LVL.remove(tr),70);
  if(best){const arm=best.r.t==='sentry'&&!best.head?.4:1;dmgRob(best.r,34*arm*(best.head?1.6:1))}}
function rReload(){if(!RS.on||RS.rl>0||RS.ammo.mag>=6||RS.ammo.res<=0)return;RS.rl=1.6*(1-.1*upL('reload'));snd('reload',.7)}
function rMelee(){if(!RS.on)return;const o=cam.position,d=new THREE.Vector3();cam.getWorldDirection(d);RS.noiseT=Math.max(RS.noiseT,.4);
  for(const r of ROB){const dx=r.x-o.x,dy=(r.y+(r.t==='drone'?0:1))-o.y,dz=r.z-o.z,L=Math.hypot(dx,dy,dz);if(L<2.8&&(dx*d.x+dy*d.y+dz*d.z)/L>.55){dmgRob(r,r.t==='sentry'?8:26);r.vx+=d.x*8;r.vz+=d.z*8;break}}}
// ---- per-frame ----
function rTick(dt0){const dt=dt0*GAME_SPEED,pc=ctr(),pe=eyeP();
  RS.cd=Math.max(0,RS.cd-dt);RS.noiseT=Math.max(0,RS.noiseT-dt);RS.hitM=Math.max(0,RS.hitM-dt);RS.flash=Math.max(0,RS.flash-dt);RS.seen=Math.max(0,RS.seen-dt);
  if(RS.rl>0){RS.rl-=dt;if(RS.rl<=0){const n=Math.min(6-RS.ammo.mag,RS.ammo.res);RS.ammo.mag+=n;RS.ammo.res-=n}}
  const sp=Math.hypot(P.vel.x,P.vel.z),nr=(P.grounded?(P.sprint?24:sp>3?10:3):4)*(1+RS.wt/RS.cap*.4)+(RS.noiseT>0?65:0);
  // robots
  for(let i=ROB.length-1;i>=0;i--){const r=ROB[i];if(!ROB.includes(r))continue;const T=ROBT[r.t],dx=pc.x-r.x,dz=pc.z-r.z,d=Math.hypot(dx,dz),d3=Math.hypot(dx,pc.y-r.y,dz);
    r.lt-=dt;if(r.lt<=0){r.lt=.25;r.los=d3<T.range&&clear(r.x,r.y+(r.t==='drone'?0:1.4),r.z,pe.x,pe.y,pe.z)}
    if(r.los||d<nr){if(r.st==='idle'||r.st==='patrol'){r.st=r.t==='scav'?'warn':'hunt';r.alert=10;if(r.t==='scav')r.warn=1.1}}
    if(r.los){RS.seen=2;r.alert=10}else if(r.alert>0){r.alert-=dt;if(r.alert<=0&&r.st==='hunt')r.st='idle'}
    r.cd-=dt;r.ph+=dt;const fy=Math.atan2(-dx,-dz);
    if(r.t==='drone'){
      let tx=r.home.x+Math.cos(r.ph*.6)*3,ty=r.home.y+Math.sin(r.ph)*.4,tz=r.home.z+Math.sin(r.ph*.6)*3,sp2=3;
      if(r.st==='hunt'){const a=r.ph*1.3+i,rad=8;tx=pc.x+Math.cos(a)*rad;tz=pc.z+Math.sin(a)*rad;ty=pc.y+2.5+Math.sin(r.ph*2)*1.5;sp2=11;
        if(r.los&&r.cd<=0&&d<30){bolt(r,6,18,.05);r.cd=1.3+Math.random()*1.2}}
      let ax=tx-r.x,ay=ty-r.y,az=tz-r.z;const L=Math.hypot(ax,ay,az)||1;r.vx+=(ax/L*sp2-r.vx)*Math.min(1,dt*3);r.vy+=(ay/L*sp2-r.vy)*Math.min(1,dt*3);r.vz+=(az/L*sp2-r.vz)*Math.min(1,dt*3);
      for(const o of ROB)if(o!==r&&o.t==='drone'){const ex=r.x-o.x,ez=r.z-o.z,ey=r.y-o.y,D=Math.hypot(ex,ey,ez);if(D<3&&D>.01){r.vx+=ex/D*dt*14;r.vy+=ey/D*dt*14;r.vz+=ez/D*dt*14}}
      let nx=r.x+r.vx*dt,ny=r.y+r.vy*dt,nz=r.z+r.vz*dt;
      if(!hitAt(nx,ny,nz,.5)){r.x=nx;r.y=ny;r.z=nz}else if(!hitAt(r.x,ny+.6,r.z,.5)){r.y=ny+.6}else{r.vx*=-.5;r.vz*=-.5;r.vy=3}
      r.m.rotation.y=fy;r.m.position.set(r.x,r.y,r.z)}
    else if(r.t==='scav'){
      const B={x1:r.home.x-14,x2:r.home.x+14,z1:r.home.z-9,z2:r.home.z+7};let sp2=0,tx=r.x,tz=r.z;
      if(r.st==='warn'){r.warn-=dt;r.m.rotation.y=fy;if(r.warn<=0&&!r.alarmed){r.alarmed=true;snd('alarm',.9);heatAdd(25);alertAll(r.x,r.z,100);toast('ALARM RAISED',1400);r.st='flee'}}
      else if(r.st==='flee'||r.st==='hunt'){const L=d||1;tx=r.x-dx/L*10;tz=r.z-dz/L*10;sp2=7;r.st='flee'}
      else{if(!r.tgt||Math.hypot(r.tgt.x-r.x,r.tgt.z-r.z)<1)r.tgt={x:B.x1+Math.random()*28,z:B.z1+Math.random()*16};tx=r.tgt.x;tz=r.tgt.z;sp2=2.2}
      if(sp2){const L=Math.hypot(tx-r.x,tz-r.z)||1;let nx=r.x+(tx-r.x)/L*sp2*dt,nz=r.z+(tz-r.z)/L*sp2*dt;nx=Math.max(B.x1,Math.min(B.x2,nx));nz=Math.max(B.z1,Math.min(B.z2,nz));
        if(!hitAt(nx,r.y+.6,nz,1.2)){r.x=nx;r.z=nz}else r.tgt=null;r.m.rotation.y=Math.atan2(-(tx-r.x),-(tz-r.z))}
      r.m.position.set(r.x,r.y+Math.abs(Math.sin(r.ph*(sp2?6:1)))*(sp2?.12:0),r.z)}
    else{ // sentry
      if(r.st==='hunt'||r.los){r.m.rotation.y+=Math.atan2(Math.sin(fy-r.m.rotation.y),Math.cos(fy-r.m.rotation.y))*Math.min(1,dt*5);
        const lamp=r.m.getObjectByName('lamp');if(r.los){if(r.cd<.6&&lamp)lamp.material=RM.bolt;if(r.cd<=0){r.burst=(r.burst||0);bolt(r,11,22,.02);r.burst++;r.cd=r.burst%3?.18:2.4;if(!(r.burst%3)&&lamp)lamp.material=RM.eye}}}}
  }
  // bolts
  for(let i=BOLTS.length-1;i>=0;i--){const b=BOLTS[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.life-=dt;b.m.position.set(b.x,b.y,b.z);
    let dead=b.life<=0||hitAt(b.x,b.y,b.z,.05);
    if(!dead&&Math.hypot(b.x-pc.x,b.z-pc.z)<.7&&b.y>P.pos.y-.1&&b.y<P.pos.y+P.h+.1){hurt(b.dmg);dead=true}
    if(dead){LVL.remove(b.m);BOLTS.splice(i,1)}}
  // drops
  for(let i=DROPS.length-1;i>=0;i--){const q=DROPS[i];q.life-=dt;q.vy-=20*dt;let ny=q.y+q.vy*dt;if(hitAt(q.x,ny,q.z,.1)||ny<q.y-40){q.vy=0;ny=q.y}q.y=ny;q.m.position.set(q.x,q.y+.25+Math.sin(T*3+i)*.05,q.z);q.m.rotation.y+=dt*2;
    if(Math.hypot(q.x-P.pos.x,q.z-P.pos.z)<2.2&&Math.abs(q.y-P.pos.y)<2.5){let ok=true;
      if(q.id==='ammo')RS.ammo.res+=3;else if(RS.wt+ITEMS[q.id].w>RS.cap*1.3){ok=false}else{RS.inv[q.id]=(RS.inv[q.id]||0)+1;runWt()}
      if(ok){toast('+1 '+(q.id==='ammo'?'ROUNDS x3':ITEMS[q.id].n),900);snd('click',.5,1.5);q.life=0}}
    if(q.life<=0){LVL.remove(q.m);DROPS.splice(i,1)}}
  // heat + director
  const floor=RS.st===1||RS.st===2?40:0;if(RS.seen<=0)RS.heat=Math.max(floor,RS.heat-1.2*dt);if(floor&&RS.heat<floor)RS.heat=floor;
  RS.dirT-=dt;if(RS.dirT<=0){RS.dirT=7;const live=ROB.filter(r=>r.t==='drone').length,cap=14;
    if(RS.heat>=25&&live<cap){const n=Math.min(cap-live,Math.max(1,Math.round((RS.heat/25)*(1-.08*upL('robots')))));
      for(let k=0;k<n;k++)for(let tr=0;tr<8;tr++){const a=Math.random()*6.28,R2=55+Math.random()*25,x=pc.x+Math.cos(a)*R2,z=pc.z+Math.sin(a)*R2,y=pc.y+3+Math.random()*8;
        if(!hitAt(x,y,z,.6)){const r=robAdd('drone',x,y,z);r.st='hunt';r.alert=15;break}}
      if(n)toast('REINFORCEMENTS INBOUND',1200)}}}
function invUse(n){if(!RS.on)return false;if(n==='REVOLVER'){P.gun=!P.gun;toast(P.gun?'REVOLVER READY':'FISTS',900);snd('click',.5,1.1);return true}
  if(n==='MEDKIT'){if(RS.inv.medkit>0&&RS.hp<RS.hpMax){RS.inv.medkit--;if(!RS.inv.medkit)delete RS.inv.medkit;runWt();RS.hp=Math.min(RS.hpMax,RS.hp+45);toast('HULL REPAIRED',1000);snd('checkpoint')}else toast(RS.inv.medkit?'HULL FULL':'NO MEDKIT',900);return true}return false}
function robHud(W,H,rt){hx.textAlign='right';
  const hp=RS.hp/RS.hpMax;hx.fillStyle='rgba(8,8,7,.6)';hx.fillRect(rt-150,H*.42+26,154,12);hx.fillStyle='#2a2a27';hx.fillRect(rt-148,H*.42+28,148,8);hx.fillStyle=hp>.35?'#ece9df':'#ff4a3a';hx.fillRect(rt-148,H*.42+28,Math.round(148*hp),8);
  txt('HULL '+Math.ceil(RS.hp),rt,H*.42+54,10,INK);txt((P.gun?'REVOLVER  ':'FISTS  ')+RS.ammo.mag+' / '+RS.ammo.res+(RS.rl>0?'  RELOAD':''),rt,H*.42+70,10,RS.ammo.mag?INK:'#ff4a3a');
  const lv=RS.heat<20?'CALM':RS.heat<45?'ALERT':RS.heat<75?'HUNTED':'OVERRUN';txt('HEAT  '+lv,rt,H*.42+86,10,RS.heat<20?'#9a968c':RS.heat<75?ACC:'#ff4a3a');hx.textAlign='left';
  if(RS.hitM>0){hx.strokeStyle='#fff';hx.lineWidth=2;const c=W/2,e=H/2;hx.beginPath();hx.moveTo(c-9,e-9);hx.lineTo(c-4,e-4);hx.moveTo(c+9,e-9);hx.lineTo(c+4,e-4);hx.moveTo(c-9,e+9);hx.lineTo(c-4,e+4);hx.moveTo(c+9,e+9);hx.lineTo(c+4,e+4);hx.stroke()}
  if(RS.flash>0){hx.fillStyle='rgba(255,40,20,'+(RS.flash*.5)+')';hx.fillRect(0,0,W,H)}
  if(hp<.35){hx.fillStyle='rgba(255,0,0,'+(.12+.08*Math.sin(T*8))+')';hx.fillRect(0,0,W,6);hx.fillRect(0,H-6,W,6)}}

function guardHub(cx,y,zh,dead){if(!RS.on)return;const L=RS.lr;
  if(L()<(dead?.9:.18)){const n=dead?3:2+(L()*2|0);for(let i=0;i<n;i++)robHub('drone',cx+(L()-.5)*10,y+3.5+L()*2,zh-8+(L()-.5)*8)}
  if(L()<(dead?.6:.2))robHub('scav',cx+(L()-.5)*12,y,zh-9+(L()-.5)*4);
  if(L()<(dead?.7:.12))robHub('sentry',cx+(L()<.5?-17:17),y,zh-5)}
