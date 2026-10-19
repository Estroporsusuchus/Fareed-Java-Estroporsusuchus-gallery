export const positionKey=fen=>fen.split(' ').slice(0,4).join(' ');
const familyNames={
 'Italian Game':'意大利开局','Sicilian Defense':'西西里防御','French Defense':'法兰西防御',"Queen's Gambit":'后翼弃兵',"Queen's Gambit Accepted":'后翼弃兵接受变例',"Queen's Gambit Declined":'后翼弃兵拒绝变例',
 'Caro-Kann Defense':'卡罗–卡恩防御','Ruy Lopez':'西班牙开局','Scandinavian Defense':'斯堪的纳维亚防御',"King's Indian Defense":'古印度防御',"King's Gambit":'王翼弃兵','English Opening':'英国式开局','London System':'伦敦体系','Four Knights Game':'四马开局','Scotch Game':'苏格兰开局','Russian Game':'俄罗斯防御','Petrov Defense':'俄罗斯防御','Vienna Game':'维也纳开局','Pirc Defense':'皮尔茨防御',"Queen's Pawn Game":'后兵开局',"King's Pawn Game":'王兵开局','Nimzo-Indian Defense':'尼姆佐–印度防御','Indian Defense':'印度防御'
};
export function lookupOpening(chess,data){
 const hit=data.entries[positionKey(chess.fen())];if(!hit)return null;
 const family=hit.name.split(':')[0];return {...hit,family,title:familyNames[family]||family};
}
export function openingComment(chess,hit){
 const base={id:'opening:'+hit.eco+':'+hit.name,text:hit.title+'。这一局，我们走到这一路了。'};
 if(hit.family==='Italian Game'&&chess.get('c4')?.type==='b'&&chess.get('c4')?.color==='w'&&!chess.get('d5')&&!chess.get('e6')&&chess.get('f7')?.color==='b')base.text='意大利开局。白象到了 c4，已经盯上 f7 了。';
 else if(hit.family==='Sicilian Defense'&&hit.plies===2)base.text='西西里防御。c 兵回应王兵，这次的中心不是对称的。';
 else if(hit.family==='French Defense'&&hit.plies===2)base.text='法兰西防御。黑方先走 e6，为推进 d5 留好了位置。';
 else if(hit.family==='Caro-Kann Defense'&&chess.get('c6')?.color==='b')base.text='卡罗–卡恩防御。c6 的兵可以支持 d5，黑方在准备争夺中心。';
 else if(hit.family==="Queen's Gambit"&&chess.get('c4')?.type==='p'&&chess.get('d5')?.type==='p')base.text='后翼弃兵。白方用 c 兵挑战 d5 的中心兵。';
 else if(hit.family==='Ruy Lopez'&&chess.get('b5')?.type==='b'&&chess.get('c6')?.type==='n')base.text='西班牙开局。象到了 b5，直接向 c6 的马施压。';
 else if(hit.family==='Scotch Game'&&chess.get('d4')?.type==='p')base.text='苏格兰开局。d 兵走到 d4，白方直接打开中心的争夺。';
 else if(hit.family==='English Opening'&&hit.plies===1)base.text='英国式开局。先走 c4，从侧翼控制中心。';
 else if(hit.family==="King's Pawn Game"&&hit.plies===2&&chess.get('e4')?.color==='w'&&chess.get('e5')?.color==='b')base.text='王兵开局。双方王兵各前进两格，中心暂时对称。';
 else if(hit.family==="Queen's Pawn Game"&&hit.plies===2&&chess.get('d4')?.color==='w'&&chess.get('d5')?.color==='b')base.text='后兵开局。双方的 d 兵在中心相遇了。';
 else return null;
 return base;
}
export function eventComment(chess,move,human){
 if(chess.isCheckmate())return{id:'end:'+ (chess.turn()===human?'loss':'win'),text:chess.turn()===human?'将死。这一局归我了，还想再来吗？':'将死。你赢了，这一步我没能守住。'};
 if(chess.isStalemate())return{id:'end:stalemate',text:'逼和了。没有合法走法，但王并没有被将军。'};
 if(chess.isInsufficientMaterial())return{id:'end:material',text:'双方剩下的子力不足以将死，和棋。'};
 if(chess.isThreefoldRepetition())return{id:'end:repetition',text:'同一个局面第三次出现了，这局按三次重复作和。'};
 if(chess.isDraw())return{id:'end:draw',text:'这一局和棋。换个开局，再试一次？'};
 if(chess.isCheck())return{id:'check:'+chess.turn(),text:chess.turn()===human?'将军。先照顾好你的王。':'将军了……我得先应对你的这一步。'};
 if(move?.promotion)return{id:'move:promotion',text:'兵升变了。棋盘上的力量已经不同了。'};
 if(move?.flags.includes('k')||move?.flags.includes('q'))return{id:'move:castle',text:'王车易位。王退到一侧，车也加入了。'};
 if(move?.flags.includes('e'))return{id:'move:enpassant',text:'吃过路兵。这个机会，只在紧接着的一步有效。'};
 if(move?.captured==='q')return{id:'capture:queen',text:move.color===human?'你拿下了我的后。我得重新考虑了。':'后被吃掉了。先稳住，看看还有什么办法。'};
 if(move?.captured==='r')return{id:'capture:rook',text:'一辆车离开了棋盘。局面要重新算一算。'};
 return null;
}
