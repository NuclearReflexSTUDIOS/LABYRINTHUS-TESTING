// Main: post-process look, menu + level picker, UI, input, HUD (style meter + 2D hands), game loop.
const hud=$('hud'),hx=hud.getContext('2d');
const GS={state:'menu',back:'menu',paused:false};
const isPlay=()=>TOUCH?(GS.state==='play'&&!GS.paused):!!document.pointerLockElement;
if(TOUCH)document.body.classList.add('touch');
const BEST_KEY='labyrinthus_best';let BEST={};try{BEST=JSON.parse(localStorage.getItem(BEST_KEY)||'{}')}catch(e){}

// ---- STYLE meter (ULTRAKILL-style rank fed by movement tricks; purely visual) ----
const RK=[0,12,30,60,100,160,240],RL=['D','C','B','A','S','SS','SSS'],RN=['DRIFTING','CLIMBING','BOUNCY','AIRBORNE','SOARING','SUPERSONIC','SKYBOUND'];
const RC=['#cfcbc0','#9ec7ff','#7be07a','#ffd33f','#ff9f2e','#ff6a2e','#ff3d5a'];
const ST={pts:0,rank:0,best:0,feed:[],recent:[],hold:0};
function style(n,p){if(ST.recent.includes(n))p*=0.4;ST.recent.push(n);if(ST.recent.length>3)ST.recent.shift();
  ST.pts=Math.min(300,ST.pts+p);ST.hold=0.9;ST.feed.unshift({n,t:2});if(ST.feed.length>5)ST.feed.pop()}
function styleTick(dt,sp,on){if(!on)return;ST.hold-=dt;if(sp>16)ST.pts=Math.min(300,ST.pts+dt*(sp-14)*0.6);
  if(ST.hold<=0)ST.pts=Math.max(0,ST.pts-dt*(3+ST.rank*5));
  let r=0;for(let i=0;i<RK.length;i++)if(ST.pts>=RK[i])r=i;if(r>ST.rank&&r>=1)snd('rank',0.8);ST.rank=r;ST.best=Math.max(ST.best,r);
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
// flashlight: a spotlight riding the camera (toggle with the Flashlight key)
const FL=new THREE.SpotLight(0xfff1d0,0,90,0.5,0.55,1);FL.target=new THREE.Object3D();scene.add(FL,FL.target);let flOn=false;const flD=new THREE.Vector3();
function resize(){
  renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);cam.aspect=mcam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();mcam.updateProjectionMatrix();
  const w=Math.max(2,Math.floor(innerWidth/S.pix)),h=Math.max(2,Math.floor(innerHeight/S.pix));if(RT)RT.dispose();
  const M_=(S.pix<=2&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget)?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
  RT=new M_(w,h,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});if('samples'in RT)RT.samples=4;
  postMat.uniforms.tDiffuse.value=RT.texture;postMat.uniforms.uRes.value.set(w,h);{const j=S.jit<=0.01?40:1/S.jit;SNAPU.value.set(w/2*j,h/2*j)}
  hud.width=Math.floor(innerWidth/S.hud);hud.height=Math.floor(innerHeight/S.hud)}
addEventListener('resize',resize);resize();

