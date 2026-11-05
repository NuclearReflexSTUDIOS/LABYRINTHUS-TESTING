// World core: renderer, environment, brutalist materials, water, sky, and the helpers every level is built from.
// Levels themselves live in levels.js. Anything added through blk()/deco()/lamp() goes into the current level group (LVL).
let T=0;
const glc=$('gl');
const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:false});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(90,1,0.12,1800);cam.rotation.order='YXZ';scene.add(cam);
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

// ---- environment (one object drives fog, lights and sky so a time-of-day / weather system can animate it later) ----
const ENV={fog:new THREE.Color(0xc9d1d3),top:new THREE.Color(.20,.40,.70),mid:new THREE.Color(.55,.71,.85),hor:new THREE.Color(.87,.89,.89),
  sunCol:new THREE.Color(1,.93,.78),sunDir:new THREE.Vector3(0.45,0.4,-0.8).normalize(),sunI:1.0,hemiSky:new THREE.Color(0xbfd2de),hemiGnd:new THREE.Color(0x8a8478),hemiI:0.55,cloud:0.45,night:0,fogNear:40,fogFar:430};
const ENVMATS=[];                                  // ground shaders that need fog distances updated
const INT=[];                                      // interior volumes (rain/snow are hidden inside)
const NIGHTU={value:0};
const SNAPU={value:new THREE.Vector2(240,135)};                                   // vertex-snap grid (set from the render-target size)
const SNAPV='\nif(gl_Position.w>0.2){gl_Position.xy=floor(gl_Position.xy/gl_Position.w*uSnap+0.5)/uSnap*gl_Position.w;}';
const SUN=ENV.sunDir;
scene.background=new THREE.Color(ENV.fog);scene.fog=new THREE.Fog(ENV.fog,ENV.fogNear,ENV.fogFar);
const hemi=new THREE.HemisphereLight(ENV.hemiSky,ENV.hemiGnd,ENV.hemiI);scene.add(hemi);
const dl=new THREE.DirectionalLight(ENV.sunCol,ENV.sunI);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-0.0005;
const sc=dl.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=300;scene.add(dl,dl.target);
// pool of 4 point lights moved onto the nearest interior lamps (constant light count = no shader recompiles)
const LP=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffe2b8,0,24,1.5);scene.add(l);return l});
const LAMPS=[];
function updLamps(p){const near=LAMPS.map(l=>({l,d:(l.x-p.x)**2+(l.y-p.y)**2+(l.z-p.z)**2})).filter(o=>o.d<1600).sort((a,b)=>a.d-b.d);
  LP.forEach((pl,i)=>{const o=near[i];if(o){pl.position.set(o.l.x,o.l.y,o.l.z);pl.intensity=1.15}else pl.intensity=0})}
function applyEnv(){
  scene.fog.color.copy(ENV.fog);scene.fog.near=ENV.fogNear;scene.fog.far=ENV.fogFar;scene.background.copy(ENV.fog);
  hemi.color.copy(ENV.hemiSky);hemi.groundColor.copy(ENV.hemiGnd);hemi.intensity=ENV.hemiI;dl.color.copy(ENV.sunCol);dl.intensity=ENV.sunI;
  WATER.uniforms.uFog.value.copy(ENV.fog);WATER.uniforms.uNear.value=ENV.fogNear;WATER.uniforms.uFar.value=ENV.fogFar;
  WATER.uniforms.uSky.value.copy(ENV.mid).lerp(ENV.hor,0.4);
  for(const m of ENVMATS){m.uniforms.uNear.value=ENV.fogNear;m.uniforms.uFar.value=ENV.fogFar}
  CLOUDS.material.uniforms.uLo.value.copy(ENV.fog).multiplyScalar(0.92);CLOUDS.material.uniforms.uHi.value.copy(ENV.fog).multiplyScalar(1.12);CLOUDS.material.uniforms.uNear.value=ENV.fogNear;CLOUDS.material.uniforms.uFar.value=ENV.fogFar;
  SKYU.uCloud.value=ENV.cloud;SKYU.uNight.value=ENV.night;NIGHTU.value=ENV.night}

