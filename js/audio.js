// Audio: loads real files from assets/audio/ and falls back to tiny synthesized sounds if a file is missing.
// Edit MANIFEST to match your filenames (.mp3 / .ogg / .wav all work).
const MANIFEST={
  music:{menu:'assets/audio/music_menu.mp3',game:'assets/audio/music_game.mp3'},
  sfx:{jump:'assets/audio/jump.wav',air:'assets/audio/air_jump.wav',wall:'assets/audio/wall_jump.wav',dash:'assets/audio/dash.wav',
    slide:'assets/audio/slide.wav',land:'assets/audio/land.wav',punch:'assets/audio/punch.wav',splash:'assets/audio/splash.wav',
    mantle:'assets/audio/mantle.wav',slam:'assets/audio/slam.wav',checkpoint:'assets/audio/checkpoint.wav',win:'assets/audio/win.wav',click:'assets/audio/click.wav'}};
const SYN={jump:[180,.12,'triangle',.1,200],air:[300,.14,'triangle',.1,300],wall:[240,.12,'square',.07,200],dash:[500,.18,'sawtooth',.08,-380],
  slide:[150,.25,'sawtooth',.04,-80],land:[70,.15,'sine',.2,-40],punch:[260,.12,'sawtooth',.08,-180],splash:[400,.25,'sine',.08,-300],
  mantle:[120,.2,'triangle',.1,120],slam:[60,.4,'sawtooth',.2,-30],checkpoint:[500,.2,'square',.06,400],win:[300,.6,'triangle',.12,500],click:[600,.04,'square',.05,-300]};
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
    const t=SYN[n];if(!t)return;
    try{this.ac=this.ac||new(window.AudioContext||window.webkitAudioContext)();if(this.ac.state==='suspended')this.ac.resume();
      const o=this.ac.createOscillator(),g=this.ac.createGain(),now=this.ac.currentTime;o.type=t[2];o.frequency.setValueAtTime(t[0]*rate,now);
      o.frequency.exponentialRampToValueAtTime(Math.max(20,(t[0]+t[4])*rate),now+t[1]);g.gain.setValueAtTime(t[3]*S.sfx*vol,now);
      g.gain.exponentialRampToValueAtTime(0.001,now+t[1]);o.connect(g);g.connect(this.ac.destination);o.start(now);o.stop(now+t[1])}catch(e){}
  }};
const snd=(n,v,r)=>Aud.play(n,v,r);
Aud.init();
