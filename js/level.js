// World: renderer, lights, sky, procedural concrete texture + shaders, water, and the LABYRINTHUS level.
let T=0;
const glc=$('gl');
const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:false});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const FOGC=0xa08c7e,scene=new THREE.Scene();scene.background=new THREE.Color(FOGC);scene.fog=new THREE.Fog(FOGC,40,420);
const cam=new THREE.PerspectiveCamera(90,1,0.05,2000);cam.rotation.order='YXZ';scene.add(cam);
const SUN=new THREE.Vector3(0.45,0.4,-0.8).normalize();
scene.add(new THREE.HemisphereLight(0xffd9b0,0x3a3a44,0.7));
const dl=new THREE.DirectionalLight(0xffe2b8,1.0);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-0.0005;
const sc=dl.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=300;scene.add(dl,dl.target);
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- concrete texture, made with code. Yellow/orange is the same texture, just tinted ----
function makeConcrete(){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=rng(7);
  g.fillStyle='#b9b9b4';g.fillRect(0,0,128,128);
  for(let i=0;i<2600;i++){const v=150+r()*90|0;g.fillStyle='rgb('+v+','+v+','+(v-4)+')';g.fillRect(r()*128,r()*128,1+(r()*2|0),1)}
  for(let i=0;i<45;i++){g.fillStyle='rgba(50,50,48,'+(0.25+r()*0.3)+')';g.fillRect(r()*128,r()*128,1+(r()*2|0),1)}
  g.fillStyle='rgba(40,40,38,.6)';g.fillRect(0,0,128,2);g.fillRect(0,0,2,128);
  g.fillStyle='rgba(30,30,28,.55)';for(const x of[32,96])for(const y of[32,96])g.fillRect(x-1,y-1,3,3);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t}
const CONC=makeConcrete();
// triplanar (world-space) sampling so the texture never stretches on big blocks + height-based darkening
function cmat(hex){const m=new THREE.MeshLambertMaterial({color:hex,flatShading:true});
  m.onBeforeCompile=sh=>{sh.uniforms.uTex={value:CONC};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>','#include <map_fragment>\nvec3 an=abs(vWN);vec2 tuv=an.y>0.5?vWP.xz:(an.x>0.5?vWP.zy:vWP.xy);\ndiffuseColor.rgb*=texture2D(uTex,tuv*0.25).rgb*1.15;\ndiffuseColor.rgb*=0.75+0.25*smoothstep(-3.0,12.0,vWP.y);')};
  return m}
const MATS=[0xd2d0c8,0x8f8f8c,0x4a4a48,0xe0731c].map(cmat);   // 0 light concrete, 1 mid, 2 dark, 3 orange

// ---- water (ankle deep) ----
const WATER=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{uTime:{value:0},uRip:{value:[0,1,2,3].map(()=>new THREE.Vector4(0,0,-99,0))},uFog:{value:new THREE.Color(FOGC)},uNear:{value:40},uFar:{value:420}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float uTime;uniform vec4 uRip[4];uniform vec3 uFog;uniform float uNear,uFar;varying vec3 vW;varying float vZ;
  void main(){vec2 p=vW.xz;float w=sin(p.x*1.3+uTime*.8)*sin(p.y*1.1-uTime*.6)*.5+sin((p.x+p.y)*2.4+uTime*1.5)*.25;
    float rp=0.;for(int i=0;i<4;i++){float age=uTime-uRip[i].z;float d=distance(p,uRip[i].xy);rp+=smoothstep(.22,0.,abs(d-age*2.2))*exp(-age*1.6)*uRip[i].w;}
    vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(V.y,0.),3.);
    vec3 col=mix(vec3(.08,.12,.13),vec3(.85,.6,.42),fr*.8)+w*.05+rp*.35;
    col=mix(col,uFog,clamp((vZ-uNear)/(uFar-uNear),0.,1.));gl_FragColor=vec4(col,clamp(.78+fr*.2,0.,1.));}`});
let RI=0;function ripple(x,z,s){WATER.uniforms.uRip.value[RI++%4].set(x,z,T,s)}

// ---- geometry helpers ----
const B=[],POOLS=[];
function blk(x1,y1,z1,x2,y2,z2,t=0){B.push({x1,x2,y1,y2,z1,z2});
  const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.castShadow=m.receiveShadow=true;scene.add(m)}
const sl=(x1,z1,x2,z2,top,t=0)=>blk(x1,top-3,z1,x2,top,z2,t);
function plaza(x1,z1,x2,z2,top,q){
  if(!q)return sl(x1,z1,x2,z2,top);
  const[a,b,c,d]=q;sl(x1,z1,a,z2,top);sl(c,z1,x2,z2,top);sl(a,z1,c,b,top);sl(a,d,c,z2,top);sl(a,b,c,d,top-0.3,1);   // basin is 0.3 deep
  const w=new THREE.Mesh(new THREE.PlaneGeometry(c-a,d-b),WATER);w.rotation.x=-Math.PI/2;w.position.set((a+c)/2,top-0.05,(b+d)/2);scene.add(w);
  POOLS.push({x1:a,x2:c,z1:b,z2:d,y:top-0.05})}                                                                       // ankle deep: surface 0.25 above basin floor
function poolAt(x,z,y){for(const p of POOLS)if(x>p.x1&&x<p.x2&&z>p.z1&&z<p.z2&&y<p.y)return p;return null}

// ---- skybox ----
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uSun:{value:SUN}},
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;
    vec3 col=mix(vec3(.93,.62,.38),vec3(.55,.5,.5),smoothstep(0.,.25,h));col=mix(col,vec3(.12,.15,.22),smoothstep(.2,.8,h));col=mix(col,vec3(.36,.3,.28),smoothstep(0.,-.3,h));
    float s=max(dot(d,uSun),0.);col+=vec3(1.,.8,.5)*pow(s,600.)*2.+vec3(1.,.6,.3)*pow(s,8.)*.35;
    float cl=smoothstep(.55,.9,sin(d.x*9.+sin(d.z*7.)*2.)*sin(h*40.+d.z*5.)*.5+.5)*smoothstep(.02,.3,h)*(1.-smoothstep(.3,.6,h));
    col=mix(col,col*.8+vec3(.2,.15,.1),cl*.5);gl_FragColor=vec4(col,1.);}`}));