// ---- UI ----
const SCREENS=['menu','levels','pause','settings','win','ups'];
const show=id=>SCREENS.forEach(s=>$(s).hidden=s!==id);
let toastT=0;function toast(m,ms=1500){const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms)}
const SET=[['sens','Mouse sensitivity',0.2,3,0.1],['fov','Field of view',70,120,1],['pix','3D pixel size',1,8,1],['jit','PS1 vertex wobble (0 = off)',0,1,0.05],['hud','HUD pixel size',1,4,1],['music','Music volume',0,1,0.05],['sfx','SFX volume',0,1,0.05]];
const CHK=[['dither','Retro dither + posterize'],['invert','Invert Y axis'],['reduce','Reduce motion (no shake, tilt, FOV kick, speed blur)'],['bigHud','Large HUD'],['typeClick','Typing click noises (a click on every key press)']];
const ACT=[['fwd','Forward'],['back','Back'],['left','Left'],['right','Right'],['jump','Jump / air jump / wall jump'],['dash','Sprint (hold)'],['slide','Slide'],['punch','Punch'],['reset','Back to checkpoint'],['flash','Flashlight'],['inv','Item wheel (hold)'],['use','Interact / search cache'],['call','Call extraction (runs)'],['reload','Reload (runs)']];
let rebind=null,lastBind=0;
const lab=c=>c.startsWith('Mouse')?'MOUSE '+(+c.slice(5)+1):c.replace(/^(Key|Digit)/,'').replace('Left','L').replace('Right','R').toUpperCase();
function build(){let h='';const setEl=$('set');
  for(const[k,n,a,b,s]of SET)h+=`<label>${n}<span id="v_${k}">${S[k]}</span><input type=range data-k="${k}" min=${a} max=${b} step=${s} value=${S[k]}></label>`;
  for(const[k,n]of CHK)h+=`<label class=ck><input type=checkbox data-c="${k}" ${S[k]?'checked':''}>${n}</label>`;
  h+='<h2>KEYBINDS</h2>';
  for(const[k,n]of ACT)h+=`<div class=kb>${n}<button data-b="${k}">${rebind===k?'PRESS A KEY...':lab(S.binds[k])}</button></div>`;
  setEl.innerHTML=h+'<br><button id="rst">RESET DEFAULTS</button>';
  const B_=S.binds,l=c=>'<kbd>'+lab(c)+'</kbd>';
  if(TOUCH){$('help').innerHTML='LEFT THUMB move / RIGHT THUMB look<br>JUMP: tap, again in the air, or off walls<br>SPRINT: hold (uses stamina) / SLIDE: hold<br>Push into a ledge to mantle, run into waist-high blocks to vault<br>ITEMS button: open the item wheel, tap a slot<br><br>';return}
  $('help').innerHTML=l(B_.fwd)+l(B_.left)+l(B_.back)+l(B_.right)+' move / <kbd>MOUSE</kbd> look<br>'+l(B_.jump)+' jump, x3 in air, or off walls<br>'+l(B_.dash)+' sprint (hold, uses stamina) / '+l(B_.slide)+' slide<br>Push into a ledge to mantle, run into low blocks to vault. '+l(B_.reset)+' checkpoint, '+l(B_.flash)+' flashlight, hold '+l(B_.inv)+' item wheel<br><br>'}
$('set').oninput=e=>{const d=e.target.dataset;if(d.k){S[d.k]=+e.target.value;$('v_'+d.k).textContent=S[d.k];if(d.k==='pix'||d.k==='hud'||d.k==='jit')resize();if(d.k==='music')Aud.vol()}else if(d.c){S[d.c]=e.target.checked;postMat.uniforms.uDither.value=S.dither?1:0}save()};
$('set').onclick=e=>{const t=e.target;if(Date.now()-lastBind<300)return;
  if(t.dataset.b){rebind=t.dataset.b;build()}else if(t.id==='rst'){S=JSON.parse(JSON.stringify(DEF));save();resize();Aud.vol();postMat.uniforms.uDither.value=S.dither?1:0;build()}};
