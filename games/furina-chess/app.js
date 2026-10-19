import {Chess} from './vendor/chess.js';
import {ChessEngine} from './engine.js';
import {lookupOpening,openingComment,eventComment} from './knowledge.js';
const $=id=>document.getElementById(id),game=new Chess();
const glyphs={wk:'♚',wq:'♛',wr:'♜',wb:'♝',wn:'♞',wp:'♟',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'},names={k:'王',q:'后',r:'车',b:'象',n:'马',p:'兵'};
let engine=new ChessEngine(),ready=false,busy=false,human='w',orientation='w',selected=null,epoch=0,knowledge=null,knowledgeFailed=false,lastOpening=null,lastSpeechPly=-10,spoken=new Set(),promotionPending=null;
function say(line){if(!line)return;$('speech').dataset.lineId=line.id;$('line').textContent=line.text;lastSpeechPly=game.history().length;}
function fail(error){busy=false;$('engine-error').hidden=false;$('error-text').textContent=error.message||'引擎暂时不可用。';render();}
function openingLabel(){
 if(knowledgeFailed){$('opening').textContent='开局资料未能加载，刷新可重试';$('opening-detail').textContent='';return;}
 $('opening').textContent=lastOpening?`${lastOpening.title} · ${lastOpening.eco}`:'尚未识别';
 $('opening-detail').textContent=lastOpening?lastOpening.name:'';
}
function afterMove(move){
 const hit=knowledge?lookupOpening(game,knowledge):null;if(hit)lastOpening=hit;openingLabel();
 const event=eventComment(game,move,human);
 if(event&&(game.isGameOver()||game.isCheck()||game.history().length-lastSpeechPly>=2))say(event);
 else if(hit&&hit.plies>=2&&!spoken.has(hit.family)&&game.history().length-lastSpeechPly>=2){const line=openingComment(game,hit);if(line){say(line);spoken.add(hit.family);}}
}
function render(){
 const files=orientation==='w'?'abcdefgh':'hgfedcba',ranks=orientation==='w'?'87654321':'12345678',history=game.history({verbose:true}),last=history.at(-1);
 const legal=selected?game.moves({square:selected,verbose:true}):[];const board=$('board');board.replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const square=files[col]+ranks[row],piece=game.get(square),button=document.createElement('button');
   button.type='button';button.className='square'+(('abcdefgh'.indexOf(square[0])+Number(square[1]))%2===0?' dark':'');button.dataset.square=square;button.setAttribute('role','gridcell');button.tabIndex=square===(selected||(orientation==='w'?'e2':'e7'))?0:-1;
   button.setAttribute('aria-label',square+(piece?` ${piece.color==='w'?'白':'黑'}${names[piece.type]}`:' 空格'));
   if(piece){const span=document.createElement('span');span.className='piece '+(piece.color==='w'?'white':'black');span.textContent=glyphs[piece.color+piece.type];span.setAttribute('aria-hidden','true');button.append(span);}
   if(last&&(last.from===square||last.to===square))button.classList.add('last');
   if(selected===square)button.classList.add('selected');
   if(legal.some(m=>m.to===square))button.classList.add('target',piece?'capture':'empty');
   if(game.isCheck()&&piece?.type==='k'&&piece.color===game.turn())button.classList.add('check');
   if(col===0){const coord=document.createElement('span');coord.className='coord rank';coord.textContent=square[1];button.append(coord);}
   if(row===7){const coord=document.createElement('span');coord.className='coord file';coord.textContent=square[0];button.append(coord);}
   button.addEventListener('click',()=>select(square));board.append(button);
 }
 $('your-side').textContent=human==='w'?'你执白':'你执黑';
 $('turn').textContent=game.isCheckmate()?(game.turn()===human?'芙获胜':'你获胜'):game.isDraw()?'和棋':!ready?'棋力引擎准备中…':!$('engine-error').hidden?'等待引擎恢复':busy?'芙正在思考…':game.turn()===human?('轮到你'+(game.isCheck()?' · 被将军':'')):'轮到芙';
 $('undo').disabled=!ready||!history.some(m=>m.color===human);$('new').disabled=!ready;
 const list=$('move-list');list.replaceChildren();for(let i=0;i<history.length;i+=2){const li=document.createElement('li');li.textContent=history[i].san+(history[i+1]?'  '+history[i+1].san:'');list.append(li);}
 $('move-count').textContent=`${history.length} 手`;
}
async function aiMove(){
 if(!ready||game.isGameOver()||game.turn()===human)return;
 const generation=epoch,fen=game.fen();busy=true;render();
 try{
  const best=await engine.search(fen,Number($('level').value));if(epoch!==generation||game.fen()!==fen)return;
  if(!best||best==='(none)'||best==='0000')throw new Error('引擎没有返回可用走法，请重试。');
  let move;try{move=game.move({from:best.slice(0,2),to:best.slice(2,4),promotion:best[4]||'q'});}catch{throw new Error('引擎返回的走法未通过棋规检查，请重试。');}
  if(!move)throw new Error('引擎走法无效。');busy=false;afterMove(move);render();
 }catch(error){if(generation!==epoch||error.name==='AbortError')return;fail(error);}
}
function execute(from,to,promotion='q'){
 let move;try{move=game.move({from,to,promotion});}catch{return;}if(!move)return;
 selected=null;afterMove(move);render();aiMove();
}
function select(square){
 if(!ready||busy||game.isGameOver()||game.turn()!==human||!$('engine-error').hidden)return;
 if(selected){
  const moves=game.moves({square:selected,verbose:true}).filter(m=>m.to===square);
  if(moves.length){
   if(moves.some(m=>m.promotion)){promotionPending={from:selected,to:square,epoch};$('promotion').showModal();return;}
   execute(selected,square);return;
  }
 }
 const piece=game.get(square);selected=piece?.color===human&&selected!==square?square:null;render();
 if(selected)$('board').querySelector(`[data-square="${selected}"]`)?.focus({preventScroll:true});
}
function reset(){
 epoch++;engine.cancel();busy=false;selected=null;lastOpening=null;spoken.clear();lastSpeechPly=-10;promotionPending=null;if($('promotion').open)$('promotion').close();
 human=$('side').value;orientation=human;game.reset();game.header('Event','A quiet game with Furina','White',human==='w'?'Player':'Furina','Black',human==='b'?'Player':'Furina');$('engine-error').hidden=true;
 openingLabel();say({id:'start:'+human,text:human==='w'?'你先吧，我想看看你的打算。':'你执黑。那么，这次由我先走。'});render();aiMove();
}
function recomputeOpening(){lastOpening=null;if(knowledge){const replay=new Chess();for(const m of game.history({verbose:true})){replay.move({from:m.from,to:m.to,promotion:m.promotion});const hit=lookupOpening(replay,knowledge);if(hit)lastOpening=hit;}}openingLabel();}
$('new').addEventListener('click',reset);$('side').addEventListener('change',reset);
$('level').addEventListener('change',()=>{if(busy){epoch++;engine.cancel();busy=false;aiMove();}});
$('undo').addEventListener('click',()=>{epoch++;engine.cancel();busy=false;selected=null;if(game.history({verbose:true}).at(-1)?.color!==human)game.undo();if(game.history({verbose:true}).at(-1)?.color===human)game.undo();$('engine-error').hidden=true;recomputeOpening();say({id:'undo',text:'退回这一步。你可以再想想。'});render();aiMove();});
$('flip').addEventListener('click',()=>{orientation=orientation==='w'?'b':'w';render();});
$('retry').addEventListener('click',async()=>{epoch++;engine.close();engine=new ChessEngine();ready=false;busy=false;$('engine-error').hidden=true;render();try{await engine.ready;ready=true;render();aiMove();}catch(e){fail(e);}});
for(const type of ['q','r','b','n']){const button=document.createElement('button');button.textContent=glyphs['w'+type];button.setAttribute('aria-label','升变为'+names[type]);button.addEventListener('click',()=>{const pending=promotionPending;promotionPending=null;$('promotion').close();if(pending?.epoch===epoch)execute(pending.from,pending.to,type);});$('promotion-options').append(button);}
$('cancel-promotion').addEventListener('click',()=>{$('promotion').close();promotionPending=null;});$('promotion').addEventListener('cancel',()=>{promotionPending=null;});
$('board').addEventListener('keydown',e=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];if(!delta)return;e.preventDefault();const buttons=[...$('board').children],current=buttons.indexOf(e.target),next=buttons[Math.max(0,Math.min(63,current+delta))];if(next){buttons.forEach(b=>b.tabIndex=-1);next.tabIndex=0;next.focus();}});
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([game.pgn()],{type:'application/x-chess-pgn'})),a=document.createElement('a');a.href=url;a.download='furina-chess.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
window.addEventListener('pagehide',()=>engine.close());
render();
const openingsReady=fetch('openings.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{knowledge=data;}).catch(()=>{knowledgeFailed=true;openingLabel();});
Promise.all([engine.ready,openingsReady]).then(()=>{ready=true;reset();}).catch(fail);
