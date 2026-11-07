// Megastructure kit + level 2 (HOLLOW GRID) + the megastructure backdrop for level 1.
// Everything here is built from AABB boxes (collision) and visual-only meshes, same as the rest of the game.
// hop() builds a roof AND registers the bot test for the jump onto it, so every gap in the level is verified.
let LPAD=null;                                                   // last pad (for auto-registered jump tests)
function setLP(cx,z1,z2,top,w=24){LPAD={cx,z1,z2,top,w}}
function hop(cx,z1,z2,top,seed,o={}){const w=o.w||24;rf(cx-w/2,z1,cx+w/2,z2,top,seed,o.kit||{},o.q);
  if(LPAD&&!o.notest){const mg=Math.min(4,LPAD.w/2-1),sx=LPAD.cx+Math.max(-mg,Math.min(mg,cx-LPAD.cx)),sz=Math.min(LPAD.z2-3,LPAD.z1+(o.run||8)),tz=(z1+z2)/2;
    test(o.name||('hop'+seed),[sx,LPAD.top,sz],ya(cx-sx,tz-sz),[cx-w/2+2,cx+w/2-2,z1,z2,top],o.dash?{dash:1,secs:7}:{secs:5})}
  setLP(cx,z1,z2,top,w)}

const GATEM=()=>pmt(0x8d8f8a,.3);
// a huge ring you run through (visual only). plane faces z unless halo (flat ring around a spire)
function gate(cx,cy,cz,R,tube=3,halo=false,glow=0xffa24a){
  const a=new THREE.Mesh(new THREE.TorusGeometry(R,tube,6,44),GATEM()),b=new THREE.Mesh(new THREE.TorusGeometry(R-tube*1.05,tube*.16,4,44),em(glow));
  for(const m of[a,b]){m.position.set(cx,cy,cz);if(halo)m.rotation.x=Math.PI/2;LVL.add(m)}
  if(!halo){for(const s of[-1,1])V(cx+s*(R-.5)-1.2,BASEY,cz-1.6,cx+s*(R-.5)+1.2,cy-R*.35,cz+1.6,GATEM())}}   // two stub piers so it stands on something
// a tall brutalist mega tower: slab + 3 setbacks + mast (visual only)
function megaTower(cx,cz,w,d,top,seed){slab(cx-w/2,cz-d/2,cx+w/2,cz+d/2,top,seed,{});dseed(seed+9);let t=top+.6,ww=w,dd=d;
  for(let i=0;i<3;i++){ww*=.7;dd*=.7;const h=rr(24,48);V(cx-ww/2,t,cz-dd/2,cx+ww/2,t+h,cz+dd/2,pmt(i%2?0xa9aba6:0x8f918c,.3));fins(cx-ww/2,cz-dd/2,cx+ww/2,cz+dd/2,t+h,Math.min(h,40),{sp:3});
    V(cx-ww/2-.2,t+h,cz-dd/2-.2,cx+ww/2+.2,t+h+.5,cz+dd/2+.2,em(0xff8a3d));t+=h}
  antenna(cx,t,cz,rr(30,70))}
// a deck between two towers with glowing window bands (visual only)
function skybridge(x1,x2,z,y,h=9,d=9){const m=pmt(0xa9aba6,.3);V(x1,y,z-d/2,x2,y+h,z+d/2,m);V(x1,y+h*.3,z-d/2-.08,x2,y+h*.62,z+d/2+.08,em(0xaee0ff));V(x1,y-3,z-1,x2,y,z+1,pmt(0x6f7378,.3))}

// ---- suspension bridge: deck (solid), pylons, sagging main cables made of small boxes, hanger posts ----
function cableBridge(cx,z1,z2,top,pz,py=52){const w=6,m=pmt(0xb9bab4,.3),cb=pmt(0x2a2c2e,1);
  blk(cx-w/2,top-1.2,z2,cx+w/2,top,z1,0);                                 // z1 is the near (larger z) end
  for(const z of pz)for(const s of[-1,1]){const x=cx+s*5;blk(x-.9,BASEY,z-.9,x+.9,top-1.3,z+.9,0);V(x-.9,top-1.2,z-.9,x+.9,top+py,z+.9,m)}
  for(const z of pz)V(cx-5.9,top+py-4,z-.7,cx+5.9,top+py-2,z+.7,m),V(cx-5.9,top+py*.45,z-.7,cx+5.9,top+py*.45+1.6,z+.7,m);
  const y=(z)=>{const[a,b]=[pz[0],pz[pz.length-1]];if(z>a)return top+3+(top+py-3-top-3)*Math.max(0,Math.min(1,(z1-z)/(z1-a)));
    if(z<b)return top+3+(py-3)*Math.max(0,Math.min(1,(z-z2)/(b-z2)));const t=(a-z)/(a-b);return top+py-4-(py-4-5)*Math.sin(Math.PI*t)}
  for(let z=z1;z>z2;z-=1.8)for(const s of[-1,1]){const x=cx+s*5,yy=y(z);V(x-.17,yy,z-.9,x+.17,yy+.34,z+.9,cb)}
  for(let z=z1-4;z>z2+3;z-=6)for(const s of[-1,1]){const x=cx+s*5,yy=y(z);if(yy>top+1.2)V(x-.05,top,z-.05,x+.05,yy,z+.05,cb)}
  for(let z=z1;z>z2;z-=3)for(const s of[-1,1])V(cx+s*2.85,top,z-.1,cx+s*2.95,top+1.1,z+.1,cb)}