addEventListener('keydown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){S.binds[rebind]=e.code;save()}rebind=null;build()},true);
addEventListener('mousedown',e=>{if(!rebind)return;e.preventDefault();e.stopPropagation();S.binds[rebind]='Mouse'+e.button;save();rebind=null;lastBind=Date.now();build()},true);
build();postMat.uniforms.uDither.value=S.dither?1:0;

const fmtT=t=>{const m=Math.floor(t/60);return m+':'+(t-m*60).toFixed(2).padStart(5,'0')};
function buildLevels(){{const ts=$('tierStrip');if(ts&&!ts.children.length)ts.innerHTML=Object.values(TIERS).filter(t=>!t.free).map(t=>'<i style="background:'+t.bg+'"></i>').join('')}$('tierLegend').innerHTML='<b>COLOUR = TIME TO FINISH</b>'+Object.values(TIERS).filter(t=>!t.free).map(t=>`<span style="--tb:${t.bg}"><i></i>${t.n} ${t.t}</span>`).join('');$('lvlList').innerHTML=LEVELS.map((L,i)=>L.hidden?"":`<button class="card" data-i="${i}" style="--tc:${(TIERS[L.tier]||TIERS.blue).c};--tb:${(TIERS[L.tier]||TIERS.blue).bg}"><span class="tb">${(TIERS[L.tier]||TIERS.blue).n} / ${(TIERS[L.tier]||TIERS.blue).l} / ${(TIERS[L.tier]||TIERS.blue).t}</span><span class="cn">${String(L.id).padStart(2,'0')}</span><span class="ct">${L.name}</span><span class="cg">${L.tag}</span><span class="cd">${L.desc}</span>
  <span class="cm"><b>LENGTH</b> ${L.len}</span><span class="cm"><b>BEST</b> ${BEST[L.id]?fmtT(BEST[L.id]):'--:--.--'}</span>${L.sections?'<span class="secs"><b>START AT</b>'+L.sections.map((s,j)=>'<u data-s="'+j+'">'+(L.secNames?L.secNames[j]:j+1)+'</u>').join('')+'</span>':''}</button>`).join('')}
$('lvlList').onclick=e=>{const c=e.target.closest('.card');if(c){snd('click');const u=e.target.closest('[data-s]');startRun(+c.dataset.i,u?+u.dataset.s:0)}};

function clearInput(){for(const c in keys)keys[c]=false;dashReq=slideReq=slamReq=punchReq=false}
function startRun(i,sec=0){if(i===undefined)i=LV;runPrep(i);P.wm=1;loadLevel(i,sec);styleReset();P.cp=0;P.time=0;respawn();GS.state='play';GS.paused=false;show('');Aud.music('game');introStart();if(TOUCH)enterTouch();else glc.requestPointerLock();toast('LEVEL '+LEVELS[i].id+'  /  '+LEVELS[i].name+'  /  '+envLabel(),2600)}
function toMenu(){RS.on=false;P.wm=1;GS.state='menu';show('menu');touchOff();document.exitPointerLock();Aud.music('menu');Aud.amb(null)}
function openSettings(from){GS.back=from;rebind=null;build();show('settings')}
function win(){GS.state='win';touchOff();document.exitPointerLock();const t=P.time,id=LEVELS[LV].id,old=BEST[id];let note='';
  if(!old||t<old){BEST[id]=t;try{localStorage.setItem(BEST_KEY,JSON.stringify(BEST))}catch(e){}note=old?'  /  NEW BEST':'  /  FIRST CLEAR'}
  $('winT').textContent='TIME '+fmtT(t)+note+'  /  BEST STYLE: '+RL[ST.best]+' '+RN[ST.best];$('winL').textContent=LEVELS[LV].name+' CLEARED';show('win');snd('win')}
const clk=fn=>()=>{snd('click');fn()};
$('tierStrip').innerHTML=Object.values(TIERS).filter(t=>!t.free).map(t=>'<i style="background:'+t.bg+'"></i>').join('');
$('bUps').onclick=clk(()=>openUps('menu'));$('bUps2').onclick=clk(()=>openUps('win'));$('bPlay').onclick=clk(()=>{buildLevels();show('levels')});$('bSet').onclick=clk(()=>openSettings('menu'));$('bQuit').onclick=clk(()=>{try{window.close()}catch(e){}toast('CLOSE THE TAB TO QUIT')});
$('bLvlBack').onclick=clk(()=>show('menu'));
$('bResume').onclick=clk(()=>{if(TOUCH){GS.paused=false;show('');$('touch').classList.add('on')}else glc.requestPointerLock()});$('bRestart').onclick=clk(()=>startRun(LV,SEC));$('bSet2').onclick=clk(()=>openSettings('pause'));$('bMenu').onclick=clk(toMenu);
$('bBack').onclick=clk(()=>{rebind=null;show(GS.back)});$('bAgain').onclick=clk(()=>startRun(LV));$('bMenu2').onclick=clk(toMenu);
addEventListener('pointerdown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
addEventListener('keydown',()=>{if(!Aud.cur)Aud.music('menu')},{once:true});
document.addEventListener('pointerlockchange',()=>{if(GS.state!=='play')return;if(document.pointerLockElement)show('');else{clearInput();show('pause')}});
document.addEventListener('pointerlockerror',()=>{if(GS.state==='play')show('pause')});

// ---- input ----
function down(c){const B_=S.binds;if(CINE.intro){CINE.intro=null;return}keys[c]=true;
  if(c===B_.inv)invOpen();
  if(c===B_.jump){P.jumpBuf=0.12;P.jumpEdge=true}
  if(c===B_.slide)slideReq=true
  if(c===B_.punch)punchReq=true;
  if(c===B_.reset&&!RS.on){respawn();toast('CHECKPOINT')}
  if(c===B_.use)runUse();if(c===B_.reload)rReload();if(c===B_.punch&&RS.on&&P.gun)rFire();if(c===B_.call)runCall();
  if(c===B_.flash){flOn=!flOn;FL.intensity=flOn?2.2:0;snd('flash')}}
addEventListener('keydown',e=>{if(!document.pointerLockElement)return;
  if(e.code==='Space'||e.code.startsWith('Control')||e.code.startsWith('Shift')||e.code==='Tab')e.preventDefault();if(!e.repeat)down(e.code)});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code===S.binds.inv)invClose(true)});
addEventListener('keydown',e=>{if(S.typeClick&&!e.metaKey&&!e.ctrlKey)snd('key',0.5,1)},true);
addEventListener('mousedown',e=>{if(document.pointerLockElement)down('Mouse'+e.button)});
addEventListener('mouseup',e=>{keys['Mouse'+e.button]=false});
addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&TOUCH&&GS.state==='play')touchPause()});
addEventListener('mousemove',e=>{if(GS.state==='menu'||!document.pointerLockElement){MPAR.tx=e.clientX/innerWidth*2-1;MPAR.ty=e.clientY/innerHeight*2-1}if(!document.pointerLockElement)return;const dx=e.movementX,dy=e.movementY;if(Math.abs(dx)>250||Math.abs(dy)>250)return;
  if(INV.open){invMove(dx,dy);return}
  yaw-=dx*0.0022*S.sens;pitch=Math.max(-1.55,Math.min(1.55,pitch-dy*0.0022*S.sens*(S.invert?-1:1)))});

