/* Shared physics and collision geometry. No image loading or browser dependency. */
(function(root){
  'use strict';
  const GROUND=278, PLAYER_X=112, BASE_SPEED=430, MAX_SPEED=780;
  const hazards={
    stump:{w:28,h:37,bottom:0,kind:'ground'},
    rock:{w:37,h:24,bottom:0,kind:'ground'},
    branch:{w:53,h:17,bottom:0,kind:'ground'},
    lowBird:{w:42,h:22,bottom:54,kind:'air'},
    highBird:{w:42,h:22,bottom:108,kind:'air'}
  };
  const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function boxes(p){
    const bottom=GROUND-p.y;
    return [{x:PLAYER_X+25,y:bottom-32,w:62,h:27},
      {x:PLAYER_X+58,y:bottom-(p.duck&&p.y===0?44:77),w:19,h:p.duck&&p.y===0?20:47}];
  }
  function obstacleBox(o){const d=hazards[o.type];return{x:o.x+5,y:GROUND-d.bottom-d.h+3,w:d.w-10,h:d.h-6};}
  function motion(p){if(p.over)return'hit';if(!p.running)return'idle';if(p.y>0)return p.airTime<.10?'takeoff':'air';if(p.duck)return'duck';if(p.landing>0)return'land';return'run';}
  class Run{
    constructor(random=Math.random){this.random=random;this.reset();this.running=false;}
    reset(){this.running=true;this.over=false;this.elapsed=0;this.distance=0;this.speed=BASE_SPEED;this.y=0;this.vy=0;this.duck=false;this.airTime=0;this.landing=0;this.obstacles=[];this.spawnIn=.6;this.spawnCount=0;this.hitTime=0;}
    jump(){if(!this.running||this.over||this.y>0||this.duck)return false;this.vy=510;this.y=.01;this.airTime=0;this.landing=0;return true;}
    tick(dt){
      if(this.over){this.hitTime+=dt;return;}
      if(!this.running)return;
      this.elapsed+=dt;this.speed=Math.min(MAX_SPEED,BASE_SPEED+this.elapsed*8);this.distance+=this.speed*dt;
      this.landing=Math.max(0,this.landing-dt);
      if(this.y>0){this.airTime+=dt;this.vy-=1700*dt;this.y+=this.vy*dt;if(this.y<=0){this.y=0;this.vy=0;this.landing=.16;}}
      this.spawnIn-=dt;
      if(this.spawnIn<=0){
        const early=['stump','rock','lowBird','branch','highBird'];
        const later=['stump','rock','lowBird','branch','highBird','lowBird'];
        const type=this.spawnCount<5?early[this.spawnCount]:later[Math.floor(this.random()*later.length)];
        this.obstacles.push({type,x:1100});this.spawnCount++;
        // Gap measured in seconds so faster running still leaves time to react.
        this.spawnIn=1.25+this.random()*.55;
      }
      for(const o of this.obstacles){o.x-=this.speed*dt;if(boxes(this).some(b=>intersects(b,obstacleBox(o)))){this.over=true;this.running=false;this.hitTime=0;break;}}
      this.obstacles=this.obstacles.filter(o=>o.x>-80);
    }
  }
  const api={Run,GROUND,PLAYER_X,BASE_SPEED,MAX_SPEED,hazards,boxes,obstacleBox,intersects,motion};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RunnerCore=api;
})(typeof window!=='undefined'?window:globalThis);
