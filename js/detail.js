// Detail library: props, roof/office/building dressing, painted text. Everything here only adds meshes to the current level (LVL);
// "solid" pieces also register collision boxes. Random layout is seeded, so a level looks the same every time it loads.
const PM={};const pmt=(h,sc=.5)=>PM[h+'/'+sc]||(PM[h+'/'+sc]=cmat(h,CONC,sc));
const EMM={};const em=h=>EMM[h]||(EMM[h]=new THREE.MeshBasicMaterial({color:h}));
let DR=rng(1);const dseed=n=>{DR=rng(n*7919+13)};const rr=(a,b)=>a+(b-a)*DR();const rp=a=>a[(DR()*a.length)|0];
const V=(x1,y1,z1,x2,y2,z2,m)=>deco(x1,y1,z1,x2,y2,z2,0,m);                                    // visual-only box with any material
function SB(x1,y1,z1,x2,y2,z2,m){const b=blk(x1,y1,z1,x2,y2,z2,0);LVL.children[LVL.children.length-1].material=m;return b}   // solid box with any material
function rbox(cx,cy,cz,w,h,d,rx,ry,rz,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(cx,cy,cz);o.rotation.set(rx,ry,rz);LVL.add(o);return o}
function cyl(cx,y,cz,r,h,m,seg=10,r2){const o=new THREE.Mesh(new THREE.CylinderGeometry(r2===undefined?r:r2,r,h,seg),m);o.position.set(cx,y+h/2,cz);LVL.add(o);return o}
const C={gr:0xaeb2ae,dg:0x2b2f33,mg:0x6d7378,rust:0x8a5a3c,wh:0xe6e4dc,yel:0xdcae22,red:0xa5392a,tea:0x44606c,tan:0xb8a888,blu:0x3d5a80,org:0xe8672a};

// ---------- props (x,z = min corner, y = floor). c = collidable ----------
function ac(x,y,z,c){const m=pmt(C.gr),d=pmt(C.dg),w=1.8,h=1.2,t=1.2;(c?SB:V)(x,y,z,x+w,y+h,z+t,m);
  V(x+.1,y+h,z+.1,x+w-.1,y+h+.07,z+t-.1,d);cyl(x+w/2,y+h+.07,z+t/2,.42,.05,pmt(C.mg),8);for(let i=0;i<6;i++)V(x+.12+i*.28,y+.2,z+t,x+.16+i*.28,y+h-.2,z+t+.03,d);
  V(x+w,y+.25,z+.3,x+w+.4,y+.5,z+.55,pmt(C.mg));V(x-.05,y,z+.15,x+w+.05,y+.1,z+.2,d);V(x-.05,y,z+t-.2,x+w+.05,y+.1,z+t-.15,d)}
function acrow(x,y,z,c){for(let i=0;i<3;i++)ac(x+i*1.9,y,z,c);V(x,y+1.45,z+1.3,x+5.5,y+1.5,z+1.35,pmt(C.dg))}
function duct(x,y,z,len,c){const m=pmt(0x9ea2a2),d=pmt(C.dg);(c?SB:V)(x,y+.5,z,x+.9,y+1.2,z+len,m);for(let q=1;q<len;q+=2)V(x-.04,y+.46,z+q,x+.94,y+1.24,z+q+.12,d);
  for(let q=.4;q<len;q+=3)V(x+.1,y,z+q,x+.2,y+.5,z+q+.12,d),V(x+.7,y,z+q,x+.8,y+.5,z+q+.12,d);V(x,y+.5,z+len,x+.9,y+1.2,z+len+.04,d)}
function tank(x,y,z,c){const cx=x+1.6,cz=z+1.6,m=pmt(C.rust,.4),d=pmt(C.dg);for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])V(cx+dx*1.1-.1,y,cz+dz*1.1-.1,cx+dx*1.1+.1,y+1.8,cz+dz*1.1+.1,d);
  V(cx-1.3,y+1.6,cz-.06,cx+1.3,y+1.7,cz+.06,d);V(cx-.06,y+1.6,cz-1.3,cx+.06,y+1.7,cz+1.3,d);cyl(cx,y+1.8,cz,1.5,2.8,m,12);for(const q of[2.4,3.4])cyl(cx,y+q,cz,1.55,.1,d,12);
  cyl(cx,y+4.6,cz,1.5,.5,m,12,.3);V(cx+1.4,y+1.8,cz-.1,cx+1.6,y+4.2,cz+.1,d);if(c)SB(cx-1.1,y,cz-1.1,cx+1.1,y+1.8,cz+1.1,d)}
