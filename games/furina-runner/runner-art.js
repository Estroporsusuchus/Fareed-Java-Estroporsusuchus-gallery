/* Approved illustrated rider atlas. Source rectangles and body anchors keep the
   torso steady while legs change; transparent image is used without editing. */
(() => {
  'use strict';
  const image=new Image();
  const frames=[
    {rect:[0,0,510,366],anchor:[250,359]},
    {rect:[525,0,510,366],anchor:[765,360]},
    {rect:[1040,0,496,366],anchor:[1260,360]},
    {rect:[0,367,525,350],anchor:[270,714]},
    {rect:[526,367,509,350],anchor:[776,679]},
    {rect:[1040,394,496,313],anchor:[1290,702]},
    {rect:[0,737,533,287],anchor:[270,991]},
    {rect:[535,737,500,287],anchor:[785,992]},
    {rect:[1040,710,496,314],anchor:[1290,992]}
  ];
  let ready=false;
  function draw(c,x,baseline,m,t,scale=1){
    if(!ready)return;
    let index=0,bob=0,stretch=1,tilt=0;
    if(m==='idle')stretch=1+Math.sin(t*2)*.006;
    if(m==='run'){index=1+Math.floor(t*10)%2;bob=Math.sin(t*20*Math.PI)*.7;}
    if(m==='takeoff'){index=3;tilt=-Math.min(t/.10,1)*.025;}
    if(m==='air'){index=4;bob=-4;tilt=Math.sin(t*6)*.015;}
    if(m==='land'){index=5;stretch=1-Math.sin(Math.min(t/.16,1)*Math.PI)*.04;}
    if(m==='duck'){index=6+Math.floor(t*8)%2;bob=Math.sin(t*16*Math.PI)*.35;}
    if(m==='hit'){index=8;tilt=Math.sin(Math.min(t,.24)*25)*.045*Math.max(0,1-t/.24);}
    const {rect:[sx,sy,sw,sh],anchor:[ax,ay]}=frames[index];
    c.save();c.translate(x+50*scale,baseline+bob*scale);c.rotate(tilt);c.scale(scale*.24,scale*.24*stretch);
    c.drawImage(image,sx,sy,sw,sh,sx-ax,sy-ay,sw,sh);c.restore();
    if(m==='land'&&t<.16){c.save();c.strokeStyle='#9fb9cd';c.lineWidth=scale;c.beginPath();c.moveTo(x+32*scale,baseline+2);c.lineTo(x+(28-12*t)*scale,baseline+3);c.moveTo(x+91*scale,baseline+2);c.lineTo(x+(96+12*t)*scale,baseline+3);c.stroke();c.restore();}
  }
  const loaded=new Promise((resolve,reject)=>{
    image.onload=()=>{ready=true;resolve();};image.onerror=()=>reject(new Error('角色图集未加载'));
  });
  window.RunnerArt={draw,loaded,frames};
  image.src='assets/furina-triceratops-atlas-v4.webp';
})();
