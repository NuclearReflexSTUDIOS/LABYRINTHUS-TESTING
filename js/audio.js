// Audio: loads real files from assets/audio/ and falls back to tiny synthesized sounds if a file is missing.
// Edit MANIFEST to match your filenames (.mp3 / .ogg / .wav all work).
const MANIFEST={
  music:{menu:'assets/audio/music_menu.mp3',game:'assets/audio/music_game.mp3'},
  sfx:{jump:'assets/audio/jump.wav',air:'assets/audio/air_jump.wav',wall:'assets/audio/wall_jump.wav',dash:'assets/audio/dash.wav',
    slide:'assets/audio/slide.wav',land:'assets/audio/land.wav',punch:'assets/audio/punch.wav',splash:'assets/audio/splash.wav',
    mantle:'assets/audio/mantle.wav',slam:'assets/audio/slam.wav',checkpoint:'assets/audio/checkpoint.wav',win:'assets/audio/win.wav',click:'assets/audio/click.wav',vault:'assets/audio/vault.wav',step:'assets/audio/step.wav',flash:'assets/audio/flashlight.wav',rank:'assets/audio/rank_up.wav'}};
function fade(a,to,done){clearInterval(a._f);a._f=setInterval(()=>{const d=to-a.volume;if(Math.abs(d)<0.03){a.volume=to;clearInterval(a._f);done&&done()}else a.volume=Math.max(0,Math.min(1,a.volume+Math.sign(d)*0.03))},40)}
const Aud={mus:{},sfx:{},ok:{},cur:null,ac:null,
  init(){
    for(const[k,u]of Object.entries(MANIFEST.music)){const a=new Audio();a.loop=true;a.preload='auto';a.src=u;
      a.addEventListener('canplaythrough',()=>{this.ok['m'+k]=true;if(this.cur===k&&a.paused)this.start(a)});this.mus[k]=a}
    for(const[k,u]of Object.entries(MANIFEST.sfx)){const a=new Audio();a.preload='auto';a.src=u;a.addEventListener('canplaythrough',()=>this.ok[k]=true);this.sfx[k]=a}
  },
  start(a){a.volume=0;a.play().then(()=>fade(a,S.music)).catch(()=>{})},
  music(n){if(this.cur===n)return;const old=this.mus[this.cur];this.cur=n;if(old)fade(old,0,()=>old.pause());const a=this.mus[n];if(a&&this.ok['m'+n])this.start(a)},
  vol(){const a=this.mus[this.cur];if(a&&!a.paused)a.volume=S.music},
  play(n,vol=1,rate=1){
    if(S.sfx<=0)return;
    if(this.ok[n]){const c=this.sfx[n].cloneNode();c.volume=Math.min(1,S.sfx*vol);c.playbackRate=rate;c.play().catch(()=>{});return}
    this.synth(n,vol,rate)
  }};

// ---- layered synth: noise + filtered tones, random variants, so it sounds like more than beeps. Real files in MANIFEST override it. ----
Aud.synth=function(n,vol,rate){
  const R=SYNR[n];if(!R)return;
  try{const ac=this._ctx();
    if(!this.bus){this.bus=ac.createDynamicsCompressor();this.bus.threshold.value=-14;this.bus.ratio.value=4;const m=ac.createGain();m.gain.value=0.9;this.bus.connect(m);m.connect(ac.destination);
      this.nb=this._noise(ac,1.5)}
    const t0=ac.currentTime,V=S.sfx*vol,pr=rate*(0.94+Math.random()*0.12);
    const env=(g,a,d,pk)=>{g.gain.setValueAtTime(0.0001,t0+a.o);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,pk),t0+a.o+a.a);g.gain.exponentialRampToValueAtTime(0.0002,t0+a.o+a.a+d)};
    const tone=(ty,f0,f1,d,pk,o=0,att=.004)=>{const os=ac.createOscillator(),g=ac.createGain();os.type=ty;os.frequency.setValueAtTime(f0*pr,t0+o);os.frequency.exponentialRampToValueAtTime(Math.max(20,f1*pr),t0+o+att+d);
      env(g,{o,a:att},d,pk*V);os.connect(g);g.connect(this.bus);os.start(t0+o);os.stop(t0+o+att+d+.05)};
    const noi=(ft,f0,f1,q,d,pk,o=0,att=.004)=>{const sr=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();sr.buffer=this.nb;sr.loopStart=0;f.type=ft;f.Q.value=q;
      f.frequency.setValueAtTime(f0*pr,t0+o);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1*pr),t0+o+att+d);env(g,{o,a:att},d,pk*V);
      sr.connect(f);f.connect(g);g.connect(this.bus);sr.start(t0+o,Math.random()*0.8);sr.stop(t0+o+att+d+.05)};
    R(tone,noi)}catch(e){}};
