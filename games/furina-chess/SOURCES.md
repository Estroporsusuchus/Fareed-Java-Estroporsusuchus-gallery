# 引擎与开局资料

- chess.js 1.4.0：来自 npm 官方发布包，BSD-2-Clause。对应源代码 https://github.com/jhlywa/chess.js/tree/v1.4.0 。
- Stockfish.js 19.0.1：来自官方 GitHub Release，原样保留的 lite-single JS/WASM，GPL-3.0。对应源代码与构建脚本 https://github.com/nmrugg/stockfish.js/tree/v19.0.1 。许可证保存在 vendor/。
- 开局资料：2026-10-19 获取 Lichess chess-openings 的 a.tsv–e.tsv，CC0。https://github.com/lichess-org/chess-openings 。使用 chess.js 回放每条PGN，按含行棋方、易位权、合法过路兵权的局面键索引。不同走子顺序到达同一局面可以识别；无匹配时只保留历史开局记录，绝不编造当前变例。
- 棋力搜索完全在浏览器 Worker 中运行，无在线推理或付费API调用。开局台词仅在对应局面条件成立时触发，其他已收录名称只显示在开局记录中。
- 配音仅归档，当前没有音频服务调用或播放接口。
