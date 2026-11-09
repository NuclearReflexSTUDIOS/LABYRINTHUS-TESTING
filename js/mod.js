// ===== OBSTACLE MODULES =====
// Every module is built in LOCAL coordinates: it starts at lz=0 (entry, y=0) and runs forward to lz=-LZ (exit, y=0), x from -24 to +24.
// place() maps it into the world (optionally rotated 180 degrees so it runs toward +z) and returns the intended path as world waypoints.
// The bot (bot5.js) walks that path for every module in a test-bed, so every module is proven beatable before it is used in a level.
const LZ=64;
let XF={ox:0,oy:0,oz:0,fl:1};
const tX=x=>XF.ox+XF.fl*x,tZ=z=>XF.oz+XF.fl*z;
function mb(x1,y1,z1,x2,y2,z2,t=0){const a=tX(x1),b=tX(x2),c=tZ(z1),d=tZ(z2);return blk(Math.min(a,b),XF.oy+y1,Math.min(c,d),Math.max(a,b),XF.oy+y2,Math.max(c,d),t)}
function ms(x1,y1,z1,x2,y2,z2,mat){const a=tX(x1),b=tX(x2),c=tZ(z1),d=tZ(z2);return SB(Math.min(a,b),XF.oy+y1,Math.min(c,d),Math.max(a,b),XF.oy+y2,Math.max(c,d),mat)}
function mv(x1,y1,z1,x2,y2,z2,mat){const a=tX(x1),b=tX(x2),c=tZ(z1),d=tZ(z2);return V(Math.min(a,b),XF.oy+y1,Math.min(c,d),Math.max(a,b),XF.oy+y2,Math.max(c,d),mat)}
function mcr(x1,y1,z1,x2,y2,z2,t,delay,back){const a=tX(x1),b=tX(x2),c=tZ(z1),d=tZ(z2);return crumble(Math.min(a,b),XF.oy+y1,Math.min(c,d),Math.max(a,b),XF.oy+y2,Math.max(c,d),t,delay,back)}
function mmov(x1,y1,z1,x2,y2,z2,t,axis,a,b,period,phase,dwell){const f=axis==='y'?1:XF.fl,A=tX(x1),B_=tX(x2),C=tZ(z1),D=tZ(z2);
  return mover(Math.min(A,B_),XF.oy+y1,Math.min(C,D),Math.max(A,B_),XF.oy+y2,Math.max(C,D),t,axis,a*f,b*f,period,phase,dwell)}
function mzone(t,x1,y1,z1,x2,y2,z2,o){const a=tX(x1),b=tX(x2),c=tZ(z1),d=tZ(z2),oo=Object.assign({},o);if(oo.vx!==undefined){oo.vx*=XF.fl;oo.vz*=XF.fl}
  zone(t,Math.min(a,b),XF.oy+y1,Math.min(c,d),Math.max(a,b),XF.oy+y2,Math.max(c,d),oo)}