function crates(x,y,z,c){const t=pmt(0xa27b4c,.6),d=pmt(0x6b4f33,.6);const f=c?SB:V;f(x,y,z,x+1.2,y+1.2,z+1.2,t);f(x+1.2,y,z+.1,x+2.3,y+1,z+1.2,d);f(x+.2,y+1.2,z+.1,x+1.1,y+2,z+1,d);
  for(const q of[0,1.2])V(x,y+.04+q*0,z-.02,x+1.2,y+.14,z+0,pmt(0x3b2d1d));rbox(x+1.7,y+1.04,z+.6,1.6,.06,1.3,0,.3,0,pmt(C.tea))}
function barrels(x,y,z,c){const cols=[C.blu,C.red,C.rust,C.tea];for(let i=0;i<3;i++){const bx=x+.5+i*.8,bz=z+.5+(i%2)*.7;cyl(bx,y,bz,.34,.9,pmt(rp(cols),.7),8);cyl(bx,y+.45,bz,.36,.06,pmt(C.dg),8);if(c)SB(bx-.3,y,bz-.3,bx+.3,y+.9,bz+.3,pmt(C.dg))}}
function chimney(x,y,z,c){const m=pmt(0xa5a8a2,.4);(c?SB:V)(x,y,z,x+1.2,y+3.4,z+1.2,m);V(x-.12,y+3.4,z-.12,x+1.32,y+3.6,z+1.32,pmt(C.dg));V(x-.05,y+1,z-.05,x+1.25,y+1.12,z+1.25,pmt(C.dg));V(x+.3,y+3.6,z+.3,x+.9,y+3.9,z+.9,pmt(C.mg))}
function hatch(x,y,z,c){const m=pmt(0xbab6a8,.4),d=pmt(C.dg);(c?SB:V)(x,y,z,x+2.6,y+2.5,z+2.8,m);V(x-.1,y+2.5,z-.1,x+2.7,y+2.62,z+2.9,pmt(C.mg));V(x+.6,y,z+2.8,x+1.9,y+2.1,z+2.86,d);V(x+.7,y+2.1,z+2.8,x+1.8,y+2.2,z+2.9,pmt(C.yel));
  V(x+2.6,y+1.4,z+.4,x+2.8,y+1.6,z+1.4,d);V(x-.02,y+.5,z+.4,x+.02,y+2,z+1.6,pmt(C.yel))}
function solar(x,y,z,c){const m=pmt(0x1f2c3d,.8),f=pmt(C.gr);for(let i=0;i<3;i++){const px=x+.2+i*1.6;rbox(px+.7,y+.75,z+1.2,1.5,.08,2.2,.5,0,0,m);V(px+.05,y,z+.3,px+.12,y+1,z+.4,f);V(px+1.35,y,z+.3,px+1.42,y+1,z+.4,f);V(px+.05,y,z+2.1,px+.12,y+.3,z+2.2,f);V(px+1.35,y,z+2.1,px+1.42,y+.3,z+2.2,f)}
  if(c)SB(x+.2,y,z+.2,x+4.9,y+.4,z+2.4,pmt(C.dg))}
