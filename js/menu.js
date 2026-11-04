// Main-menu background: a static camera in an abandoned office ~50 floors up, looking out over a massive city at golden hour.
// Birds, drifting clouds, smoke and dust. Everything here is decoration; none of it touches gameplay.
const mscene=new THREE.Scene(),mcam=new THREE.PerspectiveCamera(54,1,0.1,5000);
const M={fog:new THREE.Color(0xd9bda0),sunDir:new THREE.Vector3(0.30,0.13,-0.94).normalize(),t:0};
mscene.background=new THREE.Color(M.fog);mscene.fog=new THREE.Fog(M.fog,70,3400);
mcam.position.set(2.2,1.55,5.2);mcam.lookAt(-1.2,2.0,-60);mcam.rotation.order='YXZ';
const GROUND=-190;                                                                    // street level: 50 floors down
// sky
const MSKY={uSun:{value:M.sunDir},uTop:{value:new THREE.Color(.20,.33,.55)},uMid:{value:new THREE.Color(.78,.66,.58)},uHor:{value:new THREE.Color(1,.80,.58)},uSunCol:{value:new THREE.Color(1,.78,.5)},uCloud:{value:.5},uTime:{value:0},uNight:{value:0},uFlash:{value:0}};
const msky=makeSky(MSKY);mscene.add(msky);
// lights: low golden sun through the window (casts long mullion shadows into the room) + dim warm bounce
mscene.add(new THREE.HemisphereLight(0xffd9b0,0x4a4038,0.5));
const msun=new THREE.DirectionalLight(0xffc98a,1.5);msun.castShadow=true;msun.shadow.mapSize.set(2048,2048);msun.shadow.bias=-0.0006;
msun.position.copy(M.sunDir).multiplyScalar(60).add(new THREE.Vector3(0,2,-4));msun.target.position.set(0,0,0);
{const c=msun.shadow.camera;c.left=-22;c.right=22;c.top=14;c.bottom=-14;c.near=1;c.far=140}mscene.add(msun,msun.target);

