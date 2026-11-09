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
  {const r=rng(41);for(let z=40;z>-760;z-=130+r()*40)for(const s of[-1,1])megaTower(s*(170+r()*50),z,50+r()*30,50+r()*30,220+r()*220,Math.round(-z)*s+11)}
  for(const[z,y,R]of[[-96,26,40],[-266,30,42],[-500,52,44]])gate(0,y,z,R,3.2);
  for(const[z,y]of[[-150,200],[-420,250],[-640,300]])skybridge(-230,230,z,y,12,12);
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
  const trx=(cx,z1,z2,top,seed)=>rf(cx-12,z1,cx+12,z2,top,seed,{});          // curved chain: each roof is shifted sideways so the route sweeps in an S
  trx(6,-520,-508,32.5,120);trx(13,-540,-526,34,121);trx(9,-560,-548,36,122);trx(2,-582,-568,36,123);trx(0,-600,-590,36,124);
  blk(15,34,-534,18,35.4,-533,2);blk(4,36,-576,8,37.2,-574,2);
  floorText(['#CHAIN IT','JUMP, SPRINT, SLIDE,','CLIMB, REPEAT'],0,32.5,-505,9);CP.push({p:[9,36.05,-552]});
  test('R9>C1',[2,32.5,-497],0,[-2,14,-520,-508,32.5]);test('C1>C2',[9,32.5,-511],0,[3,20,-540,-526,34]);test('C2>C3',[11,34,-529],0,[5,13,-560,-548,36]);
  test('C3>C4',[9,36,-551],0,[-6,10,-582,-568,36]);test('C4>C5',[2,36,-571],0,[-10,10,-600,-590,36]);
  // ===== 9. FINAL CLIMB: a spiral stair around THE SPINE, up to the beacon =====
  const SC={x:0,z:-622},H3=helix(SC.x,SC.z,20,36,105,0,1),hyt=H3.last.y;
  coreBox(SC.x,SC.z,140,hyt+12);for(let i=0;i<5;i++)gate(SC.x,40+i*(hyt-30)/4,SC.z,38+i*7,3,true,i%2?0xaee0ff:0xffa24a);
  CP.push({p:[0,36.05,-596]});board(['#LAST CLIMB','FOLLOW THE STAIR AROUND','THE SPINE TO THE BEACON'],-9,36,-596,8,'+z');
  rfs(-16,-694,16,-641,hyt,125,{noProps:true});
  test('C5>helix',[0,36,-593],0,[-15,15,-693,-642,hyt],{way:H3.way,secs:90});
  Object.assign(GOAL,{x:0,y:hyt,z:-672});beacon(420);
  floorText(['#TUTORIAL COMPLETE','NEXT: HOLLOW GRID'],0,hyt,-660,16)}

const LEVELS=[
  {id:1,tier:'blue',name:'TUTORIAL',tag:'ABOVE THE CLOUDS',desc:'Learn every move one lesson at a time, with instructions painted on the roofs: jump, air jump, sprint, slide, mantle, wall jump, lifts and style. Finish with a scaffold climb to the beacon.',len:'650 M',build:buildL1},
  {id:6,hidden:true,tier:'red',name:'TOWER',tag:'TOWER OF DEATH',desc:'Five stacked floors of pure obstacles, every floor running back the other way, joined by spiral stairs. No checkpoints. Fall off and you usually land on the floor below. Reach the top.',len:'5 FLOORS',build:()=>buildTower(TOWER)},
  {id:4,hidden:true,tier:'white',name:'HOLLOW GRID',tag:'THE ABANDONED CITY',desc:'Three huge sections, each a maze of branching lanes packed with obstacles: crumbling tiles, treadmills, launch pads, crossfire, cable spans and spiral climbs. Swap lanes over bridges, find the dead ends, reach the Crown.',len:'3 SECTIONS',secNames:['SCRAPYARD','THE HOLLOW','THE CROWN'],
   sections:[()=>buildSection(SECTIONS.scrap,0,false),()=>buildSection(SECTIONS.hollow,1,false),()=>buildSection(SECTIONS.crown,2,true)]}];
LEVELS.push({id:2,tier:'free',name:'GROUNDS',tag:'THE PLAYGROUND',desc:'No goal, no timer. Every obstacle in the game laid out in a row, plus bridges and a spiral. Warm up here.',len:'FREE ROAM',build:()=>buildGrounds()});
LEVELS.push({id:3,tier:'run',name:'DISTRICT RUN',tag:'DROP, LOOT, EXTRACT',desc:'A new district every drop. Search caches (dead ends hold the best), carry too much and you slow down. Call extraction, survive the charge, reach the beacon. Die and you lose everything you carry.',len:'15-25 MIN',run:true,build:()=>runBuild()});
LEVELS.push({id:99,hidden:true,tier:'blue',name:'TESTBED',desc:'',len:'',build:()=>buildTestbed()});   // dev only: bot test-bed for every module
let LV=0;
function loadLevel(i,sec=0){LV=i;SEC=sec;LT.length=0;clearLevel();const L=LEVELS[i];(L.sections?L.sections[sec]:L.build)();mergeLevel();buildGrid();rollEnv();stepMovers(0,true)}
let SEC=0;
