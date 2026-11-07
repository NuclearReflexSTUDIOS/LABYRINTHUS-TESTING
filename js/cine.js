// Pacing + cinematics + item wheel.
//  GAME_SPEED   : whole simulation runs slower (jumps, gaps, movers all scale together so every level stays beatable).
//  TIERS        : level colour = how long it takes to finish (not how hard it is).
//  CINE         : intro fly-over, letterbox bars at checkpoints, birds.
//  INV          : 8-slot revolver item wheel (hold the Item Wheel key; mouse picks the slot; release to select).
const GAME_SPEED=0.7;
const TIERS={
  green :{n:'GREEN', l:'QUICK',      t:'20 S - 1 MIN', c:'#3ddc5a',bg:'#3ddc5a'},
  blue  :{n:'BLUE',  l:'SEMI-QUICK', t:'1 - 3 MIN',    c:'#3a8dff',bg:'#3a8dff'},
  orange:{n:'ORANGE',l:'MEDIUM',     t:'3 - 5 MIN',    c:'#ff9f2e',bg:'#ff9f2e'},
  red   :{n:'RED',   l:'SEMI-MEDIUM',t:'5 - 7 MIN',    c:'#ff3d3d',bg:'#ff3d3d'},
  black :{n:'BLACK', l:'LONG',       t:'7 - 12 MIN',   c:'#1b1b1b',bg:'#1b1b1b',ed:'#8a8a8a'},
  white :{n:'WHITE', l:'MARATHON',   t:'12 - 20 MIN',  c:'#ffffff',bg:'#ffffff'},
  chrome:{n:'CHROME',l:'WORLD WIDE', t:'ABOUT 1 HOUR', c:'#cfd8e0',bg:'linear-gradient(115deg,#fafcff,#8c98a4 30%,#e8eef4 50%,#6f7b87 75%,#f4f8fc)'}};

const CINE={intro:null,bar:0,barT:0,cap:'',birds:null};
function cineBars(sec,cap){CINE.barT=sec;CINE.cap=cap||''}
function introStart(){
  const pts=CP.map(c=>[c.p[0],c.p[1],c.p[2]]);pts.push([GOAL.x,GOAL.y,GOAL.z]);
  const len=[0];for(let i=1;i<pts.length;i++)len.push(len[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));
  CINE.intro={t:0,dur:Math.max(7,Math.min(13,len[len.length-1]/110)),pts,len,tot:len[len.length-1]||1}}
function pathAt(I,s){const d=Math.max(0,Math.min(1,s))*I.tot;let i=1;while(i<I.pts.length-1&&I.len[i]<d)i++;
  const a=I.pts[i-1],b=I.pts[i],k=(d-I.len[i-1])/Math.max(0.001,I.len[i]-I.len[i-1]);return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k]}
const _cv=new THREE.Vector3();
function cineCam(dt){const I=CINE.intro;I.t+=dt;const u=Math.min(1,I.t/I.dur),e=u*u*(3-2*u);
  const p=pathAt(I,e),q=pathAt(I,e+0.05),ang=u*5.2+0.6,r=34-14*Math.sin(u*3.1),h=22+14*Math.sin(u*4.3+1);
  const bl=Math.max(0,(u-0.86)/0.14),bs=bl*bl*(3-2*bl);                  // last 14%: glide into the player's own eyes
  const ex=P.pos.x,ey=P.pos.y+1.6,ez=P.pos.z;
  const cx=p[0]+Math.cos(ang)*r,cy=p[1]+h,cz=p[2]+Math.sin(ang)*r;
  cam.position.set(cx+(ex-cx)*bs,cy+(ey-cy)*bs,cz+(ez-cz)*bs);
  const lx=q[0],ly=q[1]+4,lz=q[2];cam.up.set(0,1,0);
  if(bs<1){cam.lookAt(lx,ly,lz);const a=cam.quaternion.clone();cam.rotation.set(pitch,yaw,0);const b=cam.quaternion.clone();cam.quaternion.copy(a.slerp(b,bs))}
  cam.fov=62+bs*(S.fov-62);cam.updateProjectionMatrix();
  if(I.t>=I.dur)CINE.intro=null}

// ---- birds: a loose flock circling the player in clear daytime ----
function initBirds(){const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0x16181c,side:THREE.DoubleSide,fog:true});
  const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0,0,1.5,0.1,0.5,0,0,0.7]),3));
  const L=[];for(let i=0;i<14;i++){const b=new THREE.Group(),w1=new THREE.Mesh(wg,mat),w2=new THREE.Mesh(wg,mat);w2.scale.x=-1;b.add(w1,w2);b.userData={a:Math.random()*6.28,r:70+Math.random()*110,h:30+Math.random()*60,s:0.12+Math.random()*0.14,ph:Math.random()*6,w1,w2};b.scale.setScalar(3+Math.random()*2);g.add(b);L.push(b)}
  g.frustumCulled=false;scene.add(g);CINE.birds=g;CINE.list=L}
function updBirds(dt,cp,T){if(!CINE.birds)initBirds();const ok=(CUR.tod==='day'||CUR.tod==='dawn'||CUR.tod==='dusk')&&(!CUR.wx||CUR.wx==='fog'||CUR.wx==='snow')&&!INSIDE_ONLY();CINE.birds.visible=ok;if(!ok)return;
  for(const b of CINE.list){const d=b.userData;d.a+=d.s*dt;b.position.set(cp.x+Math.cos(d.a)*d.r,cp.y+d.h+Math.sin(T*.7+d.ph)*4,cp.z+Math.sin(d.a)*d.r);b.rotation.y=-d.a;
    const f=Math.sin(T*(7+d.ph)+d.ph)*0.7;d.w1.rotation.z=f;d.w2.rotation.z=-f}}