function gen(x,y,z,c){(c?SB:V)(x,y,z,x+2.2,y+1.2,z+1.2,pmt(C.org,.5));V(x+.1,y+1.2,z+.1,x+1.2,y+1.45,z+1.1,pmt(C.dg));cyl(x+1.8,y+1.2,z+.6,.12,.9,pmt(C.dg),6);V(x+.05,y+.2,z+1.2,x+2.15,y+.9,z+1.23,pmt(C.dg));V(x+.2,y,z+.1,x+.5,y+.1,z+1.1,pmt(C.dg))}
function planter(x,y,z){V(x,y,z,x+3,y+.5,z+1,pmt(0x8d8a80));V(x+.1,y+.5,z+.1,x+2.9,y+.62,z+.9,pmt(0x4b3a2a));for(let i=0;i<5;i++)bush(x+.4+i*.55,y+.4,z+.5,.35+DR()*.25)}
function antenna(x,y,z,h=9){const d=pmt(C.mg),w=pmt(C.wh);V(x+.4,y,z+.4,x+.6,y+h,z+.6,d);for(let q=2;q<h;q+=2.6){V(x-.4+(q%5)*.05,y+q,z+.46,x+1.4,y+q+.08,z+.54,d);V(x+.46,y+q-.2,z-.4,x+.54,y+q-.12,z+1.4,d)}
  cyl(x+.5,y+h*.55,z+1.2,.7,.12,w,10);V(x+.35,y+h,z+.35,x+.65,y+h+.3,z+.65,em(0xff2a18));V(x,y,z,x+1,y+.3,z+1,pmt(C.dg))}
function cones(x,y,z){for(let i=0;i<4;i++){const o=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,6),pmt(C.org));o.position.set(x+.4+(i%2)*1.2,y+.3,z+.4+(i>>1)*1.1);LVL.add(o);cyl(x+.4+(i%2)*1.2,y,z+.4+(i>>1)*1.1,.28,.04,pmt(C.dg),6)}
  V(x,y+.6,z+.5,x+2,y+.9,z+.6,pmt(C.yel));V(x+.1,y,z+.45,x+.2,y+.9,z+.65,pmt(C.dg));V(x+1.8,y,z+.45,x+1.9,y+.9,z+.65,pmt(C.dg))}
function pipes(x,y,z,len){const m=pmt(0xa8a49a),b=pmt(C.dg);V(x,y+.4,z,x+.5,y+.9,z+len,m);V(x+.6,y+.35,z,x+1,y+.7,z+len,pmt(C.rust));for(let q=.5;q<len;q+=2.2)V(x-.05,y,z+q,x+1.05,y+.08,z+q+.1,b),V(x,y,z+q,x+.1,y+.5,z+q+.1,b),V(x+.9,y,z+q,x+1,y+.4,z+q+.1,b)}
function pallets(x,y,z,c){const t=pmt(0x9c7a4a,.6);for(let i=0;i<3;i++){V(x,y+i*.25,z,x+1.6,y+i*.25+.12,z+1.2,t);V(x,y+i*.25+.12,z+.1,x+1.6,y+i*.25+.25,z+.25,t);V(x,y+i*.25+.12,z+.95,x+1.6,y+i*.25+.25,z+1.1,t)}
  rbox(x+.8,y+.95,z+.6,1.7,.04,1.4,.2,.1,-.15,pmt(C.blu));if(c)SB(x,y,z,x+1.6,y+.75,z+1.2,pmt(0x6b4f33))}
