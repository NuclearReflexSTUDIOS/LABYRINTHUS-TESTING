// ===== SECTION ASSEMBLER (Hollow Grid) =====
// A section is a grid of LANES running -z. Every STAGE = a hub plaza (20 m) + one obstacle module (64 m) per lane.
// Lanes are 80 m apart; at the hubs, lateral bridges (32 m) hop between neighbouring lanes, so routes branch, merge, split again.
// Some lanes end at a dead-end cache. One guaranteed "spine" route is walked by the test bot to prove the section is beatable.
const HUBD=20,STG=HUBD+LZ,CLIMB_N=63,CLIMB_DY=.42*CLIMB_N;
const LANEC=['#ff7a2e','#4ad0ff','#b6ff4a','#ff4a8a'],LANEN=['A','B','C','D'],LX=l=>(l-1.5)*80;
const MODN={stones:'STEPPING SLABS',hurdles:'HURDLES',slide:'LOW TUNNELS',crumble:'CRUMBLING TILES',bounce:'LAUNCH PAD',conveyors:'TREADMILLS',pillars:'PILLAR CLIMB',beams:'THE BEAMS',sprintGap:'SPRINT GAP',crossfire:'CROSSFIRE',span:'CABLE SPAN',climb:'SPIRAL CLIMB'};
// 1.5-turn spiral stair around a core: raises the lane by CLIMB_DY. world coords, runs toward -z, entry plate at z0
function climbMod(cx,z0,y,seed){const r=20,cz=z0-32,yT=y+CLIMB_DY;blk(cx-10,y-3,z0-10,cx+10,y,z0,0);
  const H=helix(cx,cz,r,y,CLIMB_N,0,1,true);coreBox(cx,cz,60,yT+12);atrium(cx,cz,27,y-1,yT+34,seed);
  blk(cx-10,yT-3,z0-64,cx+10,yT,z0-50,0);V(cx-10,yT,z0-64,cx+10,yT+.12,z0-63.6,EDG());
  const w=[[cx,y,z0-2]];H.way.forEach((p,i)=>w.push([p[0],y+.42*(2*i+1),p[1],'h']));w.push([cx,yT,z0-58]);w.push([cx,yT,z0-62]);return w}
const SECTIONS={
 scrap:{title:'SCRAPYARD',seed:301,y0:30,stages:8,climb:[3,6],pool:['stones','hurdles','crumble','conveyors','pillars','beams','bounce','span'],lat:['stones','beam','crumble','conveyor','bounce']},
 hollow:{title:'THE HOLLOW',seed:302,y0:90,stages:9,climb:[3,6],pool:['stones','hurdles','slide','crumble','bounce','conveyors','pillars','beams','sprintGap','span','crossfire'],lat:['stones','beam','crumble','conveyor','bounce']},
 crown:{title:'THE CROWN',seed:303,y0:200,stages:9,climb:[2,5,7],pool:['slide','crumble','bounce','pillars','beams','sprintGap','crossfire','span','stones','hurdles','conveyors'],lat:['beam','crumble','bounce','stones']}};