// thin floating slab pad (solid only 3 m deep, so a spiral can pass underneath it)
function rfs(x1,z1,x2,z2,top,seed,o={}){plaza(x1,z1,x2,z2,top);roofKit(x1,z1,x2,z2,top,seed,o)}
// ---- spiral stair around a square core: 3 m steps, 0.42 m rise (under the step-up limit). returns the waypoints for the bot ----
function helix(cx,cz,r,y0,steps,th0,dir=1,rail=true){const dth=3/r*dir,way=[];let y=y0,last;
  for(let k=0;k<steps;k++){const th=th0+dth*k;y=y0+.42*(k+1);const x=cx+r*Math.sin(th),z=cz+r*Math.cos(th);
    blk(x-2.9,y-1.3,z-2.9,x+2.9,y,z+2.9,k%7===0?1:0);if(k%2===0)way.push([x,z]);last={x,z,y,th};
    if(rail){const ox=cx+(r+3)*Math.sin(th),oz=cz+(r+3)*Math.cos(th);V(ox-.1,y,oz-.1,ox+.1,y+1.1,oz+.1,pmt(0x2a2c2e,1));V(ox-.2,y+1.05,oz-.2,ox+.2,y+1.2,oz+.2,pmt(0x2a2c2e,1))}}
  return{way,last}}
// a hollow-looking atrium shell around a core: floor rings every 14 m + corner columns
function atrium(cx,cz,half,y0,y1,seed){const m=pmt(0xa9aba6,.3),e=pmt(0x8f918c,.3);
  for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])V(cx+sx*half-1.4,y0,cz+sz*half-1.4,cx+sx*half+1.4,y1,cz+sz*half+1.4,m);
  for(let y=y0+8;y<y1;y+=14){V(cx-half-1.4,y,cz-half-1.4,cx+half+1.4,y+1.1,cz-half+1.4,e);V(cx-half-1.4,y,cz+half-1.4,cx+half+1.4,y+1.1,cz+half+1.4,e);
    V(cx-half-1.4,y,cz-half,cx-half+1.4,y+1.1,cz+half,e);V(cx+half-1.4,y,cz-half,cx+half+1.4,y+1.1,cz+half,e);V(cx-half-1.4,y+1.1,cz-half-1.4,cx+half+1.4,y+1.5,cz-half-1.2,em(0xaee0ff))}
  V(cx-half-1.4,y1,cz-half-1.4,cx+half+1.4,y1+1.6,cz+half+1.4,e)}
function coreBox(cx,cz,h,top){blk(cx-11,BASEY,cz-11,cx+11,top,cz+11,5);deco(cx-11.2,top,cz-11.2,cx+11.2,top+h,cz+11.2,5);fins(cx-11.2,cz-11.2,cx+11.2,cz+11.2,top+h,Math.min(60,h),{sp:2})}