function dish(x,y,z){V(x+.45,y,z+.45,x+.55,y+1.6,z+.55,pmt(C.mg));const o=new THREE.Mesh(new THREE.SphereGeometry(1,10,6,0,6.283,0,1.1),pmt(C.wh));o.position.set(x+.5,y+2.1,z+.5);o.rotation.set(-1.0,0.5,0);LVL.add(o)}
function dumpster(x,y,z,c){(c?SB:V)(x,y+.2,z,x+2.4,y+1.3,z+1.2,pmt(0x3d6b4f,.6));V(x-.05,y+1.3,z-.05,x+2.45,y+1.4,z+1.25,pmt(C.dg));for(const q of[.3,2])V(x+q,y,z+.1,x+q+.15,y+.2,z+.25,pmt(C.dg)),V(x+q,y,z+.95,x+q+.15,y+.2,z+1.1,pmt(C.dg))}
function lamppost(x,y,z){V(x+.45,y,z+.45,x+.55,y+5,z+.55,pmt(C.dg));V(x+.5,y+4.9,z+.5,x+1.6,y+5,z+.6,pmt(C.dg));V(x+1.3,y+4.82,z+.4,x+1.8,y+4.9,z+.7,LAMPM)}
function turbine(x,y,z){V(x+.4,y,z+.4,x+.6,y+1.2,z+.6,pmt(C.mg));cyl(x+.5,y+1.2,z+.5,.45,.5,pmt(C.gr),10);const o=new THREE.Mesh(new THREE.ConeGeometry(.5,.45,10),pmt(C.gr));o.position.set(x+.5,y+1.95,z+.5);LVL.add(o)}
function bench(x,y,z){V(x,y+.4,z,x+1.8,y+.48,z+.5,pmt(0x9c7a4a,.6));V(x,y+.5,z+.45,x+1.8,y+.9,z+.5,pmt(0x9c7a4a,.6));V(x+.1,y,z+.1,x+.2,y+.4,z+.4,pmt(C.dg));V(x+1.6,y,z+.1,x+1.7,y+.4,z+.4,pmt(C.dg))}
const PROPS=[['dumpster',2.5,1.3],['lamppost',1.8,1],['turbine',1,1],['bench',1.8,.6],['turbine',1,1],['bench',1.8,.6],['ac',1.8,1.3],['ac',1.8,1.3],['acrow',5.6,1.4],['duct',1,0],['tank',3.2,3.2],['crates',2.4,2.4],['barrels',2,1.6],['chimney',1.4,1.4],['hatch',2.8,3],['solar',5,2.4],['gen',2.3,1.3],['planter',3,1],['antenna',1,1],['cones',2.1,1.6],['pipes',1,0],['pallets',1.7,1.3],['dish',1,1]];
function putProp(k,x,y,z,len,c){switch(k){case'ac':ac(x,y,z,c);break;case'acrow':acrow(x,y,z,c);break;case'duct':duct(x,y,z,len,c);break;case'tank':tank(x,y,z,c);break;case'crates':crates(x,y,z,c);break;case'barrels':barrels(x,y,z,c);break;
  case'chimney':chimney(x,y,z,c);break;case'hatch':hatch(x,y,z,c);break;case'solar':solar(x,y,z,c);break;case'gen':gen(x,y,z,c);break;case'planter':planter(x,y,z);break;case'antenna':antenna(x,y,z,rr(6,11));break;case'cones':cones(x,y,z);break;case'pipes':pipes(x,y,z,len);break;case'pallets':pallets(x,y,z,c);break;case'dish':dish(x,y,z);break;case'dumpster':dumpster(x,y,z,c);break;case'lamppost':lamppost(x,y,z);break;case'turbine':turbine(x,y,z);break;case'bench':bench(x,y,z);break}}

// ---------- surface grime (flat decals) ----------
function grime(x1,z1,x2,z2,y,seed,n=20,sz=3){dseed(seed);const cols=[0x8d8f8a,0x7e807b,0xa7a9a3,0x6f716d,0x9a948a];
  for(let i=0;i<n;i++){const w=rr(.4,sz),d=rr(.4,sz),x=rr(x1,x2-w),z=rr(z1,z2-d);V(x,y+.012+i*.0004,z,x+w,y+.02+i*.0004,z+d,pmt(rp(cols),.8))}
  for(let i=0;i<n*.6;i++){const x=rr(x1,x2-2),z=rr(z1,z2-2),h=DR()<.5;V(x,y+.03,z,h?x+rr(.8,3):x+.04,y+.05,h?z+.04:z+rr(.8,3),pmt(0x2a2c2e,1))}                               // cracks
  for(let i=0;i<n*.25;i++){const w=rr(.8,2.2),d=rr(.6,1.6),x=rr(x1,x2-w),z=rr(z1,z2-d);V(x,y+.035,z,x+w,y+.05,z+d,pmt(0x2b3a45,1))}                                              // puddles / oil
  for(let i=0;i<n*.5;i++){const x=rr(x1,x2),z=rr(z1,z2);V(x,y+.06,z,x+.25,y+.065,z+.35,pmt(DR()<.5?0xe9e6dc:0xd8d3c2,1))}}                                                         // litter / paper