// ---- procedural textures (board-formed concrete, grass) ----
function makeConcrete(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=rng(7);
  g.fillStyle='#bdbdb7';g.fillRect(0,0,256,256);
  for(let i=0;i<40;i++){const v=150+r()*70|0;g.fillStyle='rgba('+v+','+v+','+(v-3)+',.35)';g.fillRect(r()*256,r()*256,30+r()*90,20+r()*70)}          // large blotches
  for(let i=0;i<7000;i++){const v=140+r()*95|0;g.fillStyle='rgb('+v+','+v+','+(v-3)+')';g.fillRect(r()*256,r()*256,1+(r()*2|0),1)}                  // grain
  for(let x=0;x<256;x+=64){g.fillStyle='rgba(38,38,36,.55)';g.fillRect(x,0,2,256);g.fillStyle='rgba(255,255,250,.12)';g.fillRect(x+2,0,1,256)}      // form seams
  for(let y=0;y<256;y+=128){g.fillStyle='rgba(38,38,36,.45)';g.fillRect(0,y,256,2)}
  for(const x of[32,96,160,224])for(const y of[32,96,160,224]){g.fillStyle='rgba(30,30,28,.65)';g.fillRect(x-2,y-2,5,5);g.fillStyle='rgba(30,30,28,.3)';g.fillRect(x-4,y-4,9,9)}   // tie holes
  for(let i=0;i<16;i++){const x=r()*256,h=40+r()*120,y=r()*60;const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'rgba(40,44,46,.28)');gr.addColorStop(1,'rgba(40,44,46,0)');g.fillStyle=gr;g.fillRect(x,y,1+(r()*3|0),h)}   // rain streaks
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t}
function makeGrass(){
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=rng(3);
  g.fillStyle='#4ec92a';g.fillRect(0,0,64,64);
  for(let i=0;i<900;i++){const k=r();g.fillStyle=k<.3?'#2f9a1c':k<.7?'#6ee83a':'#9dff52';g.fillRect(r()*64,r()*64,1,1+(r()*3|0))}
  for(let i=0;i<7;i++){g.fillStyle=r()<.5?'#fff6a8':'#ffffff';g.fillRect(r()*64,r()*64,1,1)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t}
const CONC=makeConcrete(),GRASS=makeGrass();

// triplanar (world-space) sampling so the texture never stretches on big blocks; per-pixel Phong lighting (so interior point lights read)
function cmat(hex,tex=CONC,sc=0.25){const m=new THREE.MeshPhongMaterial({color:hex,specular:0x000000,shininess:0});
  m.onBeforeCompile=sh=>{sh.uniforms.uTex={value:tex};sh.uniforms.uSnap=SNAPU;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 uSnap;varying vec3 vWP;varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>'+SNAPV)
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>',`#include <map_fragment>
      vec3 an=abs(vWN);vec2 tuv=an.y>0.5?vWP.xz:(an.x>0.5?vWP.zy:vWP.xy);
      diffuseColor.rgb*=texture2D(uTex,tuv*${sc.toFixed(3)}).rgb*1.12;`)};
  return m}
// brutalist facade: concrete piers + floor spandrels with ribbon windows of smoked glass (lit windows at night)
function fmat(){const m=new THREE.MeshPhongMaterial({color:0xffffff,specular:0x000000,shininess:0});
  m.onBeforeCompile=sh=>{sh.uniforms.uTex={value:CONC};sh.uniforms.uNight=NIGHTU;sh.uniforms.uSnap=SNAPU;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 uSnap;varying vec3 vWP;varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>'+SNAPV)
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;uniform float uNight;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>',`#include <map_fragment>
      float winLit=0.;vec3 an=abs(vWN);vec2 tuv=an.y>0.5?vWP.xz:(an.x>0.5?vWP.zy:vWP.xy);vec3 conc=texture2D(uTex,tuv*0.25).rgb*1.12;
      if(an.y>0.5){diffuseColor.rgb=vec3(.84,.85,.85)*conc;}
      else{float u=vWP.x+vWP.z;float fy=fract(vWP.y/3.8);float fid=floor(vWP.y/3.8);float bay=floor(u/3.2);
        float ribbon=step(.30,fy)*step(fy,.84);float pier=1.-step(.22,fract(u/3.2));
        float h=fract(sin(dot(vec2(bay,fid),vec2(12.9898,78.233)))*43758.5453);
        vec3 glass=mix(vec3(.10,.15,.17),vec3(.34,.50,.58),smoothstep(-60.,110.,vWP.y)*.6+h*.35);
        glass+=vec3(.4)*pow(max(0.,sin(u*.21+vWP.y*.34)),20.)*.5;
        float mask=ribbon*(1.-pier);winLit=mask*step(.74,h);
        diffuseColor.rgb=mix(vec3(.80,.81,.80)*conc,glass,mask);}`)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.82,.5)*winLit*uNight*.9;')};
  return m}
const MATS=[cmat(0xc9cac4),cmat(0x9a9c98),cmat(0x4c5258),cmat(0xe8672a),cmat(0xffffff,GRASS,0.5),fmat(),cmat(0xcdc8ba),cmat(0x666b70),cmat(0x8a6a55),cmat(0xb08a58)];
// 0 light concrete, 1 mid concrete, 2 dark steel, 3 safety orange, 4 grass, 5 facade, 6 plaster, 7 dark floor tile, 8 rusty steel, 9 timber
const LAMPM=new THREE.MeshBasicMaterial({color:0xfff0cf});
const GLASSM=new THREE.MeshPhongMaterial({color:0x9ed6e6,transparent:true,opacity:0.22,specular:0xffffff,shininess:80,depthWrite:false});

// ---- water (ankle deep, clean blue: the one aero accent) ----
const WATER=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{uTime:{value:0},uRip:{value:[0,1,2,3].map(()=>new THREE.Vector4(0,0,-99,0))},uFog:{value:new THREE.Color(ENV.fog)},uNear:{value:40},uFar:{value:430},uSky:{value:new THREE.Color(.72,.88,.98)}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float uTime;uniform vec4 uRip[4];uniform vec3 uFog,uSky;uniform float uNear,uFar;varying vec3 vW;varying float vZ;
  void main(){vec2 p=vW.xz;float w=sin(p.x*1.3+uTime*.8)*sin(p.y*1.1-uTime*.6)*.5+sin((p.x+p.y)*2.4+uTime*1.5)*.25;
    float rp=0.;for(int i=0;i<4;i++){float age=uTime-uRip[i].z;float d=distance(p,uRip[i].xy);rp+=smoothstep(.22,0.,abs(d-age*2.2))*exp(-age*1.6)*uRip[i].w;}
    vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(V.y,0.),3.);
    float ca=pow(max(0.,sin(p.x*2.1+w*2.)*sin(p.y*2.3-w*2.)),6.);
    vec3 col=mix(vec3(.02,.42,.70),uSky,fr*.85)+w*.06+rp*.45+ca*.28;
    col=mix(col,uFog,clamp((vZ-uNear)/(uFar-uNear),0.,1.));gl_FragColor=vec4(col,clamp(.78+fr*.2,0.,1.));}`});
let RI=0;function ripple(x,z,s){WATER.uniforms.uRip.value[RI++%4].set(x,z,T,s)}

// ---- level container + builders ----
let LVL=new THREE.Group();scene.add(LVL);
const B=[],POOLS=[],CP=[],MOV=[],GOAL={x:0,y:0,z:0};
function clearLevel(){INT.length=0;ENVMATS.length=0;scene.remove(LVL);LVL.traverse(o=>{if(o.geometry)o.geometry.dispose()});LVL=new THREE.Group();scene.add(LVL);B.length=POOLS.length=CP.length=MOV.length=LAMPS.length=0}
function blk(x1,y1,z1,x2,y2,z2,t=0){const b={x1,x2,y1,y2,z1,z2};B.push(b);
  const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.castShadow=m.receiveShadow=true;LVL.add(m);return b}
function deco(x1,y1,z1,x2,y2,z2,t=5,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),mat||MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.receiveShadow=!mat;LVL.add(m);return m}   // visual only
const sl=(x1,z1,x2,z2,top,t=0)=>blk(x1,top-3,z1,x2,top,z2,t);
function plaza(x1,z1,x2,z2,top,q){
  if(!q)return sl(x1,z1,x2,z2,top);
  const[a,b,c,d]=q;sl(x1,z1,a,z2,top);sl(c,z1,x2,z2,top);sl(a,z1,c,b,top);sl(a,d,c,z2,top);sl(a,b,c,d,top-0.3,1);   // basin is 0.3 deep
  const w=new THREE.Mesh(new THREE.PlaneGeometry(c-a,d-b),WATER);w.rotation.x=-Math.PI/2;w.position.set((a+c)/2,top-0.05,(b+d)/2);LVL.add(w);
  POOLS.push({x1:a,x2:c,z1:b,z2:d,y:top-0.05})}