// ---- HUD ----
const INK='#ece9df',ACC='#ff5a1f',SH='#0a0a0a';
function txt(s,x,y,size,col){hx.font='bold '+size+'px "Courier New",monospace';hx.fillStyle=SH;hx.fillText(s,x+1,y+1);hx.fillStyle=col;hx.fillText(s,x,y)}
function pip(x,y,on,col){hx.fillStyle=SH;hx.fillRect(x-1,y-1,10,10);hx.fillStyle=on?col:'#4a4a46';hx.fillRect(x,y,8,8)}

// ===== HANDS =====
// handModel() is the ONLY thing that draws a hand: one square. To use a real hand later, replace its body with
// hx.drawImage(sprite,-S/2,-S/2,S,S) (the animation below already gives it x, y, rotation, scale and side).
function handModel(x,y,S,rot,side){hx.save();hx.translate(Math.round(x),Math.round(y));hx.rotate(rot);
  hx.fillStyle='#0a0a0a';hx.fillRect(-S/2-3,-S/2-3,S+6,S+6);hx.fillStyle='#e8e4da';hx.fillRect(-S/2,-S/2,S,S);hx.restore()}
// each hand is a spring (so it overshoots and settles) chasing a target pose that depends on what the player is doing
const HS=[0,1].map(()=>({x:0,y:0,r:0,s:1,vx:0,vy:0,vr:0,vs:0,init:false}));
const HA={yaw:0,pit:0,air:false,vy:0};
function drawHands(dt,W,H,sp){
  const u=Math.max(1.5,W/300),B_=P,rm=S.reduce?0.25:1,mv=B_.grounded?Math.min(sp/16,1):0,spr=B_.sprint?1:0,SZ=30*u;
  let ws=0;if(B_.wall&&B_.wallN){const rx=Math.cos(yaw),rz=-Math.sin(yaw),d=(-B_.wallN[0])*rx+(-B_.wallN[1])*rz;ws=d>0?1:-1}
  const mt=B_.mantle?Math.sin(Math.min(1,B_.mantle.t)*Math.PI):0,vt=B_.vault?Math.sin(Math.min(1,B_.vault.t)*Math.PI):0;
  const dyw=Math.max(-8,Math.min(8,(yaw-HA.yaw)/Math.max(dt,.001))),dpt=Math.max(-8,Math.min(8,(pitch-HA.pit)/Math.max(dt,.001)));HA.yaw=yaw;HA.pit=pitch;
  const vy=B_.vel.y;if(B_.grounded&&HA.air){const f=Math.min(1,-HA.vy/26);if(f>.12)for(const h of HS){h.vy+=f*900*rm;h.vs-=f*3}}HA.air=!B_.grounded;HA.vy=vy;
  for(let i=0;i<2;i++){const side=i?1:-1,h=HS[i],ph=B_.bob+(i?Math.PI:0);
    let tx=W/2+side*W*0.2-B_.sway*50,ty=H-SZ*0.3,tr=side*0.05,ts=1;
    tx+=Math.sin(T*.9+i*2)*.9*u;ty+=Math.sin(T*1.6+i*.8)*1.3*u;                                           // breathing
    const amp=mv*(1+spr*.7)*rm;ty+=Math.sin(ph)*5.5*u*amp;tx+=Math.cos(ph)*3*u*amp*side*.5;tr+=Math.sin(ph)*.09*amp;   // run swing (antiphase)
    if(spr){ty-=7*u*mv;tx-=side*5*u*mv;ts+=.1*mv}
    tx-=Math.max(-14*u,Math.min(14*u,dyw*2.2*u))*rm;ty+=Math.max(-10*u,Math.min(10*u,dpt*2*u))*rm;               // look lag
    ty+=Math.max(-10,Math.min(10,vy*.5))*u*rm;                                                                    // rise/fall drag
    if(!B_.grounded){tx+=side*5*u;tr+=side*.16}
    if(B_.sliding){ty+=15*u;tx+=side*7*u;tr=side*.5;if(i)ts*=1.12}
    if(ws){if(ws===side){tx=W/2+side*W*.27;ty=H*.58;tr=side*.35;ts=1.3}else ty+=8*u}
    if(mt>0){ty-=mt*H*.34;tx-=side*W*.04*mt;tr=side*.3*mt;ts+=mt*.3}
    if(vt>0){if(i){ty-=vt*H*.12;tx-=W*.05*vt;ts+=vt*.4;tr=-.3*vt}else{ty-=vt*10*u;tr=.3*vt}}
    if(B_.dashT>0){ty-=5*u;tx-=side*W*.03}
    if(B_.swingT>0&&B_.hand===i){const ps=1-B_.swingT/PD,e=ps<0.15?-0.2*ps/0.15:ps<0.4?-0.2+1.2*(1-(1-(ps-0.15)/0.25)**2):1-(ps-0.4)/0.6;ty-=e*H*.25;tx-=side*e*W*.12;tr=-side*e*.4;ts=1+.4*Math.max(0,e)}
    if(!h.init){h.x=tx;h.y=ty+60*u;h.r=tr;h.s=ts;h.init=true}
    const k=300,c=26,d=Math.min(dt,.05);                                                                          // spring: overshoots a little, then settles
    h.vx+=((tx-h.x)*k-h.vx*c)*d;h.vy+=((ty-h.y)*k-h.vy*c)*d;h.vr+=((tr-h.r)*k-h.vr*c*.9)*d;h.vs+=((ts-h.s)*k-h.vs*c)*d;
    h.x+=h.vx*d;h.y+=h.vy*d;h.r+=h.vr*d;h.s+=h.vs*d;
    handModel(h.x,h.y,SZ*h.s,h.r,side)}}