function drain(x,y,z){V(x,y+.02,z,x+.9,y+.05,z+.9,pmt(C.dg));for(let i=0;i<5;i++)V(x+.08+i*.17,y+.05,z+.05,x+.14+i*.17,y+.07,z+.85,pmt(C.mg))}
// roof dressing: raised lip, expansion joints, grime, drains, and props along the two side strips (never in the middle, so the running line stays clear)
function roofKit(x1,z1,x2,z2,top,seed,o={}){dseed(seed);const W=x2-x1,D=z2-z1,lip=pmt(0x8f918c,.4);
  if(!o.noLip){V(x1,top,z1,x2,top+.2,z1+.35,lip);V(x1,top,z2-.35,x2,top+.2,z2,lip);V(x1,top,z1,x1+.35,top+.2,z2,lip);V(x2-.35,top,z1,x2,top+.2,z2,lip)}
  for(let z=z1+6;z<z2-2;z+=rr(5,8))V(x1+.4,top+.012,z,x2-.4,top+.022,z+.07,pmt(0x55585a,1));
  grime(x1+.4,z1+.4,x2-.4,z2-.4,top,seed*3+1,Math.round(W*D/22+4),Math.min(3.2,W/4));
  if(D>10)for(let i=0;i<Math.max(1,(D/18)|0);i++)drain(rp([x1+1,x2-2]),top,rr(z1+2,z2-3));
  const M=o.margin||Math.min(8,(W-8)/2);if(M<2.6||o.noProps)return;const used=(o.avoid||[]).slice(),n=o.n||Math.round(D/1.7)+2;
  for(let i=0;i<n*10&&n>0;i++){const[k,w,d0]=rp(PROPS);let len=0,d=d0;if(k==='duct'||k==='pipes'){len=rr(4,9);d=len}
    if(w>M-.2)continue;const left=DR()<.5,x=left?x1+.8+rr(0,M-w):x2-.8-w-rr(0,M-w),z=rr(z1+1.5,z2-d-1.5);if(z2-d-1.5<z1+1.5)continue;
    if(used.some(u=>x<u[2]&&x+w>u[0]&&z<u[3]&&z+d>u[1]))continue;used.push([x-.4,z-.4,x+w+.4,z+d+.4]);putProp(k,x,top,z,len,o.solid!==false);if(used.length-(o.avoid||[]).length>=n)break}
  for(let i=0;i<n*2;i++){const w=rr(.3,1.1),d=rr(.3,1.1),h=rr(.15,.7),left=DR()<.5,x=left?x1+.6+rr(0,M-w):x2-.6-w-rr(0,M-w),z=rr(z1+1,z2-d-1);
    if(used.some(u=>x<u[2]&&x+w>u[0]&&z<u[3]&&z+d>u[1]))continue;V(x,top,z,x+w,top+h,z+d,pmt(rp([0xa0a39e,0x7d8185,0xb3a58a,0x6a7075,0x8a6a55]),.8));if(DR()<.4)V(x+w*.2,top+h,z+d*.2,x+w*.8,top+h+.05,z+d*.8,pmt(C.dg))}}

// ---------- buildings ----------
// ribs hanging off the long faces of a tower (visual only) so the facades read as architecture instead of flat boxes
function fins(x1,z1,x2,z2,top,depth=30,o={}){const f=pmt(0xb9bab4,.3),e=pmt(0xa3a5a0,.3),w=x2-x1,d=z2-z1;
  if(o.z!==false)for(let x=x1+1.6;x<x2-.8;x+=3.2){V(x-.16,top-depth,z1-.45,x+.16,top-.2,z1,f);V(x-.16,top-depth,z2,x+.16,top-.2,z2+.45,f)}
  if(o.x!==false)for(let z=z1+1.6;z<z2-.8;z+=3.2){V(x1-.45,top-depth,z-.16,x1,top-.2,z+.16,f);V(x2,top-depth,z-.16,x2+.45,top-.2,z+.16,f)}
  for(let y=top-3.8;y>top-depth;y-=3.8*(o.sp||2)){if(o.z!==false){V(x1-.25,y,z1-.25,x2+.25,y+.22,z1,e);V(x1-.25,y,z2,x2+.25,y+.22,z2+.25,e)}if(o.x!==false){V(x1-.25,y,z1,x1,y+.22,z2,e);V(x2,y,z1,x2+.25,y+.22,z2,e)}}}
