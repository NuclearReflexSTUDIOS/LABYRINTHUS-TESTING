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