function buildSection(cfg,idx,isLast){
  CLOUDS.visible=true;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);LPAD=null;
  const R=rng(cfg.seed),n=cfg.stages,total=n*STG;let y=cfg.y0;
  skyline(cfg.seed,200,-total-400,200,210,160,1100,0,-total/2);
  for(let z=100;z>-total-200;z-=125+R()*40)for(const s of[-1,1]){const w=46+R()*30,d=46+R()*30;megaTower(s*(265+R()*50),z,w,d,cfg.y0+60+R()*300,Math.round(-z)*s+cfg.seed)}
  for(let i=0;i<4;i++)skybridge(-330,330,-total*(i+.5)/4,cfg.y0+110+R()*90,12,12);
  // ---- start plaza spans every lane: pick a route from the first hub ----
  rf(-170,-HUBD,170,6,y,cfg.seed*10,{avoid:[[-170,-HUBD,170,-6]]});CP.push({p:[0,y+.05,-4]});
  floorText(RS.on?['#DROP ZONE','LOOT. CALL EXTRACTION. LEAVE.']:['#'+cfg.title,'SECTION '+(idx+1)+' OF 3'],0,y,-12,18);
  board(['#BRANCHING ROUTES','EVERY LANE IS A DIFFERENT PATH','LANES END IN DEAD ENDS: CHECK THE SIGNS','BRIDGES LET YOU SWAP LANES'],-60,y,-3,10,'+z');
  let A=[1,1,1,1],spine=1+(R()*2|0);const s0=spine,last=[null,null,null,null],route=[];const ptr=[LX(s0),y,-4];
  for(let k=0;k<n;k++){
    const zh=-k*STG,cl=cfg.climb.includes(k),H=A.slice(),br=[];
    if(k>0){ // lateral bridges at this hub
      const used={},add=(l,dir,type,spineMove)=>{used[l]=1;H[l]=H[l+1]=1;br.push({l,type,dir,spineMove})};
      if(R()<.55){const s2=spine+(R()<.5?-1:1);if(s2>=0&&s2<4){const l=Math.min(spine,s2),dir=s2>spine?1:-1;let t=cfg.lat[R()*cfg.lat.length|0];if(t==='bounce'&&dir<0)t='stones';add(l,dir,t,s2)}}
      for(let l=0;l<3;l++)if(!used[l]){const a=A[l],b=A[l+1];if((a^b)?R()<.6:(a&&b?R()<.3:false)){let t=cfg.lat[R()*cfg.lat.length|0];let dir=a?1:-1;if(a&&b)dir=R()<.5?1:-1;if(t==='bounce'&&dir<0)t='crumble';add(l,dir,t,-1)}}}
    const sp0=spine;for(const b of br)if(b.spineMove>=0&&(b.l===sp0||b.l+1===sp0)&&b.spineMove!==-1)spine=b.spineMove;
    const C=[0,0,0,0];let cc=0;for(let l=0;l<4;l++)if(H[l]&&(l===spine||R()<.7)){C[l]=1;cc++}if(cc<2)for(let l=0;l<4&&cc<2;l++)if(H[l]&&!C[l]){C[l]=1;cc++}
    // hubs
    for(let l=0;l<4;l++)if(H[l]){const cx=LX(l);if(k>0)rf(cx-24,zh-HUBD,cx+24,zh,y,cfg.seed*100+k*10+l,{avoid:[[cx-10,zh-HUBD,cx+10,zh],[cx-24,zh-16,cx-14,zh-4],[cx+14,zh-16,cx+24,zh-4]]});
      if(C[l]){if(k>0&&!RS.on)CP.push({p:[cx,y+.05,zh-8]});lootHub(cx+14,y,zh-6,false,.4);if(k>1)guardHub(cx,y,zh,false);if(R()<.5)gate(cx,y+14,zh-HUBD*.5,26,3,false,l%2?0xaee0ff:0xffa24a)}
      else if(k>0){board(RS.on?['#DEAD END','BUT THE LOOT IS GOOD']:['#DEAD END','THIS LANE GOES NOWHERE','TRY A BRIDGE'],cx+8,y,zh-6,7,'+z');lootHub(cx,y,zh-10,true,1);lootHub(cx-12,y,zh-14,false,.7);guardHub(cx,y,zh,true)}}
    // bridges
    for(const b of br){const x0=LX(b.l)+24,x1=LX(b.l+1)-24,zb=zh-HUBD/2;const w=LATS[b.type](x0,x1,zb,y);b.w=w;b.zb=zb;
      sign(['#'+b.type.toUpperCase(),'LANE '+LANEN[b.l]+' / '+LANEN[b.l+1]],(x0+x1)/2,y+9,zb,6,'+z',{bg:'#101214',bc:LANEC[b.l]})}
    // spine route through this hub
    for(const b of br)if(b.spineMove>=0&&(b.l===sp0||b.l+1===sp0)&&b.spineMove===spine&&spine!==sp0){const dir=spine>sp0?1:-1,wps=b.w.map(p=>p.slice());if(dir<0)wps.reverse();
      route.push([LX(sp0)+dir*17,y,b.zb,'w']);for(const p of wps)route.push(p);route.push([LX(spine)-dir*17,y,b.zb,'w'])}
    // modules
    for(let l=0;l<4;l++)if(C[l]){const cx=LX(l),z0=zh-HUBD;let nm;
      if(cl)nm='climb';else{do nm=cfg.pool[R()*cfg.pool.length|0];while(nm===last[l]&&cfg.pool.length>2)}
      last[l]=nm;const w=nm==='climb'?climbMod(cx,z0,y,cfg.seed+k):place(nm,cx,z0,y,1);
      sign(['#'+MODN[nm],'LANE '+LANEN[l]],cx,y+6.5,z0+2,7,'+z',{bg:'#101214',bc:LANEC[l]});
      if(l===spine)for(const p of w)route.push(p)}
    if(cl)y+=CLIMB_DY;A=C.slice()}
  // ---- finale: every surviving lane merges on one wide plaza ----
  const zf=-n*STG;rf(-170,zf-44,170,zf,y,cfg.seed*10+9,{avoid:[[-20,zf-44,20,zf]]});if(!RS.on)CP.push({p:[LX(spine),y+.05,zf-6]});
  Object.assign(GOAL,{x:0,y,z:zf-30});if(!RS.on)beacon(isLast?560:380);
  floorText(RS.on?['#EXTRACTION POINT','CALL IT IN, THEN COME HERE']:isLast?['#YOU REACHED','THE CROWN']:['#SECTION CLEARED','NEXT: '+SECTIONS[['scrap','hollow','crown'][idx+1]].title],0,y,zf-18,16);
  route.push([0,y,zf-30]);
  test('route:'+cfg.title,ptr,0,[0,0,0,0,0],{pf:route,secs:n*45+60,delays:[0]})}

