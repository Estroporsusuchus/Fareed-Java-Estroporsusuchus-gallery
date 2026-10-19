'use strict';
(() => {
  const C=window.RunnerCore, game=new C.Run(), canvas=document.getElementById('world'), ctx=canvas.getContext('2d');
  const ui=id=>document.getElementById(id), ink='#287cc1', pale='#d5ebfb', labels={idle:'待机',run:'奔跑',takeoff:'起跳',air:'腾空 · 收腿',land:'落地',duck:'低伏',hit:'碰撞'};
  let mode='loading',last=0,clock=0,best=0,showBoxes=false,frozenMotion='idle';
  try{best=Number(localStorage.getItem('furina-triceratops-best'))||0;}catch{}
  ui('best').textContent=String(best).padStart(4,'0');
  function line(c,points,color=ink,width=1.7,fill){c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);if(fill){c.closePath();c.fillStyle=fill;c.fill();}c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}
  function oval(c,x,y,rx,ry,fill='white',stroke=ink){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=1.6;c.stroke();}
  const drawHero=(...args)=>window.RunnerArt.draw(...args);
  function hazard(c,type,x,base,t){
    const d=C.hazards[type];c.save();c.translate(x,base-d.bottom);
    if(d.kind==='air'){
      const wing=Math.sin(t*19)*10;
      line(c,[[8,-10],[19,-17],[29,-14],[39,-9],[28,-5],[15,-5]],ink,1.5,pale);
      line(c,[[20,-11],[9,-25-wing],[24,-17],[29,-10]],ink,1.5,'white');
      line(c,[[35,-10],[44,-8],[37,-5]],ink,1.3,'white');oval(c,34,-11,1,1,ink);
    }else if(type==='stump'){
      line(c,[[2,0],[7,-31],[23,-31],[26,0]],ink,1.7,pale);oval(c,15,-32,9,4,'white');line(c,[[11,-26],[10,-7]],ink,1);line(c,[[19,-23],[20,-2]],ink,1);
    }else if(type==='rock')line(c,[[0,0],[5,-13],[15,-22],[27,-20],[37,0],[0,0],[15,-22],[19,-1]],ink,1.6,pale);
    else{line(c,[[0,-3],[49,-3]],ink,6);line(c,[[18,-4],[12,-15],[8,-17]],ink,2);line(c,[[32,-5],[40,-14]],ink,2);}
    c.restore();
  }
  function overlay(label,title,button,note){ui('state-label').textContent=label;ui('state-title').textContent=title;ui('start').textContent=button;ui('state-note').textContent=note;ui('overlay').hidden=false;}
  function start(){if(mode==='loading'||mode==='error')return;game.reset();mode='running';ui('overlay').hidden=true;ui('pause').disabled=false;ui('restart').disabled=false;ui('pause').textContent='暂停';canvas.focus({preventScroll:true});ui('announcement').textContent='出发。空格跳跃，按住向下键低伏。';}
  function jump(){if(mode==='idle'||mode==='over'){start();return;}if(mode==='running')game.jump();}
  function crouch(value){game.duck=!!value&&mode==='running';ui('duck').setAttribute('aria-pressed',String(game.duck));}
  function pause(){
    if(mode==='running'){frozenMotion=C.motion(game);mode='paused';game.running=false;crouch(false);ui('pause').textContent='继续';overlay('休息一下','三角龙在等你。','继续跑','P 或点击继续');}
    else if(mode==='paused'){mode='running';game.running=true;ui('overlay').hidden=true;ui('pause').textContent='暂停';canvas.focus({preventScroll:true});}
  }
  function finish(){mode='over';crouch(false);const score=Math.floor(game.distance/12);best=Math.max(best,score);try{localStorage.setItem('furina-triceratops-best',String(best));}catch{}ui('best').textContent=String(best).padStart(4,'0');ui('pause').disabled=true;overlay(`这次走了 ${score} 米`,'哎呀，碰到了。','再跑一回','空格重新开始 · 可勾选判定框检查碰撞');ui('announcement').textContent='碰到障碍，已停止。';}
  function background(){
    ctx.fillStyle='#fcfdff';ctx.fillRect(0,0,1080,350);
    for(let i=0;i<5;i++){const x=((i*270+80-game.distance*.1)%1400+1400)%1400-100;line(ctx,[[x,80],[x+12,77],[x+18,69],[x+30,70],[x+36,79],[x+52,81]],'#d3e6f5',1.2);}
    ctx.beginPath();ctx.moveTo(0,240);for(let i=-1;i<7;i++){const x=i*220-game.distance*.15%220;ctx.quadraticCurveTo(x+110,180+(i%2)*12,x+220,240);}ctx.strokeStyle='#e0eef9';ctx.lineWidth=1;ctx.stroke();
    line(ctx,[[0,C.GROUND],[230,C.GROUND+.3],[450,C.GROUND-.3],[800,C.GROUND+.2],[1080,C.GROUND]],'#8ab3d5',1);
    for(let i=0;i<30;i++){const x=((i*49-game.distance)%1130+1130)%1130-25;line(ctx,[[x,292+i%3*12],[x+5+i%4*2,292+i%3*12]],'#c9dfee',1);}
  }
  function draw(){
    background();const m=mode==='paused'?frozenMotion:C.motion(game),animTime=mode==='running'?game.elapsed:mode==='over'?game.hitTime:mode==='paused'?game.elapsed:clock;
    for(const o of game.obstacles)hazard(ctx,o.type,o.x,C.GROUND,animTime);
    drawHero(ctx,C.PLAYER_X,C.GROUND-game.y,m,m==='land'?.16-game.landing:(m==='takeoff'||m==='air')?game.airTime:animTime);
    if(showBoxes){ctx.save();ctx.strokeStyle='#dc6f65';ctx.lineWidth=1;ctx.setLineDash([3,3]);for(const b of [...C.boxes(game),...game.obstacles.map(C.obstacleBox)])ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore();}
    ui('score').textContent=String(Math.floor(game.distance/12)).padStart(4,'0');ui('speed').textContent=(game.speed/C.BASE_SPEED).toFixed(2)+'×';ui('motion').textContent=labels[m];
    document.querySelectorAll('[data-motion]').forEach(el=>{
      const c=el.getContext('2d'),kind=el.dataset.motion;c.clearRect(0,0,el.width,el.height);
      let t=clock;if(kind==='land')t=clock%.65;if(kind==='hit')t=clock%1.5;
      const lift=kind==='takeoff'?5+Math.sin(clock*4)*4:kind==='air'?12+Math.sin(clock*3)*3:0;
      drawHero(c,24,132-lift,kind,t,1.4);
    });
    document.querySelectorAll('[data-hazard]').forEach(el=>{const c=el.getContext('2d');c.clearRect(0,0,el.width,el.height);const d=C.hazards[el.dataset.hazard];c.save();c.translate(55,112+d.bottom*1.7);c.scale(1.7,1.7);hazard(c,el.dataset.hazard,0,0,clock);c.restore();});
  }
  function frame(time){const dt=Math.min((time-last)/1000||0,.04);last=time;clock+=dt;if(mode==='running'){game.tick(dt);if(game.over)finish();}else if(mode==='over')game.tick(dt);draw();requestAnimationFrame(frame);}
  ui('start').addEventListener('click',()=>mode==='paused'?pause():start());ui('restart').addEventListener('click',start);ui('pause').addEventListener('click',pause);
  ui('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
  ui('duck').addEventListener('pointerdown',e=>{e.preventDefault();ui('duck').setPointerCapture(e.pointerId);crouch(true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])ui('duck').addEventListener(name,()=>crouch(false));
  ui('debug').addEventListener('change',e=>{showBoxes=e.target.checked;});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});jump();});
  document.addEventListener('keydown',e=>{
    if(['INPUT','BUTTON'].includes(e.target.tagName)&&['Space','Enter'].includes(e.code))return;
    if(['Space','ArrowUp','ArrowDown','KeyS'].includes(e.code))e.preventDefault();
    if(['Space','ArrowUp'].includes(e.code)&&!e.repeat)jump();
    if(['ArrowDown','KeyS'].includes(e.code))crouch(true);
    if(e.code==='KeyP'&&!e.repeat)pause();
  });
  document.addEventListener('keyup',e=>{if(['ArrowDown','KeyS'].includes(e.code))crouch(false);});
  window.addEventListener('blur',()=>{crouch(false);if(mode==='running')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause();});
  window.RunnerArt.loaded.then(()=>{mode='idle';ui('start').disabled=false;ui('start').textContent='出发';}).catch(()=>{mode='error';overlay('素材没有加载','请刷新页面重试。','素材未就绪','');});requestAnimationFrame(frame);
})();