// a background slab (no collision): facade + fins + crown with mechanical penthouse, antennas, tanks, red aircraft lights
function slab(x1,z1,x2,z2,top,seed,o={}){dseed(seed);const W=x2-x1,D=z2-z1;deco(x1,BASEY,z1,x2,top,z2,5);deco(x1,top,z1,x2,top+.6,z2,0);fins(x1,z1,x2,z2,top,Math.min(36,top-BASEY),{sp:3});
  const pw=W*rr(.35,.55),pd=D*rr(.35,.55),px=x1+(W-pw)/2,pz=z1+(D-pd)/2,ph=rr(2.5,6);V(px,top+.6,pz,px+pw,top+.6+ph,pz+pd,pmt(0xa9aba6,.3));V(px-.2,top+.6+ph,pz-.2,px+pw+.2,top+.6+ph+.3,pz+pd+.2,pmt(C.mg));
  const r=rng(seed);for(let i=0;i<Math.min(4,(W/6)|0);i++){const x=x1+1+r()*(W-4),z=z1+1+r()*(D-3);if(x>px-2&&x<px+pw+.5&&z>pz-2&&z<pz+pd+.5)continue;ac(x,top+.6,z,false)}
  if(r()<.7)tank(x1+1.5,top+.6,z1+1.5);if(r()<.8)antenna(x2-2,top+.6,z2-2,rr(8,18));if(r()<.5)antenna(x1+2,top+.6,z2-2.5,rr(6,12));
  const lc=em(0xff2a18);for(const[x,z]of[[x1+.3,z1+.3],[x2-.6,z1+.3],[x1+.3,z2-.6],[x2-.6,z2-.6]])V(x,top+.6,z,x+.3,top+1,z+.3,lc);
  if(o.sign)sign(o.sign,(x1+x2)/2,top+ph+3,z2+.1,Math.min(W*.8,16),'+z',{bg:'#101214',bc:o.col||'#ff8a3d',board:true})}