// ===== TOWER (red): floors stacked on top of each other, every floor runs the opposite way, a 1-turn spiral joins them =====
// Same lanes, modules and lateral bridges as the Hollow Grid sections. No checkpoints: fall off a floor and you usually land on the one below.
const UT_N=42,UT_DY=.42*UT_N,UT_HD=9.1+HUBD;
function uturnMod(cx,z0,y,fl,seed){const r=20,cz=z0-fl*32,yT=y+UT_DY,zs=[z0,z0-fl*10];blk(cx-10,y-3,Math.min(...zs),cx+10,y,Math.max(...zs),0);
  const H=helix(cx,cz,r,y,UT_N,fl>0?0:Math.PI,1,true);coreBox(cx,cz,40,yT+12);atrium(cx,cz,27,y-1,yT+34,seed);
  const w=[[cx,y,z0-fl*2]];H.way.forEach((p,i)=>w.push([p[0],y+.42*(2*i+1),p[1],'h']));w.push([H.last.x,yT,H.last.z,'h']);return{w,yT}}
const TOWER={title:'TOWER',seed:401,y0:20,floors:5,S:3,pool:['stones','hurdles','slide','crumble','conveyors','pillars','beams','sprintGap','crossfire'],lat:['stones','beam','crumble','conveyor']};
function buildTower(cfg){
  CLOUDS.visible=true;const gr=makeGround(BASEY);gr.userData.keep=true;LVL.add(gr);ENVMATS.push(gr.material);LPAD=null;
  const R=rng(cfg.seed),F=cfg.floors,S=cfg.S,len=S*STG+60;let y=cfg.y0,fl=1,c=0;
  skyline(cfg.seed,200,-len-500,300,210,160,1100,0,0);
  for(let z=300;z>-len-300;z-=125+R()*40)for(const s of[-1,1]){const w=46+R()*30,d=46+R()*30;megaTower(s*(265+R()*50),z,w,d,cfg.y0+F*UT_DY+60+R()*200,Math.round(-z)*s+cfg.seed)}
  const plate=(cx,za,zb,yy,seed,f,hubZ)=>{const a=Math.min(za,zb),b=Math.max(za,zb),av={avoid:[[cx-10,a,cx+10,b],[cx-24,a+4,cx-14,b-4],[cx+14,a+4,cx+24,b-4]]};f===0?rf(cx-24,a,cx+24,b,yy,seed,av):rfs(cx-24,a,cx+24,b,yy,seed,av)};
  let A=[1,1,1,1],spine=0;const route=[],ptr=[LX(0),y,-4];
  rf(-170,-20,170,6,y,cfg.seed*10,{avoid:[[-170,-20,170,-6]]});CP.push({p:[0,y+.05,-4]});
  floorText(['#TOWER','5 FLOORS  /  NO CHECKPOINTS'],0,y,-12,18);board(['#TOWER','CLIMB TO THE TOP','EACH FLOOR RUNS THE OTHER WAY','A SPIRAL JOINS THE FLOORS','FALL OFF: YOU LAND ON THE FLOOR BELOW'],-60,y,-3,10,'+z');
  const last=[null,null,null,null];
  for(let f=0;f<F;f++){
    const lastF=f===F-1;
    for(let h=0;h<=S;h++){
      const first=h===0,hd=(first&&f>0)?UT_HD:HUBD,zA=c,zB=c-fl*hd,zbr=c-fl*hd/2,H=A.slice(),br=[];
      if(first&&f===0){/* start plaza already built */}
      else{
        // spine target lane
        const sp0=spine,opts=[sp0-1,sp0,sp0+1].filter(l=>l>=0&&l<4&&Math.abs(3-l)<=S-h);const st=opts.includes(sp0)&&R()<.5?sp0:opts[R()*opts.length|0];
        const used={};const add=(l,dir,type,sm)=>{used[l]=1;H[l]=H[l+1]=1;br.push({l,type,dir,sm})};
        if(st!==sp0){const l=Math.min(sp0,st),dir=st>sp0?1:-1;add(l,dir,cfg.lat[R()*cfg.lat.length|0],st)}
        for(let l=0;l<3;l++)if(!used[l]){const a=A[l],b=A[l+1];if((a^b)?R()<.6:(a&&b?R()<.3:false)){add(l,a?1:-1,cfg.lat[R()*cfg.lat.length|0],-1)}}
        spine=st;
        for(let l=0;l<4;l++)if(H[l])plate(LX(l),zA,zB,y,cfg.seed*100+f*40+h*4+l,f);
        for(const b of br){const x0=LX(b.l)+24,x1=LX(b.l+1)-24;b.w=LATS[b.type](x0,x1,zbr,y);b.zb=zbr;sign(['#'+b.type.toUpperCase(),'LANE '+LANEN[b.l]+' / '+LANEN[b.l+1]],(x0+x1)/2,y+9,zbr,6,'+z',{bg:'#101214',bc:LANEC[b.l]})}
        for(const b of br)if(b.sm===spine&&spine!==sp0){const dir=spine>sp0?1:-1,wps=b.w.map(p=>p.slice());if(dir<0)wps.reverse();route.push([LX(sp0)+dir*17,y,b.zb,'w']);for(const p of wps)route.push(p);route.push([LX(spine)-dir*17,y,b.zb,'w'])}
        if(first)floorText(['#FLOOR '+(f+1),'OF '+F],LX(spine),y,c-fl*6,10);
      }
      if(h===S){ // end of the floor
        if(lastF){const wa=c-fl*HUBD,wz=c-fl*(HUBD+44);rfs(-170,Math.min(wa,wz),170,Math.max(wa,wz),y,cfg.seed*10+9,{avoid:[[-20,Math.min(wa,wz),20,Math.max(wa,wz)]]});Object.assign(GOAL,{x:0,y,z:c-fl*(HUBD+22)});beacon(500);floorText(['#YOU REACHED','THE TOP'],0,y,c-fl*(HUBD+10),16);route.push([LX(spine),y,c-fl*10]);route.push([0,y,c-fl*(HUBD+22)])}
        else{const z0=c-fl*HUBD,u=uturnMod(LX(3),z0,y,fl,cfg.seed+f);for(const p of u.w)route.push(p);
          sign(['#SPIRAL UP','FLOOR '+(f+2)],LX(3),y+8,z0+fl*2,7,fl>0?'+z':'-z',{bg:'#101214',bc:'#ff3a2e'});
          const nfl=-fl,nc=z0-fl*9.1;
          route.push([LX(3),u.yT,z0+fl*8]);
          y=u.yT;fl=nfl;c=nc;A=[0,0,0,1];spine=3;h=S+1}
        continue}
      // modules for this hub
      const C=[0,0,0,0];let cc=0;for(let l=0;l<4;l++)if(H[l]&&(l===spine||R()<.7)){C[l]=1;cc++}if(cc<2)for(let l=0;l<4&&cc<2;l++)if(H[l]&&!C[l]){C[l]=1;cc++}
      for(let l=0;l<4;l++){if(!H[l])continue;const cx=LX(l);
        if(C[l]){const z0=zB;let nm;do nm=cfg.pool[R()*cfg.pool.length|0];while(nm===last[l]);last[l]=nm;const w=place(nm,cx,z0,y,fl);
          sign(['#'+MODN[nm],'LANE '+LANEN[l]],cx,y+6.5,z0+fl*2,7,fl>0?'+z':'-z',{bg:'#101214',bc:LANEC[l]});if(l===spine)for(const p of w)route.push(p);
          if(R()<.4)gate(cx,y+14,(zA+zB)/2,26,3,false,0xff3a2e)}
        else board(['#DEAD END','THIS LANE GOES NOWHERE','TRY A BRIDGE'],cx+8,y,zbr+fl*0,7,fl>0?'+z':'-z')}
      c=zB-fl*LZ;A=C.slice()}
    if(lastF)break;
    // (after the uturn the loop's h=S+1 exits; the next floor starts with h=0 at the new cursor)
  }
  test('route:TOWER',ptr,0,[0,0,0,0,0],{pf:route,secs:F*(S*45+60)+60,delays:[0]})}
