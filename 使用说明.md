# 芙宁娜的画廊

这是原 GitHub Pages 画廊的本地新版，尚未推送或替换线上网站。
所有作品统一展示，不再按动物类别组织。原有图片被复制到 originals/，原仓库没有被修改。

## 推荐加图方式

以后只把图片放入 originals/。可以直接放 236 张，也可以分几次加入；不必制作缩略图，不必编辑 HTML 或图片清单。

- 支持 JPG、JPEG、PNG、WebP、GIF。GIF 目前只生成静态首帧。
- 同名但不同内容的作品请先改名，例如 2026-10-10-001.png，防止文件管理器覆盖旧图。
- 完全相同的文件按内容去重，只展示一次；仅画面相似的图片不会自动删掉。
- 原图不修改、不删除。网页展示最长边 2400 像素的高清 WebP；它不等同于无损原文件。
- 缩略图提供 360 / 800 像素两档。首批 24 张，继续点击追加 24 张，点开后才加载高清图。
- order.json 记录基准顺序；新加入且不在该清单的作品排在前面，同批按文件名排序。需要明确排序可调整该文件的 ID 顺序。
- 图片路径使用内容指纹，因此改图后不会错误复用旧图片缓存。

## 发布到你现有的 GitHub 仓库（一次性设置）

1. 先备份仓库。把本文件夹内容放到原仓库根目录，包含隐藏的 .github/ 和 .gitignore。新版源代码中的 index.html、styles.css、script.js 替换旧文件。
2. 提交 originals/、源代码、build_gallery.py、requirements.txt、order.json、media/、.github/workflows/pages.yml。dist/ 是生成结果，不用提交。
3. GitHub 仓库 Settings → Pages → Build and deployment → Source，选择 GitHub Actions。
4. 推送 main 后，Actions 自动生成图片、图片清单及页面，并发布 dist/。原图不进入 Pages 发布包，但公共仓库中的 originals/ 仍是公开文件。
5. 确认新版正常后，旧 images/、images.json、generate_images.py、generate_playlist.py 和 build-playlist.js 可从仓库清理；新页面不再读取它们。清理当前文件不缩小旧 Git 历史。

以后通过 GitHub 网页进入 originals/ → Add file → Upload files，上传一批并提交即可；大量图片更适合把文件拖入本地仓库后用 GitHub Desktop 提交、推送。不要覆盖不同内容的同名文件。

如果只是使用现成生成好的站点，也可以将 dist/ 的内容发布到任意静态网站托管服务，但以后加图仍需重新生成。

## 本地生成与预览

随附 dist/ 已生成，可双击「预览画廊.command」，再打开它提示的网址。

重新生成需要 Python 3.10 或更新版本。首次安装依赖：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

每次添加图片后：

```sh
.venv/bin/python build_gallery.py
.venv/bin/python -m http.server 8765 --directory dist
```

然后浏览器打开 http://localhost:8765 。不要直接双击 HTML：浏览器通常会限制本地文件读取 JSON。

## 文件职责

- index.html：页面文字与结构。
- styles.css：配色、排版、手机布局。
- script.js：分批浏览、放大图、键盘与触摸、音乐。
- originals/：统一原图入口。
- build_gallery.py：检查原图、按内容去重、生成三档图片和清单。
- dist/：可发布的完整网站；构建脚本只会清理这里不再使用的生成图片。
- media/：原有音乐及播放清单。打开播放器才读取清单，音频不主动预加载。
- .github/workflows/pages.yml：自动构建发布。

## 验证边界

本地转换和检查不等于 GitHub Actions 已部署成功。在线发布还需要仓库写入权限及上述 Pages 设置；当前并未操作远程仓库。
