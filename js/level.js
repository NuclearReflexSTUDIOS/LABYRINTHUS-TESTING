// World: renderer, lights, sky, cloud sea, concrete + glass-facade shaders, water, bubbles, and the LABYRINTHUS skyscraper level.
let T=0;
const glc=$('gl');
const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:false});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const FOGC=0xc4e9f7,scene=new THREE.Scene();scene.background=new THREE.Color(FOGC);scene.fog=new THREE.Fog(FOGC,40,430);
const cam=new THREE.PerspectiveCamera(90,1,0.05,2000);cam.rotation.order='YXZ';scene.add(cam);
const SUN=new THREE.Vector3(0.45,0.4,-0.8).normalize();
scene.add(new THREE.HemisphereLight(0xd6f3ff,0x8fa4a8,0.62));
const dl=new THREE.DirectionalLight(0xfff3d8,0.8);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-0.0005;
const sc=dl.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=300;scene.add(dl,dl.target);
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- concrete texture, made with code (bright, cool, raw) ----
function makeConcrete(){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=rng(7);
  g.fillStyle='#d6dbdc';g.fillRect(0,0,128,128);
  for(let i=0;i<2600;i++){const v=170+r()*80|0;g.fillStyle='rgb('+v+','+v+','+(v+2)+')';g.fillRect(r()*128,r()*128,1+(r()*2|0),1)}
  for(let i=0;i<45;i++){g.fillStyle='rgba(60,70,74,'+(0.2+r()*0.3)+')';g.fillRect(r()*128,r()*128,1+(r()*2|0),1)}
  g.fillStyle='rgba(60,72,78,.55)';g.fillRect(0,0,128,2);g.fillRect(0,0,2,128);
  g.fillStyle='rgba(50,62,68,.5)';for(const x of[32,96])for(const y of[32,96])g.fillRect(x-1,y-1,3,3);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t}
const CONC=makeConcrete();
// triplanar (world-space) sampling so the texture never stretches on big blocks + height-based haze darkening
function cmat(hex){const m=new THREE.MeshLambertMaterial({color:hex,flatShading:true});
  m.onBeforeCompile=sh=>{sh.uniforms.uTex={value:CONC};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>','#include <map_fragment>\nvec3 an=abs(vWN);vec2 tuv=an.y>0.5?vWP.xz:(an.x>0.5?vWP.zy:vWP.xy);\ndiffuseColor.rgb*=texture2D(uTex,tuv*0.25).rgb*1.1;')};
  return m}
// brutalist glass-curtain-wall facade: concrete roof on top, glass panes + concrete mullions and floor slabs on the sides
function fmat(){const m=new THREE.MeshLambertMaterial({color:0xffffff});
  m.onBeforeCompile=sh=>{sh.uniforms.uTex={value:CONC};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>',`#include <map_fragment>
      vec3 an=abs(vWN);vec2 tuv=an.y>0.5?vWP.xz:(an.x>0.5?vWP.zy:vWP.xy);vec3 conc=texture2D(uTex,tuv*0.25).rgb*1.1;
      if(an.y>0.5){diffuseColor.rgb=vec3(.82,.86,.88)*conc;}
      else{vec2 g=vec2(vWP.x+vWP.z,vWP.y);vec2 cell=g/vec2(2.4,3.6);vec2 id=floor(cell),f=fract(cell);
        float pane=step(.08,f.x)*step(f.x,.92)*step(.16,f.y);float h=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);
        vec3 glass=mix(vec3(.16,.60,.82),vec3(.58,.88,.97),smoothstep(-40.,90.,vWP.y)*.55+h*.45);
        glass+=vec3(.55)*pow(max(0.,sin(g.x*.35+g.y*.5)),16.)*.4;
        diffuseColor.rgb=mix(vec3(.82,.86,.87)*conc,glass,pane);}`)};
  return m}
const MATS=[0xcdd7da,0xa0acb1,0x5a6a71,0x18c4ff,0x7ccf42].map(cmat);   // 0 light concrete, 1 mid, 2 dark, 3 aqua accent, 4 lime planter
MATS.push(fmat());                                                  // 5 glass facade

// ---- water (ankle deep, glossy aqua) ----
const WATER=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{uTime:{value:0},uRip:{value:[0,1,2,3].map(()=>new THREE.Vector4(0,0,-99,0))},uFog:{value:new THREE.Color(FOGC)},uNear:{value:40},uFar:{value:430}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float uTime;uniform vec4 uRip[4];uniform vec3 uFog;uniform float uNear,uFar;varying vec3 vW;varying float vZ;
  void main(){vec2 p=vW.xz;float w=sin(p.x*1.3+uTime*.8)*sin(p.y*1.1-uTime*.6)*.5+sin((p.x+p.y)*2.4+uTime*1.5)*.25;
    float rp=0.;for(int i=0;i<4;i++){float age=uTime-uRip[i].z;float d=distance(p,uRip[i].xy);rp+=smoothstep(.22,0.,abs(d-age*2.2))*exp(-age*1.6)*uRip[i].w;}
    vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(V.y,0.),3.);
    float ca=pow(max(0.,sin(p.x*2.1+w*2.)*sin(p.y*2.3-w*2.)),6.);
    vec3 col=mix(vec3(.03,.62,.82),vec3(.82,.98,1.),fr*.85)+w*.07+rp*.45+ca*.25;
    col=mix(col,uFog,clamp((vZ-uNear)/(uFar-uNear),0.,1.));gl_FragColor=vec4(col,clamp(.74+fr*.2,0.,1.));}`});
