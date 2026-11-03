// Player: run / bunnyhop / slide / dash / slam / wall jump / 3 air jumps / MANTLING / water, plus fists and particles.
const R=0.4,G=36,RUN=15,JUMP=12.5,FIXED=1/240,AIRJ=3,PD=0.24;
const P={pos:new THREE.Vector3(),prev:new THREE.Vector3(),vel:new THREE.Vector3(),h:1.8,grounded:false,sliding:false,slamming:false,
  slamT:0,dashT:0,dd:{x:0,z:-1},stamina:3,wj:3,aj:AIRJ,coyote:0,jumpBuf:0,jumpEdge:false,canCut:false,slideLock:false,wall:false,wallN:null,wallT:0,
  camY:1.6,shake:0,fov:120,stepOff:0,swingT:0,swingCd:0,hand:0,bob:0,sway:0,lyaw:0,vyPrev:0,mantle:null,mCd:0,inW:false,rt:0,cp:0,time:0};
let yaw=0,pitch=0;
const keys={};let dashReq=false,slideReq=false,slamReq=false,punchReq=false;
function respawn(){const c=CP[P.cp].p;P.pos.set(c[0],c[1],c[2]);P.prev.copy(P.pos);P.vel.set(0,0,0);P.h=1.8;P.sliding=P.slamming=false;P.dashT=0;
  P.stamina=3;P.wj=3;P.aj=AIRJ;P.stepOff=0;P.mantle=null;P.inW=false;yaw=0;pitch=0}

// ---- particles ----
const PT=[],pg=new THREE.BoxGeometry(0.12,0.12,0.12),pm={};
function burst(x,y,z,n,sp,c){if(S.reduce)n=Math.ceil(n/3);
  for(let i=0;i<n&&PT.length<260;i++){const m=new THREE.Mesh(pg,pm[c]||(pm[c]=new THREE.MeshBasicMaterial({color:c})));m.position.set(x,y,z);scene.add(m);
    PT.push({m,vx:(Math.random()-.5)*sp,vy:Math.random()*sp*0.8,vz:(Math.random()-.5)*sp,t:0.35+Math.random()*0.3})}}
function updFx(dt){for(let i=PT.length-1;i>=0;i--){const q=PT[i],m=q.m;q.t-=dt;q.vy-=22*dt;m.position.x+=q.vx*dt;m.position.y+=q.vy*dt;m.position.z+=q.vz*dt;
  m.scale.setScalar(Math.max(0.01,q.t*2));if(q.t<=0){scene.remove(m);PT.splice(i,1)}}}
function splash(x,y,z,s){burst(x,y,z,Math.round(14*s),5*s+2,0x9fb2b5);ripple(x,z,1);snd('splash',0.4+s*0.6,0.9+Math.random()*0.2)}
function slamFx(){snd('slam');for(let i=0;i<14;i++){const a=i/14*6.283;burst(P.pos.x+Math.cos(a)*1.5,P.pos.y+0.2,P.pos.z+Math.sin(a)*1.5,1,6,0xb8b5a8)}}

// ---- collision ----
function ovAt(b,x,y,z,h){return x+R>b.x1&&x-R<b.x2&&y+h>b.y1&&y<b.y2&&z+R>b.z1&&z-R<b.z2}
function hitAt(x,y,z,h){for(const b of B)if(ovAt(b,x,y,z,h))return b;return null}
function move(ax,d){
  if(!d)return;P.pos[ax]+=d;
  for(const b of B){
    const p=P.pos;if(!ovAt(b,p.x,p.y,p.z,P.h))continue;
    if(ax==='y'){if(d>0)p.y=b.y1-P.h-0.001;else p.y=b.y2;P.vel.y=0;continue}
    if(P.grounded&&b.y2-p.y<=0.5&&!hitAt(p.x,b.y2+0.01,p.z,P.h)){P.stepOff-=b.y2+0.001-p.y;p.y=b.y2+0.001;continue}
    p[ax]=d>0?b[ax+'1']-R-0.001:b[ax+'2']+R+0.001;P.vel[ax]=0;
  }
}
function accel(wx,wz,wish,a,dt){const v=P.vel,cur=v.x*wx+v.z*wz,add=wish-cur;if(add<=0)return;const s=Math.min(a*dt*wish,add);v.x+=wx*s;v.z+=wz*s}