const SYNR={
  jump:(T,N)=>{N('bandpass',500,1100,.8,.14,.35);T('triangle',150,320,.12,.35)},
  air:(T,N)=>{N('highpass',1500,5000,.6,.18,.25);T('sine',420,900,.14,.3);T('sine',630,1350,.1,.12,.03)},
  wall:(T,N)=>{N('bandpass',1400,700,1.2,.1,.5);T('square',210,110,.1,.18);T('sine',90,50,.16,.4)},
  dash:(T,N)=>{N('bandpass',400,2400,.7,.28,.45)},
  slide:(T,N)=>{N('bandpass',1100,500,1.5,.42,.28,0,.05);N('lowpass',300,200,.7,.3,.3)},
  land:(T,N)=>{T('sine',100,38,.22,.9);N('lowpass',700,150,.6,.14,.55)},
  punch:(T,N)=>{N('bandpass',900,2200,.9,.12,.4,0,.03);T('sawtooth',230,70,.12,.2,.05)},
  splash:(T,N)=>{N('bandpass',2400,500,.6,.35,.5);for(let i=0;i<4;i++)T('sine',500+Math.random()*900,900+Math.random()*900,.07,.12,.05+i*.06)},
  mantle:(T,N)=>{N('lowpass',900,350,.8,.2,.5,0,.02);T('sine',110,60,.16,.5,.18);N('bandpass',1800,900,1,.06,.18,.2)},
  vault:(T,N)=>{N('bandpass',500,1700,.8,.22,.4,0,.06);T('triangle',180,260,.1,.18,.04);T('sine',80,45,.14,.45,.3);N('lowpass',500,200,.7,.1,.3,.3)},
  slam:(T,N)=>{T('sine',70,28,.5,1);N('lowpass',900,100,.5,.4,.8)},
  checkpoint:(T,N)=>{T('sine',660,660,.5,.28);T('sine',990,990,.6,.22,.09);T('triangle',1320,1320,.5,.1,.18)},
  win:(T,N)=>{[392,494,587,784].forEach((f,i)=>{T('triangle',f,f,.5,.22,i*.11);T('sine',f*2,f*2,.4,.08,i*.11)})},
  click:(T,N)=>{N('bandpass',3000,1500,2,.02,.5);T('square',900,450,.02,.12)},
  flash:(T,N)=>{N('bandpass',2600,1800,3,.015,.5);T('square',1300,700,.015,.12);N('bandpass',2200,1400,3,.02,.35,.07)},
  rank:(T,N)=>{[523,659,784].forEach((f,i)=>{T('square',f,f,.12,.1,i*.06);T('sine',f*2,f*2,.2,.1,i*.06)})},
  step:(T,N)=>{const v=(Math.random()*3)|0;
    if(v===0){N('lowpass',650,260,.8,.07,.5);T('sine',110,60,.07,.35)}
    else if(v===1){N('lowpass',900,300,.7,.06,.45);T('sine',130,70,.06,.3);N('bandpass',2200,1800,1,.02,.12)}
    else{N('lowpass',500,200,.9,.09,.55);T('sine',95,55,.08,.4)}}
};
const snd=(n,v,r)=>Aud.play(n,v,r);
Aud.init();

// ---- synthesized ambience (rain / wind) and thunder: no files needed ----
Aud.ambNode=null;Aud.ambBase=0;Aud.ambMul=1;
Aud._ctx=function(){this.ac=this.ac||new(window.AudioContext||window.webkitAudioContext)();if(this.ac.state==='suspended')this.ac.resume();return this.ac};
Aud._noise=function(ac,sec){const b=ac.createBuffer(1,ac.sampleRate*sec,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;l=(l+0.02*w)/1.02;d[i]=w*0.6+l*6}return b};
Aud.amb=function(kind){
  try{if(this.ambNode){try{this.ambNode.src.stop()}catch(e){}this.ambNode=null}
    const P={rain:['bandpass',3200,.4,.05],pour:['bandpass',2500,.35,.09],thunder:['bandpass',2700,.35,.075],snow:['lowpass',420,.7,.03],fog:['lowpass',300,.7,.022]}[kind];if(!P)return;
    const ac=this._ctx(),src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=this._noise(ac,3);src.loop=true;f.type=P[0];f.frequency.value=P[1];f.Q.value=P[2];
    this.ambBase=P[3];g.gain.value=P[3]*S.sfx;src.connect(f);f.connect(g);g.connect(ac.destination);src.start();this.ambNode={src,g}}catch(e){}};
Aud.ambLevel=function(m){if(this.ambNode)this.ambNode.g.gain.value=this.ambBase*S.sfx*m};
Aud.thunder=function(){if(S.sfx<=0)return;try{const ac=this._ctx(),src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),n=ac.currentTime;
  src.buffer=this._noise(ac,3);f.type='lowpass';f.frequency.setValueAtTime(260,n);f.frequency.exponentialRampToValueAtTime(70,n+2.6);g.gain.setValueAtTime(0.0001,n);g.gain.exponentialRampToValueAtTime(0.7*S.sfx,n+0.08);g.gain.exponentialRampToValueAtTime(0.001,n+2.8);
  src.connect(f);f.connect(g);g.connect(ac.destination);src.start(n);src.stop(n+3)}catch(e){}};