let RI=0;function ripple(x,z,s){WATER.uniforms.uRip.value[RI++%4].set(x,z,T,s)}

// ---- geometry helpers ----
const B=[],POOLS=[];
function blk(x1,y1,z1,x2,y2,z2,t=0){B.push({x1,x2,y1,y2,z1,z2});
  const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.castShadow=m.receiveShadow=true;scene.add(m)}
function deco(x1,y1,z1,x2,y2,z2,t=5){const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.receiveShadow=true;scene.add(m)}   // visual only, no collision
const sl=(x1,z1,x2,z2,top,t=0)=>blk(x1,top-3,z1,x2,top,z2,t);
function plaza(x1,z1,x2,z2,top,q){
  if(!q)return sl(x1,z1,x2,z2,top);
  const[a,b,c,d]=q;sl(x1,z1,a,z2,top);sl(c,z1,x2,z2,top);sl(a,z1,c,b,top);sl(a,d,c,z2,top);sl(a,b,c,d,top-0.3,1);   // basin is 0.3 deep
  const w=new THREE.Mesh(new THREE.PlaneGeometry(c-a,d-b),WATER);w.rotation.x=-Math.PI/2;w.position.set((a+c)/2,top-0.05,(b+d)/2);scene.add(w);
  POOLS.push({x1:a,x2:c,z1:b,z2:d,y:top-0.05})}                                                                       // ankle deep: surface 0.25 above basin floor
function poolAt(x,z,y){for(const p of POOLS)if(x>p.x1&&x<p.x2&&z>p.z1&&z<p.z2&&y<p.y)return p;return null}
// a skyscraper: glass-facade shaft running far down into the clouds, with a concrete roof slab (optionally holding a pool)
const tower=(x1,z1,x2,z2,top,q)=>{blk(x1,-160,z1,x2,top-3,z2,5);plaza(x1,z1,x2,z2,top,q)};
const bushM=new THREE.MeshLambertMaterial({color:0x7fdc45,flatShading:true});
function bush(x,y,z,s){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),bushM);m.position.set(x,y+s*0.7,z);m.castShadow=true;scene.add(m)}