function poolAt(x,z,y){for(const p of POOLS)if(x>p.x1&&x<p.x2&&z>p.z1&&z<p.z2&&y<p.y)return p;return null}
// a skyscraper: facade shaft running far down, with a concrete roof slab (optionally holding a pool)
const BASEY=-160;
const tower=(x1,z1,x2,z2,top,q)=>{blk(x1,BASEY,z1,x2,top-3,z2,5);plaza(x1,z1,x2,z2,top,q)};
const grass=(x1,z1,x2,z2,top)=>deco(x1,top+0.04,z1,x2,top+0.1,z2,4);
const bushM=new THREE.MeshPhongMaterial({color:0x4fd236,specular:0x000000,shininess:0,flatShading:true});
function bush(x,y,z,s){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),bushM);m.position.set(x,y+s*0.7,z);m.castShadow=true;LVL.add(m)}
function lamp(x,y,z,w=1.6,d=0.5){deco(x-w/2,y-0.08,z-d/2,x+w/2,y,z+d/2,0,LAMPM);LAMPS.push({x,y:y-0.6,z})}
// movers: a collidable block that slides between a and b along an axis (window-cleaner gondolas, lifts). stepMovers() in player.js carries riders.
function mover(x1,y1,z1,x2,y2,z2,t,axis,a,b,period,phase=0,dwell=0.15){const bk=blk(x1,y1,z1,x2,y2,z2,t);const mesh=LVL.children[LVL.children.length-1];mesh.userData.keep=true;
  const m={bk,mesh,axis,a,b,period,phase,dwell,o:0,base:{x1,x2,y1,y2,z1,z2},kids:[]};MOV.push(m);return m}