const INSIDE_ONLY=()=>false;

// ---- letterbox + captions (drawn on the HUD canvas) ----
function drawCine(dt,W,H){
  if(CINE.barT>0)CINE.barT-=dt;
  const want=(CINE.intro||CINE.barT>0)?1:0;CINE.bar+=(want-CINE.bar)*Math.min(1,dt*5);
  if(CINE.bar<0.01)return;const bh=Math.round(H*0.1*CINE.bar);hx.fillStyle='#000';hx.fillRect(0,0,W,bh);hx.fillRect(0,H-bh,W,bh);
  const L=LEVELS[LV],T_=TIERS[L.tier]||TIERS.blue;
  if(CINE.intro){const I=CINE.intro,a=Math.min(1,I.t/1.2)*Math.min(1,(I.dur-I.t)/1.0);hx.globalAlpha=Math.max(0,a);
    txt('LEVEL '+String(L.id).padStart(2,'0'),W/2-hx.measureText('LEVEL 00').width/2-30,H-bh+bh*0.45,16,ACC);
    txt(L.name,W/2-hx.measureText(L.name).width/2-30,H-bh+bh*0.8,22,INK);
    hx.fillStyle=T_.c;hx.fillRect(W/2-90,H-bh-6,180,4);
    txt('PRESS ANY KEY TO SKIP',W-190,H-12,10,'#9a968c');hx.globalAlpha=1}
  else if(CINE.cap){hx.globalAlpha=Math.min(1,CINE.barT*2);hx.font='bold 14px "Courier New",monospace';txt(CINE.cap,W/2-hx.measureText(CINE.cap).width/2,H-bh+bh*0.62,14,INK);hx.globalAlpha=1}}

// ---- revolver item wheel ----
const INV={open:false,ax:0,ay:0,sel:-1,slots:[
  {n:'FLASHLIGHT',ok:true},{n:'FOOD'},{n:'WATER'},{n:'MEDKIT'},{n:'FLARE'},{n:'ROPE'},{n:'MAP'},{n:'TOOLS'}]};
function invOpen(){INV.open=true;INV.ax=INV.ay=0;INV.sel=-1;snd('click',.5,1.3)}
function invSelect(i){INV.sel=i}
function invClose(pick){if(!INV.open)return;INV.open=false;const i=INV.sel;if(pick&&i>=0){const s=INV.slots[i];
  if(s.n==='FLASHLIGHT'){flOn=!flOn;FL.intensity=flOn?2.2:0;snd('flash')}else{toast(s.n+'  /  EMPTY',900);snd('click',.4,.8)}}}
function invMove(dx,dy){INV.ax+=dx;INV.ay+=dy;const m=Math.hypot(INV.ax,INV.ay),R=120;if(m>R){INV.ax*=R/m;INV.ay*=R/m}
  invAim(INV.ax,INV.ay)}
function invAim(x,y){if(Math.hypot(x,y)<28){INV.sel=-1;return}const n=INV.slots.length;let a=Math.atan2(x,-y);if(a<0)a+=6.2832;const i=Math.round(a/(6.2832/n))%n;if(i!==INV.sel)snd('click',.25,1.1+i*0.03);INV.sel=i}
function drawWheel(W,H){if(!INV.open)return;const cx=W/2,cy=H/2,n=INV.slots.length,R=Math.min(W,H)*0.27,r=Math.min(W,H)*0.075;
  hx.fillStyle='rgba(0,0,0,.55)';hx.fillRect(0,0,W,H);
  hx.lineWidth=3;hx.strokeStyle=INK;hx.beginPath();hx.arc(cx,cy,R+r*1.25,0,6.2832);hx.stroke();hx.lineWidth=1;hx.beginPath();hx.arc(cx,cy,R-r*1.25,0,6.2832);hx.stroke();
  for(let i=0;i<n;i++){const a=i/n*6.2832,x=cx+Math.sin(a)*R,y=cy-Math.cos(a)*R,on=i===INV.sel,s=INV.slots[i],rr=r*(on?1.15:1);
    hx.beginPath();hx.arc(x,y,rr,0,6.2832);hx.fillStyle=on?ACC:'#14161a';hx.fill();hx.lineWidth=on?4:2;hx.strokeStyle=on?'#fff':(s.ok?INK:'#55575c');hx.stroke();
    hx.beginPath();hx.arc(x,y,rr*0.78,0,6.2832);hx.lineWidth=1;hx.stroke();
    hx.font='bold '+Math.round(r*0.3)+'px "Courier New",monospace';hx.fillStyle=on?'#000':(s.ok?INK:'#6b6d72');hx.textAlign='center';hx.fillText(s.n,x,y+r*0.1);hx.textAlign='left'}
  hx.beginPath();hx.arc(cx,cy,r*0.9,0,6.2832);hx.fillStyle='#0c0d0f';hx.fill();hx.lineWidth=2;hx.strokeStyle=INK;hx.stroke();
  hx.beginPath();hx.arc(cx+INV.ax*0.25,cy+INV.ay*0.25,5,0,6.2832);hx.fillStyle=ACC;hx.fill();
  hx.textAlign='center';hx.font='bold '+Math.round(r*0.34)+'px "Courier New",monospace';hx.fillStyle=INK;
  hx.fillText(INV.sel>=0?INV.slots[INV.sel].n:'ITEMS',cx,cy-r*0.05);hx.font=Math.round(r*0.22)+'px "Courier New",monospace';hx.fillStyle='#9a968c';
  hx.fillText(INV.sel>=0?(INV.slots[INV.sel].ok?'RELEASE TO USE':'EMPTY'):'AIM WITH MOUSE',cx,cy+r*0.4);hx.textAlign='left'}
