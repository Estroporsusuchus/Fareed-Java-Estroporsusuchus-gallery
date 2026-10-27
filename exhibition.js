'use strict';
window.activeHall = null;
async function initializeMuseum(artworks) {
  const read = async path => { const r = await fetch(path, {cache: 'no-cache'}); if (!r.ok) throw new Error(path); return r.json(); };
  const [halls, writings, games] = await Promise.all([read('exhibitions.json'), read('literature.json'), read('games.json')]);
  const lookup = new Map(artworks.map(a => [a.id, a]));
  const node = (tag, text, className) => { const n = document.createElement(tag); if (text) n.textContent = text; if (className) n.className = className; return n; };
  const image = art => { const img = node('img'); img.src = art.thumb.src; img.width = art.thumb.width; img.height = art.thumb.height; img.loading = 'lazy'; img.alt = art.alt; return img; };
  const entrances = document.querySelector('#hall-entrances'); entrances.replaceChildren();
  halls.forEach((hall, i) => {
    const link = node('a', '', 'hall-entrance'); link.href = '#hall/' + hall.id;
    const cover = lookup.get(hall.cover); if (cover) link.append(image(cover));
    const text = node('div', '', 'hall-description');
    text.append(node('span', `展厅 ${String(i + 1).padStart(2, '0')}`, 'eyebrow'), node('h2', hall.title));
    if (hall.englishTitle) { const title = node('p', hall.englishTitle, 'hall-english'); title.lang = 'en'; text.append(title); }
    if (hall.intro) text.append(node('p', hall.intro));
    if (hall.englishSubtitle) { const subtitle = node('p', hall.englishSubtitle, 'hall-subtitle'); subtitle.lang = 'en'; text.append(subtitle); }
    text.append(node('span', `${hall.artworks.filter(id => lookup.has(id)).length} 幅作品 · 进入展厅 →`));
    link.append(text); entrances.append(link);
  });
  const list = document.querySelector('#writing-list'); list.replaceChildren();
  const displayedWritings = [...writings.filter(p => p.layout === 'illustrated'), ...writings.filter(p => p.layout !== 'illustrated')];
  displayedWritings.forEach((post, i) => {
    if (post.layout !== 'illustrated') {
      const link = node('a', '', 'writing-entry'); link.href = '#poem/' + post.id;
      link.append(node('span', String(i + 1).padStart(2, '0'), 'eyebrow'), node('h2', post.title), node('p', post.subtitle), node('p', post.intro), node('span', '阅读 →')); list.append(link);
      return;
    }
    const entry = node('article', '', 'writing-entry catalog-poem'); entry.id = 'writing-' + post.id;
    for (const id of post.artworks || []) {
      const art = lookup.get(id); if (!art) continue;
      const img = image(art); img.src = art.full.src; img.width = art.full.width; img.height = art.full.height; img.alt = post.title; const display = node('div', '', 'catalog-display'); const frame = node('div', '', 'catalog-frame'); const mat = node('div', '', 'catalog-mat'); mat.append(img); frame.append(mat); display.append(frame); entry.append(display);
    }
    entry.append(node('h2', post.title), node('p', post.subtitle, 'catalog-subtitle'), node('p', post.author || '', 'eyebrow'));
    const original = node('div', '', 'catalog-original'); original.lang = post.language || 'en';
    for (const stanza of post.stanzas || []) original.append(node('p', stanza, 'stanza'));
    entry.append(original);
    if (post.translation && post.showTranslation !== false) {
      const translated = node('div', '', 'catalog-translation'); translated.lang = post.translation.language || 'zh-CN';
      translated.append(node('h3', post.translation.title || '中文译文'));
      for (const stanza of post.translation.stanzas || []) translated.append(node('p', stanza, 'stanza'));
      entry.append(translated);
    }
    if (post.source) {
      const source = node('div', '', 'catalog-source'); source.append(node('p', post.source.note || ''));
      const link = node('a', '原文出处 ↗'); link.href = post.source.url; link.target = '_blank'; link.rel = 'noopener'; source.append(link); entry.append(source);
    }
    list.append(entry);
  });
  const cabinets = document.querySelector('#game-cabinets'); cabinets.replaceChildren();
  games.forEach((game, i) => {
    const link = node('a', '', 'game-cabinet'); link.href = game.path;
    const display = node('div', '', 'cabinet-display');
    const cover = node('img'); cover.src = game.cover; cover.alt = game.title; cover.width = 840; cover.height = 560; cover.loading = 'lazy'; cover.decoding = 'async'; display.append(cover);
    const caption = node('div', '', 'cabinet-caption');
    caption.append(node('span', `${String(i + 1).padStart(2, '0')} / ${game.genre}`, 'eyebrow'), node('h2', game.title));
    if (game.englishTitle) { const title = node('p', game.englishTitle, 'cabinet-english'); title.lang='en'; caption.append(title); }
    caption.append(node('p', game.description), node('span', '开始游玩 →', 'cabinet-play'));
    link.append(display, caption); cabinets.append(link);
  });
  function route() {
    if (dialog.open) dialog.close();
    const hash = location.hash.slice(1) || 'home';
    const [kind, id] = hash.split('/');
    const hall = kind === 'hall' ? halls.find(h => h.id === id) : null;
    const post = kind === 'poem' ? writings.find(p => p.id === id) : null;
    const view = hall || kind === 'library' ? 'paintings-gallery' : post ? 'reading-room' : kind === 'literature' ? 'literature-room' : kind === 'games' ? 'games-room' : 'museum-home';
    for (const name of ['museum-home', 'paintings-gallery', 'literature-room', 'reading-room', 'games-room']) document.getElementById(name).hidden = name !== view;
    document.querySelectorAll('.museum-nav a').forEach(a => { if (a.hash === '#' + hash) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.activeHall = hall;
    document.title = `${hall?.title || post?.title || (kind === 'games' ? '游戏馆' : kind === 'literature' ? '文学馆' : kind === 'library' ? '馆藏目录' : '展厅入口')} · Furinart`;
    if (view === 'paintings-gallery') {
      document.querySelector('#gallery-title').textContent = hall?.title || '馆藏目录';
      document.querySelector('#gallery-english').textContent = hall?.englishTitle || '';
      document.querySelector('#gallery-intro').textContent = hall ? (hall.intro || '') : '所有作品都在这里，按原有 V1 / V2 画册浏览。';
      document.querySelector('#gallery-subtitle').textContent = hall?.englishSubtitle || '';
      document.querySelector('.versions').hidden = !!hall;
      selectVersion(selectedVersion);
    }
    if (post) {
      const illustrated = post.layout === 'illustrated';
      document.querySelector('#reading-room').classList.toggle('illustrated-reading', illustrated);
      document.querySelector('#poem-author').textContent = post.author || '';
      document.querySelector('#poem-author').hidden = !post.author;
      document.querySelector('#poem-title').textContent = post.title;
      document.querySelector('#poem-subtitle').textContent = post.subtitle;
      const body = document.querySelector('#poem-body'); body.replaceChildren(); body.lang = post.language || 'en';
      for (const stanza of post.stanzas || []) body.append(node('p', stanza, 'stanza'));
      const translation = document.querySelector('#poem-translation'); translation.replaceChildren(); translation.hidden = !post.translation || post.showTranslation === false; translation.open = illustrated;
      if (post.translation && post.showTranslation !== false) {
        translation.append(node('summary', post.translation.title || '中文译文'));
        const translated = node('div', '', 'translation-body'); translated.lang = post.translation.language || 'zh-CN';
        for (const stanza of post.translation.stanzas || []) translated.append(node('p', stanza, 'stanza'));
        translation.append(translated);
      }
      const pictures = document.querySelector('#poem-images'); pictures.replaceChildren();
      for (const id of post.artworks || []) { const art = lookup.get(id); if (art) { const a = node('a'); a.href = art.full.src; a.target = '_blank'; a.rel = 'noopener'; const img = image(art); if (illustrated) { img.src = art.full.src; img.removeAttribute('loading'); img.width = art.full.width; img.height = art.full.height; } a.append(img); pictures.append(a); } }
      const source = document.querySelector('#poem-source'); source.replaceChildren();
      if (post.source) { source.append(node('p', post.source.note || '')); const link = node('a', '原文出处 ↗'); link.href = post.source.url; link.target = '_blank'; link.rel = 'noopener'; source.append(link); }
      const nav = document.querySelector('#poem-navigation'); nav.replaceChildren();
      for (const next of writings.filter(p => p.id !== post.id)) { const link = node('a', next.title + ' →'); link.href = '#poem/' + next.id; nav.append(link); }
    }
    window.scrollTo(0, 0);
  }
  if (window.museumRoute) window.removeEventListener('hashchange', window.museumRoute);
  window.museumRoute = route; window.addEventListener('hashchange', route); route();
}