// ---- skybox: bright aqua gradient, hot sun, clouds ----
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uSun:{value:SUN}},
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSun;varying vec3 vD;
  float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec3 d=normalize(vD);float h=d.y;
    vec3 col=mix(vec3(.82,.95,1.),vec3(.33,.73,.98),smoothstep(0.,.3,h));col=mix(col,vec3(.05,.40,.88),smoothstep(.25,.9,h));col=mix(col,vec3(.86,.96,1.),smoothstep(0.,-.25,h));
    float s=max(dot(d,uSun),0.);col+=vec3(1.,.95,.75)*(pow(s,900.)*3.+pow(s,10.)*.25+pow(s,3.)*.12);
    if(h>.02){vec2 p=d.xz/(h+.15)*1.6;float c=vn(p*1.3)*.55+vn(p*2.7)*.3+vn(p*5.5)*.15;c=smoothstep(.5,.85,c);col=mix(col,vec3(1.),c*.85*smoothstep(.02,.2,h));}
    gl_FragColor=vec4(col,1.);}`}));
sky.frustumCulled=false;scene.add(sky);
// cloud sea far below the towers
const CLOUDS=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uFog:{value:new THREE.Color(FOGC)}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float uTime;uniform vec3 uFog;varying vec3 vW;varying float vZ;
  float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec2 p=vW.xz*.012+vec2(uTime*.01,uTime*.006);float c=vn(p)*.5+vn(p*2.3)*.3+vn(p*5.1)*.2;c=smoothstep(.25,.75,c);
    vec3 col=mix(vec3(.72,.88,.98),vec3(1.),c);col=mix(col,uFog,clamp((vZ-60.)/500.,0.,1.)*.7);gl_FragColor=vec4(col,.93);}`}));