// ---- the room ----
const mm=(x1,y1,z1,x2,y2,z2,t=0,ry=0,rz=0,rx=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),MATS[t]);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;mscene.add(m);return m};
{const r=rng(9);
  mm(-16,-1,-7.6,16,0,16,1);                                                       // floor slab
  mm(-16,3.7,-7.6,-6,4.5,16,0);mm(5,3.7,-7.6,16,4.5,16,0);mm(-6,3.7,-3.2,5,4.5,16,0);   // ceiling, with a collapsed bite by the window
  mm(-16,0,-7.6,-9,3.7,-6.4,0);mm(7.5,0,-7.6,16,3.7,-6.4,0);                       // window-wall masses left/right
  mm(-9,3.0,-7.6,7.5,3.7,-6.6,0);mm(-9,0,-7.3,7.5,0.25,-6.7,0);                    // spandrel beam + low sill
  mm(-3.9,0,-7.4,-3.2,3.7,-6.6,0);mm(3.8,0,-7.4,4.5,3.7,-6.6,0);                   // piers
  mm(-15,0,-2,-14,3.7,-1,1);mm(-12,0,3,-11,3.7,4,1);mm(12.5,0,1,13.5,3.7,2,1);     // columns receding into the dark
  // curtain-wall mullions: some bent, some gone
  for(let x=-8.6;x<7.3;x+=1.45){if(r()<0.22||(x>-3.9&&x<-3.1)||(x>3.7&&x<4.6))continue;const bend=(r()-.5)*(r()<.35?0.5:0.04);mm(x,0.25,-7.1,x+0.07,3.0,-7.0,2,0,bend)}
  mm(-8.6,1.25,-7.1,-4,1.32,-7.0,2,0,0.03);mm(-3,2.45,-7.1,3.6,2.52,-7.0,2,0,-0.05);mm(4.7,1.25,-7.1,7.2,1.32,-7.0,2,0,0.08);
  for(const[x,y,w,h,rz]of[[-7.4,1.4,1.3,1.0,0.0],[-0.4,2.5,1.3,0.5,0.1],[5.8,1.35,1.3,1.1,-0.05]]){const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.03),GLASSM);g.position.set(x,y+h/2,-7.05);g.rotation.z=rz;mscene.add(g)}
  // ceiling debris, rebar and hanging tiles
  for(let i=0;i<14;i++){const x=-5+r()*9,z=-3.1+r()*1.2,l=0.8+r()*1.6;mm(x,3.7-l,z,x+0.04,3.7,z+0.04,8,0,(r()-.5)*0.25)}
  for(let i=0;i<7;i++){const x=-8+r()*14,z=-2+r()*12;mm(x,3.55,z,x+1.2,3.7,z+0.6,6,r()*0.5,(r()-.5)*0.9)}
  mm(-6,0,-3.6,-3.2,0.5,-2,0,0.4,0,0.1);mm(-1,0,-5.2,1.2,0.35,-4.4,0,-0.3);mm(1.4,0,-4.4,2.4,0.25,-3.6,0,0.6);          // rubble
  // abandoned furniture: tipped desk, chairs, cabinet, stacked boxes
  mm(3,0,-3,5,0.75,-2.2,9,0.3,0,0.0);mm(3.2,0.75,-2.9,3.4,1.5,-2.7,9,0.3);mm(-9,0,-5.5,-7.8,1.4,-4.7,2,0.6);
  mm(5.2,0,-2,5.8,0.5,-1.4,2,0.4);mm(6.4,0,-4,7,0.5,-3.4,2,-0.5,0,0.5);mm(0.5,0,-1,1.1,0.45,-0.4,2,1.2);
  mm(8,0,-5.5,9.6,0.5,-4.6,8);mm(8.1,0.5,-5.4,9.4,1.0,-4.7,8,0.1);mm(-12,0,-6,-11,1.7,-5,2,0.2);
  // scattered paper (thin white quads)
  for(let i=0;i<46;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.21),new THREE.MeshLambertMaterial({color:0xe9e2cf,side:THREE.DoubleSide}));p.rotation.set(-Math.PI/2,0,r()*6.28);p.position.set(-9+r()*17,0.012+r()*0.01,-6.5+r()*13);p.receiveShadow=true;mscene.add(p)}
  // glass shards near the edge
  for(let i=0;i<28;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(0.08+r()*0.2,0.05+r()*0.14),new THREE.MeshBasicMaterial({color:0xcfeaf2,transparent:true,opacity:0.55,side:THREE.DoubleSide}));p.rotation.set(-Math.PI/2,0,r()*6.28);p.position.set(-7+r()*14,0.02,-6.8+r()*2.2);mscene.add(p)}
}