// menu parallax: DOM layers drift by depth (data-d), the 3D camera moves with the mouse too
function menuParallax(dt){const k=Math.min(1,dt*4);MPAR.x+=(MPAR.tx-MPAR.x)*k;MPAR.y+=(MPAR.ty-MPAR.y)*k;
  document.querySelectorAll('[data-d]').forEach(e=>{const d=+e.dataset.d;e.style.transform='translate('+(-MPAR.x*d).toFixed(1)+'px,'+(-MPAR.y*d*.6).toFixed(1)+'px)'})}
const CAMS={roll:0,pit:0,ly:0,lv:0,lp:0,lpv:0,air:false,vy:0};
function drawHud(dt,sp,state){
  const kk=S.bigHud?1.5:1;hx.setTransform(1,0,0,1,0,0);hx.clearRect(0,0,hud.width,hud.height);if(GS.state==='menu')return;
  hx.setTransform(kk,0,0,kk,0,0);const W=hud.width/kk,H=hud.height/kk,bx=14,by=H-14;
  if(GS.state==='play'&&!CINE.intro)drawHands(dt,W,H,sp);
  drawCine(dt,W,H);drawWheel(W,H);if(GS.state==='play'&&!CINE.intro)runHud(W,H);
  {const plate=(x,y,w,h)=>{hx.fillStyle='rgba(8,8,7,.55)';hx.fillRect(x,y,w,h);hx.fillStyle=ACC;hx.fillRect(x,y,3,h);hx.fillStyle='rgba(236,233,223,.35)';hx.fillRect(x,y,w,1);hx.fillRect(x,y+h-1,w,1)};
   plate(bx-6,by-94,180,102);
   txt((sp*GAME_SPEED).toFixed(1),bx+6,by-68,22,ACC);txt('M/S',bx+74,by-68,9,'#9a968c');
   txt('STAMINA',bx+6,by-52,8,'#9a968c');
   for(let i=0;i<3;i++){const x=bx+6+i*54,y=by-46;hx.fillStyle='#2a2a27';hx.fillRect(x,y,50,6);hx.fillStyle=P.exh?ACC:INK;hx.fillRect(x,y,Math.round(50*Math.max(0,Math.min(1,P.stamina-i))),6)}
   txt('WALL',bx+6,by-26,8,'#9a968c');for(let i=0;i<3;i++)pip(bx+40+i*12,by-34,i<P.wj,ACC);
   txt('AIR',bx+92,by-26,8,'#9a968c');for(let i=0;i<AIRJ;i++)pip(bx+114+i*12,by-34,i<P.aj,INK);
   txt(state,bx+6,by-6,11,state==='WALL'||state==='SPRINT'||state==='MANTLE'||state==='VAULT'?ACC:INK);if(flOn)txt('LIGHT ON',bx+100,by-6,9,ACC)}
  if(!(TIERS[LEVELS[LV].tier]||{}).free){const g=GOAL,d0=Math.max(1,Math.hypot(CP[0].p[0]-g.x,CP[0].p[1]-g.y,CP[0].p[2]-g.z)),f=v=>Math.max(0,Math.min(1,1-Math.hypot(v[0]-g.x,v[1]-g.y,v[2]-g.z)/d0)),
    bw=Math.min(380,W*.42),x0=Math.round((W-bw)/2),tc=(TIERS[LEVELS[LV].tier]||TIERS.blue).c,pr=f([P.pos.x,P.pos.y,P.pos.z]);
   hx.fillStyle='rgba(8,8,7,.55)';hx.fillRect(x0-6,6,bw+12,26);hx.fillStyle='#2a2a27';hx.fillRect(x0,12,bw,6);hx.fillStyle=tc;hx.fillRect(x0,12,Math.round(bw*pr),6);
   for(let i=1;i<CP.length;i++){const q=f(CP[i].p);hx.fillStyle=i<=P.cp?INK:'#6b6d72';hx.fillRect(x0+Math.round(bw*q)-1,9,2,12)}
   hx.fillStyle=INK;hx.fillRect(x0+Math.round(bw*pr)-2,9,4,12);hx.textAlign='center';txt(Math.round(pr*100)+'%   CP '+P.cp+'/'+(CP.length-1),W/2,29,8,'#9a968c');hx.textAlign='left'}
  {const tc=TIERS[LEVELS[LV].tier]||TIERS.blue;hx.fillStyle=SH;hx.fillRect(13,7,13,13);hx.fillStyle=tc.c;hx.fillRect(14,8,11,11)}txt('L'+LEVELS[LV].id+' '+LEVELS[LV].name+'  '+(TIERS[LEVELS[LV].tier]||TIERS.blue).n,32,18,10,INK);txt(envLabel(),14,30,9,'#9a968c');
  const t=P.time;txt(fmtT(t),W-80,22,13,INK);txt('ALT '+Math.max(0,Math.round(P.pos.y))+'M',W-80,34,9,'#9a968c');
  {const col=RC[ST.rank],px=W-14,lo=RK[ST.rank],hi=RK[ST.rank+1]||RK[ST.rank]+60,f=Math.max(0,Math.min(1,(ST.pts-lo)/(hi-lo)));
   hx.textAlign='right';txt(RL[ST.rank],px,76,40,col);
   hx.textAlign='left';hx.fillStyle=SH;hx.fillRect(W-124,82,112,8);hx.fillStyle='#3a3a37';hx.fillRect(W-123,83,110,6);hx.fillStyle=col;hx.fillRect(W-123,83,Math.round(110*f),6);
   hx.textAlign='right';txt(RN[ST.rank],px,102,10,col);
   ST.feed.slice(0,TOUCH?2:5).forEach((e,i)=>{hx.globalAlpha=Math.min(1,e.t);txt(e.n,px,118+i*12,9,i?INK:ACC);hx.globalAlpha=1});hx.textAlign='left'}
  const cx=Math.floor(W/2),cy=Math.floor(H/2);hx.fillStyle=INK;hx.fillRect(cx-1,cy-1,2,2);hx.fillRect(cx-6,cy,3,1);hx.fillRect(cx+3,cy,3,1);hx.fillRect(cx,cy-6,1,3);hx.fillRect(cx,cy+3,1,3)}

