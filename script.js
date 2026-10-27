'use strict';
const $ = s => document.querySelector(s);
const batch = 24;
let allWorks = [], works = [], shown = 0, current = 0, opener;
function preference(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function remember(key, value) { try { localStorage.setItem(key, value); } catch {} }
let selectedVersion = preference('furina-version', 'v1') === 'v2' ? 'v2' : 'v1';
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').textContent = theme === 'light' ? '切换蓝黑' : '切换浅色';
  remember('furina-theme', theme);
}
setTheme(preference('furina-theme', 'dark') === 'light' ? 'light' : 'dark');
$('#theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
function selectVersion(version) {
  if (dialog.open) dialog.close();
  selectedVersion = version; remember('furina-version', version);
  works = window.activeHall ? window.activeHall.artworks.map(id => allWorks.find(art => art.id === id)).filter(Boolean) : allWorks.filter(art => art.version === version);
  shown = 0; $('#gallery').replaceChildren();
  document.querySelectorAll('[data-version]').forEach(button => {
    button.disabled = false;
    button.setAttribute('aria-pressed', String(button.dataset.version === version));
    const count = allWorks.filter(art => art.version === button.dataset.version).length;
    button.textContent = `${button.dataset.version.toUpperCase()} · ${count} 张`;
  });
  $('#count').textContent = `${version.toUpperCase()} · ${version === 'v1' ? '原来的画作' : '新的画作'} · ${works.length} 幅`;
  if (window.activeHall) $('#count').textContent = `精选展出 · ${works.length} 幅`;
  $('#status').textContent = works.length ? '' : '新的故事，即将在这里开始。';
  appendBatch();
}
document.querySelectorAll('[data-version]').forEach(button => button.addEventListener('click', () => selectVersion(button.dataset.version)));
const dialog = $('#lightbox'), full = $('#full-image');
function appendBatch() {
  const fragment = document.createDocumentFragment();
  const end = Math.min(shown + batch, works.length);
  for (let i = shown; i < end; i++) {
    const art = works[i], button = document.createElement('button'), img = document.createElement('img');
    button.className = 'art-card'; button.type = 'button';
    button.setAttribute('aria-label', art.title ? `查看《${art.title}》` : `查看第 ${i + 1} 张画作`);
    img.width = art.thumb.width; img.height = art.thumb.height;
    img.alt = art.alt; img.loading = i < 3 ? 'eager' : 'lazy'; img.decoding = 'async';
    img.srcset = art.small.width < art.thumb.width ? `${art.small.src} ${art.small.width}w, ${art.thumb.src} ${art.thumb.width}w` : `${art.thumb.src} ${art.thumb.width}w`;
    img.sizes = '(max-width: 480px) 90vw, (max-width: 800px) 44vw, 30vw'; img.src = art.thumb.src;
    button.append(img);
    if (art.title) { const caption = document.createElement('span'); caption.className = 'art-title'; caption.textContent = art.title; button.append(caption); }
    button.addEventListener('click', () => openArt(i, button));
    fragment.append(button);
  }
  $('#gallery').append(fragment); shown = end;
  $('#more').hidden = shown >= works.length;
  $('#progress').textContent = works.length ? `已展示 ${shown} / ${works.length} 张` : '';
}
async function loadGallery() {
  $('#retry').hidden = true; $('#status').textContent = '画作加载中…';
  try {
    const response = await fetch('images.json');
    if (!response.ok) throw new Error('manifest');
    const data = await response.json();
    if (!Array.isArray(data) || data.some(x => !x.thumb?.src || !x.full?.src || !x.small?.src)) throw new Error('format');
    allWorks = data; await initializeMuseum(data);
  } catch {
    $('#paintings-gallery').hidden = false; $('#status').textContent = '暂时无法读取画作，请重试。'; $('#count').textContent = ''; $('#retry').hidden = false;
  }
}
function showArt(index) {
  current = (index + works.length) % works.length;
  const art = works[current];
  $('#image-status').textContent = '高清画作加载中…'; $('#image-retry').hidden = true;
  full.hidden = true; full.alt = art.alt; full.src = art.full.src;
  $('#image-position').textContent = `${art.title ? art.title + ' · ' : ''}${current + 1} / ${works.length}`;
  $('#download').href = art.full.src;
}
function openArt(index, button) { opener = button; showArt(index); dialog.showModal(); $('#close').focus(); }
full.addEventListener('load', () => { full.hidden = false; $('#image-status').textContent = ''; });
full.addEventListener('error', () => { $('#image-status').textContent = '这张画暂时没有加载成功。'; $('#image-retry').hidden = false; });
$('#image-retry').addEventListener('click', () => { full.removeAttribute('src'); showArt(current); });
$('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener?.focus());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
$('#previous').addEventListener('click', () => showArt(current - 1));
$('#next').addEventListener('click', () => showArt(current + 1));
dialog.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showArt(current + (e.key === 'ArrowLeft' ? -1 : 1)); } });
let touch;
full.addEventListener('touchstart', e => { touch = [e.changedTouches[0].clientX, e.changedTouches[0].clientY]; }, {passive:true});
full.addEventListener('touchend', e => { if (!touch) return; const dx=e.changedTouches[0].clientX-touch[0], dy=e.changedTouches[0].clientY-touch[1]; if(Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)) showArt(current+(dx<0?1:-1)); touch=null; }, {passive:true});
$('#more').addEventListener('click', appendBatch); $('#retry').addEventListener('click', loadGallery);
// Music is independent of gallery loading and requested only after opening the player.
const audio = $('#audio'); let tracks = [], track = 0, musicLoading = false, musicLoaded = false; const localUrls = [];
function selectTrack(index, play = true) {
  if (!tracks.length) return;
  track = (index + tracks.length) % tracks.length;
  audio.src = tracks[track].src; $('#track-name').textContent = tracks[track].name;
  if (play) audio.play().catch(() => { $('#track-name').textContent = '请点击播放器播放按钮。'; });
}
let loadingMusic;
async function loadMusic() {
  if (musicLoaded) return;
  if (loadingMusic) return loadingMusic;
  loadingMusic = (async () => {
    try {
      const r = await fetch('media/playlist.json'); if (!r.ok) throw new Error();
      const list = await r.json();
      tracks.push(...list.map(t => typeof t === 'string' ? {name:t.replace(/\.[^.]+$/, ''),src:'media/'+encodeURIComponent(t)} : t));
      musicLoaded = true;
      if (!audio.getAttribute('src')) selectTrack(0, false);
    } catch { $('#track-name').textContent = '播放清单暂不可用，可以选择本地歌曲。'; }
    finally { loadingMusic = null; }
  })();
  return loadingMusic;
}
$('#music-toggle').addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  await loadMusic();
  if (audio.getAttribute('src')) audio.play().catch(() => { $('#track-name').textContent = '请重试播放。'; });
});
audio.addEventListener('play', () => { $('#music-toggle').textContent = 'Pause Music'; });
audio.addEventListener('pause', () => { $('#music-toggle').textContent = 'Play Music'; });
$('#prev-track').addEventListener('click', async () => { await loadMusic(); selectTrack(track-1); });
$('#next-track').addEventListener('click', async () => { await loadMusic(); selectTrack(track+1); });
$('#random-track').addEventListener('click', async () => { await loadMusic(); selectTrack(Math.floor(Math.random()*tracks.length)); });
audio.addEventListener('ended', async () => { await loadMusic(); selectTrack(track+1); });
audio.addEventListener('error', () => { $('#track-name').textContent = '歌曲加载失败，请手动切换下一首。'; });
$('#upload-track').addEventListener('change', e => {
  for (const f of e.target.files) if(f.type.startsWith('audio/')) { const src=URL.createObjectURL(f); localUrls.push(src); tracks.push({name:f.name,src}); }
  if (!audio.getAttribute('src')) selectTrack(0, false);
});
window.addEventListener('pagehide', () => localUrls.forEach(url => URL.revokeObjectURL(url)));
loadGallery();
