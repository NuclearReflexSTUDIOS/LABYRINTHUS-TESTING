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

// ---------- LEVEL 1 : ASCENT (short, above the clouds) ----------
function buildL1(){
  CLOUDS.visible=true;skyline(11,110,-390,80,100,120,590,-10,-150);
  CP.push({p:[0,0.05,8]},{p:[0,5.05,-114]},{p:[-37,21.55,-189]},{p:[9,33.05,-250]});Object.assign(GOAL,{x:8,y:75,z:-282});
  // neighbouring slabs (visual only)
  for(const[x1,z1,x2,z2,top]of[[-92,-70,-60,-40,18],[-100,-160,-64,-120,44],[-96,-260,-62,-228,12],[-84,-340,-52,-300,96],[40,-80,72,-44,12],[46,-146,78,-110,40],[40,-210,72,-176,26],[44,-300,78,-262,60],[-30,-330,-6,-306,118],[30,-340,54,-312,108],[-100,10,-62,50,30],[48,-10,84,28,50]]){
    deco(x1,BASEY,z1,x2,top,z2,5);deco(x1,top,z1,x2,top+0.6,z2,0)}
  // 1. start roof: pool, mantle steps, parkour ledges, slide tunnel
  tower(-24,-34,24,14,0,[8,-30,20,-18]);
  blk(-24,0,12.8,24,1.2,14,0);blk(-24,0,-34,-22.8,1.2,12.8,0);blk(22.8,0,-34,24,1.2,12.8,0);
  blk(-21,0,-8,-17,0.9,-4);blk(-16,0,-8,-12,1.4,-4);blk(-11,0,-8,-7,1.9,-4);
  blk(-22,0,-14,-18,1.6,-10,3);blk(-22,0,-18,-18,3.4,-14,3);blk(-22,0,-22,-18,5.2,-18,3);blk(-23,0,-28,-14,7,-22,1);
  blk(12,0,-10,13,3.3,0,1);blk(19,0,-10,20,3.3,0,1);blk(12,1.3,-10,20,1.6,0,3);blk(12,1.6,-10,20,3.3,0,1);
  blk(-9,0,3,-5,1.3,7,2);blk(6,0,3,10,1.3,7,2);blk(21,0,10,22,14,11,2);
  grass(-4,-33,4,-8,0);bush(-20,0,11,1.4);bush(-17.5,0,11.5,1);bush(20,0,-30,1.3);
  // 2. roof hop
  tower(-9,-52,9,-42,1.5);blk(-1,1.5,-48,1,2.7,-46,3);grass(-9,-52,-5,-42,1.5);
  tower(-8,-68,8,-58,3.5);blk(3,3.5,-66,7,5,-62,2);bush(-6,3.5,-60,1.1);
  // 3. the beam, then a 16m dash gap
  tower(-2.5,-96,2.5,-72,5);
  // 4. wall-jump shaft between two towers (5m wide, 11m climb) -> mantle onto the right wall top
  tower(-10,-138,10,-112,5);blk(-10,5,-138,-2.5,16.5,-126,5);blk(2.5,5,-138,10,14.5,-126,5);
  // 5. skybridge tower: low slide canopy, then up a floor
  tower(0,-170,14,-146,14.5);blk(0,14.5,-166,1,18,-158,2);blk(13,14.5,-166,14,18,-158,2);blk(1,15.8,-166,13,18,-158,3);blk(5,14.5,-152,9,15.7,-150,1);
  tower(-12,-196,4,-176,18);bush(2,18,-194,1.2);grass(-12,-196,-4,-176,18);
  // 6. checkpoint garden tower with a pool, and a second wall-jump shaft
  tower(-40,-232,-18,-186,21.5,[-35,-206,-25,-196]);blk(-40,21.5,-232,-31.5,33.5,-218,5);blk(-26.5,21.5,-232,-18,31,-218,5);
  bush(-39.2,21.5,-187.2,1.2);bush(-20,21.5,-188,1.1);grass(-40,-232,-18,-208,21.5);
  // 7. dash street
  tower(-30,-262,-14,-240,31);tower(2,-262,16,-244,33);blk(7,33,-256,11,34.4,-252,2);
  // 8. the spiral: balconies winding up the central megatower
  for(let i=1;i<=17;i++){const a=(i-1)*Math.PI/4,x=8+11.5*Math.sin(a),z=-282+11.5*Math.cos(a),top=33+2.5*i;sl(x-2.5,z-2.5,x+2.5,z+2.5,top,i%3===0?3:0);deco(x-0.5,top-70,z-0.5,x+0.5,top-3,z+0.5,2)}
  tower(3,-287,13,-277,75);blk(7,75,-283,9,77,-281,3);
  for(const[x,z]of[[3,-287],[12.4,-287],[3,-277.6],[12.4,-277.6]])deco(x,75,z,x+0.6,90+x*0.2,z+0.6,2);
  // tests
  test('r0r1',[0,0,-33],0,[-9,9,-52,-42,1.5]);test('r1r2',[3,1.5,-44],0,[-8,8,-68,-58,3.5]);test('r2r3',[0,3.5,-70],0,[-2.5,2.5,-96,-72,5]);test('r3r4',[0,5,-94],0,[-10,10,-138,-112,5]);
  test('r5r6',[2,14.5,-168],0,[-12,4,-196,-176,18]);test('r6r7',[-2,18,-190],1.5708,[-40,-18,-232,-186,21.5]);test('r8r9d',[-16,31,-250],-1.5708,[2,16,-262,-244,33],{dash:40});
  const g=new THREE.Mesh(new THREE.BoxGeometry(0.8,6,0.8),new THREE.MeshBasicMaterial({color:0xb6ff4a}));g.position.set(GOAL.x,GOAL.y+3,GOAL.z);LVL.add(g);
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,300,8,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:0.35,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));bm.position.set(GOAL.x,GOAL.y+150,GOAL.z);bm.userData.keep=true;LVL.add(bm)}

