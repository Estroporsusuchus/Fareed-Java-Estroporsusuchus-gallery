#!/usr/bin/env python3
"""Build a static gallery. Originals are read-only and excluded from deployment."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parent
SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

def build(root=ROOT):
    halls_path = root / 'exhibitions.json'
    if halls_path.exists():
        halls = json.loads(halls_path.read_text())
        assigned = {}
        for hall in halls:
            local_ids = set()
            for art_id in hall['artworks']:
                if art_id in local_ids:
                    raise SystemExit(f'Duplicate exhibit within {hall["id"]}: {art_id}')
                local_ids.add(art_id)
                if hall['id'] == 'featured':
                    continue  # The only exhibition allowed to share works with a themed hall.
                if art_id in assigned:
                    raise SystemExit(f'Duplicate exhibit in {assigned[art_id]} and {hall["id"]}: {art_id}')
                assigned[art_id] = hall['id']
    games_path = root / 'games.json'
    if games_path.exists():
        seen_games = set()
        for game in json.loads(games_path.read_text()):
            if game['id'] in seen_games:
                raise SystemExit('Duplicate game ID: ' + game['id'])
            seen_games.add(game['id'])
            for key in ['path', 'cover']:
                value = Path(game[key])
                if value.is_absolute() or '..' in value.parts or not (root / value).exists():
                    raise SystemExit('Invalid game asset: ' + game[key])
            if not (root / game['path'] / 'index.html').is_file():
                raise SystemExit('Missing game entry: ' + game['path'])
    original = root / 'originals'
    files = sorted((p for p in original.rglob('*') if p.is_file() and p.suffix.lower() in SUPPORTED), key=lambda p: p.relative_to(original).as_posix().casefold())
    if not files:
        raise SystemExit('No images found in originals/. Add images before building.')
    config_path = root / 'collections.json'
    config = json.loads(config_path.read_text()) if config_path.exists() else {}
    metadata_path = root / 'artwork-metadata.json'
    metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}
    v1 = set(config.get('v1', []))
    excluded = set(config.get('excluded', []))
    # Validate all originals before publishing a new manifest.
    unique, seen = [], set()
    for path in files:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in seen or digest in excluded:
            continue
        with Image.open(path) as img:
            img.load()
        seen.add(digest)
        unique.append((path, digest))
    dist = root / 'dist'
    assets = dist / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    entries = []
    for path, digest in unique:
        with Image.open(path) as source:
            img = ImageOps.exif_transpose(source)
            img = img.convert('RGBA' if 'A' in img.getbands() or 'transparency' in img.info else 'RGB')
            sizes = {}
            for kind, edge, quality in [('small', 360, 80), ('thumb', 800, 82), ('full', 2400, 92)]:
                name = f'{digest}-{kind}.webp'
                target = assets / name
                if not target.exists():
                    variant = img.copy()
                    variant.thumbnail((edge, edge), Image.Resampling.LANCZOS)
                    variant.save(target, 'WEBP', quality=quality, method=6)
                with Image.open(target) as variant:
                    sizes[kind] = {'src': 'assets/' + name, 'width': variant.width, 'height': variant.height}
            entries.append({'id': digest, 'alt': metadata.get(digest, {}).get('title', '芙宁娜画廊作品'), **metadata.get(digest, {}), 'version': 'v1' if digest in v1 else 'v2', **sizes})
    # New works first, existing works keep their previous order.
    order_path = root / 'order.json'
    previous = json.loads(order_path.read_text()) if order_path.exists() else []
    lookup = {e['id']: e for e in entries}
    old = set(previous)
    order = [e['id'] for e in entries if e['id'] not in old] + [i for i in previous if i in lookup]
    entries = [lookup[i] for i in order]
    order_path.write_text(json.dumps(order, indent=2) + '\n')
    for name in ['index.html', 'styles.css', 'script.js', 'exhibition.js', 'exhibitions.json', 'literature.json', 'games.json']:
        shutil.copy2(root / name, dist / name)
    games = root / 'games'
    if games.exists():
        shutil.copytree(games, dist / 'games', dirs_exist_ok=True, ignore=shutil.ignore_patterns('.DS_Store'))
    media = root / 'media'
    if media.exists():
        shutil.copytree(media, dist / 'media', dirs_exist_ok=True, ignore=shutil.ignore_patterns('.DS_Store'))
    (dist / '.nojekyll').touch()
    manifest = dist / 'images.json'
    temporary = dist / 'images.json.tmp'
    temporary.write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':')))
    temporary.replace(manifest)
    keep = {e[k]['src'].split('/')[-1] for e in entries for k in ['small','thumb','full']}
    for path in assets.glob('*.webp'):
        if path.name not in keep:
            path.unlink()  # Only obsolete generated files; originals are never removed.
    stats = {k: sum((dist / e[k]['src']).stat().st_size for e in entries) for k in ['small','thumb','full']}
    print(json.dumps({'original_files': len(files), 'unique_images': len(entries), 'duplicates_skipped': len(files)-len(entries), 'bytes': stats}, ensure_ascii=False))
    return entries

if __name__ == '__main__':
    build()