CLOUDS.rotation.x=-Math.PI/2;CLOUDS.position.y=-50;scene.add(CLOUDS);
// distant megacity skyline: glass towers, day-lit (no collision)
const WIN=new THREE.MeshBasicMaterial({color:0xffffff});
WIN.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <map_fragment>',`#include <map_fragment>
    vec2 w=vec2(vWP.x+vWP.z,vWP.y)*.16;vec2 id=floor(w),f=fract(w);float h=fract(sin(dot(id,vec2(12.9,78.2)))*43758.5);
    float pane=step(.12,f.x)*step(f.x,.88)*step(.2,f.y)*(1.-step(.5,vWN.y));
    vec3 glass=mix(vec3(.26,.62,.8),vec3(.66,.9,.98),h);vec3 wall=vec3(.74,.8,.82);
    float shade=.72+.28*dot(vWN,normalize(vec3(.45,.4,-.8)));
    diffuseColor.rgb=mix(wall,glass,pane)*shade;`)};
{const r=rng(11);let n=0;while(n<110){const a=r()*6.283,d=120+r()*470,w=14+r()*40,top=15+r()*165,x=-10+Math.cos(a)*d,z=-150+Math.sin(a)*d;
  if(Math.abs(x+10)<100+w&&z>-390&&z<80)continue;n++;                       // keep the route corridor clear
  const h=top+60,m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*(0.6+r()*0.8)),WIN);m.position.set(x,top-h/2,z);scene.add(m)}}
// glass neighbours close to the route (visual only) so every roof sits inside a canyon of skyscrapers
for(const[x1,z1,x2,z2,top]of[[-92,-70,-60,-40,18],[-100,-160,-64,-120,44],[-96,-260,-62,-228,12],[-84,-340,-52,-300,96],[40,-80,72,-44,12],[46,-146,78,-110,40],[40,-210,72,-176,26],[44,-300,78,-262,60],[-30,-330,-6,-306,118],[30,-340,54,-312,108],[-100,10,-62,50,30],[48,-10,84,28,50]]){
  deco(x1,-160,z1,x2,top,z2,5);deco(x1,top,z1,x2,top+0.6,z2,0)}

// ---- floating soap bubbles (frutiger aero) ----
const BUB=[],bubM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2);vec3 c=mix(vec3(.55,.92,1.),vec3(1.,.78,.95),f);gl_FragColor=vec4(c+f*.4,f*.75+.05);}'});
{const r=rng(5);for(let i=0;i<90;i++){const s=0.4+r()*r()*3.2,m=new THREE.Mesh(new THREE.SphereGeometry(s,10,8),bubM);
  const y=-10+r()*90,z=20-(Math.max(0,y+10)/100)*320+(r()-.5)*160;m.position.set((r()-.5)*180,y,z);scene.add(m);BUB.push({m,y:m.position.y,p:r()*6.28,s:0.4+r()*0.8})}}
function updBub(){for(const b of BUB)b.m.position.y=b.y+Math.sin(T*b.s+b.p)*1.6}

// ---- THE LEVEL (z runs negative = forward, y is up: climb skyscraper to skyscraper) ----
const CP=[{p:[0,0.05,8]},{p:[0,5.05,-114]},{p:[-37,21.55,-189]},{p:[9,33.05,-250]}];     // checkpoints
const GOAL={x:8,y:75,z:-282};
// 1. start roof: pool, mantle steps, parkour ledges, slide tunnel
tower(-24,-34,24,14,0,[8,-30,20,-18]);
blk(-24,0,12.8,24,1.2,14,0);blk(-24,0,-34,-22.8,1.2,12.8,0);blk(22.8,0,-34,24,1.2,12.8,0);                          // parapets (front is open)
blk(-21,0,-8,-17,0.9,-4);blk(-16,0,-8,-12,1.4,-4);blk(-11,0,-8,-7,1.9,-4);                                          // mantle steps
blk(-22,0,-14,-18,1.6,-10,3);blk(-22,0,-18,-18,3.4,-14,3);blk(-22,0,-22,-18,5.2,-18,3);blk(-23,0,-28,-14,7,-22,1);   // parkour ledges
blk(12,0,-10,13,3.3,0,1);blk(19,0,-10,20,3.3,0,1);blk(12,1.3,-10,20,1.6,0,3);blk(12,1.6,-10,20,3.3,0,1);            // slide tunnel
blk(-9,0,3,-5,1.3,7,2);blk(6,0,3,10,1.3,7,2);blk(21,0,10,22,14,11,2);                                              // AC units + antenna mast
bush(-20,0,11,1.4);bush(-17.5,0,11.5,1);bush(20,0,-30,1.3);deco(-22.8,0,-33,-12,0.5,-31,4);
// 2. roof hop: three small towers, widening gaps
tower(-9,-52,9,-42,1.5);blk(-1,1.5,-48,1,2.7,-46,3);
tower(-8,-68,8,-58,3.5);blk(3,3.5,-66,7,5,-62,2);bush(-6,3.5,-60,1.1);
// 3. the beam, then a 16m dash gap
tower(-2.5,-96,2.5,-72,5);
// 4. wall-jump shaft between two glass towers (5m wide, 11m climb) -> mantle onto the right wall top
tower(-10,-138,10,-112,5);
blk(-10,5,-138,-2.5,16.5,-126,5);blk(2.5,5,-138,10,14.5,-126,5);
// 5. skybridge tower: low slide canopy, then up a floor
tower(0,-170,14,-146,14.5);
blk(0,14.5,-166,1,18,-158,2);blk(13,14.5,-166,14,18,-158,2);blk(1,15.8,-166,13,18,-158,3);blk(5,14.5,-152,9,15.7,-150,1);
tower(-12,-196,4,-176,18);bush(2,18,-194,1.2);
// 6. checkpoint garden tower with a pool, and a second wall-jump shaft
tower(-40,-232,-18,-186,21.5,[-35,-206,-25,-196]);
blk(-40,21.5,-232,-31.5,33.5,-218,5);blk(-26.5,21.5,-232,-18,31,-218,5);
bush(-39.2,21.5,-187.2,1.2);bush(-20,21.5,-188,1.1);deco(-40,21.5,-190.5,-18,22.1,-186,4);
// 7. dash street: 16m gap between two towers
tower(-30,-262,-14,-240,31);
tower(2,-262,16,-244,33);blk(7,33,-256,11,34.4,-252,2);
// 8. the spiral: balconies winding up the central megatower
for(let i=1;i<=17;i++){const a=(i-1)*Math.PI/4,x=8+11.5*Math.sin(a),z=-282+11.5*Math.cos(a),top=33+2.5*i;sl(x-2.5,z-2.5,x+2.5,z+2.5,top,i%3===0?3:0);deco(x-0.5,top-70,z-0.5,x+0.5,top-3,z+0.5,2)}
tower(3,-287,13,-277,75);
blk(7,75,-283,9,77,-281,3);
for(const[x,z]of[[3,-287],[12.4,-287],[3,-277.6],[12.4,-277.6]])deco(x,75,z,x+0.6,90+x*0.2,z+0.6,2);
{const g=new THREE.Mesh(new THREE.BoxGeometry(0.8,6,0.8),new THREE.MeshBasicMaterial({color:0xb6ff4a}));g.position.set(GOAL.x,GOAL.y+3,GOAL.z);scene.add(g);
 const b=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,300,8,1,true),new THREE.MeshBasicMaterial({color:0x7fe8ff,transparent:true,opacity:0.35,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));
 b.position.set(GOAL.x,GOAL.y+150,GOAL.z);scene.add(b)}