// ---- loop ----
let last=performance.now(),acc=0;const vp=new THREE.Vector3();
function checkpoints(){if(RS.on)return;const p=P.pos;
  for(let i=P.cp+1;i<CP.length;i++){const c=CP[i].p;if(Math.hypot(p.x-c[0],p.z-c[2])<4&&Math.abs(p.y-c[1])<3){P.cp=i;toast('CHECKPOINT');cineBars(2.4,'CHECKPOINT '+i+'  /  '+Math.round(p.y)+' M UP');snd('checkpoint');style('CHECKPOINT',15)}}
  if(Math.hypot(p.x-GOAL.x,p.z-GOAL.z)<2.5&&Math.abs(p.y-GOAL.y)<3){const L=LEVELS[LV];if(L.sections&&SEC<L.sections.length-1)nextSection();else win()}}
function nextSection(){const L=LEVELS[LV],t=P.time;loadLevel(LV,SEC+1);P.cp=0;P.time=t;respawn();snd('win');toast('SECTION '+(SEC+1)+' / '+L.sections.length+'  /  '+L.secNames[SEC],2800);cineBars(3,L.secNames[SEC]+'  /  SECTION '+(SEC+1)+' OF '+L.sections.length)}
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.max(0,Math.min((t-last)/1000,0.05));last=t;T+=dt;
  const playing=GS.state==='play'&&isPlay()&&!CINE.intro;
  const v=P.vel,sp=Math.hypot(v.x,v.z),rm=S.reduce?0:1;
  if(GS.state==='menu'){
    updMenu(dt);menuParallax(dt);postMat.uniforms.uSpeed.value=0;postMat.uniforms.uTime.value=T%100;
    renderer.setRenderTarget(RT);renderer.render(mscene,mcam);renderer.setRenderTarget(null);renderer.render(postScene,postCam);drawHud(dt,0,'');return}
  if(playing){acc+=dt*(INV.open?0.1:GAME_SPEED);while(acc>=FIXED){P.prev.copy(P.pos);step(FIXED);acc-=FIXED}P.time+=dt;checkpoints();runTick(dt);
    if(P.pos.y<CP[P.cp].p[1]-50){if(RS.on){RS.msg='YOU FELL';runEnd(false)}else{respawn();toast('RESPAWN')}}}
  vp.copy(P.prev).lerp(P.pos,acc/FIXED);
  P.camY+=((P.sliding?0.75:1.6)-P.camY)*Math.min(1,dt*14);P.stepOff*=Math.max(0,1-dt*14);P.shake=Math.max(0,P.shake-dt*2.5);
  const sx=Math.sin(T*83)*P.shake*0.06*rm,sy=Math.cos(T*71)*P.shake*0.06*rm,sd=((keys[S.binds.right]?1:0)-(keys[S.binds.left]?1:0))*rm;
  // --- parkour camera: step-synced bob, strafe/slide/wall roll, landing dip, vault/mantle pitch, forward lean ---
  {const v2=P.vel,rx=Math.cos(yaw),rz=-Math.sin(yaw),lat=v2.x*rx+v2.z*rz,fwd=-(v2.x*Math.sin(yaw)+v2.z*Math.cos(yaw)),g=P.grounded&&playing?1:0,
    amp=Math.min(sp/16,1)*g*(P.sprint?1.5:1)*rm,th=P.bob,k=Math.min(1,dt*9);
   if(CAMS.air&&P.grounded){const f=Math.min(1,-CAMS.vy/26);if(f>.1){CAMS.lv-=f*2.6*rm;CAMS.lp+=f*.05*rm}}CAMS.air=!P.grounded;CAMS.vy=P.vel.y;
   CAMS.ly+=CAMS.lv*dt;CAMS.lv+=(-CAMS.ly*180-CAMS.lv*17)*dt;CAMS.lpv=(CAMS.lpv||0)+(-CAMS.lp*160-(CAMS.lpv||0)*16)*dt;CAMS.lp+=CAMS.lpv*dt;
   let tr=-lat/22*0.05*rm,tp=-Math.max(0,fwd)/30*0.035*rm,wl=0;
   if(P.wall&&P.wallN){const d=(-P.wallN[0])*rx+(-P.wallN[1])*rz;wl=(d>0?1:-1)*.13*rm}
   if(P.sliding)tr+=Math.max(-1,Math.min(1,lat/8+.4))*.06*rm,tp+=.035*rm;
   tr+=wl;
   if(P.mantle){const t=Math.min(1,P.mantle.t);tp-=Math.sin(t*Math.PI)*.2*rm;tr+=Math.sin(t*Math.PI*2)*.03*rm}
   if(P.vault){const t=Math.min(1,P.vault.t);tp+=Math.sin(t*Math.PI)*.1*rm;tr+=Math.sin(t*Math.PI)*.04*rm}
   CAMS.roll+=(tr-CAMS.roll)*k;CAMS.pit+=(tp-CAMS.pit)*k;
   const by=-Math.cos(th*2)*0.05*amp,bx=Math.sin(th)*0.035*amp,br=Math.sin(th)*0.014*amp,bp=Math.cos(th*2)*0.006*amp;
   const right=new THREE.Vector3(rx,0,rz);
   cam.position.set(vp.x+sx+right.x*bx,vp.y+P.camY+P.stepOff+sy+by+CAMS.ly,vp.z+right.z*bx);
   cam.rotation.set(pitch+CAMS.pit+bp+CAMS.lp,yaw,CAMS.roll+br)}
  P.fov+=(S.fov+rm*(Math.min(sp,40)*0.5+(P.sprint?9:0))-P.fov)*Math.min(1,dt*10);cam.fov=P.fov;cam.updateProjectionMatrix();
  cam.getWorldDirection(flD);FL.position.copy(cam.position);FL.target.position.copy(cam.position).addScaledVector(flD,10);
  if(CINE.intro)cineCam(dt);updBirds(dt,cam.position,T);styleTick(dt,sp,playing);updFx(dt);updLamps(cam.position);updEnv(dt,cam.position);
  sky.position.copy(cam.position);dl.position.copy(cam.position).addScaledVector(SUN,120);dl.target.position.copy(cam.position);
  WATER.uniforms.uTime.value=T;SKYU.uTime.value=T;CLOUDS.material.uniforms.uTime.value=T;postMat.uniforms.uTime.value=T%100;postMat.uniforms.uSpeed.value=Math.min(sp/40,1)*rm;
  renderer.setRenderTarget(RT);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  drawHud(dt,sp,P.vault?'VAULT':P.mantle?'MANTLE':P.sprint?'SPRINT':P.sliding?'SLIDE':P.wall?'WALL':P.inW?'WATER':P.grounded?(sp>1?'RUN':'IDLE'):'AIR');
}
show('menu');requestAnimationFrame(loop);

