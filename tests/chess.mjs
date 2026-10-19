import assert from 'node:assert/strict';import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';
const {Chess}=await import('../games/furina-chess/vendor/chess.js');
const K=await import('../games/furina-chess/knowledge.js');const data=JSON.parse(fs.readFileSync(new URL('../games/furina-chess/openings.json',import.meta.url)));
function position(pgn){const g=new Chess();g.loadPgn(pgn);return g;}
let g=position('1. e4 e5 2. Nf3 Nc6 3. Bc4');assert.equal(K.lookupOpening(g,data).family,'Italian Game');assert.match(K.openingComment(g,K.lookupOpening(g,data)).text,/f7/);
g=position('1. e4 c5');assert.equal(K.lookupOpening(g,data).family,'Sicilian Defense');assert.match(K.openingComment(g,K.lookupOpening(g,data)).text,/c 兵/);
g=position('1. d4 d5 2. c4');assert.equal(K.lookupOpening(g,data).family,"Queen's Gambit");
const a=position('1. Nf3 Nc6 2. e4 e5 3. Bc4'),b=position('1. e4 e5 2. Nf3 Nc6 3. Bc4');assert.equal(K.positionKey(a.fen()),K.positionKey(b.fen()));assert.equal(K.lookupOpening(a,data).name,K.lookupOpening(b,data).name);
g=new Chess('8/6k1/8/8/8/8/6K1/8 w - - 0 1');assert.equal(K.lookupOpening(g,data),null);
g=position('1. f3 e5 2. g4 Qh4#');assert(g.isCheckmate());assert.match(K.eventComment(g,g.history({verbose:true}).at(-1),'w').text,/归我/);
g=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');assert.equal(g.move('O-O').flags,'k');
g=position('1. e4 a6 2. e5 d5');assert.equal(g.move('exd6').flags,'e');
g=new Chess('7k/P7/8/8/8/8/6K1/8 w - - 0 1');assert.equal(g.move({from:'a7',to:'a8',promotion:'n'}).promotion,'n');
console.log('PASS opening names, evidence-based quotes, transpositions, unknown positions, mate, castling, en passant and underpromotion.');
const engine=spawn(process.execPath,[fileURLToPath(new URL('../games/furina-chess/vendor/stockfish-19-lite-single.js',import.meta.url))]);let output='',phase=0;const timer=setTimeout(()=>{console.error(output.slice(-1000));engine.kill();process.exitCode=1;},25000);
engine.stdout.on('data',chunk=>{output+=chunk;for(const line of output.split('\n')){
 if(phase===0&&line.trim()==='uciok'){phase=1;engine.stdin.write('isready\n');}
 if(phase===1&&line.trim()==='readyok'){phase=2;engine.stdin.write('setoption name Skill Level value 0\nposition startpos\ngo depth 3 movetime 300\n');}
 if(phase===2&&line.startsWith('bestmove ')){phase=3;const move=line.split(' ')[1];assert(new Chess().move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]}));clearTimeout(timer);engine.stdin.write('quit\n');console.log('PASS real Stockfish 19 WASM engine returned a legal move:',move);}
}});engine.stdin.write('uci\n');