// =====================================================================================
// LEVEL 2 : HOLLOW GRID  (megastructures: gates, a cable bridge, an atrium spiral, a ring walk, skybridges, the crown)
// =====================================================================================
function buildL2(){
  CLOUDS.visible=false;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);LPAD=null;
  skyline(23,220,-1900,150,90,160,1100,0,-700);
  // --- megastructure backdrop: a canyon of mega towers, gates over the route, skybridges overhead ---
  {const r=rng(77);for(let z=60;z>-1500;z-=120+r()*50){for(const s of[-1,1]){const w=46+r()*30,d=46+r()*30,cx=s*(125+r()*60)+(s>0?30:0);megaTower(cx,z,w,d,150+r()*260,Math.round(-z)*s+31)}}}
  for(const z of[-120,-250])gate(0,38,z,44,3.4);
  for(const[z,y]of[[-90,210],[-380,260],[-720,300],[-1020,230]])skybridge(-190,220,z,y,12,12);
  // --- S0 start plaza ---
  rf(-22,-44,22,12,0,201,{},[-18,-30,-8,-20]);setLP(0,-44,12,0,44);CP.push({p:[0,0.05,6]});
  blk(-22,0,10.8,22,1.2,12,0);blk(-22,0,-44,-20.8,1.2,10.8,0);blk(20.8,0,-44,22,1.2,10.8,0);acrow(14,0,-30,true);crates(15,0,-12,true);pallets(-20,0,6,true);antenna(18,0,-42,12);
  floorText(['#HOLLOW GRID','THE CITY ABOVE THE CLOUDS'],0,0,-2,15);
  board(['#THE HOLLOW','THE BEACON IS ON THE CROWN','FOLLOW THE ROUTE UPWARD','EVERYTHING HERE IS ABANDONED'],-14,0,-28,8,'+z');
  // --- S1 gantry run: staggered roofs under the first gates ---
  hop(7,-66,-50,0,211,{name:'g1'});hop(-6,-92,-74,1,212,{name:'g2'});hop(8,-120,-100,2,213,{name:'g3'});
  CP.push({p:[8,2.05,-112]});floorText(['#CHECKPOINT','SAVED'],8,2,-113,8);
  hop(-6,-148,-128,3,214,{name:'g4'});hop(4,-178,-156,4,215,{name:'g5'});hop(-4,-206,-186,5,216,{name:'g6'});CP.push({p:[-4,5.05,-198]});
  // --- S2 the cable bridge: 140 m of 6 m deck ---
  const BT=5;cableBridge(-4,-212,-352,BT,[-248,-316],54);
  sign(['#THE SPAN','DO NOT LOOK DOWN'],-4,BT+3.3,-213,6,'+z',{bg:'#101214',bc:'#ffb020'});
  setLP(-4,-352,-212,BT,6);hop(-4,-406,-358,BT,231,{name:'bridgeOut'});
  // --- S3 atrium spiral: 2.5 turns up a square core ---
  const HC={x:-4,z:-428},H1=helix(HC.x,HC.z,20,BT,105,0,1),hy=H1.last.y;
  coreBox(HC.x,HC.z,150,hy+14);atrium(HC.x,HC.z,27,BT-1,hy+60,1);
  CP.push({p:[HC.x,BT+.05,-400]});board(['#THE ATRIUM','A STAIR AROUND THE CORE','KEEP CLIMBING'],8,BT,-380,8,'+z');
  rfs(-18,-484,10,-447,hy,241,{});setLP(-4,-484,-447,hy,28);
  test('helix1',[HC.x,BT,-404],0,[-17,9,-483,-449,hy],{way:H1.way,secs:90});CP.push({p:[-4,hy+.05,-466]});
  // --- S4 office tunnel (lit interior, doorways at both ends) ---
  const O={z2:-484,z1:-560};
  office(-14,O.z1,6,O.z2,hy,5,{front:[[-5,1,hy,hy+3.6]],back:[[-5,1,hy,hy+3.6]]});
  officeKit(-14,O.z1,6,O.z2,hy,5,243);for(let z=O.z2-9;z>O.z1+6;z-=14){desk(-12,z,hy);desk(2.2,z-4,hy)}
  rf(-10,-600,10,-560,hy,245,{});setLP(0,-600,-560,hy,20);
  test('office',[-2,hy,-466],0,[-9,9,-600,-562,hy],{secs:8,mantle:1});CP.push({p:[0,hy+.05,-590]});
  // --- S5 scaffold up a facade ---
  const zf=-612,nS=12;scaffold(zf,hy,nS,3,'scafL2');test('toScaf',[-3.5,hy,-593],0,[-9,-2,zf,zf+7,hy],{secs:6});
  const rt=hy+3*(nS-1);rf(-30,-676,30,zf,rt,251,{});CP.push({p:[-5.5,hy+.05,zf+3.5]});CP.push({p:[0,rt+.05,-640]});
  board(['#THE RING','AN ORBIT OF SLABS','AROUND THE MEGASTRUCTURE'],-14,rt,-650,9,'-z');
  // --- S6 ring walk: stepping slabs on a half circle around a mega core ---
  const RC={x:0,z:-731},RR=55,ns=9,t0=0.6435,t1=Math.PI-t0;coreBox(RC.x,RC.z,260,rt-2);
  gate(RC.x,rt-6,RC.z,RR,3.6,true,0xffa24a);for(const a of[0,1])V(-RR,rt-4,RC.z-2,RR,rt-2,RC.z+2,pmt(0x8f918c,.3)),V(-2,rt-4,RC.z-RR,2,rt-2,RC.z+RR,pmt(0x8f918c,.3));
  let pv={cx:24,cz:-668,top:rt};
  for(let i=0;i<ns;i++){const th=t0+i*(t1-t0)/(ns-1),cx=RR*Math.sin(th),cz=RC.z+RR*Math.cos(th),top=rt+.7*(i+1);
    blk(cx-4,top-3,cz-4,cx+4,top,cz+4,0);V(cx-4,top,cz-4,cx+4,top+.18,cz-3.6,pmt(0x8f918c,.4));V(cx-4,top,cz+3.6,cx+4,top+.18,cz+4,pmt(0x8f918c,.4));
    test('ring'+i,[pv.cx,pv.top,pv.cz],ya(cx-pv.cx,cz-pv.cz),[cx-3.5,cx+3.5,cz-3.5,cz+3.5,top],{secs:4});pv={cx,cz,top}}
  // --- S7 wall-jump shaft, then skybridge beams ---
  const ox=24,sy=pv.top,sz0=pv.cz-10,zb=sz0-60;
  rf(ox-10,zb,ox+10,sz0,sy,261,{avoid:[[ox-10,zb,ox+10,zb+20],[ox-10,sz0-8,ox+10,sz0]]});
  test('ringOut',[pv.cx,pv.top,pv.cz],ya(ox-pv.cx,sz0-4-pv.cz),[ox-9,ox+9,zb,sz0,sy],{secs:5});CP.push({p:[ox,sy+.05,sz0-5]});
  blk(ox-10,sy,zb,ox-2.5,sy+11.5,zb+12,5);blk(ox+2.5,sy,zb,ox+10,sy+9.5,zb+12,5);
  board(['#THE SHAFT','WALL JUMP BETWEEN THE WALLS','CLIMB OUT AT THE TOP'],ox+7,sy,zb+28,8,'+z');
  const ty=sy+9.5;rf(ox,zb-40,ox+14,zb-8,ty,262,{avoid:[[ox,zb-40,ox+14,zb-24]]});
  test('shaftOut',[ox+6,ty,zb+4],0,[ox,ox+14,zb-40,zb-8,ty],{secs:6});setLP(ox+7,zb-40,zb-8,ty,14);CP.push({p:[ox+7,ty+.05,zb-14]});
  let bz=zb-40;
  const beam=(len,gap,seed,cx,w)=>{const z2=bz-gap,z1=z2-len;rf(cx-w/2,z1,cx+w/2,z2,ty,seed,{noProps:true});
    const sx=LPAD.cx,sz=Math.min(LPAD.z2-3,LPAD.z1+10);test('beam'+seed,[sx,ty,sz],ya(cx-sx,(z1+z2)/2-sz),[cx-w/2+1,cx+w/2-1,z1,z2,ty],{dash:1,secs:8});setLP(cx,z1,z2,ty,w);bz=z1;return[z1,z2]};
  const b1=beam(54,14,271,ox+7,14);blk(ox,ty,b1[1]-28,ox+14,ty+1.0,b1[1]-27,2);
  const b2=beam(54,18,272,ox-2,14);blk(ox-9,ty,b2[1]-26,ox+5,ty+.95,b2[1]-25,2);CP.push({p:[ox-2,ty+.05,b2[1]-6]});
  const b3=beam(46,16,273,ox+6,14);
  for(const z of[b1[0]+27,b2[0]+27])for(const s of[-1,1])V(ox+s*60-14,ty-60,z-9,ox+s*60+14,ty+90,z+9,pmt(0x9a9c97,.3));
  board(['#SPRINT & VAULT','RUN INTO LOW BLOCKS TO VAULT','HOLD '+kn('dash')+' FOR LONG GAPS'],ox+7,ty,b1[1]-6,8,'+z');
  // --- S8 the crown: a last spiral around a slim spire, ringed by halos, up to the beacon ---
  const CC={x:ox+6,z:bz-70};hop(ox+6,bz-52,bz-6,ty,281,{name:'toCrown',w:24});
  CP.push({p:[CC.x,ty+.05,bz-14]});
  const H2=helix(CC.x,CC.z,16,ty,117,0,-1),cy=H2.last.y;coreBox(CC.x,CC.z,150,cy+10);
  for(let i=0;i<6;i++)gate(CC.x,ty+i*(cy-ty)/5+6,CC.z,40+i*6,3,true,i%2?0xaee0ff:0xffa24a);
  rfs(CC.x-14,CC.z-40,CC.x+14,CC.z-17,cy,291,{noProps:true});
  test('helix2',[CC.x,ty,CC.z+19],0,[CC.x-13,CC.x+13,CC.z-40,CC.z-18,cy],{way:H2.way,secs:100});
  Object.assign(GOAL,{x:CC.x,y:cy,z:CC.z-30});beacon(560);floorText(['#YOU REACHED','THE CROWN'],CC.x,cy,CC.z-24,12)}