// ---------- painted text ----------
const SIGNC={};
function signTex(lines,o){const key=lines.join('|')+(o.bg||'')+(o.col||'')+(o.bc||'');if(SIGNC[key])return SIGNC[key];
  const W=1024,LH=o.lh||112,H=lines.length*LH+(o.bg?48:24),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,W,H);g.strokeStyle=o.bc||o.col||'#fff';g.lineWidth=8;g.strokeRect(10,10,W-20,H-20)}
  g.textAlign='center';g.textBaseline='middle';
  lines.forEach((s,i)=>{let head=s[0]==='#';if(head)s=s.slice(1);let fs=head?(o.hs||104):(o.fs||80);g.font='bold '+fs+'px Impact,"Arial Black","Arial Narrow",sans-serif';
    while(g.measureText(s).width>W-70&&fs>20){fs-=4;g.font='bold '+fs+'px Impact,"Arial Black",sans-serif'}
    const y=(o.bg?24:12)+i*LH+LH/2;g.lineJoin='round';g.lineWidth=o.bg?0:12;if(!o.bg){g.strokeStyle='#0a0a0a';g.strokeText(s,W/2,y)}
    g.fillStyle=head?'#ff7a1f':(o.col||'#ffffff');g.fillText(s,W/2,y)});
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=4;
  return SIGNC[key]={t,r:H/W,m:new THREE.MeshBasicMaterial({map:t,alphaTest:.5,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}}
// sign(lines, centre, width, face): face = '+z' '-z' '+x' '-x' (wall facing that way) or 'up' (painted on a floor, reads from the -z direction). Lines starting with # are headings.
function sign(lines,cx,cy,cz,w,face='+z',o={}){const s=signTex(lines,o),h=w*s.r,g=new THREE.PlaneGeometry(w,h),p=new THREE.Mesh(g,s.m);p.position.set(cx,cy,cz);
  if(face==='-z')p.rotation.y=Math.PI;else if(face==='+x')p.rotation.y=Math.PI/2;else if(face==='-x')p.rotation.y=-Math.PI/2;else if(face==='up')p.rotation.x=-Math.PI/2;
  if(o.board){const t=.3,B=pmt(0x1a1c1e,.5),k=face==='-z'?-1:1;
    if(face==='+z'||face==='-z'){V(cx-w/2-.3,cy-h/2-.3,cz-t/2-(k<0?.0:0),cx+w/2+.3,cy+h/2+.3,cz+t/2,B);p.position.z=cz+k*(t/2+.03);
      if(o.legs!==false){const gy=o.ground===undefined?cy-h/2-3:o.ground;for(const lx of[cx-w/2+.4,cx+w/2-.4])V(lx-.12,gy,cz-.2,lx+.12,cy-h/2,cz+.2,pmt(C.dg))}}
    else{V(cx-t/2,cy-h/2-.3,cz-w/2-.3,cx+t/2,cy+h/2+.3,cz+w/2+.3,B);p.position.x=cx+(face==='+x'?1:-1)*(t/2+.03)}}
  LVL.add(p);return p}
// standing board on legs at the roof edge
const board=(lines,x,top,z,w,face='+z',o={})=>{w*=1.25;const d=Object.assign({bg:'#0f1113',bc:'#ff7a2e'},o);return sign(lines,x,top+3.6+w*signTex(lines,d).r/2,z,w,face,Object.assign(d,{board:true,ground:top}))};
const floorText=(lines,x,top,z,w,o={})=>sign(lines,x,top+.03,z,w,'up',o);
// what the player has to press (follows the current key bindings / touch layout)
function kn(a){if(TOUCH)return({mv:'LEFT THUMB',look:'RIGHT THUMB',jump:'JUMP BUTTON',dash:'SPRINT BUTTON',slide:'SLIDE BUTTON',reset:'HOLD CHECKPOINT',flash:'LIGHT BUTTON'})[a]||a.toUpperCase();
  if(a==='mv')return'W A S D';if(a==='look')return'MOUSE';return lab(S.binds[a])}

// ---------- offices ----------
function chair(x,y,z){const d=pmt(C.dg);V(x,y+.42,z,x+.5,y+.48,z+.5,d);V(x+.02,y+.48,z+.46,x+.48,y+1,z+.5,d);V(x+.22,y,z+.22,x+.28,y+.42,z+.28,pmt(C.mg));V(x,y,z+.2,x+.5,y+.05,z+.3,d);V(x+.2,y,z,x+.3,y+.05,z+.5,d)}
function cubicle(x,y,z,w=2.4,d=2.4){const m=pmt(0x7d8a8f,.8);V(x,y,z,x+.08,y+1.4,z+d,m);V(x,y,z,x+w,y+1.4,z+.08,m);V(x+w,y,z,x+w+.08,y+1.4,z+d*.6,m);V(x+.15,y+.74,z+.15,x+w-.2,y+.8,z+.8,pmt(0xb08a58));
  V(x+.6,y+.8,z+.3,x+1.1,y+1.2,z+.45,pmt(C.dg));V(x+.62,y+.85,z+.28,x+1.08,y+1.17,z+.3,em(0x7fd0a8));chair(x+.7,y,z+1);if(DR()<.5)V(x+1.4,y+.8,z+.3,x+1.9,y+.82,z+.7,pmt(0xe4e2da,1))}
function cabinet(x,y,z,w=1,solid){const m=pmt(0x888c8e,.6);(solid?SB:V)(x,y,z,x+w,y+1.4,z+.55,m);for(let i=0;i<4;i++)V(x+.08,y+.2+i*.33,z+.55,x+w-.08,y+.22+i*.33,z+.57,pmt(C.dg))}
function rack(x,y,z,facing=1){V(x,y,z,x+.9,y+2.2,z+1,pmt(0x23272b));const l=[0x46ff7a,0xff9a2a,0x46d4ff];for(let i=0;i<11;i++)for(let j=0;j<2;j++)if(DR()<.6)V(x+.15+j*.55,y+.2+i*.17,z+(facing>0?1:-.02),x+.2+j*.55,y+.24+i*.17,z+(facing>0?1.02:0),em(rp(l)))}
// ceiling, floor wear, wall fittings and scattered office clutter for an office from office(); keeps x in [-keep,keep] free of anything collidable (nothing here is solid)
function officeKit(x1,z1,x2,z2,y0,h,seed,o={}){dseed(seed);const top=y0+h,tile=em(0x66696a),dk=em(0x2e3133);
  for(let x=x1+1.2;x<x2-1;x+=2.4)V(x,top-.12,z1+.6,x+.06,top,z2-.6,tile);for(let z=z1+1;z<z2-.6;z+=2.4)V(x1+.6,top-.12,z,x2-.6,top,z+.06,tile);       // ceiling grid
  for(let z=z1+3;z<z2-2;z+=rr(9,13)){const dw=rr(.9,1.5);V(x1+.6,top-1.05,z,x2-.6,top-.1,z+dw,em(0x585b5c));for(let x=x1+4;x<x2-2;x+=5)V(x,top-1.12,z-.02,x+.15,top-.95,z+dw+.02,dk)}   // beams / ducts
  for(let i=0;i<Math.round((x2-x1)*(z2-z1)/70);i++){const x=rr(x1+1,x2-2),z=rr(z1+1,z2-2),w=rr(.8,1.2);V(x,top-.18,z,x+w,top-.1,z+w,pmt(0x74777a,1));if(DR()<.5)V(x+w*.4,y0+.03,z+w*.4,x+w*.4+.08,y0+.03+.04,z+w*.4+.08,pmt(0xdedcd2,1))}  // gaps in the ceiling and tiles on the floor
  for(let i=0;i<Math.round((x2-x1)*(z2-z1)/60);i++){const x=rr(x1+1.4,x2-1.4),y=rr(top-2.8,top-.4),z=rr(z1+1.4,z2-1.4);V(x,y,z,x+.04,top,z+.04,pmt(C.dg))}
  for(let z=z1+4;z<z2-3;z+=7.7)for(const sx of[x1+.6,x2-.6]){const y=y0+1.15+(DR()-.5)*.2,L=sx<x1+2;if(DR()<.55)V(L?sx:sx-.05,y,z,L?sx+.05:sx,y+.7,z+1,pmt(0xd4d0c2,1))}
  const keep=o.keep||4,fx=pmt(0x6a7a78,.6);for(let z=z1+2;z<z2-3;z+=rr(4.5,7)){for(const left of[true,false]){if(DR()<.75){const x=left?x1+.8:x2-3.2;cubicle(x,y0,z);if(DR()<.6)cubicle(left?x+2.6:x-2.6,y0,z+.2)}}}
  for(let i=0;i<Math.round((z2-z1)/4);i++){const left=DR()<.5;cabinet(left?x1+.7:x2-1.8,y0,rr(z1+2,z2-3),1,false)}
  for(let i=0;i<Math.round((z2-z1)/3);i++){chair(rr(x1+3,x2-3),y0,rr(z1+2,z2-2))}
  for(let i=0;i<Math.round((z2-z1)/22);i++)rack(rp([x1+.8,x2-1.8]),y0,rr(z1+3,z2-4),1);
  for(const sx of[x1+.62,x2-.62])for(let z=z1+5;z<z2-4;z+=rr(14,22)){V(sx-.02,y0+1.4,z,sx+.02,y0+2.8,z+2.2,pmt(0xe0ddd0,1));V(sx-.03,y0+1.5,z+.1,sx+.03,y0+1.8,z+1.2,pmt(0x2b3a45,1))}
  for(let i=0;i<4;i++){const x=rr(x1+2,x2-2),z=rr(z1+2,z2-3);V(x,y0+.5,z,x+.1,top-1.2,z+.1,pmt(C.dg));V(x-.3,y0,z-.3,x+.4,y0+.5,z+.4,pmt(0x6a4a30))}                                    // dead plants / stands
  const ex=em(0x40ff80);for(const[x,z]of[[x1+.65,z1+4],[x2-.65,z2-4]])V(x-.04,y0+3.6,z,x+.04,y0+4.1,z+.8,ex)}

// ---------- exterior bits ----------
// hanging window-cleaner rail, pipes and a ladder for a face of a tower (visual only)
function drops(x,z,top,n,face=1){dseed(Math.round(x*3+z));for(let i=0;i<n;i++){const y=top-rr(4,30);V(x+i*2.2,y,z,x+i*2.2+.12,y+rr(3,9),z+.12*face,pmt(C.dg))}}
// a strip of lit shop-style lettering for walls in the city ("abandoned" flavour text)
const TAGS=['FOR LEASE','VACANT','HOLLOW GRID','NUCLEAR RECOIL','R3CTRR313','NO ENTRY','ROOF ACCESS','DANGER','FLOOR 50','EXIT','KEEP CLEAR','OFFICE SPACE','CONDEMNED','STAIRS','MECH ROOM','LOADING','WATCH YOUR STEP'];