sky.frustumCulled=false;scene.add(sky);
// distant megacity skyline (no collision): shader-drawn windows
const WIN=new THREE.MeshBasicMaterial({color:0xffffff});
WIN.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <map_fragment>',`#include <map_fragment>
    vec2 w=vec2(vWP.x+vWP.z,vWP.y)*.18;vec2 id=floor(w),f=fract(w);float lit=step(.72,fract(sin(dot(id,vec2(12.9,78.2)))*43758.5));
    float win=step(.2,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.75)*(1.-step(.5,vWN.y));
    diffuseColor.rgb=mix(vec3(.15,.14,.14),mix(vec3(.24,.24,.27),vec3(1.,.72,.4),lit),win);`)};
{const r=rng(11);for(let i=0;i<90;i++){const a=r()*6.283,d=190+r()*330,w=14+r()*40,h=50+r()*260,x=Math.cos(a)*d,z=-110+Math.sin(a)*d;
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*(0.6+r()*0.8)),WIN);m.position.set(x,h/2-40,z);scene.add(m)}}

// ---- THE LEVEL (z runs negative = forward) ----
const CP=[{p:[0,0.05,8]},{p:[0,4.55,-96]},{p:[4.5,16,-190]}];                 // checkpoints
const GOAL={x:7,y:42,z:-208};
// 1. start plaza with ankle-deep pool, mantle blocks, slide tunnel
plaza(-36,-54,36,14,0,[-10,-30,10,-18]);
blk(-38,0,-54,-36,10,16,0);blk(36,0,-54,38,10,16,0);blk(-38,0,14,38,8,16,0);       // enclosing walls (wall-jumpable)
blk(-32,0,-8,-28,0.9,-4);blk(-27,0,-8,-23,1.4,-4);blk(-22,0,-8,-18,1.9,-4);          // mantle steps
blk(-34,0,-14,-30,1.6,-10,3);blk(-34,0,-18,-30,3.4,-14,3);blk(-34,0,-22,-30,5.2,-18,3);blk(-35,0,-26,-26,7,-22,1); // parkour ledges
blk(14,0,-10,15,3.3,0,1);blk(27,0,-10,28,3.3,0,1);blk(14,1.3,-10,28,1.6,0,3);blk(14,1.6,-10,28,3.3,0,1);            // slide tunnel
blk(14,0,-36,18,1.2,-32,1);blk(22,0,-40,28,2.2,-34,1);blk(-6,0,-40,6,0.6,-36,2);      // pool-side blocks
for(let i=0;i<4;i++)blk(-22+i*9,0,-46,-20+i*9,5+i*1.5,-44,2);                       // pillars
// 2. dash street: platforms over the void, flanked by megatowers
sl(-4,-66,4,-60,1.5,3);sl(-4,-82,4,-76,3,3);sl(-4,-112,4,-93,4.5,0);
blk(-24,-30,-104,-12,45,-50,0);blk(12,-30,-104,24,45,-50,1);
// 3. wall-jump shaft (5m wide, climb 11m) -> mantle onto the right wall top
blk(-8,0,-112,-2.5,19,-100,0);blk(2.5,0,-112,8,15.5,-100,0);
// 4. skybridge: gaps, low slide-ceiling, mantle blocks
sl(2.5,-130,6.5,-112,15.5,1);sl(2.5,-150,6.5,-138,15.5,1);sl(2.5,-170,6.5,-159,15.5,1);
blk(2.5,15.5,-148,3.2,19,-140,2);blk(5.8,15.5,-148,6.5,19,-140,2);blk(2.5,16.8,-148,6.5,19,-140,3);
blk(2.5,15.5,-166,6.5,17.1,-164.5,3);
blk(-20,-30,-170,-8,30,-120,1);blk(14,-30,-175,28,38,-125,0);
// 5. tower plaza (checkpoint + pool) and the spiral climb
plaza(-2,-194,11,-182,15.5,[1,-191,8,-185]);
blk(-30,-30,-200,-16,60,-180,0);
for(let i=1;i<=10;i++){const a=(i-1)*Math.PI/4,x=4.5+11*Math.sin(a),z=-210+11*Math.cos(a);sl(x-2.5,z-2.5,x+2.5,z+2.5,15.5+2.5*i,i%3===0?3:1)}
// 6. summit: tower core with a rooftop pool and the goal beacon
blk(0.5,0,-214,8.5,39,-206,0);plaza(0.5,-214,8.5,-206,42,[1.5,-213,4.5,-209]);
{const g=new THREE.Mesh(new THREE.BoxGeometry(0.8,6,0.8),new THREE.MeshBasicMaterial({color:0xff9a3a}));g.position.set(GOAL.x,GOAL.y+3,GOAL.z);scene.add(g);
 const b=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,300,8,1,true),new THREE.MeshBasicMaterial({color:0xff8a2a,transparent:true,opacity:0.3,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));
 b.position.set(GOAL.x,GOAL.y+150,GOAL.z);scene.add(b)}
