# CREATE — My Five Gifts · Olesia Dmytrush

An interactive, cinematic portfolio for my i.c.stars assignment: a spilled cup of coffee becomes five golden gifts — Resilience, Creativity, Connection, Problem-Solving and Leadership.

## What's real, and how it was made

| Part | How it works |
|---|---|
| Opening story (walking, rock, stumble, coffee spill, magic) | A **rendered cinematic video** of my avatar (`assets/video/create-film.mp4` / `.webm`), edited from my five clips IMG_9709, 9710, 9712 and 9713 into one 24.5-second film. It is a video, **not** a real-time 3D character. |
| Five golden streams, sparkles, gold dust | **Real-time WebGL** (Three.js r169, vendored in `assets/js/three.module.min.js`). The streams start at the coffee cup in the film, change from coffee-brown to champagne-gold, and fly into the five gift cards. They are synced to the film's time, so Pause, Replay and the timeline control the particles too. |
| Five gift cards | Gift illustrations are cropped from my storyboard. They light up when their stream arrives. Selecting one scrolls to that gift and opens it. |
| Expandable gifts | Each gift shows its image, number, title and short description. Selecting it reveals 2 jobs and 5 growth actions; selecting again (or pressing Esc) closes it. |
| Controls | Play/Pause, Replay, Skip intro, Sound on/off, timeline scrubber, eight clickable story scenes, and a Reduce motion switch (it also respects the device's reduced-motion setting). |

**There is no "drag to rotate" control**, because the folder has no rigged 3D model (GLB/VRM). See "Using a real 3D character" below.

## Folder structure

```
index.html
README.md
.nojekyll
assets/
  css/style.css
  js/main.js              page logic (no libraries)
  js/fx.js                WebGL streams (Three.js)
  js/three.module.min.js  Three.js r169 (MIT license)
  video/create-film.mp4   main film (H.264, for Chrome, Edge and Safari)
  video/create-film.webm  same film (VP9, fallback for other browsers)
  img/                    gift-1..5, scene-1..8, storyboard, avatar, posters, favicon
```

## Preview on your computer

Opening `index.html` by double-clicking works for most things, but browsers block JavaScript modules on `file://`, so the golden streams won't show. To see everything, run a small local server inside this folder:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Open your repository on github.com (for example `github.com/odmytrush28/<repo-name>`).
2. Back up the old version: create a branch (for example `old-version`) from the branch you have now, or download it as a ZIP.
3. On your main branch, select **Add file → Upload files** and drag in **everything inside this folder**: `index.html`, `README.md`, `.nojekyll` and the whole `assets` folder. `index.html` must be at the repository root. (`.nojekyll` is a hidden file on Mac; it is optional.)
4. If the old site had files that are no longer needed (old `scene.js`, `avatar.js`, old `assets/gift-*.webp`), you can delete them. Nothing in the new site uses them.
5. Commit the changes.
6. Go to **Settings → Pages → Build and deployment**. Set Source to **Deploy from a branch**, Branch to **main** and **/(root)**, then select **Save**.
7. Wait 1–2 minutes, then open `https://odmytrush28.github.io/<repo-name>/`.

All paths are relative, so the site works in a repository subfolder URL without any changes.

## Using a real 3D character (GLB) later

To make the avatar a real, rotatable 3D character, you need a **rigged GLB** (or VRM) of the blonde avatar, with these animation clips: `Walk`, `Stumble` (trip), `Surprised`, `Smile/Idle`, plus a bone for the right hand so the cup can attach to it. Ready Player Me, Mixamo (for animations) or a 3D artist on Fiverr/ArtStation can produce one.

When you have it:

1. Put it at `assets/models/olesia.glb`.
2. Load it in `fx.js` with Three.js `GLTFLoader` (from `three/examples/jsm/loaders/GLTFLoader.js`, same version r169), play its clips with `AnimationMixer`, and add `OrbitControls` for mouse/touch rotation.
3. Replace the `<video>` in the film area with the 3D canvas, or keep the video as the fallback for phones.

## Credits

Story, avatar video and illustrations: Olesia Dmytrush (AI-assisted). Three.js © three.js authors, MIT License.
