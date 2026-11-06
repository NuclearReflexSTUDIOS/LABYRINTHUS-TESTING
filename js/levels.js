// Levels. Each build() fills the current level group using the helpers in level.js and sets CP (checkpoints) + GOAL.
// LT collects jump transitions (from, target roof) so a test bot can verify every gap is reachable.
const LT=[];
const test=(name,from,yaw,tgt,opt={})=>LT.push({name,from,yaw,tgt,opt});

// ---------- shared building helpers (walls with openings, offices, scaffolding, gondolas) ----------
// opening = [from,to,sillY,headY]; sill == floor means a floor-level doorway
function wallX(xa,xb,zc,y1,y2,th,gaps=[],t=0){const z1=zc-th/2,z2=zc+th/2;let x=xa;
  for(const[g1,g2,s,h]of gaps.slice().sort((a,b)=>a[0]-b[0])){if(g1>x)blk(x,y1,z1,g1,y2,z2,t);if(s>y1)blk(g1,y1,z1,g2,s,z2,t);if(h<y2)blk(g1,h,z1,g2,y2,z2,t);x=g2}
  if(x<xb)blk(x,y1,z1,xb,y2,z2,t)}
function wallZ(za,zb,xc,y1,y2,th,gaps=[],t=0){const x1=xc-th/2,x2=xc+th/2;let z=za;
  for(const[g1,g2,s,h]of gaps.slice().sort((a,b)=>a[0]-b[0])){if(g1>z)blk(x1,y1,z,x2,y2,g1,t);if(s>y1)blk(x1,y1,g1,x2,s,g2,t);if(h<y2)blk(x1,h,g1,x2,y2,g2,t);z=g2}
  if(z<zb)blk(x1,y1,z,x2,y2,zb,t)}
const wins=(a,b,every,w,y0,sill=0.9,head=3.4)=>{const o=[];for(let s=a+every/2-w/2;s+w<=b;s+=every)o.push([s,s+w,y0+sill,y0+head]);return o};
// an office floor on top of a tower body: z2 is the front (entry) face, z1 the back. floor top = y0.
function office(x1,z1,x2,z2,y0,h,o={}){
  tower(x1,z1,x2,z2,y0);blk(x1,y0+h,z1,x2,y0+h+0.9,z2,0);const th=0.6;INT.push({x1,x2,z1,z2,y0:y0-1,y1:y0+h+1});
  wallX(x1,x2,z2-th/2,y0,y0+h,th,o.front||[]);wallX(x1,x2,z1+th/2,y0,y0+h,th,o.back||[]);
  wallZ(z1,z2,x1+th/2,y0,y0+h,th,o.left||wins(z1+3,z2-3,16,3.6,y0));wallZ(z1,z2,x2-th/2,y0,y0+h,th,o.right||wins(z1+3,z2-3,16,3.6,y0));
  for(let z=z2-8;z>z1+4;z-=8){lamp(0,y0+h,z);lamp(-12,y0+h,z);lamp(12,y0+h,z)}
  return{y0,h,roof:y0+h+0.9}}
const column=(x,z,y0,h,s=0.5)=>blk(x-s,y0,z-s,x+s,y0+h,z+s,0);
function desk(x,z,y0,w=1.8,d=0.8){blk(x,y0,z,x+w,y0+0.76,z+d,9);deco(x+w*0.3,y0+0.76,z+0.1,x+w*0.3+0.5,y0+1.2,z+0.2,2);blk(x+w*0.4,y0,z+d+0.1,x+w*0.4+0.5,y0+0.45,z+d+0.6,2)}
// outdoor tube scaffolding: planks zig-zag up a facade (front face at zf, planks stand out toward +z). Even levels left, odd right.
function scaffold(zf,y0,n,rise,name,depth=7,L=[-9,-2],R=[2,9]){
  for(let k=0;k<n;k++){const y=y0+k*rise,x=k%2?R:L;
    blk(x[0],y-0.25,zf,x[1],y,zf+depth,9);
    for(const px of[x[0]+0.1,x[1]-0.3])for(const pz of[zf+0.1,zf+depth-0.3])deco(px,y-rise,pz,px+0.2,y+1.0,pz+0.2,8);        // standards
    deco(x[0],y+0.9,zf+depth-0.1,x[1],y+1.0,zf+depth,8);deco(x[0],y+0.45,zf+depth-0.1,x[1],y+0.5,zf+depth,8);                // guard rails
    deco(x[0]+0.1,y+0.9,zf,x[0]+0.2,y+1.0,zf+depth,8);deco(x[1]-0.2,y+0.9,zf,x[1]-0.1,y+1.0,zf+depth,8);
    if(k<n-1){const nx=(k+1)%2?R:L,cx=(x[0]+x[1])/2;test(name+' '+k,[cx,y,zf+depth/2],k%2?1.5708:-1.5708,[nx[0],nx[1],zf,zf+depth,y+rise])}}}