const fp=(x1,z1,x2,z2,y=0,t=0)=>mb(x1,y-3,z1,x2,y,z2,t);               // floor plate, top at y
const EDG=()=>em(0xffa24a),EDC=()=>em(0xaee0ff);
// ---- the modules. each returns its path: [[x,y,z,flags]] (flags: C = slide, w = walk) ----
const MODS={
 stones(){const w=[[0,0,-2]];fp(-10,-6,10,0);fp(-10,-LZ,10,-58);
   for(let i=0;i<6;i++){const z=-11-8.5*i,x=(i%2?4.2:-4.2);fp(x-3.6,z-2.5,x+3.6,z+2.5,0,i%2?0:1);mv(x-3.6,0,z-2.5,x+3.6,0.12,z-2,EDG());w.push([x,0,z])}
   w.push([0,0,-61]);return w},
 hurdles(){const w=[[0,0,-3]];fp(-10,-LZ,10,0);
   for(let i=0;i<6;i++){const z=-10-i*8.6;
     if(i%2===0){mb(-10,0,z-.8,10,1.0+(i%4===0?.15:0),z+.8,2);mv(-10,1.0,z-.8,10,1.08,z-.7,EDG());w.push([0,0,z+3])}
     else{const L=i%4===1;mb(L?-5:-10,0,z-.8,L?10:5,2.6,z+.8,6);mv(L?-5:-10,2.6,z-.8,L?10:5,2.7,z+.8,EDG());w.push([L?-7.5:7.5,0,z+3]);w.push([L?-7.5:7.5,0,z-3])}}
   w.push([0,0,-61]);return w},
 slide(){const w=[[0,0,-3,'w']];fp(-6,-LZ,6,0);
   for(const[a,b]of[[-9,-24],[-33,-48]]){mb(-6,1.25,b,6,4,a,2);mb(-6.6,0,b,-6,4,a,7);mb(6,0,b,6.6,4,a,7);mv(-6,1.15,b,6,1.25,a,EDG());w.push([0,0,a+1.5,'w']);w.push([0,0,b-1.5,'C'])}
   mb(-6,0,-28.5,6,1.0,-27.5,2);mb(-6,0,-51.5,6,1.0,-50.5,2);w.push([0,0,-61]);return w},
 crumble(){const w=[[0,0,-2]];fp(-8,-6,8,0);fp(-8,-LZ,8,-58);
   for(let i=0;i<8;i++){const z=-9-i*6,x=(i%3===0?-4:i%3===1?0:4);mcr(x-3,-.6,z-2.2,x+3,0,z+2.2,3,.5,3.2);mv(x-3,0,z-2.2,x+3,.06,z-2.1,EDG());w.push([x,0,z])}
   w.push([0,0,-61]);return w},
 bounce(){const w=[[0,0,-2]];fp(-10,-10,10,0);fp(-10,-LZ,10,-52);
   fp(-3,-9,3,-4,0,3);mzone('pad',-3,-.1,-9,3,.5,-4,{f:30});mv(-3,0,-9,3,.15,-4,EDG());w.push([0,0,-6.5,'w']);
   fp(-9,-30,9,-42,8,0);mv(-9,8,-30,9,8.12,-30.4,EDG());w.push([0,8,-34]);w.push([0,0,-56,'w']);return w},
 conveyors(){const w=[[0,0,-2]];fp(-8,-6,8,0);fp(-8,-LZ,8,-60);
   for(const[a,b,s]of[[-8,-20,7],[-24,-36,-7],[-40,-52,9]]){fp(-8,b,8,a,0,7);mzone('conv',-8,-.1,b,8,.5,a,{vx:0,vz:s});mv(-8,0,b,8,.06,b+.4,EDG());mb(-8,0,(a+b)/2-.4,8,.9,(a+b)/2+.4,2);w.push([0,0,b-1])}
   w.push([0,0,-62]);return w},
 pillars(){const w=[[0,0,-2]];fp(-10,-6,10,0);fp(-10,-LZ,10,-58);const H=[1.9,3.7,5.5,7.3,5.5,3.7,1.9];
   H.forEach((h,i)=>{const z=-10-i*7,x=(i%2?4.5:-4.5);mb(x-2.2,-3,z-2.2,x+2.2,h,z+2.2,i%2?1:0);mv(x-2.2,h,z-2.2,x+2.2,h+.1,z-2,EDG());w.push([x,h,z])});
   w.push([0,0,-61]);return w},
 beams(){const w=[[0,0,-2]];fp(-14,-6,14,0);fp(-14,-LZ,14,-58);
   for(const x of[-11,0,11]){fp(x-1.2,-58,x+1.2,-6,0,x?7:1);mv(x-1.2,0,-58,x+1.2,.1,-6,EDG())}
   for(let i=0;i<4;i++){const z=-12-i*11;mb(-1.2,0,z-.5,1.2,1.0,z+.5,2);w.push([0,0,z+2.5])}
   mb(-12.2,0,-30,-9.8,2.2,-29,6);mb(9.8,0,-42,12.2,2.2,-41,6);w.push([0,0,-61]);return w},
 sprintGap(){const w=[[0,0,-2]];fp(-7,-22,7,0);fp(-7,-44,7,-36,0,1);fp(-7,-LZ,7,-52);
   mb(-7,0,-14,7,1.0,-13,2);w.push([0,0,-17]);w.push([0,0,-39]);mb(-7,0,-41,7,1.0,-40.2,2);w.push([0,0,-55]);w.push([0,0,-61]);return w},
 span(){const w=[[0,0,-2]];fp(-10,-6,10,0);fp(-10,-LZ,10,-58);const a=tZ(-6),b=tZ(-58),hi=Math.max(a,b),lo=Math.min(a,b);
   cableBridge(tX(0),hi,lo,XF.oy,[hi-14,lo+14],30);w.push([0,0,-30]);w.push([0,0,-61]);return w},
 crossfire(){const w=[[0,0,-2]];fp(-9,-LZ,9,0);
   [[-14,0],[-22,.5],[-34,.25],[-44,.75],[-54,0]].forEach(([z,ph],i)=>{mmov(-5,0,z-.9,5,3.2,z+.9,2,'x',-9,9,4.4,ph,.1);mv(-5,3.2,z-.9,5,3.3,z+.9,EDG())});
   w.push([0,0,-12]);w.push([0,0,-30]);w.push([0,0,-61]);return w}
};
// the 5 lateral bridges used between lanes at hub plazas (built in WORLD coordinates, x direction): from x0 to x1 at row z (centre), top y
const LATS={
 stones(x0,x1,z,y){const n=4,L=x1-x0,s=L/n;for(let i=0;i<n;i++){const cx=x0+s*(i+.5),dz=(i%2?2.2:-2.2);blk(cx-2.6,y-3,z+dz-2.6,cx+2.6,y,z+dz+2.6,i%2?0:1)}
   return[[x0+s*.5,y,z-2.2],[x0+s*1.5,y,z+2.2],[x0+s*2.5,y,z-2.2],[x0+s*3.5,y,z+2.2]]},
 beam(x0,x1,z,y){blk(x0,y-3,z-1.1,x1,y,z+1.1,7);V(x0,y,z-1.1,x1,y+.1,z+1.1,EDC());blk((x0+x1)/2-.5,y,z-1.1,(x0+x1)/2+.5,y+1.0,z+1.1,2);return[[x1-1,y,z]]},
 crumble(x0,x1,z,y){const n=6,s=(x1-x0)/n,w=[];for(let i=0;i<n;i++){crumble(x0+s*i+.3,y-.6,z-2.2,x0+s*(i+1)-.3,y,z+2.2,3,.5,3.2);w.push([x0+s*(i+.5),y,z])}return w},
 bounce(x0,x1,z,y){const m=(x0+x1)/2;blk(x0,y-3,z-5,x0+5,y,z+5,0);zone('pad',x0+1,y-.1,z-3,x0+4,y+.5,z+3,{f:30});V(x0+1,y,z-3,x0+4,y+.15,z+3,EDG());
   blk(m-6,y+7.5,z-5,m+6,y+8,z+5,1);blk(x1-5,y-3,z-5,x1,y,z+5,0);return[[x0+2.5,y,z,'w'],[m,y+8,z],[x1-2,y,z]]},
 conveyor(x0,x1,z,y){const n=4,s=(x1-x0)/n,w=[];for(let i=0;i<n;i++){blk(x0+s*i,y-3,z-4,x0+s*(i+1),y,z+4,7);zone('conv',x0+s*i,y-.1,z-4,x0+s*(i+1),y+.5,z+4,{vx:(i%2?-7:7),vz:0});V(x0+s*i,y,z-4,x0+s*i+.4,y+.06,z+4,EDG());w.push([x0+s*(i+.5),y,z])}return w}
};
// ---- placing ----
function place(name,cx,z0,y,fl=1,o={}){const old=XF;XF={ox:cx,oy:y,oz:z0,fl};const w=MODS[name](o);const out=w.map(p=>[tX(p[0]),XF.oy+p[1],tZ(p[2]),p[3]||'']);XF=old;return out}

