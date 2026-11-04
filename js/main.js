// Main: post-process look, menu + level picker, UI, input, HUD (style meter + 2D hands), game loop.
const hud=$('hud'),hx=hud.getContext('2d');
const GS={state:'menu',back:'menu'};
const BEST_KEY='labyrinthus_best';let BEST={};try{BEST=JSON.parse(localStorage.getItem(BEST_KEY)||'{}')}catch(e){}

// ---- STYLE meter (ULTRAKILL-style rank fed by movement tricks; purely visual) ----
const RK=[0,12,30,60,100,160,240],RL=['D','C','B','A','S','SS','SSS'],RN=['DRIFTING','CLIMBING','BOUNCY','AIRBORNE','SOARING','SUPERSONIC','SKYBOUND'];
const RC=['#cfcbc0','#9ec7ff','#7be07a','#ffd33f','#ff9f2e','#ff6a2e','#ff3d5a'];
const ST={pts:0,rank:0,best:0,feed:[],recent:[],hold:0};
function style(n,p){if(ST.recent.includes(n))p*=0.4;ST.recent.push(n);if(ST.recent.length>3)ST.recent.shift();
  ST.pts=Math.min(300,ST.pts+p);ST.hold=0.9;ST.feed.unshift({n,t:2});if(ST.feed.length>5)ST.feed.pop()}
function styleTick(dt,sp,on){if(!on)return;ST.hold-=dt;if(sp>22)ST.pts=Math.min(300,ST.pts+dt*(sp-20)*0.35);
  if(ST.hold<=0)ST.pts=Math.max(0,ST.pts-dt*(3+ST.rank*5));
  let r=0;for(let i=0;i<RK.length;i++)if(ST.pts>=RK[i])r=i;ST.rank=r;ST.best=Math.max(ST.best,r);
  for(let i=ST.feed.length-1;i>=0;i--){ST.feed[i].t-=dt;if(ST.feed[i].t<=0)ST.feed.splice(i,1)}}
function styleReset(){ST.pts=0;ST.rank=0;ST.best=0;ST.feed.length=0;ST.recent.length=0;ST.hold=0}

