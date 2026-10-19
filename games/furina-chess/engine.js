export class ChessEngine {
  constructor(){this.serial=0;this.pending=null;this.start();}
  start(){
    this.worker=new Worker(new URL('./vendor/stockfish-19-lite-single.js',import.meta.url));
    this.ready=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.worker.terminate();reject(new Error('棋力引擎加载超时，请重试。'));},25000);
      this.worker.onmessage=event=>{
        for(const line of String(event.data).split('\n')){
          if(line==='uciok')this.worker.postMessage('isready');
          if(line==='readyok'){clearTimeout(timer);resolve();}
          if(line.startsWith('bestmove ')&&this.pending){const p=this.pending;this.pending=null;clearTimeout(p.timer);p.resolve(line.split(' ')[1]);}
        }
      };
      this.worker.onerror=()=>{clearTimeout(timer);const error=new Error('棋力引擎未能启动，请重试。');reject(error);if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(error);this.pending=null;}};
      this.worker.postMessage('uci');
    });
    // Avoid unhandled rejection if the player navigates away during loading.
    this.ready.catch(()=>{});
  }
  cancel(){this.serial++;if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new DOMException('取消思考','AbortError'));this.pending=null;this.worker.terminate();this.start();}}
  async search(fen,level){
    const serial=++this.serial;await this.ready;
    if(serial!==this.serial)throw new DOMException('取消思考','AbortError');
    const options=[{skill:0,depth:3,time:300},{skill:6,depth:8,time:800},{skill:18,depth:16,time:1800}][level];
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending=null;this.worker.terminate();reject(new Error('思考超时，请重试。'));this.start();},15000);
      this.pending={resolve,reject,timer};
      this.worker.postMessage('setoption name Skill Level value '+options.skill);
      this.worker.postMessage('position fen '+fen);
      this.worker.postMessage(`go depth ${options.depth} movetime ${options.time}`);
    });
  }
  close(){this.serial++;if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new DOMException('已离开','AbortError'));this.pending=null;}this.worker.terminate();}
}
