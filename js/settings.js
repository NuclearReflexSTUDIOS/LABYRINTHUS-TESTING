// Player settings (visual / audio / controls only - nothing that changes gameplay rules).
const $=id=>document.getElementById(id);
const SAVE_KEY='labyrinthus_v2';
const DEF={sens:1,fov:120,pix:3,hud:2,dither:true,music:0.6,sfx:0.8,invert:false,reduce:false,bigHud:false,typeClick:false,
  binds:{fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',slide:'ControlLeft',punch:'Mouse0',reset:'KeyR',flash:'KeyF',inv:'KeyQ'}};
// phones/tablets: primary pointer is coarse (a touchscreen laptop still counts as desktop). Add ?touch to the URL to force touch controls.
const TOUCH=matchMedia('(pointer:coarse)').matches||/[?&]touch\b/.test(location.search);
if(TOUCH){DEF.pix=4;DEF.fov=100}
let S=JSON.parse(JSON.stringify(DEF));
try{const o=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');Object.assign(S,o);S.binds=Object.assign({},DEF.binds,o.binds)}catch(e){}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