// ---- post-process: low-res render, then ordered-dither + posterize + crushed contrast + vignette + scanlines + grain
//      (the grimy Buckshot-Roulette / White-Knuckle look). "Retro dither" in settings turns the quantizing off. ----
const postMat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
  uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uTime:{value:0},uSpeed:{value:0},uDither:{value:1}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uTime,uSpeed,uDither;varying vec2 vUv;
  float bay2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
  float bay4(vec2 a){return bay2(.5*a)*.25+bay2(a);}
  void main(){vec2 uv=vUv,c=uv-.5;float r=dot(c,c);float ab=.0016+uSpeed*.004*r;
    vec3 col=vec3(texture2D(tDiffuse,uv+c*ab).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-c*ab).b);
    if(uSpeed>.05){vec3 a=col;for(int i=1;i<4;i++)a+=texture2D(tDiffuse,uv-c*uSpeed*.025*float(i)).rgb;col=a/4.;}
    vec3 bl=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 o=vec2(cos(a),sin(a))*3./uRes;bl+=max(texture2D(tDiffuse,uv+o).rgb-.78,0.);}
    col+=bl*.15;
    vec2 px=floor(uv*uRes);float l=dot(col,vec3(.299,.587,.114));
    col=mix(vec3(l),col,.94);col=pow(max(col,0.),vec3(1.1));col=(col-.5)*1.16+.5;col*=1.04;
    col*=mix(vec3(.90,1.,1.07),vec3(1.08,1.,.9),smoothstep(.15,.85,l));
    col*=1.-smoothstep(.08,.72,r*1.7)*.6;
    col*=1.-.05*step(.5,fract(px.y*.5))*uDither;
    col+=(fract(sin(dot(px+uTime,vec2(12.9898,78.233)))*43758.5453)-.5)*(.03+.035*uDither);
    float L=mix(255.,7.,uDither);col=floor(col*L+bay4(px))/L;
    gl_FragColor=vec4(clamp(col,0.,1.),1.);}`});
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));
let RT=null;
function resize(){
  renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);cam.aspect=mcam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();mcam.updateProjectionMatrix();
  const w=Math.max(2,Math.floor(innerWidth/S.pix)),h=Math.max(2,Math.floor(innerHeight/S.pix));if(RT)RT.dispose();
  const M_=(S.pix<=2&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget)?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
  RT=new M_(w,h,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});if('samples'in RT)RT.samples=4;
  postMat.uniforms.tDiffuse.value=RT.texture;postMat.uniforms.uRes.value.set(w,h);SNAPU.value.set(w/2,h/2);
  hud.width=Math.floor(innerWidth/S.hud);hud.height=Math.floor(innerHeight/S.hud)}
addEventListener('resize',resize);resize();

// ---- UI ----
const SCREENS=['menu','levels','pause','settings','win'];
const show=id=>SCREENS.forEach(s=>$(s).hidden=s!==id);
let toastT=0;function toast(m,ms=1500){const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms)}
const SET=[['sens','Mouse sensitivity',0.2,3,0.1],['fov','Field of view',70,120,1],['pix','3D pixel size',1,8,1],['hud','HUD pixel size',1,4,1],['music','Music volume',0,1,0.05],['sfx','SFX volume',0,1,0.05]];
const CHK=[['dither','Retro dither + posterize'],['invert','Invert Y axis'],['reduce','Reduce motion (no shake, tilt, FOV kick, speed blur)'],['bigHud','Large HUD']];
const ACT=[['fwd','Forward'],['back','Back'],['left','Left'],['right','Right'],['jump','Jump / air jump / wall jump'],['dash','Dash'],['slide','Slide / slam'],['punch','Punch'],['reset','Back to checkpoint']];
let rebind=null,lastBind=0;
const lab=c=>c.startsWith('Mouse')?'MOUSE '+(+c.slice(5)+1):c.replace(/^(Key|Digit)/,'').replace('Left','L').replace('Right','R').toUpperCase();
function build(){let h='';const setEl=$('set');
  for(const[k,n,a,b,s]of SET)h+=`<label>${n}<span id="v_${k}">${S[k]}</span><input type=range data-k="${k}" min=${a} max=${b} step=${s} value=${S[k]}></label>`;
  for(const[k,n]of CHK)h+=`<label class=ck><input type=checkbox data-c="${k}" ${S[k]?'checked':''}>${n}</label>`;
  h+='<h2>KEYBINDS</h2>';
  for(const[k,n]of ACT)h+=`<div class=kb>${n}<button data-b="${k}">${rebind===k?'PRESS A KEY...':lab(S.binds[k])}</button></div>`;
  setEl.innerHTML=h+'<br><button id="rst">RESET DEFAULTS</button>';
  const B_=S.binds,l=c=>'<kbd>'+lab(c)+'</kbd>';
  $('help').innerHTML=l(B_.fwd)+l(B_.left)+l(B_.back)+l(B_.right)+' move / <kbd>MOUSE</kbd> look<br>'+l(B_.jump)+' jump, x3 in air, or off walls<br>'+l(B_.dash)+' dash / '+l(B_.slide)+' slide, slam<br>Push into a ledge to mantle. '+l(B_.reset)+' checkpoint<br><br>'}
$('set').oninput=e=>{const d=e.target.dataset;if(d.k){S[d.k]=+e.target.value;$('v_'+d.k).textContent=S[d.k];if(d.k==='pix'||d.k==='hud')resize();if(d.k==='music')Aud.vol()}else if(d.c){S[d.c]=e.target.checked;postMat.uniforms.uDither.value=S.dither?1:0}save()};
$('set').onclick=e=>{const t=e.target;if(Date.now()-lastBind<300)return;
  if(t.dataset.b){rebind=t.dataset.b;build()}else if(t.id==='rst'){S=JSON.parse(JSON.stringify(DEF));save();resize();Aud.vol();postMat.uniforms.uDither.value=S.dither?1:0;build()}};
addEventListener('keydown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){S.binds[rebind]=e.code;save()}rebind=null;build()},true);
addEventListener('mousedown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();S.binds[rebind]='Mouse'+e.button;save();rebind=null;lastBind=Date.now();build()},true);
build();postMat.uniforms.uDither.value=S.dither?1:0;

const fmtT=t=>{const m=Math.floor(t/60);return m+':'+(t-m*60).toFixed(2).padStart(5,'0')};
function buildLevels(){$('lvlList').innerHTML=LEVELS.map((L,i)=>`<button class="card" data-i="${i}"><span class="cn">${String(L.id).padStart(2,'0')}</span><span class="ct">${L.name}</span><span class="cg">${L.tag}</span><span class="cd">${L.desc}</span>
  <span class="cm"><b>LENGTH</b> ${L.len}</span><span class="cm"><b>BEST</b> ${BEST[L.id]?fmtT(BEST[L.id]):'--:--.--'}</span></button>`).join('')}
$('lvlList').onclick=e=>{const c=e.target.closest('.card');if(c){snd('click');startRun(+c.dataset.i)}};

function clearInput(){for(const c in keys)keys[c]=false;dashReq=slideReq=slamReq=punchReq=false}
function startRun(i){if(i===undefined)i=LV;loadLevel(i);styleReset();P.cp=0;P.time=0;respawn();GS.state='play';show('');Aud.music('game');glc.requestPointerLock();toast('LEVEL '+LEVELS[i].id+'  /  '+LEVELS[i].name+'  /  '+envLabel(),2600)}
function toMenu(){GS.state='menu';show('menu');document.exitPointerLock();Aud.music('menu');Aud.amb(null)}
function openSettings(from){GS.back=from;rebind=null;build();show('settings')}
function win(){GS.state='win';document.exitPointerLock();const t=P.time,id=LEVELS[LV].id,old=BEST[id];let note='';
  if(!old||t<old){BEST[id]=t;try{localStorage.setItem(BEST_KEY,JSON.stringify(BEST))}catch(e){}note=old?'  /  NEW BEST':'  /  FIRST CLEAR'}
  $('winT').textContent='TIME '+fmtT(t)+note+'  /  BEST STYLE: '+RL[ST.best]+' '+RN[ST.best];$('winL').textContent=LEVELS[LV].name+' CLEARED';show('win');snd('win')}
const clk=fn=>()=>{snd('click');fn()};
$('bPlay').onclick=clk(()=>{buildLevels();show('levels')});$('bSet').onclick=clk(()=>openSettings('menu'));$('bQuit').onclick=clk(()=>{try{window.close()}catch(e){}toast('CLOSE THE TAB TO QUIT')});
$('bLvlBack').onclick=clk(()=>show('menu'));
$('bResume').onclick=clk(()=>glc.requestPointerLock());$('bRestart').onclick=clk(()=>startRun(LV));$('bSet2').onclick=clk(()=>openSettings('pause'));$('bMenu').onclick=clk(toMenu);
$('bBack').onclick=clk(()=>{rebind=null;show(GS.back)});$('bAgain').onclick=clk(()=>startRun(LV));$('bMenu2').onclick=clk(toMenu);
addEventListener('pointerdown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
addEventListener('keydown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
document.addEventListener('pointerlockchange',()=>{if(GS.state!=='play')return;if(document.pointerLockElement)show('');else{clearInput();show('pause')}});
document.addEventListener('pointerlockerror',()=>{if(GS.state==='play')show('pause')});

// ---- input ----
function down(c){const B_=S.binds;keys[c]=true;
  if(c===B_.jump){P.jumpBuf=0.12;P.jumpEdge=true}
  if(c===B_.dash)dashReq=true;
  if(c===B_.slide){slideReq=true;slamReq=true}
  if(c===B_.punch)punchReq=true;
  if(c===B_.reset){respawn();toast('CHECKPOINT')}}
addEventListener('keydown',e=>{if(!document.pointerLockElement)return;
  if(e.code==='Space'||e.code.startsWith('Control')||e.code.startsWith('Shift')||e.code==='Tab')e.preventDefault();if(!e.repeat)down(e.code)});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('mousedown',e=>{if(document.pointerLockElement)down('Mouse'+e.button)});
addEventListener('mouseup',e=>{keys['Mouse'+e.button]=false});
addEventListener('blur',clearInput);
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;const dx=e.movementX,dy=e.movementY;if(Math.abs(dx)>250||Math.abs(dy)>250)return;
  yaw-=dx*0.0022*S.sens;pitch=Math.max(-1.55,Math.min(1.55,pitch-dy*0.0022*S.sens*(S.invert?-1:1)))});

// ---- HUD ----
const INK='#ece9df',ACC='#ff5a1f',SH='#0a0a0a';
function txt(s,x,y,size,col){hx.font='bold '+size+'px "Courier New",monospace';hx.fillStyle=SH;hx.fillText(s,x+1,y+1);hx.fillStyle=col;hx.fillText(s,x,y)}
function pip(x,y,on,col){hx.fillStyle=SH;hx.fillRect(x-1,y-1,10,10);hx.fillStyle=on?col:'#4a4a46';hx.fillRect(x,y,8,8)}

// 2D hands (placeholder squares, white-knuckle style): each hand is sleeve + palm + 4 fingers + knuckles + thumb, all fillRects.
const HD=[{x:0,y:0,g:.3,s:1},{x:0,y:0,g:.3,s:1}];
function hand(cx,py,u,g,side,s){                                  // cx = palm centre x, py = palm top y, g = grip 0 (open) .. 1 (fist), s = extra scale
  u*=s;const pw=26*u,ph=20*u,x0=cx-pw/2,SK='#e8e4da',SD='#b3ad9f',OL='#0a0a0a',R=(x,y,w,h,c)=>{hx.fillStyle=c;hx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  R(cx-11*u,py+ph-1,22*u,200,OL);R(cx-10*u,py+ph,20*u,200,'#2d3135');R(cx-10*u,py+ph+6*u,20*u,2.5*u,ACC);                      // sleeve with a tape band
  const fl=[15,18,16,12].map(h=>h*u*(1-0.66*g)),fx=[0,6.6,13.2,19.8].map(v=>x0+v*u);
  R(x0-u,py-u,pw+2*u,ph+2*u,OL);R(x0,py,pw,ph,SK);R(x0,py+ph*0.62,pw,ph*0.38,SD);                                         // palm
  for(let i=0;i<4;i++){R(fx[i]-u,py-fl[i]-u,6.4*u,fl[i]+2*u,OL);R(fx[i],py-fl[i],5.4*u,fl[i]+u,SK);if(g>0.4){R(fx[i],py-fl[i],5.4*u,3*u,'#fff')}}   // fingers (curling shortens them)
  const kn=3.5*u+g*3*u;for(let i=0;i<4;i++){R(fx[i]-u*0.5,py-kn*0.5-u,6.4*u,kn+u,OL);R(fx[i],py-kn*0.5,5.4*u,kn,'#fdfcf8')}              // knuckles (white when gripping)
  const tx=side>0?x0-8*u:x0+pw+u,tw=7*u,th=g>0.5?7*u:14*u,ty=g>0.5?py+4*u:py+2*u;R(tx-u,ty-u,tw+2*u,th+2*u,OL);R(tx,ty,tw,th,SK)}                // thumb tucks in when gripping
function drawHands(dt,W,H,sp){
  const u=Math.max(1.5,W/300),amt=P.grounded?Math.min(sp/15,1):0,B_=P;
  let ws=0;if(B_.wall&&B_.wallN){const rx=Math.cos(yaw),rz=-Math.sin(yaw),d=(-B_.wallN[0])*rx+(-B_.wallN[1])*rz;ws=d>0?1:-1}            // wall on right (+1) or left (-1)
  const mt=B_.mantle?Math.sin(Math.min(1,B_.mantle.t)*Math.PI):0;
  for(let i=0;i<2;i++){const side=i?1:-1,h=HD[i];
    let tx=W/2+side*(W*0.15)-B_.sway*60,ty=H-30*u,tg=0.35,ts=1;
    ty+=Math.sin(B_.bob*side)*2.4*u*amt+Math.sin(T*1.4+i)*0.8*u;
    if(!B_.grounded){ty-=7*u;tg=0.05}
    if(B_.sliding){ty+=16*u;tx+=side*W*0.08;tg=0.8}
    if(B_.dashT>0){ty-=5*u;tx-=side*W*0.04;tg=0.7;tx+=(Math.random()-.5)*2*u}
    if(B_.slamming){ty-=12*u;tg=1}
    if(ws&&ws===side){ty=H-64*u;tx=W/2+side*(W*0.2);tg=1}                                                                            // grab the wall
    if(mt>0){ty-=mt*50*u;tx-=side*W*0.02;tg=1}
    if(B_.swingT>0&&B_.hand===i){const ps=1-B_.swingT/PD,e=ps<0.15?-0.2*ps/0.15:ps<0.4?-0.2+1.2*(1-(1-(ps-0.15)/0.25)**2):1-(ps-0.4)/0.6;ty-=e*46*u;tx-=side*e*W*0.09;tg=1;ts=1+0.35*Math.max(0,e)}
    const k=Math.min(1,dt*16);h.x+=(tx-h.x)*k;h.y+=(ty-h.y)*k;h.g+=(tg-h.g)*k;h.s+=(ts-h.s)*k;
    hand(h.x,h.y,u,h.g,side,h.s)}}

function drawHud(dt,sp,state){
  const kk=S.bigHud?1.5:1;hx.setTransform(1,0,0,1,0,0);hx.clearRect(0,0,hud.width,hud.height);if(GS.state==='menu')return;
  hx.setTransform(kk,0,0,kk,0,0);const W=hud.width/kk,H=hud.height/kk,bx=14,by=H-14;
  if(GS.state==='play')drawHands(dt,W,H,sp);
  txt(state,bx,by,11,state==='WALL'||state==='DASH'||state==='MANTLE'?ACC:INK);
  for(let i=0;i<3;i++){const x=bx+i*26,y=by-30;hx.fillStyle=SH;hx.fillRect(x-1,y-1,24,8);hx.fillStyle='#4a4a46';hx.fillRect(x,y,22,6);hx.fillStyle=INK;hx.fillRect(x,y,Math.round(22*Math.max(0,Math.min(1,P.stamina-i))),6)}
  for(let i=0;i<3;i++)pip(bx+i*12,by-50,i<P.wj,ACC);
  for(let i=0;i<AIRJ;i++)pip(bx+44+i*12,by-50,i<P.aj,INK);
  txt(sp.toFixed(1),bx,by-58,22,ACC);
  txt('L'+LEVELS[LV].id+' '+LEVELS[LV].name,14,18,10,INK);txt(envLabel(),14,30,9,'#9a968c');
  const t=P.time;txt(fmtT(t),W-80,22,13,INK);txt('ALT '+Math.max(0,Math.round(P.pos.y))+'M',W-80,34,9,'#9a968c');
  {const col=RC[ST.rank],px=W-14,lo=RK[ST.rank],hi=RK[ST.rank+1]||RK[ST.rank]+60,f=Math.max(0,Math.min(1,(ST.pts-lo)/(hi-lo)));
   hx.textAlign='right';txt(RL[ST.rank],px,76,40,col);
   hx.textAlign='left';hx.fillStyle=SH;hx.fillRect(W-124,82,112,8);hx.fillStyle='#3a3a37';hx.fillRect(W-123,83,110,6);hx.fillStyle=col;hx.fillRect(W-123,83,Math.round(110*f),6);
   hx.textAlign='right';txt(RN[ST.rank],px,102,10,col);
   ST.feed.forEach((e,i)=>{hx.globalAlpha=Math.min(1,e.t);txt(e.n,px,118+i*12,9,i?INK:ACC);hx.globalAlpha=1});hx.textAlign='left'}
  const cx=Math.floor(W/2),cy=Math.floor(H/2);hx.fillStyle=INK;hx.fillRect(cx-1,cy-1,2,2);hx.fillRect(cx-6,cy,3,1);hx.fillRect(cx+3,cy,3,1);hx.fillRect(cx,cy-6,1,3);hx.fillRect(cx,cy+3,1,3)}

// ---- loop ----
let last=performance.now(),acc=0;const vp=new THREE.Vector3();
function checkpoints(){const p=P.pos;
  for(let i=P.cp+1;i<CP.length;i++){const c=CP[i].p;if(Math.hypot(p.x-c[0],p.z-c[2])<4&&Math.abs(p.y-c[1])<3){P.cp=i;toast('CHECKPOINT');snd('checkpoint');style('CHECKPOINT',15)}}
  if(Math.hypot(p.x-GOAL.x,p.z-GOAL.z)<2.5&&Math.abs(p.y-GOAL.y)<3)win()}
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.max(0,Math.min((t-last)/1000,0.05));last=t;T+=dt;
  const playing=GS.state==='play'&&!!document.pointerLockElement;
  const v=P.vel,sp=Math.hypot(v.x,v.z),rm=S.reduce?0:1;
  if(GS.state==='menu'){
    updMenu(dt);postMat.uniforms.uSpeed.value=0;postMat.uniforms.uTime.value=T%100;
    renderer.setRenderTarget(RT);renderer.render(mscene,mcam);renderer.setRenderTarget(null);renderer.render(postScene,postCam);drawHud(dt,0,'');return}
  if(playing){acc+=dt;while(acc>=FIXED){P.prev.copy(P.pos);step(FIXED);acc-=FIXED}P.time+=dt;checkpoints();
    if(P.pos.y<CP[P.cp].p[1]-50){respawn();toast('RESPAWN')}}
  vp.copy(P.prev).lerp(P.pos,acc/FIXED);
  P.camY+=((P.sliding?0.75:1.6)-P.camY)*Math.min(1,dt*14);P.stepOff*=Math.max(0,1-dt*14);P.shake=Math.max(0,P.shake-dt*2.5);
  const sx=Math.sin(T*83)*P.shake*0.06*rm,sy=Math.cos(T*71)*P.shake*0.06*rm,sd=((keys[S.binds.right]?1:0)-(keys[S.binds.left]?1:0))*rm;
  cam.position.set(vp.x+sx,vp.y+P.camY+P.stepOff+sy,vp.z);cam.rotation.set(pitch,yaw,-sd*0.025);
  P.fov+=(S.fov+rm*(Math.min(sp,40)*0.5+(P.dashT>0?18:0))-P.fov)*Math.min(1,dt*10);cam.fov=P.fov;cam.updateProjectionMatrix();
  updFx(dt);updLamps(cam.position);updEnv(dt,cam.position);
  sky.position.copy(cam.position);dl.position.copy(cam.position).addScaledVector(SUN,120);dl.target.position.copy(cam.position);
  WATER.uniforms.uTime.value=T;SKYU.uTime.value=T;CLOUDS.material.uniforms.uTime.value=T;postMat.uniforms.uTime.value=T%100;postMat.uniforms.uSpeed.value=Math.min(sp/40,1)*rm;
  renderer.setRenderTarget(RT);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  drawHud(dt,sp,P.mantle?'MANTLE':P.dashT>0?'DASH':P.slamming?'SLAM':P.sliding?'SLIDE':P.slamT>0?'SLAM READY - JUMP':P.wall?'WALL':P.inW?'WATER':P.grounded?(sp>1?'RUN':'IDLE'):'AIR');
}
show('menu');requestAnimationFrame(loop);