// ---- the city: ~4000 instanced slabs, haze-faded with distance ----
const CITY_N=4400;
const cityMat=new THREE.MeshLambertMaterial({color:0xffffff});
cityMat.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 iw=vec4(transformed,1.0);mat3 im=mat3(modelMatrix);
    #ifdef USE_INSTANCING
    iw=instanceMatrix*iw;im=im*mat3(instanceMatrix);
    #endif
    vWP=(modelMatrix*iw).xyz;vWN=normalize(im*normal);`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
    .replace('#include <map_fragment>',`#include <map_fragment>
    float u=vWP.x+vWP.z;float fy=fract(vWP.y/3.8);float bay=floor(u/3.2);float fid=floor(vWP.y/3.8);float h=fract(sin(dot(vec2(bay,fid),vec2(12.9,78.2)))*43758.5);
    float mask=step(.30,fy)*step(fy,.84)*(1.-step(.22,fract(u/3.2)))*(1.-step(.5,vWN.y));
    vec3 glass=mix(vec3(.10,.13,.16),vec3(.62,.50,.40),h*h);
    diffuseColor.rgb=mix(diffuseColor.rgb,glass,mask);`)};
const city=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),cityMat,CITY_N);
const roofM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0x6a6560}),CITY_N);
{const r=rng(42),mat=new THREE.Matrix4(),col=new THREE.Color();let n=0,rn=0;const P0=80;
  for(let i=-30;i<=30&&n<CITY_N;i++)for(let j=1;j>-38&&n<CITY_N;j--){
    const cx=i*P0+48,cz=j*P0+48,dx=cx-mcam.position.x,dz=cz-mcam.position.z,d=Math.hypot(dx,dz);
    if(Math.abs(cx)<70&&cz>-30)continue;                                              // our own building
    if(r()<0.06)continue;                                                              // empty lots
    const w=44+r()*20,dep=44+r()*20,far=Math.min(1,Math.max(0,(d-120)/1500));
    const cap=(Math.pow(r(),1.5)*(70+90*(1-far))+30)+Math.pow(r(),2.2)*far*340+(r()<0.05?far*180:0);   // low near us, a towering skyline in the distance
    const top=GROUND+Math.min(cap,d<260?175:480);
    mat.compose(new THREE.Vector3(cx+(r()-.5)*4,(top+GROUND)/2,cz+(r()-.5)*4),new THREE.Quaternion(),new THREE.Vector3(w,top-GROUND,dep));city.setMatrixAt(n,mat);
    const g=0.55+r()*0.3,warm=r()*0.08;col.setRGB(g+warm,g,g-warm*0.7);if(r()<0.1)col.multiplyScalar(0.55);city.setColorAt(n,col);n++;
    if(r()<0.7){const rw=w*(0.2+r()*0.3),rd=dep*(0.2+r()*0.3),rh=3+r()*10;mat.compose(new THREE.Vector3(cx+(r()-.5)*(w-rw),top+rh/2,cz+(r()-.5)*(dep-rd)),new THREE.Quaternion(),new THREE.Vector3(rw,rh,rd));roofM.setMatrixAt(rn++,mat)}
    if(r()<0.1){mat.compose(new THREE.Vector3(cx,top+18+r()*10,cz),new THREE.Quaternion(),new THREE.Vector3(0.6,36+r()*20,0.6));roofM.setMatrixAt(rn++,mat)}                       // antennas
  }
  city.count=n;roofM.count=rn;city.instanceMatrix.needsUpdate=true;city.instanceColor.needsUpdate=true;roofM.instanceMatrix.needsUpdate=true;city.frustumCulled=false;roofM.frustumCulled=false}
mscene.add(city,roofM);
const mground=makeGround(GROUND,9000,80,16);mground.material.uniforms.uFog.value=M.fog;mground.material.uniforms.uNear.value=70;mground.material.uniforms.uFar.value=3400;mscene.add(mground);
// tower cranes frozen mid-job
for(const[x,z,h]of[[-190,-420,210],[260,-700,300],[40,-1300,380]]){const g=new THREE.Group(),dk=new THREE.MeshLambertMaterial({color:0x7a6f62});
  const mast=new THREE.Mesh(new THREE.BoxGeometry(3,h,3),dk);mast.position.y=h/2;g.add(mast);const jib=new THREE.Mesh(new THREE.BoxGeometry(h*0.7,2.2,2.2),dk);jib.position.set(h*0.2,h+3,0);g.add(jib);
  const cw=new THREE.Mesh(new THREE.BoxGeometry(10,8,6),dk);cw.position.set(-h*0.14,h-2,0);g.add(cw);g.position.set(x,GROUND+(0),z);g.rotation.y=0.6;mscene.add(g)}
// smoke columns
const cloudTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d'),r=rng(5);
  for(let i=0;i<46;i++){const x=40+r()*176,y=30+r()*60,rad=16+r()*36,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,6.283);g.fill()}
  const t=new THREE.CanvasTexture(c);return t})();
const smokeMat=new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,color:0x3b3633,opacity:0.5,fog:true});
for(const[x,z]of[[-420,-900],[170,-1500],[-80,-620]])for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(120+i*26,60+i*14),smokeMat);m.position.set(x+i*10,GROUND+30+i*50,z);m.lookAt(mcam.position.x,m.position.y,mcam.position.z);mscene.add(m)}

// ---- clouds (billboards, slow drift) ----
const CL=[];
{const r=rng(8),cm=new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,color:0xffe3c4,opacity:0.78,fog:false});
  for(let i=0;i<26;i++){const w=500+r()*1100,m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*0.38),cm);
    const z=-900-r()*2800;m.position.set((r()-.5)*4200,140+r()*520,z);m.lookAt(0,m.position.y,0);mscene.add(m);CL.push({m,s:2+r()*5})}}

// ---- birds ----
const birdMat=new THREE.MeshBasicMaterial({color:0x17130f,side:THREE.DoubleSide});
const wingG=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0,.16, 1.15,0,.22, 1.0,0,-.3, 0,0,.16, 1.0,0,-.3, 0,0,-.16]),3));g.computeVertexNormals();return g})();
function makeBird(scale){const b=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.14,0.62),birdMat);b.add(body);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.1,0.16),birdMat);head.position.z=-0.36;b.add(head);
  const wl=new THREE.Mesh(wingG,birdMat),wr=new THREE.Mesh(wingG,birdMat);wr.position.x=0.08;wl.position.x=-0.08;wl.scale.x=-1;b.add(wl,wr);b.scale.setScalar(scale);b.userData={wl,wr};mscene.add(b);return b}
const FLOCKS=[];
function flock(cx,cy,cz,R,n,speed,scale,spread,flap){const f={c:new THREE.Vector3(cx,cy,cz),R,speed,flap,birds:[]};const r=rng(Math.floor(cx*3+cz));
  for(let i=0;i<n;i++)f.birds.push({m:makeBird(scale*(0.85+r()*0.3)),off:i*0.16+r()*0.1,dy:(r()-.5)*spread,dr:(r()-.5)*spread*1.4,ph:r()*6.28});FLOCKS.push(f)}
flock(30,28,-170,70,9,0.16,1.6,10,7.5);flock(-50,4,-95,48,5,0.2,1.3,6,8.5);flock(0,10,-52,34,3,0.23,1.1,4,9);flock(90,95,-430,160,16,0.11,3.2,24,6.5);flock(-130,60,-300,110,7,0.14,2.2,14,7);
function updMenu(dt){M.t+=dt;MSKY.uTime.value=M.t;
  for(const c of CL){c.m.position.x+=c.s*dt;if(c.m.position.x>2600)c.m.position.x=-2600}
  for(const f of FLOCKS)for(const b of f.birds){const a=M.t*f.speed+b.off,R=f.R+b.dr,x=f.c.x+Math.cos(a)*R,z=f.c.z+Math.sin(a)*R,y=f.c.y+b.dy+Math.sin(a*3+b.ph)*2.5;
    b.m.position.set(x,y,z);b.m.rotation.y=-a+Math.PI;b.m.rotation.z=0.25*Math.sin(a*2+b.ph);
    const fl=Math.sin(M.t*f.flap+b.ph)*0.6*(0.35+0.65*Math.max(0,Math.sin(M.t*0.5+b.ph*2)));b.m.userData.wl.rotation.z=-fl;b.m.userData.wr.rotation.z=fl}
  for(let i=0;i<DUST_N;i++){const j=i*3;dustA[j]+=Math.sin(M.t*0.2+i)*dt*0.05;dustA[j+1]+=Math.sin(M.t*0.13+i*1.7)*dt*0.04+dt*0.01;dustA[j+2]+=Math.cos(M.t*0.17+i)*dt*0.05;if(dustA[j+1]>3.6)dustA[j+1]=0.1}
  dust.geometry.attributes.position.needsUpdate=true}
// dust motes drifting in the sun shafts
const DUST_N=160,dustA=new Float32Array(DUST_N*3);{const r=rng(2);for(let i=0;i<DUST_N;i++){dustA[i*3]=-9+r()*18;dustA[i*3+1]=0.2+r()*3.3;dustA[i*3+2]=-6.5+r()*14}}
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustA,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:0xffe0b0,size:0.045,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));mscene.add(dust);
