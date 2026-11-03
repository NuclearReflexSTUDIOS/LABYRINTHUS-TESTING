// Player settings (visual / audio / controls only - nothing that changes gameplay rules).
const $=id=>document.getElementById(id);
const SAVE_KEY='labyrinthus_v1';
const DEF={sens:1,fov:120,pix:1,hud:2,music:0.6,sfx:0.8,invert:false,reduce:false,bigHud:false,
  binds:{fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',slide:'ControlLeft',punch:'Mouse0',reset:'KeyR'}};
let S=JSON.parse(JSON.stringify(DEF));
try{const o=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');Object.assign(S,o);S.binds=Object.assign({},DEF.binds,o.binds)}catch(e){}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
