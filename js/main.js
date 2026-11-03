// Main: post-processing shader, main menu + cinematic, UI, input, HUD, game loop.
const hud=$('hud'),hx=hud.getContext('2d');
const G={state:'menu',back:'menu'};

// ---- post-process: renders the 3D scene at low-res, then upscales (nearest) with grade / vignette / aberration / grain / speed blur ----
const postMat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
  uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uTime:{value:0},uSpeed:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uTime,uSpeed;varying vec2 vUv;
  void main(){vec2 uv=vUv,c=uv-.5;float r=dot(c,c);float ab=.0012+uSpeed*.004*r;
    vec3 col=vec3(texture2D(tDiffuse,uv+c*ab).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-c*ab).b);
    if(uSpeed>.05){vec3 a=col;for(int i=1;i<4;i++)a+=texture2D(tDiffuse,uv-c*uSpeed*.025*float(i)).rgb;col=a/4.;}
    float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,.88);
    col*=mix(vec3(.94,.97,1.06),vec3(1.1,1.,.88),smoothstep(.15,.8,l));col=pow(col,vec3(.95));
    col*=1.-smoothstep(.12,.75,r*1.6)*.55;
    col+=(fract(sin(dot(floor(uv*uRes)+uTime,vec2(12.9898,78.233)))*43758.5453)-.5)*.04;
    gl_FragColor=vec4(col,1.);}`});
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));
let RT=null;
function resize(){
  renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
  const w=Math.max(2,Math.floor(innerWidth/S.pix)),h=Math.max(2,Math.floor(innerHeight/S.pix));if(RT)RT.dispose();
  const M=(S.pix<=2&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget)?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
  RT=new M(w,h,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});if('samples'in RT)RT.samples=4;
  postMat.uniforms.tDiffuse.value=RT.texture;postMat.uniforms.uRes.value.set(w,h);
  hud.width=Math.floor(innerWidth/S.hud);hud.height=Math.floor(innerHeight/S.hud)}
addEventListener('resize',resize);resize();

// ---- main-menu cinematic: a slow flight through the level ----
const path=new THREE.CatmullRomCurve3([[0,2.2,12],[0,1.3,-15],[0,3.5,-45],[0,8,-70],[0,14,-98],[0,22,-108],[5,21,-130],[5,19,-155],[5,22,-185],
  [29,28,-210],[4.5,34,-235],[-20,38,-210],[4.5,44,-185],[35,60,-130],[30,50,-60],[15,30,10]].map(a=>new THREE.Vector3(...a)),true,'centripetal');
const PLEN=path.getLength();let cu=0;
function cine(dt){cu=(cu+dt*7/PLEN)%1;const p=path.getPointAt(cu),q=path.getPointAt((cu+0.012)%1);
  cam.position.copy(p);cam.fov=70;cam.updateProjectionMatrix();cam.lookAt(q.x,q.y-0.5+Math.sin(T*0.3)*1.5,q.z)}

// ---- UI ----
const SCREENS=['menu','pause','settings','win'];
const show=id=>SCREENS.forEach(s=>$(s).hidden=s!==id);
let toastT=0;function toast(m){const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),1500)}
const SET=[['sens','Mouse sensitivity',0.2,3,0.1],['fov','Field of view',70,120,1],['pix','3D pixel size',1,8,1],['hud','HUD pixel size',1,4,1],['music','Music volume',0,1,0.05],['sfx','SFX volume',0,1,0.05]];
const CHK=[['invert','Invert Y axis'],['reduce','Reduce motion (no shake, tilt, FOV kick, speed blur)'],['bigHud','Large HUD']];
const ACT=[['fwd','Forward'],['back','Back'],['left','Left'],['right','Right'],['jump','Jump / air jump / wall jump'],['dash','Dash'],['slide','Slide / slam'],['punch','Punch'],['reset','Back to checkpoint']];
let rebind=null,lastBind=0;
const lab=c=>c.startsWith('Mouse')?'MOUSE '+(+c.slice(5)+1):c.replace(/^(Key|Digit)/,'').replace('Left','L').replace('Right','R').toUpperCase();
function build(){let h='';const setEl=$('set');
  for(const[k,n,a,b,s]of SET)h+=`<label>${n}<span id="v_${k}">${S[k]}</span><input type=range data-k="${k}" min=${a} max=${b} step=${s} value=${S[k]}></label>`;
  for(const[k,n]of CHK)h+=`<label class=ck><input type=checkbox data-c="${k}" ${S[k]?'checked':''}>${n}</label>`;
  h+='<h2>KEYBINDS</h2>';
  for(const[k,n]of ACT)h+=`<div class=kb>${n}<button data-b="${k}">${rebind===k?'PRESS A KEY...':lab(S.binds[k])}</button></div>`;
  setEl.innerHTML=h+'<br><button id="rst">RESET DEFAULTS</button>';
  const B=S.binds,l=c=>'<kbd>'+lab(c)+'</kbd>';
  $('help').innerHTML=l(B.fwd)+l(B.left)+l(B.back)+l(B.right)+' move / <kbd>MOUSE</kbd> look<br>'+l(B.jump)+' jump, x3 in air, or off walls<br>'+l(B.dash)+' dash / '+l(B.slide)+' slide, slam<br>Push into a ledge to mantle. '+l(B.reset)+' checkpoint<br><br>'}
$('set').oninput=e=>{const d=e.target.dataset;if(d.k){S[d.k]=+e.target.value;$('v_'+d.k).textContent=S[d.k];if(d.k==='pix'||d.k==='hud')resize();if(d.k==='music')Aud.vol()}else if(d.c)S[d.c]=e.target.checked;save()};
$('set').onclick=e=>{const t=e.target;if(Date.now()-lastBind<300)return;
  if(t.dataset.b){rebind=t.dataset.b;build()}else if(t.id==='rst'){S=JSON.parse(JSON.stringify(DEF));save();resize();Aud.vol();build()}};
addEventListener('keydown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){S.binds[rebind]=e.code;save()}rebind=null;build()},true);
addEventListener('mousedown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();S.binds[rebind]='Mouse'+e.button;save();rebind=null;lastBind=Date.now();build()},true);
build();

function clearInput(){for(const c in keys)keys[c]=false;dashReq=slideReq=slamReq=punchReq=false}
function startRun(){P.cp=0;P.time=0;respawn();G.state='play';show('');Aud.music('game');glc.requestPointerLock()}
function toMenu(){G.state='menu';show('menu');Aud.music('menu')}
function openSettings(from){G.back=from;rebind=null;build();show('settings')}
function win(){G.state='win';document.exitPointerLock();const t=P.time,m=Math.floor(t/60);$('winT').textContent='TIME '+m+':'+(t-m*60).toFixed(2).padStart(5,'0');show('win');snd('win')}
const clk=fn=>()=>{snd('click');fn()};
$('bPlay').onclick=clk(startRun);$('bSet').onclick=clk(()=>openSettings('menu'));$('bQuit').onclick=clk(()=>{try{window.close()}catch(e){}toast('CLOSE THE TAB TO QUIT')});
$('bResume').onclick=clk(()=>glc.requestPointerLock());$('bRestart').onclick=clk(startRun);$('bSet2').onclick=clk(()=>openSettings('pause'));$('bMenu').onclick=clk(toMenu);
$('bBack').onclick=clk(()=>{rebind=null;show(G.back)});$('bAgain').onclick=clk(startRun);$('bMenu2').onclick=clk(toMenu);
addEventListener('pointerdown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
addEventListener('keydown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
document.addEventListener('pointerlockchange',()=>{if(G.state!=='play')return;if(document.pointerLockElement)show('');else{clearInput();show('pause')}});
document.addEventListener('pointerlockerror',()=>{if(G.state==='play')show('pause')});

// ---- input ----
function down(c){const B=S.binds;keys[c]=true;
  if(c===B.jump){P.jumpBuf=0.12;P.jumpEdge=true}
  if(c===B.dash)dashReq=true;
  if(c===B.slide){slideReq=true;slamReq=true}
  if(c===B.punch)punchReq=true;
  if(c===B.reset){respawn();toast('CHECKPOINT')}}
addEventListener('keydown',e=>{if(!document.pointerLockElement)return;
  if(e.code==='Space'||e.code.startsWith('Control')||e.code.startsWith('Shift')||e.code==='Tab')e.preventDefault();if(!e.repeat)down(e.code)});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('mousedown',e=>{if(document.pointerLockElement)down('Mouse'+e.button)});
addEventListener('mouseup',e=>{keys['Mouse'+e.button]=false});
addEventListener('blur',clearInput);
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;const dx=e.movementX,dy=e.movementY;if(Math.abs(dx)>250||Math.abs(dy)>250)return;
  yaw-=dx*0.0022*S.sens;pitch=Math.max(-1.55,Math.min(1.55,pitch-dy*0.0022*S.sens*(S.invert?-1:1)))});

// ---- HUD ----
const INK='#e8e6df',ACC='#e0731c';
function txt(s,x,y,size,col){hx.font='bold '+size+'px "Courier New",monospace';hx.fillStyle='#111';hx.fillText(s,x+1,y+1);hx.fillStyle=col;hx.fillText(s,x,y)}
function pip(x,y,on,col){hx.fillStyle='#111';hx.fillRect(x-1,y-1,10,10);hx.fillStyle=on?col:'#3d3d3b';hx.fillRect(x,y,8,8)}
function drawHud(sp,state){
  const kk=S.bigHud?1.5:1;hx.setTransform(1,0,0,1,0,0);hx.clearRect(0,0,hud.width,hud.height);if(G.state==='menu')return;
  hx.setTransform(kk,0,0,kk,0,0);const W=hud.width/kk,H=hud.height/kk,bx=14,by=H-14;
  txt(state,bx,by,11,state==='WALL'||state==='DASH'||state==='MANTLE'?ACC:INK);
  for(let i=0;i<3;i++){const x=bx+i*26,y=by-30;hx.fillStyle='#111';hx.fillRect(x-1,y-1,24,8);hx.fillStyle='#3d3d3b';hx.fillRect(x,y,22,6);hx.fillStyle=INK;hx.fillRect(x,y,Math.round(22*Math.max(0,Math.min(1,P.stamina-i))),6)}
  for(let i=0;i<3;i++)pip(bx+i*12,by-50,i<P.wj,ACC);
  for(let i=0;i<AIRJ;i++)pip(bx+44+i*12,by-50,i<P.aj,INK);
  txt(sp.toFixed(1),bx,by-58,22,ACC);
  const t=P.time,m=Math.floor(t/60);txt(m+':'+(t-m*60).toFixed(2).padStart(5,'0'),W-80,22,13,INK);
  const cx=Math.floor(W/2),cy=Math.floor(H/2);hx.fillStyle=INK;hx.fillRect(cx-1,cy-1,2,2);hx.fillRect(cx-6,cy,3,1);hx.fillRect(cx+3,cy,3,1);hx.fillRect(cx,cy-6,1,3);hx.fillRect(cx,cy+3,1,3)}

// ---- loop ----
let last=performance.now(),acc=0,toastLast=0;const vp=new THREE.Vector3();
function checkpoints(){const p=P.pos;
  for(let i=P.cp+1;i<CP.length;i++){const c=CP[i].p;if(Math.hypot(p.x-c[0],p.z-c[2])<4&&Math.abs(p.y-c[1])<3){P.cp=i;toast('CHECKPOINT');snd('checkpoint')}}
  if(Math.hypot(p.x-GOAL.x,p.z-GOAL.z)<2.5&&Math.abs(p.y-GOAL.y)<3)win()}
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min((t-last)/1000,0.05);last=t;T+=dt;
  const playing=G.state==='play'&&!!document.pointerLockElement;
  if(playing){acc+=dt;while(acc>=FIXED){P.prev.copy(P.pos);step(FIXED);acc-=FIXED}P.time+=dt;checkpoints();
    if(P.pos.y<-25){respawn();toast('RESPAWN')}}
  const v=P.vel,sp=Math.hypot(v.x,v.z),rm=S.reduce?0:1;
  arms.forEach(a=>a.visible=G.state!=='menu');
  if(G.state==='menu')cine(dt);
  else{
    vp.copy(P.prev).lerp(P.pos,acc/FIXED);
    P.camY+=((P.sliding?0.75:1.6)-P.camY)*Math.min(1,dt*14);P.stepOff*=Math.max(0,1-dt*14);P.shake=Math.max(0,P.shake-dt*2.5);
    const sx=Math.sin(T*83)*P.shake*0.06*rm,sy=Math.cos(T*71)*P.shake*0.06*rm,sd=((keys[S.binds.right]?1:0)-(keys[S.binds.left]?1:0))*rm;
    cam.position.set(vp.x+sx,vp.y+P.camY+P.stepOff+sy,vp.z);cam.rotation.set(pitch,yaw,-sd*0.025);
    P.fov+=(S.fov+rm*(Math.min(sp,40)*0.5+(P.dashT>0?18:0))-P.fov)*Math.min(1,dt*10);cam.fov=P.fov;cam.updateProjectionMatrix();
    poseArms(dt,sp)}
  updFx(dt);
  sky.position.copy(cam.position);dl.position.copy(cam.position).addScaledVector(SUN,120);dl.target.position.copy(cam.position);
  WATER.uniforms.uTime.value=T;postMat.uniforms.uTime.value=T%100;postMat.uniforms.uSpeed.value=G.state==='menu'?0:Math.min(sp/40,1)*rm;
  renderer.setRenderTarget(RT);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  drawHud(sp,P.mantle?'MANTLE':P.dashT>0?'DASH':P.slamming?'SLAM':P.sliding?'SLIDE':P.slamT>0?'SLAM READY - JUMP':P.wall?'WALL':P.inW?'WATER':P.grounded?(sp>1?'RUN':'IDLE'):'AIR');
}
show('menu');requestAnimationFrame(loop);