// window-cleaner gondola: slides vertically from yBase up by R and back; cables hang from a davit at topY
function gondola(x,zBack,zFront,yBase,R,period,topY,phase=0){
  const m=mover(x-5,yBase-0.4,zBack,x+5,yBase,zFront,8,'y',0,R,period,phase,0.2);
  const cx=x,cy=yBase-0.2,cz=(zBack+zFront)/2;
  const kid=(x1,y1,z1,x2,y2,z2,t)=>{const k=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);k.position.set((x1+x2)/2-cx,(y1+y2)/2-cy,(z1+z2)/2-cz);m.mesh.add(k)};
  kid(x-5,yBase,zBack,x-4.8,yBase+1.1,zFront,2);kid(x+4.8,yBase,zBack,x+5,yBase+1.1,zFront,2);kid(x-5,yBase,zBack,x+5,yBase+0.1,zBack+0.2,2);
  kid(x-5,yBase+1.0,zBack,x-4.8,yBase+1.1,zFront,3);kid(x+4.8,yBase+1.0,zBack,x+5,yBase+1.1,zFront,3);
  m.cables=[];for(const cxx of[x-4.5,x+4.5]){const c=new THREE.Mesh(new THREE.BoxGeometry(0.08,1,0.08),MATS[2]);c.userData.keep=true;LVL.add(c);m.cables.push({mesh:c,x:cxx,z:zBack+0.6,topY})}
  return m}
const REBAR=(x,y,z,h)=>deco(x,y,z,x+0.12,y+h,z+0.12,8);

// roof = solid tower + dressing; with a pool the dressing goes on the strips around the basin so nothing floats over the water
function rf(x1,z1,x2,z2,top,seed,o={},q){tower(x1,z1,x2,z2,top,q);
  if(!q){roofKit(x1,z1,x2,z2,top,seed,o);return}
  const[a,b,c,d]=q,s=Object.assign({},o,{noLip:true,noProps:true});roofKit(x1,z1,a,z2,top,seed,s);roofKit(c,z1,x2,z2,top,seed+1,s);roofKit(a,z1,c,b,top,seed+2,s);roofKit(a,d,c,z2,top,seed+3,s)}
const ya=(dx,dz)=>Math.atan2(-dx,-dz);                                              // yaw that faces (dx,dz)
function beacon(h=300){const g=new THREE.Mesh(new THREE.BoxGeometry(0.8,6,0.8),new THREE.MeshBasicMaterial({color:0xb6ff4a}));g.position.set(GOAL.x,GOAL.y+3,GOAL.z);LVL.add(g);
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,h,8,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:0.35,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));bm.position.set(GOAL.x,GOAL.y+h/2,GOAL.z);bm.userData.keep=true;LVL.add(bm)}

