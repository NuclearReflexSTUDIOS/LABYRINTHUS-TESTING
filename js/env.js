// Time of day + weather. rollEnv() is called on every level load: it picks dawn / day / dusk / night at random, then a 50% chance of
// one weather type (rain, thunder, snow, fog, pour). Everything is driven through ENV (see level.js) so the sky, fog, lights, windows and particles agree.
const TODS=['dawn','day','dusk','night'],WEATHERS=['rain','thunder','snow','fog','pour'];
const TOD_P={
  dawn :{top:[.20,.26,.48],mid:[.78,.52,.48],hor:[1,.70,.48],sun:[1,.62,.38],sunI:.9,hs:[.78,.60,.60],hg:[.40,.36,.36],hI:.5,fog:[.85,.68,.60],night:.25,elev:.14},
  day  :{top:[.20,.40,.70],mid:[.55,.71,.85],hor:[.87,.89,.89],sun:[1,.93,.78],sunI:1.05,hs:[.75,.82,.87],hg:[.54,.52,.47],hI:.55,fog:[.79,.82,.83],night:0,elev:.42},
  dusk :{top:[.12,.15,.35],mid:[.62,.34,.44],hor:[1,.48,.28],sun:[1,.45,.2],sunI:.85,hs:[.65,.45,.55],hg:[.33,.28,.30],hI:.45,fog:[.70,.50,.48],night:.6,elev:.11},
  night:{top:[.005,.015,.05],mid:[.02,.04,.10],hor:[.05,.08,.15],sun:[.55,.65,1],sunI:.5,hs:[.20,.27,.46],hg:[.08,.09,.14],hI:.5,fog:[.05,.08,.13],night:1,elev:.5}};
// weather = multipliers on the time-of-day look (+ particle settings)
const WX_P={
  rain   :{cloud:.85,sunK:.4 ,hemiK:.85,desat:.40,fogN:25,fogF:330,fogGray:.35,rain:{n:.55,speed:30,wind:.10,len:.9 ,alpha:.30}},
  pour   :{cloud:1  ,sunK:.22,hemiK:.80,desat:.60,fogN:12,fogF:200,fogGray:.55,rain:{n:1  ,speed:44,wind:.28,len:1.5,alpha:.42}},
  thunder:{cloud:1  ,sunK:.25,hemiK:.80,desat:.55,fogN:15,fogF:230,fogGray:.50,rain:{n:.8 ,speed:40,wind:.22,len:1.3,alpha:.38}},
  snow   :{cloud:.8 ,sunK:.55,hemiK:1.1,desat:.35,fogN:15,fogF:260,fogGray:.45,whiten:.35,snow:{n:1,speed:3.2,wind:.25,size:3.4}},
  fog    :{cloud:.55,sunK:.5 ,hemiK:1.0,desat:.30,fogN:3 ,fogF:115,fogGray:.55,whiten:.2}};
const BASEC={top:new THREE.Color(),mid:new THREE.Color(),hor:new THREE.Color(),fog:new THREE.Color(),sun:new THREE.Color(),hs:new THREE.Color(),hg:new THREE.Color()};
const WIND={g:1,rb:.1,sb:.25,ro:0,so:0};
const CUR={tod:'day',wx:null,flash:0,nextFlash:6,thunderT:-1,vis:1,base:{hI:.55,sunI:1},flashing:false};
const LUM=c=>c.r*.299+c.g*.587+c.b*.114;
const desat=(c,k)=>{const l=LUM(c);c.r+=(l-c.r)*k;c.g+=(l-c.g)*k;c.b+=(l-c.b)*k;return c};
const pick=a=>a[Math.floor(Math.random()*a.length)];