// ---------- LEVEL 2 : HOLLOW GRID (3x longer: roofs, scaffolding, office interiors, gondolas, a tube bridge) ----------
function buildL2(){
  CLOUDS.visible=false;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);
  skyline(23,170,-1250,150,70,160,950,0,-420);
  for(let z=-60;z>-700;z-=85){const r=rng(z);for(const sx of[-1,1]){const w=24+r()*22,x1=sx>0?46+r()*8:-46-r()*8-w,top=20+r()*150;deco(x1,BASEY,z-w,x1+w,top,z,5);deco(x1,top,z-w,x1+w,top+0.6,z,0)}}
  // ===== 1. start roof: an abandoned construction site =====
  tower(-22,-46,22,12,0,[-18,-30,-8,-20]);
  blk(-22,0,10.8,22,1.2,12,0);blk(-22,0,-46,-20.8,1.2,10.8,0);blk(20.8,0,-46,22,1.2,10.8,0);
  CP.push({p:[0,0.05,6]});
  blk(12,0,2,17,2.5,7,2);deco(14,2.5,4,15,36,5,8);deco(-26,35,3.5,16,36,5.5,8);deco(-26,31,4,-25.4,35,5,2);       // crane base, mast, jib
  grass(6,-45,21,-31,0);grass(-21,-9,-12,9,0);bush(10,0,-38,1.3);bush(17,0,-36,1);bush(-20,0,0,1.2);
  blk(-6,0,-42,6,0.6,-38,9);blk(-4,0,-46,4,1.2,-42,9);for(let i=0;i<5;i++)REBAR(-20+i*1.3,0,-44,3.4+i*0.5);
  tower(-10,-65,10,-55,2);tower(-6,-81,6,-73,3.5);grass(-10,-65,-4,-55,2);blk(3,2,-63,6,3.2,-60,3);
  blk(-5,3.0,-111,-2,3.5,-81,2);for(let z=-106;z<-84;z+=6)deco(-3.7,-8,z,-3.3,3.0,z+0.3,8);                          // steel I-beam over the void
  test('R0->R1',[0,1.2,-44.5],0,[-10,10,-65,-55,2]);test('R1->R2',[0,2,-57],0,[-6,6,-81,-73,3.5]);test('R2->beam',[-3.5,3.5,-75],0,[-5,-2,-111,-81,3.5]);
  // ===== 2. scaffold climb up tower A, then into its office =====
  const zA=-124,y0A=25.5;
  scaffold(zA,4.5,8,3,'scafA');test('beam->scafA',[-3.5,3.5,-109],0,[-9,-2,zA,zA+7,4.5]);CP.push({p:[5,y0A+0.05,zA-6]});
  const A=office(-24,-184,24,zA,y0A,5.6,{front:[[0,9,y0A,y0A+3.4]],back:[[-5,5,y0A,y0A+3.4]]});
  for(const x of[-20,-17,-14,-11,11,14,17,20])desk(x,-131,y0A);
  for(const z of[-150,-166])for(const x of[-9,9])column(x,z,y0A,5.6);
  wallX(-23.4,23.4,-142,y0A,y0A+5.6,0.6,[[-3,3,y0A,y0A+1.3],[9,12,y0A,y0A+2.8]]);blk(9,y0A,-142.3,12,y0A+1.4,-141.7,9);     // slide gap + crate-blocked door
  blk(-20,y0A+2.3,-174,20,y0A+2.8,-158,2);deco(-20,y0A+2.8,-158.2,20,y0A+3.8,-158,8);for(let x=-20;x<=20;x+=4)deco(x,y0A,-174,x+0.2,y0A+2.3,-173.8,8);       // mezzanine
  for(let i=0;i<4;i++)desk(-18+i*2.6,-178,y0A);
  grass(-20,-184,20,-178,A.roof);
  // ===== 3. window-cleaner gondola up to tower B's garden terrace =====
  const yB=39.5;
  gondola(0,-189.8,-184.3,y0A,yB-y0A,18,yB+8);
  tower(-18,-250,18,-197.5,yB,[-16,-246,-6,-234]);grass(2,-250,18,-197.5,yB);grass(-18,-232,-6,-197.5,yB);
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
  CP.push({p:[0,y0C+0.05,-272]});
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
  const yD=yT;tower(-16,-440,16,zT2,yD);CP.push({p:[0,yD+0.05,-414]});
  blk(-14,yD,-432,-13,yD+3,-422,2);blk(13,yD,-432,14,yD+3,-422,2);blk(-13,yD+1.3,-432,13,yD+3,-422,3);blk(8,yD,-418,12,yD+1.5,-415,2);
  grass(-16,-418,-6,zT2,yD);bush(-14,yD,-410,1.3);bush(14,yD,-412,1.1);deco(-15,yD,-438,-9,yD+5,-433,2);
  tower(-8,-460,8,-449,yD+3);tower(-6,-476,6,-468,yD+6);grass(-8,-460,8,-454,yD+3);blk(-1.5,yD+5.5,-506,1.5,yD+6,-476,2);
  const yE=yD+8;tower(-12,-536,12,-524,yE);
  test('D->E1',[0,yD,-438],0,[-8,8,-460,-449,yD+3]);test('E1->E2',[0,yD+3,-451],0,[-6,6,-476,-468,yD+6]);test('beam->E3 dash',[0,yD+6,-504],0,[-12,12,-536,-524,yE],{dash:45,secs:5});
  // ===== 7. second gondola (20m) into tower F: server hall =====
  const y0F=yE+20;
  gondola(0,-547,-541.5,yE,20,22,88,0.1);
  office(-24,-618,24,-553,y0F,5.6,{front:[[-6,6,y0F,y0F+3.4]],back:[[-6,6,y0F,y0F+3.4]]});CP.push({p:[0,y0F+0.05,-558]});
  for(const z of[-586,-602])for(const sx of[-1,1])blk(sx>0?5:-7,y0F,z,sx>0?7:-5,y0F+2.4,z+4,2);
  wallX(-23.4,23.4,-576,y0F,y0F+5.6,0.6,[[-3,3,y0F,y0F+1.3]]);wallX(-23.4,23.4,-610,y0F,y0F+5.6,0.6,[[-3,3,y0F,y0F+1.3],[9,12,y0F,y0F+2.8]]);blk(9,y0F,-610.3,12,y0F+1.4,-609.7,9);
  blk(-8,y0F+2.5,-606,8,y0F+3,-592,2);
  for(const px of[-6,6])deco(px-0.3,y0F+5.6+0.9,-553.8,px+0.3,88.3,-553.2,8);deco(-6.3,88,-553.8,6.3,88.3,-541,8);      // davit over gondola 2
  // ===== 8. last climb: scaffolding up the final tower to the helipad =====
  const yH=y0F+2;tower(-9,-632,3,-625,yH);tower(-9,-646,3,-639,yH+0.5);
  const zG=-660,nG=17,y0G=yH+3.5;
  scaffold(zG,y0G,nG,3,'scafG');CP.push({p:[-5.5,y0G+0.05,zG+3.5]});
  test('F->H1',[0,y0F,-616],0,[-9,3,-632,-625,yH]);test('H1->H2',[-3,yH,-627],0,[-9,3,-646,-639,yH+0.5]);test('H2->scafG',[-3,yH+0.5,-641],0,[-9,-2,zG,zG+7,y0G]);
  const yTop=y0G+3*(nG-1);tower(-22,-730,22,zG,yTop);grass(-22,-730,-10,zG,yTop);grass(10,-730,22,zG,yTop);
  deco(-8,yTop+0.05,-704,8,yTop+0.12,-686,3);deco(-5,yTop+0.12,-703,-3,yTop+0.2,-687,0);deco(3,yTop+0.12,-703,5,yTop+0.2,-687,0);deco(-3,yTop+0.12,-696,3,yTop+0.2,-694,0);
  for(const[x,z]of[[-22,-730],[21.4,-730],[-22,-660.6],[21.4,-660.6]])deco(x,yTop,z,x+0.6,yTop+14,z+0.6,2);
  Object.assign(GOAL,{x:0,y:yTop,z:-695});
  const g=new THREE.Mesh(new THREE.BoxGeometry(0.8,6,0.8),new THREE.MeshBasicMaterial({color:0xb6ff4a}));g.position.set(GOAL.x,GOAL.y+3,GOAL.z);LVL.add(g);
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,400,8,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:0.35,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));bm.position.set(GOAL.x,GOAL.y+200,GOAL.z);bm.userData.keep=true;LVL.add(bm)}

const LEVELS=[
  {id:1,name:'ASCENT',tag:'ABOVE THE CLOUDS',desc:'Concrete towers rising out of a sea of cloud. Learn the moves: sprint gaps, wall-jump shafts, mantles, a slide canopy and a spiral up the central megatower.',len:'300 M',build:buildL1},
  {id:2,name:'HOLLOW GRID',tag:'THE ABANDONED CITY',desc:'Three times the climb. Scaffolding into dead offices, window-cleaner gondolas, an elevator-shaft wall jump, a glass tube bridge and a final scaffold to the helipad.',len:'900 M',build:buildL2}];
let LV=0;
function loadLevel(i){LV=i;clearLevel();LEVELS[i].build();mergeLevel();rollEnv();stepMovers(0,true)}