// ---------- LEVEL 1 : TUTORIAL (every move, one lesson at a time, painted on the roofs) ----------
function buildL1(){
  CLOUDS.visible=true;skyline(11,170,-980,100,100,120,820,-10,-380);
  {const r=rng(5);for(let z=60;z>-740;z-=36+r()*22){const d=22+r()*16;for(const s of[-1,1]){const w=26+r()*14,x1=s<0?-100-r()*6:68+r()*6;
    slab(x1,z-d,x1+w,z,10+r()*100,Math.round(z)*s+7,r()<.3?{sign:[TAGS[(r()*TAGS.length)|0]]}:{})}}}
  const J=kn('jump'),SP=kn('dash'),SL=kn('slide');
  // ===== START: move, look, goal, checkpoints =====
  rf(-22,-60,22,14,0,101,{},[-18,-40,-8,-30]);CP.push({p:[0,0.05,8]});
  blk(-22,0,12.8,22,1.2,14,0);blk(-22,0,-60,-20.8,1.2,12.8,0);blk(20.8,0,-60,22,1.2,12.8,0);
  grass(-21,-28,-9,-4,0);grass(8,-56,21,-36,0);grass(-21,-28,-9,12,0);bush(-19,0,-2,1.3);bush(-12,0,-1.5,1);bush(18,0,-40,1.4);bush(11,0,-52,1.1);bush(-20,0,10,1.2);
  acrow(14,0,6,true);crates(-20,0,4,true);barrels(16,0,-20,true);pallets(-6,0,-52,true);antenna(18,0,10,12);gen(8,0,10,true);
  floorText(['#WELCOME','TO THE TUTORIAL'],0,0,3,13);
  floorText(['#MOVE',kn('mv')],0,0,-10,12);floorText(['#LOOK',kn('look')],0,0,-20,12);
  board(['#THE GOAL','REACH THE GREEN BEACON','AT THE VERY TOP'],-14,0,-32,8,'+z');board(['#EASY DOES IT','NOTHING HERE CAN HURT YOU','FALLING JUST RESETS YOU'],14,0,-44,8,'+z');
  board(['#CHECKPOINTS','WALK OVER A PAD TO SAVE','FELL? '+kn('reset')+' RETURNS YOU'],-14,0,-50,8,'+z');
  sign(['#LABYRINTHUS','A GAME BY R3CTRR313'],0,6.2,13.7,18,'-z',{bg:'#101214',bc:'#ff7a2e',board:false});
  // ===== 1. JUMP =====
  const tr=(z1,z2,top,seed,bd,o={})=>{rf(-12,z1,12,z2,top,seed,Object.assign({avoid:bd?[[-12,bd.z-1.5,12,bd.z+1.5]]:[]},o));if(bd)board(bd.l,bd.x||-7,top,bd.z,8,'+z')};
  floorText(['#JUMP',J],0,0,-48,12);
  tr(-80,-65,0,111,{l:['#JUMP','JUMP ACROSS THE GAP','HOLD IT FOR A HIGHER HOP'],z:-69});tr(-103,-88,0,112,{l:['#KEEP GOING','JUMP AGAIN AS YOU LAND','TO KEEP YOUR SPEED'],z:-92,x:7});tr(-128,-111,0,113,null);
  CP.push({p:[0,0.05,-118]});floorText(['#CHECKPOINT','SAVED'],0,0,-121,9);
  test('R0>R1',[0,0,-56],0,[-10,10,-80,-65,0]);test('R1>R2',[0,0,-77],0,[-10,10,-103,-88,0]);test('R2>R3',[0,0,-100],0,[-10,10,-128,-111,0]);
  // ===== 2. AIR JUMP =====
  tr(-158,-142,1.5,114,{l:['#AIR JUMP','PRESS '+J+' AGAIN','WHILE IN THE AIR','YOU HAVE 3 AIR JUMPS'],z:-146});
  // ===== 3. SPRINT (long runway) =====
  rf(-12,-250,12,-175,3,115,{avoid:[[-12,-214,12,-204]]});floorText(['#AIR JUMPS RESET','WHEN YOU LAND'],0,3,-182,9);
  floorText(['#SPRINT','HOLD '+SP],0,3,-200,12);board(['#SPRINT','HOLD '+SP+' WHILE MOVING','LONGER JUMPS, MORE SPEED','THE BAR (BOTTOM LEFT) DRAINS','IT REFILLS WHEN YOU STOP'],7,3,-209,8,'+z');
  CP.push({p:[0,3.05,-186]});
  test('R3>R4',[0,0,-125],0,[-10,10,-158,-142,1.5]);test('R4>R5',[0,1.5,-155],0,[-10,10,-250,-175,3]);
  // ===== 4. SLIDE (low tunnel) =====
  rf(-12,-340,12,-272,3,116,{avoid:[[-12,-312,12,-286],[-12,-340,12,-318]]});floorText(['#BIG GAP AHEAD','SPRINT AND JUMP'],0,3,-244,9);
  floorText(['#SLIDE','HOLD '+SL,'WHILE RUNNING'],0,3,-281,12);CP.push({p:[0,3.05,-278]});
  blk(-10,4.35,-308,10,6.5,-292,2);blk(-10,3,-308,-9.4,6.5,-292,2);blk(9.4,3,-308,10,6.5,-292,2);
  sign(['#DUCK','SLIDE UNDER'],0,5.4,-291.9,5.5,'+z',{bg:'#101214',bc:'#ffb020'});for(let x=-9;x<10;x+=3)deco(x,4.2,-292.1,x+1.5,4.35,-291.9,3);
  // ===== 5. MANTLE (three ledges, each a little higher) =====
  blk(-10,3,-340,10,5,-318,1);blk(-10,3,-340,10,7,-326,1);blk(-10,3,-340,10,9,-332,1);
  sign(['#MANTLE','JUMP AT A LEDGE','AND YOU CLIMB UP'],0,3+1.7,-317.9,7,'+z',{bg:'#101214',bc:'#ffb020'});
  sign(['#AGAIN'],0,5+1.4,-325.9,5,'+z',{bg:'#101214',bc:'#ffb020'});sign(['#AND AGAIN'],0,7+1.4,-331.9,6,'+z',{bg:'#101214',bc:'#ffb020'});
  test('R5>R6',[0,3,-247],0,[-10,10,-340,-272,3],{dash:1,secs:6});test('mantle',[0,3,-316],0,[-10,10,-398,-345,9],{secs:6,mantle:1});
  // ===== 6. WALL JUMP (the same 5m shaft as the old level one) =====
  rf(-10,-400,10,-340,9,117,{avoid:[[-10,-400,10,-380],[-10,-348,10,-340]]});CP.push({p:[0,9.05,-346]});floorText(['#WALL JUMP','TOUCH A WALL','THEN PRESS '+J],0,9,-360,9);
  blk(-10,9,-400,-2.5,20.5,-388,5);blk(2.5,9,-400,10,18.5,-388,5);
  board(['#WALL JUMP','JUMP OFF THE WALLS','ZIG-ZAG UP THE SHAFT','CLIMB OUT AT THE TOP'],7,9,-372,8,'+z');
  sign(['#KICK','OFF'],-2.55,15,-394,4,'+x',{bg:'#101214',bc:'#ffb020'});sign(['#THEN','THE','OTHER'],2.55,13.5,-394,4,'-x',{bg:'#101214',bc:'#ffb020'});
  // ===== 7. MOVING PLATFORM =====
  rf(0,-440,14,-408,18.5,118,{avoid:[[0,-440,14,-420]]});CP.push({p:[7,18.55,-414]});
  test('wall>R8',[6,18.5,-396],0,[0,14,-440,-408,18.5]);
  const gm=gondola(7,-445.5,-440,18.5,14,18,18.5+14+8);
  board(['#LIFT','STEP ON AND RIDE UP','THEN JUMP OFF AT THE TOP'],7,18.5,-424,8,'+z');
  rf(-12,-500,26,-454,32.5,119,{},[-8,-492,6,-474]);CP.push({p:[0,32.55,-460]});
  for(const px of[-4,4])deco(px-.3,32.5,-454.8,px+.3,40.8,-454.2,8);deco(-4.3,40.5,-454.8,4.3,40.8,-440,8);
  test('lift>R9',[7,32.5,-447],0,[-12,26,-500,-454,32.5]);
  grass(-12,-500,-8,-454,32.5);grass(6,-500,26,-454,32.5);bush(-10,32.5,-460,1.4);bush(20,32.5,-470,1.6);bush(-9,32.5,-490,1.2);
  board(['#WATER','SHALLOW WATER SLOWS YOU','BUT NEVER HURTS'],-9,32.5,-481,7,'+z');
  // ===== 8. STYLE (put it all together) =====
  board(['#STYLE','TRICKS FILL THE METER','TOP RIGHT: D C B A S SS SSS','KEEP MOVING, MIX YOUR MOVES'],14,32.5,-496,8,'+z');
  tr(-520,-508,32.5,120,null,{});tr(-540,-526,34,121,null);tr(-560,-548,36,122,null);tr(-582,-568,36,123,null);tr(-600,-590,36,124,null);
  blk(3,34,-534,6,35.4,-533,2);blk(4,36,-576,8,37.2,-574,2);
  floorText(['#CHAIN IT','JUMP, SPRINT, SLIDE,','CLIMB, REPEAT'],0,32.5,-505,9);CP.push({p:[0,36.05,-552]});
  test('R9>C1',[0,32.5,-497],0,[-8,8,-520,-508,32.5]);test('C1>C2',[0,32.5,-511],0,[-8,8,-540,-526,34]);test('C2>C3',[0,34,-529],0,[-6,6,-560,-548,36]);
  test('C3>C4',[0,36,-551],0,[-10,10,-582,-568,36]);test('C4>C5',[0,36,-571],0,[-10,10,-600,-590,36]);
  // ===== 9. FINAL CLIMB: a scaffold up to the beacon =====
  const zf=-612,y0=36,nS=9;scaffold(zf,y0,nS,3,'scafT');test('C5>scaf',[-3.5,36,-593],0,[-9,-2,zf,zf+7,y0]);CP.push({p:[-5.5,y0+0.05,zf+3.5]});
  board(['#LAST CLIMB','ZIG-ZAG UP THE SCAFFOLD'],0,36,-596,8,'+z');
  const top=y0+3*(nS-1);rf(-22,-660,22,zf,top,125,{});grass(-22,-660,-10,zf,top);grass(10,-660,22,zf,top);
  Object.assign(GOAL,{x:0,y:top,z:-640});beacon();
  floorText(['#TUTORIAL COMPLETE','NEXT: HOLLOW GRID'],0,top,-632,16);
  for(const[x,z]of[[-22,-660],[21.4,-660],[-22,-612.6],[21.4,-612.6]])deco(x,top,z,x+.6,top+12,z+.6,2)}