// ---- simulation step (fixed 240 Hz) ----
function step(dt){
  const v=P.vel,p=P.pos,k=keys,Bd=S.binds;
  P.mCd-=dt;
  if(P.mantle){const m=P.mantle;m.t+=dt/0.3;const t=Math.min(1,m.t),e=1-(1-t)*(1-t),h=Math.max(0,(t-0.35)/0.65),hs=h*h*(3-2*h);
    p.set(m.fx+(m.tx-m.fx)*hs,m.fy+(m.ty-m.fy)*Math.min(1,e*1.35),m.fz+(m.tz-m.fz)*hs);
    if(m.t>=1){P.mantle=null;v.set(m.dx*6,0,m.dz*6);P.mCd=0.3;P.aj=AIRJ;P.wj=3;P.stepOff-=0.15;burst(p.x,p.y,p.z,6,3,0xb8b5a8)}
    return}
  const fw=(k[Bd.fwd]?1:0)-(k[Bd.back]?1:0),sd=(k[Bd.right]?1:0)-(k[Bd.left]?1:0);
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
  let wx=fx*fw+rx*sd,wz=fz*fw+rz*sd;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl}
  const ctrl=k[Bd.slide],wasG=P.grounded;
  P.grounded=v.y<=0.01&&!!hitAt(p.x,p.y-0.06,p.z,P.h);
  if(!wasG&&P.grounded&&P.vyPrev<-9){P.stepOff-=Math.min(0.35,-P.vyPrev*0.012);burst(p.x,p.y,p.z,8,4,0xb8b5a8);snd('land',Math.min(1,-P.vyPrev/30))}
  const pool=poolAt(p.x,p.z,p.y),inW=!!pool;
  if(inW&&!P.inW)splash(p.x,pool.y,p.z,Math.min(1,Math.abs(P.vyPrev)/20+0.35));
  P.inW=inW;
  if(P.grounded){P.coyote=0.1;P.wj=3;P.aj=AIRJ;if(P.slamming){P.slamming=false;P.slamT=0.4;P.shake=0.6;slamFx()}}else P.coyote-=dt;
  P.slamT-=dt;P.jumpBuf-=dt;P.swingCd-=dt;
  if((punchReq||k[Bd.punch])&&P.swingCd<=0){P.swingT=PD;P.swingCd=0.26;P.hand^=1;snd('punch',0.7,0.9+Math.random()*0.2)}
  punchReq=false;if(P.swingT>0)P.swingT-=dt;
  if(k[Bd.jump]&&P.grounded)P.jumpBuf=0.05;
  // wall probe (remember which block we touched)
  let wn=null,wb=null;
  if(!P.grounded){const y=p.y+0.1,h=P.h-0.2;let b;
    if(b=hitAt(p.x+.1,y,p.z,h)){wn=[-1,0];wb=b}else if(b=hitAt(p.x-.1,y,p.z,h)){wn=[1,0];wb=b}
    else if(b=hitAt(p.x,y,p.z+.1,h)){wn=[0,-1];wb=b}else if(b=hitAt(p.x,y,p.z-.1,h)){wn=[0,1];wb=b}}
  P.wall=!!wn;if(wn){P.wallN=wn;P.wallT=0.12}P.wallT-=dt;if(P.grounded)P.wallT=0;
  // MANTLE: pushing into a ledge whose top is 0.6-2.2m above your feet and has room to stand on
  if(wn&&P.mCd<=0&&v.y<7&&wl>0&&(-wx*wn[0]-wz*wn[1])>0.3){
    const rise=wb.y2-p.y;
    if(rise>0.6&&rise<=2.2){const tx=p.x-wn[0]*0.7,tz=p.z-wn[1]*0.7;
      if(!hitAt(tx,wb.y2+0.02,tz,1.8)){P.mantle={t:0,fx:p.x,fy:p.y,fz:p.z,tx,ty:wb.y2+0.02,tz,dx:-wn[0],dz:-wn[1]};P.slamming=false;P.sliding=false;P.dashT=0;v.set(0,0,0);snd('mantle');return}}}
  // dash
  if(dashReq&&P.stamina>=1&&P.dashT<=0){P.stamina-=1;P.dashT=0.2;P.dd=wl>0?{x:wx,z:wz}:{x:fx,z:fz};P.sliding=false;P.slamming=false;P.fov+=S.reduce?0:22;
    snd('dash');burst(p.x,p.y+1,p.z,8,4,0xe8e6df)}
  dashReq=false;
  // slide
  const sp=Math.hypot(v.x,v.z);
  if(!ctrl)P.slideLock=false;
  if(P.grounded&&ctrl&&!P.sliding&&!P.slideLock&&sp>4&&P.dashT<=0){P.sliding=true;snd('slide');if(slideReq&&!inW){const t=Math.max(sp,21)/sp;v.x*=t;v.z*=t}}
  slideReq=false;
  if(P.sliding&&(!ctrl||!P.grounded||sp<4)&&!(P.grounded&&ctrl&&sp>=4)){if(!hitAt(p.x,p.y,p.z,1.8)){P.sliding=false;if(sp<4&&ctrl)P.slideLock=true}}
  // slam
  if(slamReq&&!P.grounded&&!P.sliding&&P.dashT<=0){P.slamming=true;v.x*=0.2;v.z*=0.2}
  slamReq=false;
  // jumps: ground (+coyote), wall (3), then 3 air jumps
  const jh=k[Bd.jump];
  if(P.jumpBuf>0||P.jumpEdge){
    const wj=P.wallT>0&&P.wj>0?P.wallN:null,jm=inW?0.9:1;
    if(P.jumpBuf>0&&(P.grounded||P.coyote>0)){
      v.y=(P.slamT>0?23:JUMP)*jm;P.canCut=P.slamT<=0;if(P.slamT>0)P.shake=0.3;P.slamT=0;
      if(P.dashT>0){P.dashT=0;v.x=P.dd.x*26;v.z=P.dd.z*26}
      if(P.sliding){v.x*=1.12;v.z*=1.12;P.sliding=false}
      P.jumpBuf=0;P.coyote=0;P.grounded=false;snd('jump',1,0.95+Math.random()*0.1);burst(p.x,p.y,p.z,4,3,0xb8b5a8);
    }else if(P.jumpBuf>0&&wj){
      const dn=v.x*wj[0]+v.z*wj[1];if(dn<0){v.x-=dn*wj[0];v.z-=dn*wj[1]}
      v.x+=wj[0]*11;v.z+=wj[1]*11;v.y=13.5;P.wj--;P.aj=AIRJ;P.wallT=0;P.canCut=false;P.jumpBuf=0;P.slamming=false;P.shake=0.15;
      snd('wall');burst(p.x,p.y+1,p.z,8,4,0xb8b5a8);
    }else if(P.jumpEdge&&P.aj>0&&!P.grounded&&(v.y>0||!hitAt(p.x,p.y-1,p.z,P.h))){
      P.aj--;v.y=JUMP*0.95;P.canCut=false;P.slamming=false;P.jumpBuf=0;P.shake=0.1;snd('air',1,1+(AIRJ-P.aj)*0.08);burst(p.x,p.y,p.z,8,4,0xe8e6df);
      if(P.dashT>0){P.dashT=0;v.x=P.dd.x*22;v.z=P.dd.z*22}
      if(wl>0){const s=Math.max(Math.hypot(v.x,v.z),9);v.x=wx*s;v.z=wz*s}
    }
  }
  P.jumpEdge=false;
  if(!jh&&P.canCut&&v.y>7){v.y=7;P.canCut=false}
  P.h=P.sliding?1.0:1.8;
  // horizontal + vertical velocity
  if(P.dashT>0){P.dashT-=dt;v.x=P.dd.x*40;v.z=P.dd.z*40;v.y=0;if(P.dashT<=0){v.x=P.dd.x*22;v.z=P.dd.z*22}}
  else{
    if(P.sliding){const s=Math.hypot(v.x,v.z),f=Math.max(0,s-s*(0.8+(inW?3:0))*dt-2*dt)/(s||1);v.x*=f;v.z*=f;if(wl>0)accel(wx,wz,10,3,dt)}
    else if(P.grounded&&P.jumpBuf<=0){
      const s=Math.hypot(v.x,v.z);if(s>0){const d=Math.max(s,4)*10*dt,f=Math.max(0,s-d)/s;v.x*=f;v.z*=f}
      if(wl>0)accel(wx,wz,RUN*(inW?0.7:1),10,dt);
    }else if(wl>0)accel(wx,wz,RUN,3,dt);
    if(inW&&P.grounded){const f=Math.max(0,1-2.5*dt);v.x*=f;v.z*=f}                       // water drag
    if(P.slamming)v.y=-60;else v.y=Math.max(v.y-G*dt,P.wall?-9:-70);
    P.stamina=Math.min(3,P.stamina+dt*0.9);
  }
  if(inW&&P.grounded&&Math.hypot(v.x,v.z)>2){P.rt-=dt;if(P.rt<=0){P.rt=0.2;ripple(p.x,p.z,0.7);burst(p.x,pool.y,p.z,2,2.5,0x9fb2b5);snd('splash',0.25,1.2)}}
  P.vyPrev=v.y;move('x',v.x*dt);move('z',v.z*dt);move('y',v.y*dt);
}