// ---- precipitation: GPU-animated streaks (rain) and flakes (snow), wrapped in a box around the camera ----
const PBOX=new THREE.Vector3(46,34,46);
const rainU={uCam:{value:new THREE.Vector3()},uTime:{value:0},uSpeed:{value:30},uWind:{value:.1},uWOff:{value:0},uLen:{value:.9},uOn:{value:0},uBox:{value:PBOX},uAlpha:{value:.3},uCol:{value:new THREE.Color(.75,.85,1)}};
const rainG=(()=>{const N=5200,pos=new Float32Array(N*6),end=new Float32Array(N*2),rnd=new Float32Array(N*2),r=rng(77);
  for(let i=0;i<N;i++){const x=r(),y=r(),z=r(),q=r();for(let k=0;k<2;k++){pos.set([x,y,z],i*6+k*3);end[i*2+k]=k;rnd[i*2+k]=q}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aEnd',new THREE.BufferAttribute(end,1));g.setAttribute('aRnd',new THREE.BufferAttribute(rnd,1));return g})();
const RAIN=new THREE.LineSegments(rainG,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:rainU,
  vertexShader:`uniform vec3 uCam,uBox;uniform float uTime,uSpeed,uWind,uLen,uOn,uWOff;attribute float aEnd;attribute float aRnd;varying float vA;
  void main(){vec3 p=position*uBox;p.y-=uSpeed*uTime*(.85+aRnd*.3);p.x+=uWOff;
    vec3 q=mod(p-uCam+uBox*.5,uBox)-uBox*.5;vec3 w=uCam+q;vec3 vel=normalize(vec3(uWind,-1.,0.));w-=vel*uLen*aEnd;
    float d=length(q);vA=step(aRnd,uOn)*(1.-aEnd*.8)*(1.-smoothstep(14.,23.,d));gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
  fragmentShader:'uniform vec3 uCol;uniform float uAlpha;varying float vA;void main(){gl_FragColor=vec4(uCol,vA*uAlpha);}'}));
RAIN.frustumCulled=false;RAIN.visible=false;scene.add(RAIN);
const snowU={uCam:{value:new THREE.Vector3()},uTime:{value:0},uSpeed:{value:3.2},uWind:{value:.25},uWOff:{value:0},uSize:{value:3.4},uOn:{value:0},uBox:{value:PBOX},uScale:{value:300}};
const snowG=(()=>{const N=3400,pos=new Float32Array(N*3),rnd=new Float32Array(N),r=rng(5);for(let i=0;i<N;i++){pos.set([r(),r(),r()],i*3);rnd[i]=r()}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aRnd',new THREE.BufferAttribute(rnd,1));return g})();
const SNOW=new THREE.Points(snowG,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:snowU,
  vertexShader:`uniform vec3 uCam,uBox;uniform float uTime,uSpeed,uWind,uSize,uOn,uScale,uWOff;attribute float aRnd;varying float vA;
  void main(){vec3 p=position*uBox;p.y-=uSpeed*uTime*(.7+aRnd*.6);p.x+=sin(uTime*.6+aRnd*30.)*1.6+uWOff;p.z+=cos(uTime*.5+aRnd*17.)*1.2;
    vec3 q=mod(p-uCam+uBox*.5,uBox)-uBox*.5;vec4 mv=viewMatrix*vec4(uCam+q,1.);gl_Position=projectionMatrix*mv;
    float d=length(q);vA=step(aRnd,uOn)*(1.-smoothstep(16.,23.,d));gl_PointSize=clamp(uSize*(.6+aRnd*.8)*uScale/max(-mv.z,.5),1.,14.);}`,
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,1.,1.,vA*smoothstep(.5,.15,d)*.9);}'}));
SNOW.frustumCulled=false;SNOW.visible=false;scene.add(SNOW);

// ---- apply a time of day + weather ----
function setEnv(tod,wx){
  CUR.tod=tod;CUR.wx=wx;const p=TOD_P[tod],w=wx&&WX_P[wx];
  BASEC.top.setRGB(...p.top);BASEC.mid.setRGB(...p.mid);BASEC.hor.setRGB(...p.hor);BASEC.fog.setRGB(...p.fog);BASEC.sun.setRGB(...p.sun);BASEC.hs.setRGB(...p.hs);BASEC.hg.setRGB(...p.hg);
  let sunI=p.sunI,hI=p.hI,cloud=tod==='night'?.4:.45,fogN=40,fogF=tod==='night'?380:430;
  if(w){for(const k of['top','mid','hor','sun','hs'])desat(BASEC[k],w.desat);
    const g=LUM(BASEC.fog);BASEC.fog.lerp(new THREE.Color(g,g,g*1.03),w.fogGray);if(w.whiten)BASEC.fog.lerp(new THREE.Color(1,1,1).multiplyScalar(tod==='night'?.18:1),w.whiten*(tod==='night'?.4:1));
    BASEC.hor.lerp(BASEC.fog,.55);BASEC.mid.lerp(BASEC.fog,.3);sunI*=w.sunK;hI*=w.hemiK;cloud=w.cloud;fogN=w.fogN;fogF=w.fogF*(tod==='night'?.8:1)}
  // sun / moon direction: somewhere ahead, lower at dawn and dusk
  const az=(Math.random()-.5)*1.3;SUN.set(az,p.elev,-.8).normalize();
  ENV.night=p.night;ENV.cloud=cloud;ENV.fogNear=fogN;ENV.fogFar=fogF;CUR.base.hI=hI;CUR.base.sunI=sunI;
  ENV.top.copy(BASEC.top);ENV.mid.copy(BASEC.mid);ENV.hor.copy(BASEC.hor);ENV.fog.copy(BASEC.fog);ENV.sunCol.copy(BASEC.sun);ENV.hemiSky.copy(BASEC.hs);ENV.hemiGnd.copy(BASEC.hg);ENV.hemiI=hI;ENV.sunI=sunI;
  // precipitation
  RAIN.visible=SNOW.visible=false;
  if(w&&w.rain){const r=w.rain;rainU.uSpeed.value=r.speed;rainU.uWind.value=r.wind;rainU.uLen.value=r.len;rainU.uAlpha.value=r.alpha;rainU.uCol.value.copy(BASEC.fog).lerp(new THREE.Color(.85,.92,1),.55).multiplyScalar(tod==='night'?1.7:1.05);CUR.dens=r.n;RAIN.visible=true}
  else if(w&&w.snow){const s=w.snow;snowU.uSpeed.value=s.speed;snowU.uWind.value=s.wind;snowU.uSize.value=s.size;CUR.dens=s.n;SNOW.visible=true}
  WIND.rb=rainU.uWind.value;WIND.sb=snowU.uWind.value;CUR.flash=0;CUR.nextFlash=3+Math.random()*5;CUR.thunderT=-1;CUR.vis=1;
  applyEnv();
  if(typeof Aud!=='undefined')Aud.amb(wx)}
function rollEnv(tod,wx){tod=tod||pick(TODS);if(wx===undefined)wx=Math.random()<0.5?pick(WEATHERS):null;setEnv(tod,wx);return{tod,wx}}
const envLabel=()=>CUR.tod.toUpperCase()+(CUR.wx?' / '+CUR.wx.toUpperCase():'');

// ---- per-frame: lightning, precipitation follows the camera and fades inside buildings ----

// ---- lightning bolt: jagged forked line placed ahead of the camera on each flash ----
const BOLT_MAX=400,boltPos=new Float32Array(BOLT_MAX*6),boltGeo=new THREE.BufferGeometry();
boltGeo.setAttribute('position',new THREE.BufferAttribute(boltPos,3));boltGeo.setDrawRange(0,0);
const boltMat=new THREE.LineBasicMaterial({color:0xeaf2ff,transparent:true,opacity:0,fog:false,depthWrite:false,blending:THREE.AdditiveBlending});
const BOLT=new THREE.LineSegments(boltGeo,boltMat);BOLT.frustumCulled=false;BOLT.visible=false;scene.add(BOLT);
function makeBolt(cp){
  let n=0;const ang=(typeof yaw!=='undefined'?yaw:0)+(Math.random()-.5)*1.2,dist=160+Math.random()*320;
  const bx=cp.x-Math.sin(ang)*dist,bz=cp.z-Math.cos(ang)*dist;
  const seg=(a,b)=>{if(n>=BOLT_MAX)return;boltPos.set([a[0],a[1],a[2],b[0],b[1],b[2]],n*6);n++};
  const run=(x,y,z,ty,depth)=>{let px=x,py=y,pz=z;const steps=Math.max(4,Math.round((y-ty)/14));
    for(let i=1;i<=steps;i++){const t=i/steps,nx=px+(Math.random()-.5)*20*(depth?1.3:1)+(x-px)*0,ny=y+(ty-y)*t,nz=pz+(Math.random()-.5)*20;
      seg([px,py,pz],[nx,ny,nz]);
      if(depth<2&&Math.random()<.22)run(nx,ny,nz,ny-(40+Math.random()*90),depth+1);
      px=nx;py=ny;pz=nz}};
  run(bx,cp.y+300+Math.random()*80,bz,cp.y-60,0);
  boltGeo.setDrawRange(0,n*2);boltGeo.attributes.position.needsUpdate=true}
function updEnv(dt,cp){
  const inside=INT.some(i=>cp.x>i.x1&&cp.x<i.x2&&cp.z>i.z1&&cp.z<i.z2&&cp.y>i.y0&&cp.y<i.y1);
  CUR.vis+=((inside?0:1)-CUR.vis)*Math.min(1,dt*(inside?9:3));
  // wind gusts (smooth noise); offsets integrate so gusts never make the precipitation jump
  {const g=0.55+0.9*Math.max(0,Math.sin(T*.31)*Math.sin(T*.83+1.7)*.5+.5)*(CUR.wx==='thunder'||CUR.wx==='pour'?1.6:1);
   WIND.g+=(g-WIND.g)*Math.min(1,dt*0.8);
   rainU.uWind.value=WIND.rb*WIND.g;snowU.uWind.value=WIND.sb*WIND.g;
   WIND.ro+=rainU.uWind.value*rainU.uSpeed.value*dt;WIND.so+=snowU.uWind.value*snowU.uSpeed.value*dt;
   rainU.uWOff.value=WIND.ro;snowU.uWOff.value=WIND.so;
   if(CUR.wx==='fog'||CUR.wx==='rain'||CUR.wx==='snow'){const k=CUR.wx==='fog'?0.22:0.08;scene.fog.far=ENV.fogFar*(1+k*Math.sin(T*.12)+k*.5*Math.sin(T*.31+2));scene.fog.near=ENV.fogNear*(1+k*Math.sin(T*.12))}}
  // rain splashes where drops hit nearby surfaces
  if(RAIN.visible&&CUR.vis>0.6&&typeof burst==='function'&&typeof P!=='undefined'&&!P.vault){
    CUR.splT=(CUR.splT||0)-dt;if(CUR.splT<=0){CUR.splT=CUR.wx==='pour'||CUR.wx==='thunder'?0.025:0.06;
      const a=Math.random()*6.283,r=2+Math.random()*9,x=P.pos.x+Math.cos(a)*r,z=P.pos.z+Math.sin(a)*r;
      if(hitAt(x,P.pos.y-0.06,z,0.1))burst(x,P.pos.y+0.02,z,1,1.6,0xcfe6f5)}}
  if(BOLT.visible){boltMat.opacity=Math.min(1,CUR.flash*1.6);if(CUR.flash<=0.02)BOLT.visible=false}
  if(RAIN.visible){rainU.uCam.value.copy(cp);rainU.uTime.value=T;rainU.uOn.value=CUR.dens*CUR.vis}
  if(SNOW.visible){snowU.uCam.value.copy(cp);snowU.uTime.value=T;snowU.uOn.value=CUR.dens*CUR.vis;snowU.uScale.value=innerHeight*0.5/Math.tan(cam.fov*0.00872665)/Math.max(1,S.pix)}
  if(typeof Aud!=='undefined')Aud.ambLevel(0.35+0.65*CUR.vis);
  if(CUR.wx==='thunder'){CUR.nextFlash-=dt;
    if(CUR.nextFlash<=0){CUR.flash=1;makeBolt(cp);BOLT.visible=true;CUR.nextFlash=(Math.random()<.35?0.12:5+Math.random()*10);CUR.thunderT=0.35+Math.random()*2.4}
    if(CUR.thunderT>0){CUR.thunderT-=dt;if(CUR.thunderT<=0&&typeof Aud!=='undefined')Aud.thunder()}}
  if(CUR.flash>0.001||CUR.flashing){CUR.flash=Math.max(0,CUR.flash-dt*3.4);const f=CUR.flash;CUR.flashing=f>0;
    hemi.intensity=CUR.base.hI+f*1.5;dl.intensity=CUR.base.sunI+f*0.9;ENV.fog.copy(BASEC.fog).lerp(WHITE,f*0.45);ENV.hemiSky.copy(BASEC.hs).lerp(WHITE,f*0.5);
    scene.fog.color.copy(ENV.fog);scene.background.copy(ENV.fog);SKYU.uFlash.value=f*0.6;WATER.uniforms.uFog.value.copy(ENV.fog)}}
const WHITE=new THREE.Color(.8,.85,1);