// ---- touch controls: floating left stick (move), right-side drag (look), on-screen buttons ----
const TE=$('touch'),stick=$('tStick'),knob=stick.firstElementChild;let tMove=null,tLook=null;
function enterTouch(){TE.classList.add('on');clearInput();try{const d=document.documentElement;(d.requestFullscreen||d.webkitRequestFullscreen||(()=>0)).call(d);screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}
function touchOff(){TE.classList.remove('on');tMove=tLook=null;stick.style.opacity=0;clearInput()}
function touchPause(){GS.paused=true;clearInput();tMove=tLook=null;stick.style.opacity=0;TE.classList.remove('on');show('pause')}
function setMove(dx,dy){const B_=S.binds,r=Math.min(1,Math.hypot(dx,dy)/(innerHeight*0.12)),a=Math.atan2(dy,dx),d=r>0.28;
  keys[B_.fwd]=d&&Math.sin(a)<-0.38;keys[B_.back]=d&&Math.sin(a)>0.38;keys[B_.left]=d&&Math.cos(a)<-0.38;keys[B_.right]=d&&Math.cos(a)>0.38;
  const m=innerHeight*0.12,l=Math.hypot(dx,dy)||1,k=Math.min(l,m)/l;knob.style.transform='translate('+dx*k+'px,'+dy*k+'px)'}
function tFind(e,id){for(const t of e.changedTouches)if(t.identifier===id)return t;return null}
TE.addEventListener('touchstart',e=>{if(CINE.intro){CINE.intro=null;e.preventDefault();return}
  if(INV.open&&!e.target.closest('button')){e.preventDefault();const t=e.changedTouches[0];invAim(t.clientX-innerWidth/2,t.clientY-innerHeight/2);invClose(true);return}
  if(e.target.closest('button'))return;e.preventDefault();
  for(const t of e.changedTouches){
    if(t.clientX<innerWidth*0.45&&!tMove){tMove={id:t.identifier,x:t.clientX,y:t.clientY};stick.style.left=t.clientX+'px';stick.style.top=t.clientY+'px';stick.style.opacity=1;setMove(0,0)}
    else if(!tLook)tLook={id:t.identifier,x:t.clientX,y:t.clientY}}},{passive:false});
TE.addEventListener('touchmove',e=>{if(e.target.closest('button'))return;e.preventDefault();
  if(tMove){const t=tFind(e,tMove.id);if(t)setMove(t.clientX-tMove.x,t.clientY-tMove.y)}
  if(tLook){const t=tFind(e,tLook.id);if(t){const k=0.0042*S.sens;yaw-=(t.clientX-tLook.x)*k;pitch=Math.max(-1.55,Math.min(1.55,pitch-(t.clientY-tLook.y)*k*(S.invert?-1:1)));tLook.x=t.clientX;tLook.y=t.clientY}}},{passive:false});
function tEnd(e){if(e.target.closest('button'))return;
  if(tMove&&tFind(e,tMove.id)){tMove=null;stick.style.opacity=0;const B_=S.binds;keys[B_.fwd]=keys[B_.back]=keys[B_.left]=keys[B_.right]=false}
  if(tLook&&tFind(e,tLook.id))tLook=null}
TE.addEventListener('touchend',tEnd);TE.addEventListener('touchcancel',tEnd);
for(const b of TE.querySelectorAll('button[data-k]')){const k=()=>S.binds[b.dataset.k];
  b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();b.classList.add('dn');down(k())},{passive:false});
  const up=e=>{e.preventDefault();e.stopPropagation();b.classList.remove('dn');if(b.dataset.k!=='flash'&&b.dataset.k!=='reset')keys[k()]=false};
  b.addEventListener('touchend',up,{passive:false});b.addEventListener('touchcancel',up,{passive:false})}
{let h=0;const b=$('tCp');
 b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();b.classList.add('dn');h=setTimeout(()=>{down(S.binds.reset);h=0},500)},{passive:false});
 const up=e=>{e.preventDefault();b.classList.remove('dn');if(h){clearTimeout(h);h=0}};b.addEventListener('touchend',up,{passive:false});b.addEventListener('touchcancel',up,{passive:false})}
$('tInv').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();if(INV.open)invClose(false);else invOpen()},{passive:false});
$('tPause').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();touchPause()},{passive:false});
