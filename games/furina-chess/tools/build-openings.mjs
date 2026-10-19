// Usage: node tools/build-openings.mjs /path/to/lichess-chess-openings
import fs from 'node:fs';
import path from 'node:path';
import {Chess} from '../vendor/chess.js';
const directory=process.argv[2];if(!directory)throw new Error('Supply directory containing a.tsv through e.tsv');
const entries={};
for(const file of ['a','b','c','d','e'])for(const row of fs.readFileSync(path.join(directory,file+'.tsv'),'utf8').trim().split('\n').slice(1)){
 const [eco,name,pgn]=row.split('\t'),game=new Chess();game.loadPgn(pgn);
 const key=game.fen().split(' ').slice(0,4).join(' '),entry={eco,name,pgn,plies:game.history().length};
 if(!entries[key]||name.length<entries[key].name.length)entries[key]=entry;
}
fs.writeFileSync(new URL('../openings.json',import.meta.url),JSON.stringify({source:'https://github.com/lichess-org/chess-openings',license:'CC0-1.0',entries}));