// ---------- LEVEL 2 : HOLLOW GRID (3x longer: roofs, scaffolding, office interiors, gondolas, a tube bridge) ----------
function buildL2(){
  CLOUDS.visible=false;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);
  skyline(23,220,-1900,150,70,160,1100,0,-650);
  for(let z=-40;z>-1420;z-=62){const r=rng(z);for(const sx of[-1,1]){const w=24+r()*22,d=26+r()*22,x1=sx>0?52+r()*10:-52-r()*10-w,top=20+r()*200;slab(x1,z-d,x1+w,z,top,Math.round(-z)*sx+3,r()<.3?{sign:[TAGS[(r()*TAGS.length)|0]]}:{})}}
  // ===== 1. start roof: an abandoned construction site =====
  rf(-22,-46,22,12,0,201,{},[-18,-30,-8,-20]);acrow(14,0,-30,true);tank(-20,0,-44,true);crates(15,0,-12,true);pallets(-20,0,6,true);antenna(18,0,-44,12);
  blk(-22,0,10.8,22,1.2,12,0);blk(-22,0,-46,-20.8,1.2,10.8,0);blk(20.8,0,-46,22,1.2,10.8,0);
  CP.push({p:[0,0.05,6]});
  blk(12,0,2,17,2.5,7,2);deco(14,2.5,4,15,36,5,8);deco(-26,35,3.5,16,36,5.5,8);deco(-26,31,4,-25.4,35,5,2);       // crane base, mast, jib
  grass(6,-45,21,-31,0);grass(-21,-9,-12,9,0);bush(10,0,-38,1.3);bush(17,0,-36,1);bush(-20,0,0,1.2);
  blk(-6,0,-42,6,0.6,-38,9);blk(-4,0,-46,4,1.2,-42,9);for(let i=0;i<5;i++)REBAR(-20+i*1.3,0,-44,3.4+i*0.5);
  rf(-10,-65,10,-55,2,202,{n:2});rf(-6,-81,6,-73,3.5,203,{n:1,margin:0});grass(-10,-65,-4,-55,2);blk(3,2,-63,6,3.2,-60,3);
  blk(-5,3.0,-111,-2,3.5,-81,2);for(let z=-106;z<-84;z+=6)deco(-3.7,-8,z,-3.3,3.0,z+0.3,8);                          // steel I-beam over the void
  test('R0->R1',[0,1.2,-44.5],0,[-10,10,-65,-55,2]);test('R1->R2',[0,2,-57],0,[-6,6,-81,-73,3.5]);test('R2->beam',[-3.5,3.5,-75],0,[-9,-2,-131,-117,4.5]);
  // ===== 2. scaffold climb up tower A, then into its office =====
  const zA=-124,y0A=25.5;
  scaffold(zA,4.5,8,3,'scafA');test('beam->scafA',[-3.5,3.5,-109],0,[-9,-2,zA,zA+7,4.5]);CP.push({p:[5,y0A+0.05,zA-6]});
  const A=office(-24,-184,24,zA,y0A,5.6,{front:[[0,9,y0A,y0A+3.4]],back:[[-5,5,y0A,y0A+3.4]]});officeKit(-24,-184,24,zA,y0A,5.6,301);fins(-24,-184,24,zA,y0A,44,{z:false});
  for(const x of[-20,-17,-14,-11,11,14,17,20])desk(x,-131,y0A);
  for(const z of[-150,-166])for(const x of[-9,9])column(x,z,y0A,5.6);
  wallX(-23.4,23.4,-142,y0A,y0A+5.6,0.6,[[-3,3,y0A,y0A+1.3],[9,12,y0A,y0A+2.8]]);blk(9,y0A,-142.3,12,y0A+1.4,-141.7,9);     // slide gap + crate-blocked door
  blk(-20,y0A+2.3,-174,20,y0A+2.8,-158,2);deco(-20,y0A+2.8,-158.2,20,y0A+3.8,-158,8);for(let x=-20;x<=20;x+=4)deco(x,y0A,-174,x+0.2,y0A+2.3,-173.8,8);       // mezzanine
  for(let i=0;i<4;i++)desk(-18+i*2.6,-178,y0A);
  lamp(-10,y0A+2.3,-166,2.6,.6);lamp(10,y0A+2.3,-166,2.6,.6);lamp(0,y0A+2.3,-170,2.6,.6);
  grass(-20,-184,20,-178,A.roof);
  // ===== 3. window-cleaner gondola up to tower B's garden terrace =====
  const yB=39.5;
  gondola(0,-189.8,-184.3,y0A,yB-y0A,18,yB+8);
  rf(-18,-250,18,-197.5,yB,305,{},[-16,-246,-6,-234]);fins(-18,-250,18,-197.5,yB,40,{z:false});acrow(10,yB,-246,true);tank(-17,yB,-205,true);hatch(13,yB,-212,true);antenna(15,yB,-200,12);grass(2,-250,18,-197.5,yB);grass(-18,-232,-6,-197.5,yB);
  blk(-3,yB,-214,3,yB+1.2,-212,4);blk(-14,yB,-218,-8,yB+1.1,-216,4);blk(8,yB,-228,14,yB+1.1,-226,4);bush(-12,yB,-204,1.5);bush(12,yB,-206,1.3);bush(10,yB,-240,1.6);
  for(const px of[-4,4])deco(px-0.2,yB,-203.2,px+0.2,yB+4,-202.8,8);deco(-5,yB+4,-205,5,yB+4.3,-201,9);                  // pergola
  for(const px of[-6,6])deco(px-0.3,yB,-198.1,px+0.3,yB+8.3,-197.5,8);deco(-6.3,yB+8,-198.1,6.3,yB+8.3,-185.5,8);   // davit over the gondola
  CP.push({p:[0,yB+0.05,-205]});
  // ===== 4. dash gap into tower C: lobby, elevator-shaft wall jump, catwalk =====
  const y0C=40,hC=16,zC1=-314,zC2=-266;
  office(-22,zC1,22,zC2,y0C,hC,{front:[[-8,8,y0C,y0C+4]],back:[[-4,4,y0C+9.5,y0C+13]],left:wins(zC1+4,zC2-4,18,4,y0C,1,6),right:wins(zC1+4,zC2-4,18,4,y0C,1,6)});
  for(const x of[-14,-6,6,14])column(x,-276,y0C,hC,0.6);
  blk(-9,y0C,-296,-2.5,y0C+11.5,-284,0);blk(2.5,y0C,-296,9,y0C+9.5,-284,0);blk(-9,y0C+9,-313.4,9,y0C+9.5,-296,2);
  desk(-18,-271,y0C);desk(-15,-271,y0C);desk(13,-271,y0C);desk(16,-271,y0C);
  for(let z=-274;z>-314;z-=9){lamp(0,y0C+hC,z,2.4,0.6);lamp(-15,y0C+hC,z,2.4,0.6);lamp(15,y0C+hC,z,2.4,0.6)}
  CP.push({p:[0,y0C+0.05,-272]});officeKit(-22,zC1,22,zC2,y0C,hC,302);fins(-22,zC1,22,zC2,y0C,44,{z:false});
  test('B->C dash',[0,yB,-244],0,[-8,8,-278,-267.5,y0C],{dash:50,secs:5});
  // ===== 5. the tube bridge: glass-walled, floor gaps, shutters to slide under =====
  const yT=y0C+9.5,zT1=-314,zT2=-408;
  blk(-4,yT-3,-334,4,yT,zT1,0);blk(-4,yT-3,-358,4,yT,-340,0);blk(-4,yT-3,zT2,4,yT,-366,0);
  wallZ(zT2,zT1,-4.3,yT-3,yT+5,0.6,wins(zT2+2,zT1-2,12,3.6,yT,1.2,3.6));wallZ(zT2,zT1,4.3,yT-3,yT+5,0.6,wins(zT2+2,zT1-2,12,3.6,yT,1.2,3.6));
  blk(-4.6,yT+5,zT2,4.6,yT+5.9,zT1,0);for(let z=-322;z>zT2;z-=10)lamp(0,yT+5,z,2,0.5);
  blk(-4,yT+1.3,-386,4,yT+5,-385,2);blk(-4,yT+1.3,-394,4,yT+5,-393,3);
  INT.push({x1:-5,x2:5,z1:zT2,z2:zT1,y0:yT-1,y1:yT+6});
  test('tube gap1',[0,yT,-332],0,[-4,4,-358,-340,yT]);test('tube gap2',[0,yT,-342],0,[-4,4,zT2,-366,yT]);
  // ===== 6. rooftop D: ducts to slide through, then a hop chain with a beam and an 18m dash =====
  const yD=yT;rf(-16,-440,16,zT2,yD,310,{avoid:[[-16,-434,16,-414]]});CP.push({p:[0,yD+0.05,-414]});
  blk(-14,yD,-432,-13,yD+3,-422,2);blk(13,yD,-432,14,yD+3,-422,2);blk(-13,yD+1.3,-432,13,yD+3,-422,3);blk(8,yD,-418,12,yD+1.5,-415,2);
  grass(-16,-418,-6,zT2,yD);bush(-14,yD,-410,1.3);bush(14,yD,-412,1.1);deco(-15,yD,-438,-9,yD+5,-433,2);
  rf(-8,-460,8,-449,yD+3,311,{n:1,margin:3});rf(-6,-476,6,-468,yD+6,312,{noProps:true});grass(-8,-460,8,-454,yD+3);blk(-1.5,yD+5.5,-506,1.5,yD+6,-476,2);
  const yE=yD+8;rf(-12,-536,12,-524,yE,313,{});
  test('D->E1',[0,yD,-438],0,[-8,8,-460,-449,yD+3]);test('E1->E2',[0,yD+3,-451],0,[-6,6,-476,-468,yD+6]);test('beam->E3 dash',[0,yD+6,-504],0,[-12,12,-536,-524,yE],{dash:45,secs:5});
  // ===== 7. second gondola (20m) into tower F: server hall =====
  const y0F=yE+20;
  gondola(0,-547,-541.5,yE,20,22,88,0.1);
  office(-24,-618,24,-553,y0F,5.6,{front:[[-6,6,y0F,y0F+3.4]],back:[[-6,6,y0F,y0F+3.4]]});CP.push({p:[0,y0F+0.05,-558]});officeKit(-24,-618,24,-553,y0F,5.6,303);fins(-24,-618,24,-553,y0F,44,{z:false});
  for(const z of[-586,-602])for(const sx of[-1,1])blk(sx>0?5:-7,y0F,z,sx>0?7:-5,y0F+2.4,z+4,2);
  wallX(-23.4,23.4,-576,y0F,y0F+5.6,0.6,[[-3,3,y0F,y0F+1.3]]);wallX(-23.4,23.4,-610,y0F,y0F+5.6,0.6,[[-3,3,y0F,y0F+1.3],[9,12,y0F,y0F+2.8]]);blk(9,y0F,-610.3,12,y0F+1.4,-609.7,9);
  blk(-8,y0F+2.5,-606,8,y0F+3,-592,2);
  for(const px of[-6,6])deco(px-0.3,y0F+5.6+0.9,-553.8,px+0.3,88.3,-553.2,8);deco(-6.3,88,-553.8,6.3,88.3,-541,8);      // davit over gondola 2
  // ===== 8. last climb: scaffolding up the final tower to the helipad =====
  const yH=y0F+2;tower(-9,-632,3,-625,yH);tower(-9,-646,3,-639,yH+0.5);
  const zG=-660,nG=17,y0G=yH+3.5;
  scaffold(zG,y0G,nG,3,'scafG');CP.push({p:[-5.5,y0G+0.05,zG+3.5]});
  test('F->H1',[0,y0F,-616],0,[-9,3,-632,-625,yH]);test('H1->H2',[-3,yH,-627],0,[-9,3,-646,-639,yH+0.5]);test('H2->scafG',[-3,yH+0.5,-641],0,[-9,-2,zG,zG+7,y0G]);
  const yTop=y0G+3*(nG-1);rf(-22,-730,22,zG,yTop,320,{avoid:[[-9,-706,9,-684]]});grass(-22,-730,-10,zG,yTop);grass(10,-730,22,zG,yTop);
  deco(-8,yTop+0.05,-704,8,yTop+0.12,-686,3);deco(-5,yTop+0.12,-703,-3,yTop+0.2,-687,0);deco(3,yTop+0.12,-703,5,yTop+0.2,-687,0);deco(-3,yTop+0.12,-696,3,yTop+0.2,-694,0);
  for(const[x,z]of[[-22,-730],[21.4,-730],[-22,-660.6],[21.4,-660.6]])deco(x,yTop,z,x+0.6,yTop+14,z+0.6,2);
  CP.push({p:[0,yTop+0.05,-690]});floorText(['#HALFWAY','THE CRANE YARD IS NEXT'],0,yTop,-676,14);
  // ===== 9. crane yard: a girder across the void, then slide gaps and a taller wall-jump shaft =====
  const yJ=yTop;rf(-12,-762,12,-738,yJ,330,{});
  deco(-3,yJ,-760,3,yJ+46,-754,8);deco(-2,yJ+44,-830,2,yJ+46.4,-760,8);for(let z=-762;z>-830;z-=6){deco(-1.8,yJ+43,z-3,-1.6,yJ+44,z,8);deco(1.6,yJ+43,z-3,1.8,yJ+44,z,8)}deco(-4,yJ+38,-766,4,yJ+44,-762,2);
  blk(-1.3,yJ-0.6,-818,1.3,yJ,-762,2);for(let z=-816;z<-764;z+=8)deco(-1.3,yJ-1.6,z,1.3,yJ-0.6,z+.4,8);for(const z of[-790,-806])deco(-1.4,yJ,z,1.4,yJ+.08,z+.3,3);
  test('G>J1',[0,yJ,-732],0,[-12,12,-762,-738,yJ]);test('J1>girder>J2',[0,yJ,-760],0,[-12,12,-906,-826,yJ+3],{secs:9});
  const yJ2=yJ+3;rf(-12,-906,12,-826,yJ2,331,{avoid:[[-12,-866,12,-852],[-12,-906,12,-886]]});CP.push({p:[0,yJ2+0.05,-832]});
  test('girder>J2',[0,yJ,-816],0,[-12,12,-906,-826,yJ2]);
  wallX(-11.4,11.4,-860,yJ2,yJ2+5,0.6,[[-3,3,yJ2,yJ2+1.3]]);blk(-11.4,yJ2,-860.3,-3.4,yJ2+1.4,-859.7,2);
  blk(-12,yJ2,-906,-2.5,yJ2+11.5,-894,5);blk(2.5,yJ2,-906,12,yJ2+9.5,-894,5);
  const yJ3=yJ2+9.5;rf(0,-952,14,-914,yJ3,332,{avoid:[[0,-952,14,-934]]});CP.push({p:[7,yJ3+0.05,-920]});
  test('shaftR>J3',[6,yJ3,-900],0,[0,14,-952,-914,yJ3]);
  // ===== 10. the atrium: a tall dead office, climbed on floating slabs, out of a window onto a tram =====
  const y0H=yJ3,hH=16;office(-24,-1000,24,-958,y0H,hH,{front:[[-5,5,y0H,y0H+3.6]],back:[[-4,4,y0H+9.6,y0H+13.2]]});officeKit(-24,-1000,24,-958,y0H,hH,304,{keep:6});fins(-24,-1000,24,-958,y0H,44,{z:false});
  CP.push({p:[0,y0H+0.05,-962]});
  for(const x of[-18,-12,12,18])column(x,-968,y0H,hH,0.6);
  blk(-4.5,y0H,-974,-2.5,y0H+1.5,-971.5,2);blk(-12,y0H+2.6,-980,-5,y0H+3.2,-970,0);blk(5,y0H+5.8,-990,12,y0H+6.4,-981,0);blk(-6,y0H+9,-999.4,6,y0H+9.6,-993,0);
  for(const[x1,z1,x2,z2,y]of[[-12,-980,-5,-970,y0H+2.6],[5,-990,12,-981,y0H+5.8],[-6,-999.4,6,-993,y0H+9]])for(const[x,z]of[[x1+.3,z1+.3],[x2-.6,z2-.6]])deco(x,y0H,z,x+.3,y,z+.3,2);
  floorText(['#CLIMB THE SLABS','THEN OUT THE WINDOW'],0,y0H,-965,14);
  test('H>P1',[-3.6,y0H+1.5,-972.7],ya(-1,0),[-12,-5,-980,-970,y0H+3.2],{mantle:1});test('P1>P2',[-8.5,y0H+3.2,-978],ya(14,-8),[5,12,-990,-981,y0H+6.4]);test('P2>P3',[8.5,y0H+6.4,-988],ya(-8,-9),[-6,6,-999.4,-993,y0H+9.6]);
  // ===== 11. the tram: a platform that rides a cable across the gap to the next roof =====
  const yTr=y0H+9.6,tr=mover(-5,yTr-0.5,-1008,5,yTr,-1002,8,'z',0,-50,26,0,0.12);
  {const cz=-1005,kid=(x1,y1,z1,x2,y2,z2,t)=>{const k=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);k.position.set((x1+x2)/2,(y1+y2)/2-(yTr-.25),(z1+z2)/2-cz);tr.mesh.add(k)};
   kid(-5,yTr,-1008,-4.8,yTr+1.1,-1002,2);kid(4.8,yTr,-1008,5,yTr+1.1,-1002,2);kid(-5,yTr,-1008,5,yTr+1.1,-1007.8,2);kid(-5,yTr+1,-1008,5,yTr+1.1,-1007.8,3)}
  deco(-4,yTr-.35,-1002,4,yTr,-1000,0);
  deco(-.1,yTr+7.4,-1062,.1,yTr+7.6,-996,8);deco(-.1,yTr+9.4,-1062,.1,yTr+9.6,-996,8);for(let z=-1000;z>-1062;z-=6)deco(-.1,yTr+7.6,z,.1,yTr+9.4,z-.1,8);
  const yK=yTr;rf(-14,-1126,14,-1062,yK,340,{});fins(-14,-1126,14,-1062,yK,40,{z:false});CP.push({p:[0,yK+0.05,-1070]});
  test('tram>K',[0,yK,-1056],0,[-14,14,-1126,-1062,yK]);
  // ===== 12. second tube bridge (glass, floor gaps, a shutter to slide under) then the last scaffold =====
  const zq1=-1126,zq2=-1214;
  blk(-4,yK-3,-1150,4,yK,zq1,0);blk(-4,yK-3,-1182,4,yK,-1158,0);blk(-4,yK-3,zq2,4,yK,-1190,0);
  wallZ(zq2,zq1,-4.3,yK-3,yK+5,0.6,wins(zq2+2,zq1-2,12,3.6,yK,1.2,3.6));wallZ(zq2,zq1,4.3,yK-3,yK+5,0.6,wins(zq2+2,zq1-2,12,3.6,yK,1.2,3.6));
  blk(-4.6,yK+5,zq2,4.6,yK+5.9,zq1,0);for(let z=-1134;z>zq2;z-=10)lamp(0,yK+5,z,2,0.5);blk(-4,yK+1.3,-1170,4,yK+5,-1169,2);blk(-4,yK+1.3,-1200,4,yK+5,-1199,3);
  INT.push({x1:-5,x2:5,z1:zq2,z2:zq1,y0:yK-1,y1:yK+6});
  test('K>tube1',[0,yK,-1124],0,[-4,4,-1182,-1158,yK]);test('tube2',[0,yK,-1180],0,[-4,4,zq2,-1190,yK]);
  const yM=yK;rf(-16,-1270,16,zq2,yM,341,{});fins(-16,-1270,16,zq2,yM,40,{z:false});CP.push({p:[0,yM+0.05,-1220]});
  const zF=-1282,nF=14;scaffold(zF,yM,nF,3,'scafF');CP.push({p:[-5.5,yM+0.05,zF+3.5]});test('M>scafF',[-3.5,yM,-1272],0,[-9,-2,zF,zF+7,yM]);
  const yEnd=yM+3*(nF-1);rf(-22,-1350,22,zF,yEnd,342,{avoid:[[-10,-1330,10,-1302]]});grass(-22,-1350,-10,zF,yEnd);grass(10,-1350,22,zF,yEnd);
  deco(-8,yEnd+0.05,-1324,8,yEnd+0.12,-1306,3);deco(-5,yEnd+0.12,-1323,-3,yEnd+0.2,-1307,0);deco(3,yEnd+0.12,-1323,5,yEnd+0.2,-1307,0);deco(-3,yEnd+0.12,-1316,3,yEnd+0.2,-1314,0);
  for(const[x,z]of[[-22,-1350],[21.4,-1350],[-22,-1282.6],[21.4,-1282.6]])deco(x,yEnd,z,x+0.6,yEnd+14,z+0.6,2);
  floorText(['#YOU MADE IT','THE HELIPAD'],0,yEnd,-1300,14);
  Object.assign(GOAL,{x:0,y:yEnd,z:-1316});beacon(500)}

const LEVELS=[
  {id:1,name:'TUTORIAL',tag:'ABOVE THE CLOUDS',desc:'Learn every move one lesson at a time, with instructions painted on the roofs: jump, air jump, sprint, slide, mantle, wall jump, lifts and style. Finish with a scaffold climb to the beacon.',len:'650 M',build:buildL1},
  {id:2,name:'HOLLOW GRID',tag:'THE ABANDONED CITY',desc:'Twice as long as before. Scaffolding into dead offices, window-cleaner gondolas, a crane girder, an elevator-shaft wall jump, a tall atrium, a cable tram and two glass tube bridges up to the helipad.',len:'1350 M',build:buildL2}];
let LV=0;
function loadLevel(i){LV=i;LT.length=0;clearLevel();LEVELS[i].build();mergeLevel();rollEnv();stepMovers(0,true)}