// ---- fists ----
function limb(){const g=new THREE.Group();
  const add=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:c,depthTest:false,fog:false}));m.position.set(x,y,z);m.renderOrder=999;g.add(m)};
  add(0.14,0.14,0.55,0x262626,0,0,-0.1);add(0.17,0.17,0.06,0xc8571a,0,0,-0.4);add(0.2,0.18,0.24,0xb8b5a8,0,0,-0.55);add(0.2,0.05,0.05,0x161616,0,0.05,-0.68);
  cam.add(g);return g}
const arms=[limb(),limb()];
function poseArms(dt,sp){
  P.bob+=dt*(P.grounded?sp*0.55:0);
  P.sway+=(Math.max(-0.12,Math.min(0.12,-(yaw-P.lyaw)*8))-P.sway)*Math.min(1,dt*12);P.lyaw=yaw;
  const ps=P.swingT>0?1-P.swingT/PD:0,amt=P.grounded?Math.min(sp/15,1):0,mt=P.mantle?Math.sin(Math.min(1,P.mantle.t)*Math.PI):0;
  arms.forEach((g,i)=>{const side=i?1:-1;let e=0;
    if(P.swingT>0&&P.hand===i){if(ps<0.15)e=-0.3*ps/0.15;else if(ps<0.4){const t=(ps-0.15)/0.25;e=-0.3+1.3*(1-(1-t)*(1-t))}else e=1-(ps-0.4)/0.6}
    e=Math.max(e,mt);
    g.position.set(side*(0.38-0.3*e)+P.sway,-0.38+0.1*e+Math.sin(P.bob*side)*0.02*amt-(P.sliding?0.12:0)+(P.grounded?0:0.04),-0.45-0.55*e+(P.dashT>0?0.15:0)+Math.cos(P.bob*2)*0.012*amt);
    g.rotation.set(0.12-0.2*e,-side*(0.22-0.2*e),side*(0.12+(P.sliding?0.5:0)))})}