// ---- test-bed: one of every module and lateral bridge, each with a bot path ----
function buildTestbed(){CLOUDS.visible=false;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);
  const names=Object.keys(MODS);fp(-12,-10,12,12,0,0);CP.push({p:[0,0.05,6]});
  names.forEach((n,i)=>{const cx=i*64+(i?0:0),z0=-12;if(i)fp(cx-12,z0-0,cx+12,z0+10,0);const w=place(n,cx,z0,0,1);
    test('mod:'+n,[cx,0,z0+.5],0,[0,0,0,0,0],{pf:w,secs:25,delays:n==='crossfire'?[0,.5,1,1.5,2,2.5,3,3.5,4]:[0]});
    const w2=place(n,cx,z0+300,0,-1);fp(cx-12,z0+300-10,cx+12,z0+300,0);test('rev:'+n,[cx,0,z0+299.5],Math.PI,[0,0,0,0,0],{pf:w2,secs:25,delays:n==='crossfire'?[0,.5,1,1.5,2,2.5,3,3.5,4]:[0]})});
  {const cx=names.length*64,z0=-12;fp(cx-12,z0,cx+12,z0+10,0);const w=climbMod(cx,z0,0,5);test('mod:climb',[cx,0,z0+.5],0,[0,0,0,0,0],{pf:w,secs:45})}
  Object.keys(LATS).forEach((n,i)=>{const z=-120-i*30;blk(-22,-3,z-6,-4,0,z+6,0);blk(28,-3,z-6,46,0,z+6,0);const w=LATS[n](-4,28,z,0);w.push([40,0,z]);
    test('lat:'+n,[-18,0,z],-Math.PI/2,[0,0,0,0,0],{pf:w,secs:12,delays:[0,.5,1,1.5,2,2.5,3]})});
  Object.assign(GOAL,{x:0,y:0,z:-500})}