// merge all static level meshes by material to keep draw calls low
function mergeLevel(){
  LVL.updateMatrixWorld(true);const by=new Map();
  LVL.children.slice().forEach(o=>{if(o.isMesh&&!o.userData.keep&&o.geometry.index){const k=o.material.uuid;if(!by.has(k))by.set(k,{m:o.material,list:[],cs:false,rs:false});const e=by.get(k);e.list.push(o);e.cs=e.cs||o.castShadow;e.rs=e.rs||o.receiveShadow}});
  const v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const e of by.values()){let nv=0,ni=0;for(const o of e.list){nv+=o.geometry.attributes.position.count;ni+=o.geometry.index.count}
    const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),idx=new Uint32Array(ni);let vo=0,io=0;
    for(const o of e.list){const g=o.geometry,p=g.attributes.position,nn=g.attributes.normal,uu=g.attributes.uv;nm.getNormalMatrix(o.matrixWorld);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pos[(vo+i)*3]=v.x;pos[(vo+i)*3+1]=v.y;pos[(vo+i)*3+2]=v.z;
        n.fromBufferAttribute(nn,i).applyMatrix3(nm).normalize();nor[(vo+i)*3]=n.x;nor[(vo+i)*3+1]=n.y;nor[(vo+i)*3+2]=n.z;if(uu){uv[(vo+i)*2]=uu.getX(i);uv[(vo+i)*2+1]=uu.getY(i)}}
      for(let i=0;i<g.index.count;i++)idx[io+i]=g.index.getX(i)+vo;vo+=p.count;io+=g.index.count;LVL.remove(o);g.dispose()}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('uv',new THREE.BufferAttribute(uv,2));G.setIndex(new THREE.BufferAttribute(idx,1));
    const mesh=new THREE.Mesh(G,e.m);mesh.castShadow=e.cs;mesh.receiveShadow=e.rs;mesh.frustumCulled=false;LVL.add(mesh)}}

// ---- skybox (colors/clouds come from ENV) ----
const SKYU={uNight:{value:0},uFlash:{value:0},uSun:{value:SUN},uTop:{value:ENV.top},uMid:{value:ENV.mid},uHor:{value:ENV.hor},uSunCol:{value:ENV.sunCol},uCloud:{value:ENV.cloud},uTime:{value:0}};
function makeSky(U){const m=new THREE.Mesh(new THREE.SphereGeometry(1000,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSun,uTop,uMid,uHor,uSunCol;uniform float uCloud,uTime,uNight,uFlash;varying vec3 vD;
  float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec3 d=normalize(vD);float h=d.y;
    vec3 col=mix(uHor,uMid,smoothstep(0.,.3,h));col=mix(col,uTop,smoothstep(.25,.9,h));col=mix(col,uHor*.95,smoothstep(0.,-.25,h));
    float s=max(dot(d,uSun),0.);col+=uSunCol*(pow(s,900.)*3.+pow(s,12.)*.28+pow(s,3.)*.1);
    if(h>.02){vec2 p=d.xz/(h+.15)*1.6+vec2(uTime*.012,uTime*.005);float c=vn(p*1.3)*.55+vn(p*2.7)*.3+vn(p*5.5)*.15;c=smoothstep(1.02-uCloud,1.25-uCloud,c);
      vec3 cc=(vec3(1.)*(1.-uNight)+uHor*1.4*uNight)*(.82+.18*smoothstep(0.,.6,h));cc=mix(cc,cc*(uHor+.25),.35);col=mix(col,cc,c*.9*smoothstep(.02,.2,h));}
    if(h>0.){vec3 sd=floor(d*150.);float st=step(.9968,fract(sin(dot(sd,vec3(12.9898,78.233,37.719)))*43758.5453));col+=vec3(.9,.95,1.)*st*uNight*smoothstep(0.,.25,h)*(1.-uCloud*.7);}
    col+=vec3(.9,.95,1.)*smoothstep(.9993,.99965,max(dot(d,uSun),0.))*uNight*(1.-uCloud*.8);
    col+=vec3(.75,.8,1.)*uFlash;
    gl_FragColor=vec4(col,1.);}`}));m.frustumCulled=false;return m}
const sky=makeSky(SKYU);scene.add(sky);
// cloud sea far below the towers (level 1)
const CLOUDS=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uFog:{value:ENV.fog},uLo:{value:new THREE.Color(.72,.78,.82)},uHi:{value:new THREE.Color(1,1,1)},uNear:{value:40},uFar:{value:430}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float uTime,uNear,uFar;uniform vec3 uFog,uLo,uHi;varying vec3 vW;varying float vZ;
  float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec2 p=vW.xz*.012+vec2(uTime*.01,uTime*.006);float c=vn(p)*.5+vn(p*2.3)*.3+vn(p*5.1)*.2;c=smoothstep(.25,.75,c);
    vec3 col=mix(uLo,uHi,c);col=mix(col,uFog,clamp((vZ-uNear)/(uFar-uNear),0.,1.)*.85);gl_FragColor=vec4(col,.93);}`}));
CLOUDS.rotation.x=-Math.PI/2;CLOUDS.position.y=-50;scene.add(CLOUDS);
// street grid far below (level 2 and the menu): dark asphalt, lighter city blocks
function makeGround(y,size=6000,period=90,road=22){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.ShaderMaterial({uniforms:{uFog:{value:ENV.fog},uNear:{value:40},uFar:{value:430},uP:{value:period},uR:{value:road}},
  vertexShader:'varying vec3 vW;varying float vZ;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vZ=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform vec3 uFog;uniform float uNear,uFar,uP,uR;varying vec3 vW;varying float vZ;
  void main(){vec2 q=mod(vW.xz,uP);float road=step(q.x,uR)+step(q.y,uR);road=min(road,1.);float h=fract(sin(dot(floor(vW.xz/uP),vec2(12.9,78.2)))*43758.5);
    vec3 col=mix(vec3(.30,.31,.30)*(.8+.25*h),vec3(.10,.10,.11),road);col=mix(col,uFog,clamp((vZ-uNear)/(uFar-uNear),0.,1.));gl_FragColor=vec4(col,1.);}`}));
  m.rotation.x=-Math.PI/2;m.position.y=y;return m}
// distant megacity skyline: brutalist slabs with ribbon windows, lit at night (no collision)
const WIN=new THREE.MeshBasicMaterial({color:0xffffff});
WIN.onBeforeCompile=sh=>{sh.uniforms.uNight=NIGHTU;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;varying vec3 vWP;varying vec3 vWN;').replace('#include <map_fragment>',`#include <map_fragment>
    float u=vWP.x+vWP.z;float fy=fract(vWP.y/3.8);float bay=floor(u/3.2);float fid=floor(vWP.y/3.8);float h=fract(sin(dot(vec2(bay,fid),vec2(12.9,78.2)))*43758.5);
    float mask=step(.30,fy)*step(fy,.84)*(1.-step(.22,fract(u/3.2)))*(1.-step(.5,vWN.y));
    vec3 wall=vec3(.64,.65,.64)*(.85+.15*fract(sin(floor(vWP.x*.07+vWP.z*.05))*91.7));vec3 glass=mix(vec3(.12,.17,.2),vec3(.42,.55,.62),h);
    float shade=.74+.26*dot(vWN,normalize(vec3(.45,.4,-.8)));
    vec3 lit=vec3(1.,.8,.5)*step(.72,h)*uNight;
    diffuseColor.rgb=mix(wall,glass,mask)*shade*mix(1.,.25+.0,uNight)+mask*lit*1.3;`)};
function skyline(seed,count,zMin,zMax,keepX,minD,maxD,cx,cz){const r=rng(seed);let n=0;
  while(n<count){const a=r()*6.283,d=minD+r()*(maxD-minD),w=14+r()*40,top=15+r()*185,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    if(Math.abs(x)<keepX+w&&z>zMin&&z<zMax)continue;n++;
    const h=top-BASEY,m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*(0.6+r()*0.8)),WIN);m.position.set(x,top-h/2,z);LVL.add(m)}}