// ---- GROUNDS: the playground. every obstacle module in a row, the lateral bridges and the spiral below. no goal, no timer pressure ----
function buildGrounds(){CLOUDS.visible=true;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);
  skyline(7,160,-700,500,120,150,900,300,0);
  const names=Object.keys(MODS),xe=names.length*64+12;
  fp(-24,-12,xe,14,0,0);CP.push({p:[0,0.05,6]});
  floorText(['#GROUNDS','EVERY OBSTACLE, ONE AFTER ANOTHER'],0,0,2,16);
  board(['#THE PLAYGROUND','NO GOAL, NO TIMER','RUN ALONG THE WALKWAY AND','TRY EVERY OBSTACLE','BRIDGES AND A SPIRAL SOUTH'],-14,0,10,9,'+z');
  names.forEach((n,i)=>{const cx=i*64;place(n,cx,-12,0,1);floorText(['#'+(MODN[n]||n.toUpperCase())],cx,0,-8,10);CP.push({p:[cx,0.05,0]})});
  // lateral bridges: south of the walkway, left to right
  Object.keys(LATS).forEach((n,i)=>{const z=44+i*30;fp(-24,12,-10,z+6,0,0);blk(-22,-3,z-6,-4,0,z+6,0);blk(28,-3,z-6,46,0,z+6,0);LATS[n](-4,28,z,0);
    floorText(['#'+n.toUpperCase()],-14,0,z,8);if(i===0)CP.push({p:[-14,0.05,30]})});
  // spiral climb
  {const cx=120,z0=44;fp(cx-14,12,cx+14,z0,0,0);climbMod(cx,z0,0,9);floorText(['#SPIRAL CLIMB'],cx,0,z0-4,9)}
  Object.assign(GOAL,{x:0,y:-500,z:-900})}
